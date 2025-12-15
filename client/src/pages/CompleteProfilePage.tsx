import React, { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Droplet, MapPin, CheckCircle2, ArrowRight, Loader2, Heart, Navigation, Search, Building2, Camera } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import api from "@/config/api";
import { toast } from "sonner";
import { cn } from "@/utils/utils";
import { HospitalSearch } from "@/components/frontend/HospitalSearch";

const NepalMap = React.lazy(() => import("@/components/map/NepalMap"));

export default function CompleteProfilePage() {
    const { user, checkUserLoggedIn } = useAuth();
    const navigate = useNavigate();
    const isHospital = user?.role === 'hospital';

    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [step, setStep] = useState(isHospital ? 2 : 1);
    const [formData, setFormData] = useState({
        bloodType: user?.bloodType !== 'unknown' ? user?.bloodType : (isHospital ? "unknown" : ""),
        address: user?.facilityAddress || user?.location?.address || "",
        coordinates: user?.location?.coordinates || [85.324, 27.7172] as [number, number],
        facilityName: user?.facilityName || "",
        verificationImage: user?.verificationImage || ""
    });

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

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData({
            ...formData,
            coordinates: [lng, lat]
        });
    };

    const selectFacility = (facility: any) => {
        setFormData({
            ...formData,
            facilityName: facility.name,
            address: facility.address,
            coordinates: facility.location.coordinates
        });
        toast.success(`Selected ${facility.name}`);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (max 5MB)");

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, verificationImage: reader.result as string });
            toast.success("Proof image captured!");
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!isHospital && !formData.bloodType) return toast.error("Please select your blood group");
        if (!formData.address) return toast.error("Please provide your location");
        if (isHospital && !formData.facilityName) return toast.error("Please select your facility");
        if (isHospital && !formData.verificationImage) return toast.error("Please provide verification proof");

        setLoading(true);
        try {
            const finalData = { ...formData };
            if (!isHospital) {
                finalData.facilityName = "";
                finalData.verificationImage = "";
            }

            await api.put('/auth/profile', finalData);
            await checkUserLoggedIn();
            toast.success("Profile completed!");
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-2xl text-[#FF1744] font-black text-xs uppercase tracking-[0.2em]">
                        <Heart size={14} className="fill-current" />
                        Final Step
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter">One last <span className="text-[#FF1744]">thing</span>...</h1>
                </div>

                <div className="space-y-10">
                    <Card className="border-none shadow-2xl shadow-gray-100/50 rounded-[40px] p-12">
                        <CardContent className="p-0 space-y-12 text-left">
                            {step === 1 ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                                            <Droplet className="text-[#FF1744]" /> What's your blood group?
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {bloodTypes.map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, bloodType: type })}
                                                className={cn(
                                                    "h-14 rounded-2xl font-black text-lg transition-all border-2",
                                                    formData.bloodType === type
                                                        ? "bg-[#FF1744] border-[#FF1744] text-white shadow-xl"
                                                        : "bg-white border-gray-100 text-gray-400 hover:border-red-100 hover:text-[#FF1744]"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!formData.bloodType}
                                        className="w-full h-18 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest"
                                    >
                                        Next Step
                                    </Button>
                                </div>
                            ) : step === 2 ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                                            <MapPin className="text-[#FF1744]" /> {isHospital ? "Find your Facility" : "Pin your Location"}
                                        </h2>
                                        {!isHospital && (
                                            <Button onClick={getCurrentLocation} disabled={gettingLocation} className="bg-red-50 text-[#FF1744] rounded-xl h-10 px-4">
                                                Detect
                                            </Button>
                                        )}
                                    </div>

                                    {isHospital && (
                                        <HospitalSearch
                                            onSelect={selectFacility}
                                            placeholder="Find your medical facility..."
                                        />
                                    )}

                                    <div className="h-[250px] w-full rounded-2xl overflow-hidden border">
                                        <Suspense fallback={<div>Loading Map...</div>}>
                                            <NepalMap
                                                center={[formData.coordinates[1], formData.coordinates[0]]}
                                                onLocationSelect={handleLocationSelect}
                                                markerPosition={[formData.coordinates[1], formData.coordinates[0]]}
                                            />
                                        </Suspense>
                                    </div>

                                    <textarea
                                        placeholder="Full Address..."
                                        className="w-full min-h-[100px] p-6 bg-gray-50 rounded-[28px] outline-none font-bold text-sm"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />

                                    <div className="flex gap-4">
                                        {!isHospital && <Button onClick={() => setStep(1)} variant="ghost" className="h-18 px-6">Back</Button>}
                                        <Button onClick={() => isHospital ? setStep(3) : handleSave()} className="flex-1 h-18 bg-[#FF1744] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100">
                                            {isHospital ? "Next: Verification" : "Finish Setup"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                        <Camera className="text-[#FF1744]" /> Verification Proof
                                    </h2>
                                    <div className="aspect-video bg-gray-50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center relative hover:border-[#FF1744] cursor-pointer group">
                                        {formData.verificationImage ? (
                                            <img src={formData.verificationImage} className="h-full w-full object-cover rounded-3xl" alt="Proof" />
                                        ) : (
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <Camera size={48} className="mx-auto text-gray-300 group-hover:text-[#FF1744]" />
                                                <p className="mt-2 font-black text-gray-400">Upload Logo or License</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <div className="flex gap-4">
                                        <Button onClick={() => setStep(2)} variant="ghost" className="h-18 px-6">Back</Button>
                                        <Button onClick={handleSave} disabled={loading || !formData.verificationImage} className="flex-1 h-18 bg-[#FF1744] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100">
                                            {loading ? <Loader2 className="animate-spin" /> : "Submit for Verification"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
