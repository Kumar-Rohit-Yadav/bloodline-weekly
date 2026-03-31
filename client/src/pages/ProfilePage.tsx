import React, { useState, useEffect, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
    User, Mail, Droplet, MapPin, ShieldCheck,
    Camera, LogOut, Save, Loader2,
    Activity, Navigation,
    Building2, AlertCircle, Phone, CheckCircle2,
    ExternalLink, Calendar, Clock, Lock, Globe
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/config/api";
import { toast } from "sonner";
import { cn } from "@/utils/utils";
import { ActivityHistory } from "@/components/dashboard/ActivityHistory";

const NepalMap = React.lazy(() => import("@/components/map/NepalMap"));

export default function ProfilePage() {
    const { user, logout, checkUserLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
    const [changeRequests, setChangeRequests] = useState<any[]>([]);
    const [fetchingRequests, setFetchingRequests] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        bloodType: user?.bloodType || "unknown",
        profileImage: user?.profileImage || "",
        address: user?.location?.address || "",
        coordinates: (user?.location?.coordinates as [number, number]) || [85.324, 27.7172],
        facilityName: user?.facilityName || "",
        medicalNotes: user?.medicalNotes || "",
        lastDonationDate: user?.lastDonationDate || "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                bloodType: user.bloodType || "unknown",
                profileImage: user.profileImage || "",
                address: user.location?.address || "",
                coordinates: (user.location?.coordinates as [number, number]) || [85.324, 27.7172],
                facilityName: user.facilityName || "",
                medicalNotes: user.medicalNotes || "",
                lastDonationDate: user.lastDonationDate ? new Date(user.lastDonationDate).toISOString().split('T')[0] : "",
            });
            if (user.role === 'hospital') {
                fetchChangeRequests();
            }
        }
    }, [user]);

    const fetchChangeRequests = async () => {
        try {
            setFetchingRequests(true);
            const res = await api.get('/auth/my-profile-change-requests');
            if (res.data.success) {
                setChangeRequests(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch change requests");
        } finally {
            setFetchingRequests(false);
        }
    };

    const isHospital = user?.role === 'hospital';
    const isVerified = user?.isVerified;
    const isPending = isHospital && !isVerified && !!user?.verificationImage;
    // Verified hospitals CAN edit to submit change requests, but unverified (pending review) are strictly locked.
    const isLocked = isHospital && !isVerified && !!user?.verificationImage;
    const latestRequest = changeRequests[0];
    const isChangePending = latestRequest?.status === 'pending';

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

    const getCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported");

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setFormData(prev => ({
                    ...prev,
                    coordinates: [longitude, latitude]
                }));

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data.display_name) {
                        setFormData(prev => ({ ...prev, address: data.display_name }));
                        toast.success("Location and address captured!");
                    } else {
                        toast.success("Coordinates captured!");
                    }
                } catch (error) {
                    toast.success("Coordinates captured (Address failed)");
                } finally {
                    setGettingLocation(false);
                }
            },
            (err) => {
                setGettingLocation(false);
                toast.error("Location access denied.");
            }
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', {
                ...formData,
                location: {
                    type: "Point",
                    coordinates: formData.coordinates,
                    address: formData.address
                }
            });

            if (res.data.success) {
                if (res.data.isChangeRequestPending) {
                    toast.success("Change request submitted for Admin review!");
                    fetchChangeRequests();
                } else {
                    await checkUserLoggedIn();
                    toast.success("Profile updated successfully!");
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            return toast.error("New passwords do not match");
        }
        if (passwordData.newPassword.length < 4) {
            return toast.error("Password must be at least 4 characters");
        }

        setUpdatingPassword(true);
        try {
            const res = await api.put('/auth/updatepassword', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            if (res.data.success) {
                toast.success("Password updated successfully!");
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: ""
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Password update failed");
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">My Profile</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white/50 p-2 rounded-[28px] border border-gray-100 glass-panel flex gap-2">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={cn(
                                "px-8 py-3.5 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all",
                                activeTab === 'settings' ? "bg-gray-900 text-white shadow-xl" : "text-gray-400 hover:text-gray-900"
                            )}
                        >
                            Profile Info
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "px-8 py-3.5 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all",
                                activeTab === 'history' ? "bg-gray-900 text-white shadow-xl" : "text-gray-400 hover:text-gray-900"
                            )}
                        >
                            Activity
                        </button>
                    </div>
                    <Button onClick={handleLogout} className="h-14 px-8 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">
                        <LogOut size={16} className="mr-2" /> Logout
                    </Button>
                </div>
            </div>

            {activeTab === 'settings' ? (
                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Left Panel: Profile Visuals */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="border-none shadow-2xl shadow-gray-100/30 rounded-[60px] p-10 bg-white overflow-hidden group">
                            <div className="relative">
                                <div className="w-56 h-56 mx-auto bg-gray-50 rounded-[54px] p-2 ring-4 ring-red-50 relative overflow-hidden">
                                    {formData.profileImage ? (
                                        <img src={formData.profileImage} className="w-full h-full object-cover rounded-[48px]" alt="Profile" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <User size={80} />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm rounded-[48px]">
                                        <Camera className="text-white" size={32} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="mt-8 text-center space-y-3">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2">
                                    {isHospital ? (user?.facilityName || user?.name) : user?.name}
                                    {isVerified && <VerifiedBadge size={20} />}
                                </h3>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full font-black text-[10px] uppercase tracking-widest border border-gray-100">
                                    {user?.role} Access
                                </div>
                                {isVerified && (
                                    <div className="flex items-center justify-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest mt-2 animate-in slide-in-from-top-4">
                                        <ShieldCheck size={14} className="fill-current" /> Verified Agency
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Location Preview Card */}
                        <Card className="border-none shadow-xl shadow-gray-100/20 rounded-[50px] p-8 bg-white overflow-hidden relative border border-gray-100">
                            <div className="space-y-6 relative">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Location</p>
                                        <h4 className="text-lg font-black tracking-tight text-gray-900">{formData.address.split(',')[0] || "No Location Set"}</h4>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <Navigation size={18} className="text-gray-400" />
                                    </div>
                                </div>
                                <div className="h-48 bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                    <Suspense fallback={<div className="h-full bg-gray-100 animate-pulse w-full" />}>
                                        <NepalMap
                                            center={formData.coordinates.length === 2 ? [formData.coordinates[1], formData.coordinates[0]] : [27.7172, 85.324]}
                                            markerPosition={formData.coordinates.length === 2 ? [formData.coordinates[1], formData.coordinates[0]] : [27.7172, 85.324]}
                                        />
                                    </Suspense>
                                    <div className="absolute top-4 right-4 z-[1000] p-2 bg-white/80 backdrop-blur rounded-xl shadow-sm border border-gray-100">
                                        <Globe size={14} className="text-[#FF1744] animate-pulse" />
                                    </div>
                                </div>
                                <Button
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation}
                                    className="w-full h-14 bg-gray-900 text-white hover:bg-black border-none rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    {gettingLocation ? <Loader2 className="animate-spin" /> : <MapPin size={16} />}
                                    Refresh Location
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Right Panel: Settings Form */}
                    <div className="lg:col-span-8 space-y-10">
                        <Card className="border-none shadow-2xl shadow-gray-100/30 rounded-[40px] p-10 bg-white">
                            <CardContent className="p-0 space-y-10">
                                <form onSubmit={handleUpdateProfile} className="space-y-10">
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-3 text-left">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Display Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="h-14 pl-12 font-bold rounded-2xl"
                                                />
                                            </div>
                                        </div>

                                        {(user?.role === 'donor' || user?.role === 'receiver') && (
                                            <div className="space-y-3 text-left">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Blood Type</label>
                                                <div className="relative">
                                                    <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF1744]" size={18} />
                                                    <select
                                                        value={formData.bloodType}
                                                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-2xl appearance-none font-black text-gray-900 outline-none focus:ring-4 focus:ring-red-50 transition-all cursor-pointer"
                                                    >
                                                        {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {user?.role === 'donor' && (
                                        <div className="grid sm:grid-cols-2 gap-8">
                                            <div className="space-y-3 text-left">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Medical Notes</label>
                                                <div className="relative">
                                                    <AlertCircle className="absolute left-4 top-4 text-gray-300" size={18} />
                                                    <textarea
                                                        value={formData.medicalNotes}
                                                        onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                                                        placeholder="Any medical conditions, allergies, or medications..."
                                                        className="w-full min-h-[100px] p-4 pl-12 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-700 focus:ring-4 focus:ring-red-50 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3 text-left">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Last Donation Date</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                    <Input
                                                        type="date"
                                                        value={formData.lastDonationDate}
                                                        onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                                                        className="h-14 pl-12 font-bold rounded-2xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isChangePending && (
                                        <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[40px] flex items-start gap-6 animate-in slide-in-from-top-6">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
                                                <Clock size={24} />
                                            </div>
                                            <div className="text-left space-y-2">
                                                <p className="text-lg font-black text-amber-900 uppercase tracking-tight">Update Under Review</p>
                                                <p className="text-sm text-amber-700 font-bold leading-relaxed">
                                                    You have a pending profile change request. Further updates are disabled until an administrator reviews your current submission.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {latestRequest?.status === 'rejected' && (
                                        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[40px] flex items-start gap-6 animate-in slide-in-from-top-6">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500">
                                                <AlertCircle size={24} />
                                            </div>
                                            <div className="text-left space-y-2">
                                                <p className="text-lg font-black text-red-900 uppercase tracking-tight">Change Request Rejected</p>
                                                <p className="text-sm text-red-800 font-bold leading-relaxed">
                                                    Your previous profile update was not approved.
                                                </p>
                                                {latestRequest.adminNotes && (
                                                    <div className="p-4 bg-white/50 rounded-2xl border border-red-100">
                                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Admin Feedback:</p>
                                                        <p className="text-xs font-bold text-red-900 leading-relaxed italic">"{latestRequest.adminNotes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isVerified && !isChangePending && (
                                        <div className="p-6 bg-blue-50/50 border-2 border-blue-100 rounded-[32px] flex items-start gap-4 animate-in slide-in-from-top-4">
                                            <ShieldCheck className="text-blue-500 shrink-0 mt-1" size={20} />
                                            <div className="text-left space-y-1">
                                                <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Verified Account</p>
                                                <p className="text-xs text-blue-700 font-bold leading-relaxed">
                                                    Modifying your agency name or location will require a manual review by our administration team to maintain platform integrity.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isLocked && (
                                        <div className="p-8 bg-gray-50 border-2 border-gray-100 rounded-[40px] flex items-start gap-6">
                                            <Lock className="text-gray-400 shrink-0 mt-1" size={24} />
                                            <div className="text-left space-y-2">
                                                <p className="text-lg font-black text-gray-900 uppercase tracking-tight">Configuration Locked</p>
                                                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                                                    Your verification is currently in progress. Profile edits are disabled until your agency identity is confirmed.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isHospital && (
                                        <div className="space-y-3 text-left">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Facility Name</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                <Input
                                                    value={formData.facilityName}
                                                    onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                                                    disabled={isLocked || isChangePending}
                                                    className={cn(
                                                        "h-14 pl-12 font-bold rounded-2xl",
                                                        (isLocked || isChangePending) && "bg-gray-50 border-gray-100 text-gray-400 opacity-70 cursor-not-allowed"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 text-left block">Primary Address (GPS Locked)</label>
                                        </div>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <Input
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                disabled={isLocked || isChangePending}
                                                className={cn(
                                                    "h-14 pl-12 font-bold rounded-2xl",
                                                    (isLocked || isChangePending) && "bg-gray-50 border-gray-100 text-gray-400 opacity-70 cursor-not-allowed"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || isChangePending}
                                        className="w-full h-20 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : (isChangePending ? <Clock size={20} /> : <CheckCircle2 size={20} />)}
                                        {isChangePending ? "Review in Progress" : "Save Changes"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Security Card: Change Password */}
                        <Card className="border-none shadow-2xl shadow-gray-100/30 rounded-[40px] p-10 bg-white border border-red-50">
                            <div className="flex items-center gap-4 mb-10 border-l-4 border-[#FF1744] pl-4">
                                <Lock className="text-[#FF1744]" size={24} />
                                <div className="text-left">
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Security Access</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update your account password</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-8">
                                <div className="grid sm:grid-cols-1 gap-6">
                                    <div className="space-y-3 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Current Password</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            required
                                            className="h-14 font-bold rounded-2xl"
                                            icon={<Lock size={18} />}
                                        />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-3 text-left">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Password</label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                required
                                                className="h-14 font-bold rounded-2xl"
                                                icon={<ShieldCheck size={18} />}
                                            />
                                        </div>
                                        <div className="space-y-3 text-left">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwordData.confirmNewPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                                required
                                                className="h-14 font-bold rounded-2xl"
                                                icon={<ShieldCheck size={18} />}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={updatingPassword}
                                    className="w-full h-16 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    {updatingPassword ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                                    Update Security Key
                                </Button>
                            </form>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-10 rounded-[60px] border border-gray-100 shadow-xl animate-in zoom-in-95 duration-500">
                    <ActivityHistory />
                </div>
            )}
        </div>
    );
}
