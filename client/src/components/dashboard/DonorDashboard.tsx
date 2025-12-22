import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserType } from "@/context/AuthContext";
import {
    Droplet, Heart, Clock, Navigation, CheckCircle2, AlertCircle,
    ArrowRight, Loader2, ShieldCheck, QrCode, X, BookOpen,
    MessageCircle, Zap, Globe, MapPin, Activity, Plus, Minus, User, Calendar
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/utils";
import api from "@/config/api";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export const DonorDashboard = ({ user }: { user: UserType }) => {
    const [isAvailable, setIsAvailable] = useState(true);
    const [discoveries, setDiscoveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyingMission, setVerifyingMission] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState("");
    const [verifyUnits, setVerifyUnits] = useState(1);
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [donationCount, setDonationCount] = useState(0);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [showBooking, setShowBooking] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [bookingData, setBookingData] = useState({
        hospitalId: "",
        bloodType: user?.bloodType || "O+",
        scheduledAt: "",
        notes: ""
    });
    const [pendingCount, setPendingCount] = useState(0);
    const { socket } = useSocket();
    const navigate = useNavigate();

    const handleRequestConnection = async (receiverId: string, requestId: string) => {
        try {
            await api.post('/connections', { receiverId, requestId });
            toast.success("Connection request sent! Hospital will be notified.");
            setDiscoveries(prev => prev.map(d => d._id === requestId ? { ...d, connectionStatus: 'pending' } : d));
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to send request");
        }
    };

    const fetchOpportunities = async () => {
        try {
            const [nearbyRes, historyRes] = await Promise.all([
                api.get('/requests/nearby'),
                api.get('/requests/history')
            ]);
            const data = nearbyRes.data.data;
            setDiscoveries(data);

            const history = historyRes.data.data || [];
            const donations = history.filter((h: any) => h.type === 'donation' || h.type === 'manual_donation');
            setDonationCount(donations.length);
        } catch (error: any) {
            toast.error("Failed to load local donation needs.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments/me');
            setAppointments(res.data.data);
        } catch (error) {
            console.error("Failed to fetch appointments");
        }
    };

    const fetchHospitals = async () => {
        try {
            const res = await api.get('/hospital/public-inventory');
            setHospitals(res.data.data);
        } catch (error) {
            console.error("Failed to fetch hospitals");
        }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await api.get('/connections/pending');
            setPendingCount(res.data.data.length);
        } catch (error) {
            console.error("Failed to fetch pending count");
        }
    };

    useEffect(() => {
        fetchOpportunities();
        fetchAppointments();
        fetchHospitals();
        fetchPendingCount();

        if (socket) {
            socket.on('connection_requested', (data: any) => {
                setPendingCount(prev => prev + 1);
                toast.info(`New connection request from ${data.sender.name}!`, {
                    action: {
                        label: 'View',
                        onClick: () => navigate('/dashboard/messages')
                    }
                });
            });

            socket.on('MISSION_FULFILLED', (data: any) => {
                setDiscoveries(prev => {
                    const updated = prev.map(req =>
                        req._id === data.requestId
                            ? { ...req, collectedUnits: data.collected, status: data.status || req.status }
                            : req
                    );
                    // Vanish from radar if fulfilled
                    return updated.filter(req => req.status !== 'Fulfilled');
                });
            });

            return () => {
                socket.off('MISSION_FULFILLED');
                socket.off('connection_requested');
            };
        }
    }, [socket]);

    // Socket Room Management
    useEffect(() => {
        if (socket && discoveries.length > 0) {
            discoveries.forEach(req => {
                socket.emit('join', req._id);
            });
        }
    }, [socket, discoveries]);

    const handleCommitSupport = async (request: any) => {
        try {
            // Directly pledge 1 unit as requested to streamline flow
            await api.put(`/requests/${request._id}/pledge`, { units: 1 });
            toast.success("Excellent! You've committed to support.");
            fetchOpportunities();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to start donation.");
        }
    };

    const handleDeleteAppointment = async (appointmentId: string) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        try {
            await api.delete(`/appointments/${appointmentId}`);
            toast.success("Appointment cancelled successfully.");
            fetchAppointments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to cancel appointment.");
        }
    };

    const handleVerifyCompletion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyingMission || !verifyCode) return;

        setIsSubmittingCode(true);
        try {
            // Include units in verification payload
            const res = await api.post(`/requests/${verifyingMission}/verify-qr`, {
                token: verifyCode,
                units: verifyUnits
            });
            if (res.data.success) {
                toast.success(`Donation of ${verifyUnits} units complete! Thank you.`);
                setVerifyingMission(null);
                setVerifyCode("");
                setVerifyUnits(1);
                fetchOpportunities();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Incorrect code. Please check with the hospital.");
        } finally {
            setIsSubmittingCode(false);
        }
    };

    const calculateDistance = (coords1: [number, number], coords2: [number, number]) => {
        if (!coords1 || !coords2) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
        const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/appointments', bookingData);
            if (res.data.success) {
                toast.success("Appointment booked! Waiting for hospital confirmation.");
                setShowBooking(false);
                fetchAppointments();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Booking failed");
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* Donor Identity & Impact Summary */}
            <div className="px-4">
                <div className="glass-panel rounded-[48px] p-8 sm:p-12 border-white/50 shadow-2xl shadow-gray-200/50 flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] -z-10" />

                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-left w-full">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-red-500 to-pink-500 rounded-[42px] blur opacity-25 group-hover:opacity-40 transition-opacity" />
                            <div className="relative w-28 h-28 bg-white text-[#FF1744] rounded-[40px] flex items-center justify-center font-black text-5xl shadow-xl border border-red-50">
                                {user?.bloodType}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                <ShieldCheck size={20} className="text-amber-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase">
                                    {user?.name}
                                </h1>
                                <div className="inline-flex items-center self-center sm:self-auto gap-2 px-3 py-1 bg-amber-50 rounded-lg text-amber-600 font-black text-[9px] uppercase tracking-widest border border-amber-100">
                                    Elite Donor
                                </div>
                            </div>
                            <p className="text-base sm:text-lg font-bold text-gray-400 max-w-md leading-tight">
                                Your blood type is in high demand in the <span className="text-gray-900">{user?.location?.city || 'local'} area</span>.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full xl:w-auto shrink-0">
                        <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center sm:items-start gap-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Impact Score</p>
                            <div className="flex items-center gap-2">
                                <Activity size={20} className="text-[#FF1744]" />
                                <span className="text-2xl font-black text-gray-900 uppercase">High</span>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-900 rounded-[32px] shadow-xl flex flex-col items-center sm:items-start gap-2">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Donations</p>
                            <div className="flex items-center gap-2 text-white">
                                <Heart size={20} className="text-red-400 fill-red-400" />
                                <span className="text-2xl font-black">{donationCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Tracker */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                        <div className="w-2 h-8 bg-[#FF1744] rounded-full" />
                        Upcoming Appointments
                    </h2>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => navigate('/dashboard/messages')}
                            className="bg-white text-gray-900 border-2 border-gray-100 hover:border-red-100 px-6 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all relative"
                        >
                            <MessageCircle size={16} className="text-[#FF1744]" /> Inbox
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF1744] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                                    {pendingCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowBooking(true)}
                            className="bg-gray-900 text-white hover:bg-black px-6 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3"
                        >
                            <Calendar size={16} /> Book Appointment
                        </Button>
                    </div>
                </div>

                {appointments.length > 0 ? (
                    <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                        {appointments.map((apt) => (
                            <div key={apt._id} className="min-w-[320px] bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className={cn(
                                    "absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10",
                                    apt.status === 'Confirmed' ? "bg-green-500" : "bg-amber-500"
                                )} />
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hospital</p>
                                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{apt.hospital.facilityName}</h4>
                                        </div>
                                        <div className="w-12 h-12 bg-red-50 text-[#FF1744] rounded-2xl flex items-center justify-center font-black">
                                            {apt.bloodType}
                                        </div>
                                    </div>
                                    {apt.status === 'Pending' && (
                                        <button
                                            onClick={() => handleDeleteAppointment(apt._id)}
                                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            title="Cancel Appointment"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    <div className="flex items-center gap-6 justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-900">{new Date(apt.scheduledAt).toLocaleDateString()}</p>
                                                <p className="text-[9px] font-bold text-gray-400">{new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                            apt.status === 'Confirmed' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm">
                            <Calendar size={32} />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No upcoming donations scheduled</p>
                    </div>
                )}
            </div>

            {/* Opportunity Board */}
            <div className="px-4 space-y-8 sm:space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="space-y-2 text-left">
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase flex items-center gap-4">
                            Blood Requirements
                        </h2>
                        <p className="text-gray-400 font-bold text-sm sm:text-base">Nearby blood needs and donation drives.</p>
                    </div>
                    <Button variant="ghost" className="hidden sm:inline-flex bg-white hover:bg-gray-50 border border-gray-100 px-8 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-900 shadow-sm">
                        Browse Network <Globe size={16} className="ml-3 text-[#FF1744]" />
                    </Button>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-8 bg-white/50 rounded-[60px] border-4 border-dashed border-gray-100">
                        <div className="relative">
                            <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                            <div className="absolute inset-0 m-auto w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Scanning local area...</p>
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Searching nearby hospitals</p>
                        </div>
                    </div>
                ) : discoveries.length > 0 ? (
                    <div className="grid xl:grid-cols-2 gap-8">
                        {discoveries.map((req) => (
                            <motion.div
                                key={req._id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "p-6 sm:p-10 rounded-[48px] border-2 transition-all relative overflow-hidden group",
                                    req.myPledgeStatus
                                        ? "bg-gradient-to-br from-green-50/50 to-white border-green-200 shadow-xl shadow-green-100/20"
                                        : "bg-white border-transparent hover:border-gray-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-2"
                                )}
                            >
                                {/* ... Same content as before ... */}
                                {/* Truncating purely visual parts not changed for brevity, but retaining full structure */}

                                {req.urgency === 'Critical' && !req.myPledgeStatus && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 animate-pulse" />
                                )}

                                <div className="flex flex-col gap-10 relative z-10">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-12">
                                        <div className="relative shrink-0">
                                            <div className={cn(
                                                "w-24 h-24 rounded-[32px] flex flex-col items-center justify-center shadow-lg border-2 transition-transform duration-500 group-hover:rotate-6",
                                                req.myPledgeStatus ? "bg-green-500 text-white border-green-400" : "bg-gray-100 text-gray-900 border-white"
                                            )}>
                                                <span className="text-4xl font-black tracking-tighter">{req.bloodType}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 opacity-60">Group</span>
                                            </div>
                                            {req.urgency === 'Critical' && (
                                                <div className="absolute -top-2 -left-2 bg-red-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
                                                    <Zap size={16} className="fill-current" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-6 w-full text-center md:text-left">
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                                    <h4 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{req.hospitalName}</h4>
                                                    {req.isPublicDrive ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="px-5 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 flex items-center gap-2">
                                                                <Globe size={12} className="animate-spin-slow" /> Stock Drive
                                                            </span>
                                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mr-2">Hospital Contribution</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={cn(
                                                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2",
                                                                req.urgency === 'Critical' ? "bg-[#FF1744] text-white shadow-red-100" : "bg-amber-500 text-white shadow-amber-100"
                                                            )}>
                                                                {req.urgency === 'Critical' ? <Activity size={12} className="animate-pulse" /> : <Clock size={12} />}
                                                                Patient Need
                                                            </span>
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase tracking-widest mr-2",
                                                                req.urgency === 'Critical' ? "text-red-400" : "text-amber-500"
                                                            )}>{req.urgency} Urgency</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-gray-400 text-sm font-bold">
                                                    <span className="flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                                        <MapPin size={14} className="text-[#FF1744]" />
                                                        {req.location?.address?.split(',')[0]}
                                                        {user?.location?.coordinates && (
                                                            <span className="text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                                                {calculateDistance(user.location.coordinates as [number, number], req.location.coordinates)} km
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                                    <span className="flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                                        <User size={14} className="text-blue-400" />
                                                        Patient: {req.patientName || 'Medical Case'}
                                                    </span>
                                                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                                    <span className="flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                                        <Heart size={14} className="text-pink-400" />
                                                        By: {req.requester?.name || 'Authorized Lab'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-gray-400">Current Progress</span>
                                                    <span className={cn(
                                                        req.collectedUnits >= req.units ? "text-green-500" : "text-[#FF1744]"
                                                    )}>
                                                        {req.collectedUnits || 0} / {req.units} Units Gathered
                                                    </span>
                                                </div>
                                                <div className="h-4 bg-gray-100 rounded-2xl overflow-hidden border border-gray-50 p-1">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, ((req.collectedUnits || 0) / req.units) * 100)}%` }}
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            req.myPledgeStatus ? "bg-green-500" : req.collectedUnits >= req.units ? "bg-indigo-500" : "bg-gradient-to-r from-red-400 to-[#FF1744]"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 w-full">
                                        {req.status === 'Fulfilled' ? (
                                            <div className="h-20 px-10 bg-green-50 text-green-600 rounded-[32px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest border border-green-100">
                                                <CheckCircle2 size={18} /> Mission Completed
                                            </div>
                                        ) : req.myPledgeStatus ? (
                                            req.collectedUnits >= req.units ? (
                                                <div className="h-24 px-10 bg-indigo-50 text-indigo-600 rounded-[40px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest border border-indigo-100 shadow-sm shadow-indigo-50">
                                                    <Clock size={20} /> Goal Reached By Others
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Button
                                                        onClick={() => navigate('/dashboard/messages')}
                                                        className="h-20 bg-gray-900 text-white rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-200"
                                                    >
                                                        <MessageCircle size={18} className="mr-3" /> Inbox
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setVerifyingMission(req._id); setVerifyUnits(1); }}
                                                        className="h-20 bg-green-500 hover:bg-green-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-green-100"
                                                    >
                                                        Finalize <ArrowRight size={18} className="ml-3" />
                                                    </Button>
                                                    <Button
                                                        disabled={req.connectionStatus === 'pending'}
                                                        onClick={() => handleRequestConnection(req.requester?._id || req.hospitalId, req._id)}
                                                        className={cn(
                                                            "h-20 rounded-[32px] font-black text-[10px] uppercase tracking-widest transition-all border-4 border-gray-50 flex items-center justify-center col-span-2 lg:col-span-1",
                                                            req.connectionStatus === 'pending'
                                                                ? "bg-gray-100 text-gray-400"
                                                                : "bg-white text-gray-900 hover:border-red-50"
                                                        )}
                                                    >
                                                        {req.connectionStatus === 'pending' ? <Clock size={16} /> : <MessageCircle size={16} />}
                                                        <span className="ml-2">Connect</span>
                                                    </Button>
                                                </div>
                                            )
                                        ) : req.collectedUnits >= req.units ? (
                                            <div className="h-24 px-10 bg-indigo-50 text-indigo-600 rounded-[40px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest border border-indigo-100 shadow-sm shadow-indigo-50">
                                                <Clock size={20} /> Goal Reached - Awaiting Collection
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <Button
                                                    onClick={() => handleCommitSupport(req)}
                                                    className="flex-1 h-24 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[40px] font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red-200"
                                                >
                                                    Commit Support
                                                </Button>
                                                <Button
                                                    disabled={req.connectionStatus === 'pending'}
                                                    onClick={() => handleRequestConnection(req.requester?._id || req.hospitalId, req._id)}
                                                    className={cn(
                                                        "px-8 h-24 rounded-[40px] font-black text-[10px] uppercase tracking-widest transition-all",
                                                        req.connectionStatus === 'pending'
                                                            ? "bg-gray-100 text-gray-400"
                                                            : "bg-white border-4 border-gray-50 text-gray-900 hover:border-red-50"
                                                    )}
                                                >
                                                    {req.connectionStatus === 'pending' ? <Clock size={16} /> : <MessageCircle size={16} />}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center bg-white rounded-[60px] border-4 border-dashed border-gray-100 flex flex-col items-center gap-8 shadow-sm">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                <Activity size={56} />
                            </div>
                            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-10" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">No nearby requests</h3>
                            <p className="text-gray-400 font-bold max-w-sm mx-auto">There are no active blood requests in your area right now.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Modal */}
            {verifyingMission && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <Card className="max-w-md w-full bg-white rounded-[60px] border-none shadow-2xl animate-in zoom-in-95 overflow-hidden">
                        <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Final Step</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Security Handshake</p>
                            </div>
                            <button onClick={() => setVerifyingMission(null)} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                        </CardHeader>
                        <CardContent className="p-12 space-y-8">
                            <div className="space-y-6">
                                <p className="text-lg font-bold text-gray-500 text-center leading-relaxed">
                                    Confirm donation details and enter the 6-digit code.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pl-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-left">Units Donated</label>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            Max {discoveries.find(d => d._id === verifyingMission)?.units - (discoveries.find(d => d._id === verifyingMission)?.collectedUnits || 0)} Units
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-[24px] border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setVerifyUnits(Math.max(1, verifyUnits - 1))}
                                            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:bg-gray-100 shadow-sm"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <input
                                            type="number"
                                            value={verifyUnits}
                                            onChange={(e) => {
                                                const req = discoveries.find(d => d._id === verifyingMission);
                                                const max = req ? req.units - (req.collectedUnits || 0) : 1;
                                                setVerifyUnits(Math.min(max, Math.max(1, parseInt(e.target.value) || 1)));
                                            }}
                                            className="flex-1 bg-transparent text-center font-black text-2xl outline-none text-gray-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const req = discoveries.find(d => d._id === verifyingMission);
                                                const max = req ? req.units - (req.collectedUnits || 0) : 1;
                                                if (verifyUnits < max) setVerifyUnits(verifyUnits + 1);
                                            }}
                                            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:bg-gray-100 shadow-sm"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyCompletion} className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2 text-left">Security Code</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value)}
                                            className="w-full h-24 text-center text-5xl font-black tracking-[0.4em] bg-gray-50 border-4 border-transparent focus:border-red-500 rounded-[32px] transition-all outline-none text-gray-900 placeholder:text-gray-100"
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={verifyCode.length !== 6 || isSubmittingCode}
                                        className="w-full h-20 bg-gray-900 hover:bg-black text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl"
                                    >
                                        {isSubmittingCode ? <Loader2 className="animate-spin" /> : "Complete Donation"}
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Pledge Amount Modal REMOVED - Streamlined flow */}

            {/* Appointment Booking Modal */}
            {showBooking && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full">
                        <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden">
                            <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                <div className="space-y-1 text-left">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Book Donation</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Schedule a visit</p>
                                </div>
                                <button onClick={() => setShowBooking(false)} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                            </CardHeader>
                            <CardContent className="p-12 space-y-8">
                                <form onSubmit={handleCreateAppointment} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block text-left">Select Hospital</label>
                                        <select
                                            required
                                            value={bookingData.hospitalId}
                                            onChange={(e) => setBookingData({ ...bookingData, hospitalId: e.target.value })}
                                            className="w-full h-18 bg-gray-50 border-none rounded-[24px] px-6 text-sm font-bold outline-none"
                                        >
                                            <option value="">Choose Hospital...</option>
                                            {hospitals.map(h => (
                                                <option key={h._id} value={h._id}>{h.facilityName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block text-left">Blood Type</label>
                                        <select
                                            value={bookingData.bloodType}
                                            onChange={(e) => setBookingData({ ...bookingData, bloodType: e.target.value })}
                                            className="w-full h-18 bg-gray-50 border-none rounded-[24px] px-6 text-sm font-bold outline-none"
                                        >
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block text-left">Date & Time</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={bookingData.scheduledAt}
                                            onChange={(e) => setBookingData({ ...bookingData, scheduledAt: e.target.value })}
                                            className="w-full h-18 bg-gray-50 border-none rounded-[24px] px-6 text-sm font-bold outline-none"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-20 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-200">
                                        Confirm Reservation
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
