import React, { useState, useEffect } from "react";
import { User as UserType } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Activity, Droplets, UserPlus, ClipboardList, TrendingUp, AlertTriangle,
    ArrowRight, Loader2, QrCode, X, Search, Heart, ShieldCheck, CheckCircle2,
    Database, Save, Plus, Minus, Settings, ShoppingBag, Globe, Zap, MessageCircle,
    MapPin, User, Clock, Calendar, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/utils";
import api from "@/config/api";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export const HospitalDashboard = ({ user }: { user: UserType }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stock, setStock] = useState<any[]>([]);
    const [activeDonations, setActiveDonations] = useState<any[]>([]);
    const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [generatingQr, setGeneratingQr] = useState(false);
    const [suggestedDonors, setSuggestedDonors] = useState<any[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    const [showMatches, setShowMatches] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [activeDashboardTab, setActiveDashboardTab] = useState<'missions' | 'appointments'>('missions');
    const [pendingCount, setPendingCount] = useState(0);
    const { socket } = useSocket();

    // Inventory Management State
    const [isManagingStock, setIsManagingStock] = useState(false);
    const [editableStock, setEditableStock] = useState<any[]>([]);
    const [isSavingStock, setIsSavingStock] = useState(false);

    // Public Drive State
    const [isStartingDrive, setIsStartingDrive] = useState(false);
    const [driveData, setDriveData] = useState({
        bloodType: "O+",
        units: 10,
        description: "General donation drive to replenish hospital blood bank."
    });

    // Direct Fulfill Logic
    const [isDirectFulfilling, setIsDirectFulfilling] = useState(false);
    const [directFulfillUnits, setDirectFulfillUnits] = useState<number>(1);
    const [submittingFulfill, setSubmittingFulfill] = useState(false);

    const fetchHospitalData = async () => {
        try {
            // Fetch Inventory, My Requests, and Nearby Public Drives (Network)
            const [invRes, myReqRes, nearbyRes] = await Promise.all([
                api.get('/hospital/inventory'),
                api.get('/hospital/my-requests'),
                api.get('/requests/nearby')
            ]);

            const inventory = invRes.data.data || [];
            setStock(inventory);
            setEditableStock(inventory);

            const myReqs = myReqRes.data.data || [];
            const nearbyReqs = nearbyRes.data.data || [];

            // Combine Requests (Prioritize My Requests + Others' Public Drives)
            // Filter out my own requests from nearby to avoid duplicates if API returns them
            // Actually, let's just use a Map to dedup by _id
            const combinedMap = new Map();

            myReqs.forEach((r: any) => {
                const isCreator = r.requester === user?._id;
                combinedMap.set(r._id, { ...r, isCreator, isMine: true });
            });
            nearbyReqs.forEach((r: any) => {
                if (!combinedMap.has(r._id)) {
                    combinedMap.set(r._id, { ...r, isCreator: false, isMine: false });
                }
            });

            const allReqs = Array.from(combinedMap.values());
            // Filter unfulfilled
            setActiveDonations(allReqs.filter((r: any) => r.status !== 'Fulfilled'));

        } catch (error) {
            console.error("Failed to fetch hospital data");
            toast.error("Connection error. Please refresh.");
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

    const handleUpdateAptStatus = async (id: string, status: string) => {
        try {
            const res = await api.put(`/appointments/${id}/status`, { status });
            if (res.data.success) {
                toast.success(`Appointment ${status.toLowerCase()}!`);
                fetchAppointments();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update status");
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
        fetchHospitalData();
        fetchAppointments();
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
                setActiveDonations((prev: any[]) => {
                    const updated = prev.map((req: any) =>
                        req._id === data.requestId
                            ? { ...req, collectedUnits: data.collected, status: data.status || req.status }
                            : req
                    );
                    // Filter out fulfilled missions so they vanish from dashboard in real-time
                    return updated.filter((req: any) => req.status !== 'Fulfilled');
                });
                toast.success(`Progress Update for ${data.hospitalName}!`);
            });

            socket.on('connection_requested', () => {
                fetchPendingCount();
            });

            return () => {
                socket.off('MISSION_FULFILLED');
                socket.off('connection_requested');
            };
        }
    }, [socket]);

    // Socket Room Management: Join rooms for all active donations to receive progress events
    useEffect(() => {
        if (socket && activeDonations.length > 0) {
            activeDonations.forEach((req: any) => {
                socket.emit('join', req._id);
            });
        }
    }, [socket, activeDonations]);

    const handleGenerateCode = async (requestId: string) => {
        setGeneratingQr(true);
        try {
            // Include units in QR generation if needed?
            // Currently generate-qr just makes a token. verification uses the token AND units.
            // So we just generate the token here.

            const res = await api.get(`/hospital/generate-qr/${requestId}`);
            if (res.data.success) {
                setQrToken(res.data.data.token);
                toast.success("Verification Code Generated!");
            }
        } catch (error) {
            toast.error("Failed to generate code");
        } finally {
            setGeneratingQr(false);
        }
    };

    const handleUpdateStock = async () => {
        setIsSavingStock(true);
        try {
            await api.put('/hospital/inventory', { inventory: editableStock });
            setStock(editableStock);
            toast.success("Blood Bank Updated Successfully!");
            setIsManagingStock(false);
        } catch (error) {
            toast.error("Failed to update stock");
        } finally {
            setIsSavingStock(false);
        }
    };

    const handleStartDrive = async () => {
        if (!user?.location || !user?.location.coordinates) {
            return toast.error("Facility location missing. Please update your profile.");
        }

        try {
            const res = await api.post('/requests', {
                bloodType: driveData.bloodType,
                units: driveData.units,
                description: driveData.description || `General donation drive for ${user.facilityName} to support local patients and replenish emergency reserves.`,
                location: user.location,
                hospitalName: user.facilityName,
                manualUrgency: 'Normal',
                isPublicDrive: true
            });

            if (res.data.success) {
                toast.success("Public Donation Drive Started!");
                setIsStartingDrive(false);
                fetchHospitalData();
            }
        } catch (error: any) {
            const message = error.response?.data?.error || "Failed to start drive";
            toast.error(message);
        }
    };

    const handleDirectFulfill = async () => {
        if (!selectedDonation) return;
        setSubmittingFulfill(true);
        try {
            const res = await api.post(`/requests/${selectedDonation._id}/fulfill-direct`, {
                units: directFulfillUnits
            });

            if (res.data.success) {
                toast.success(`Successfully donated ${directFulfillUnits} units from stock!`);
                setIsDirectFulfilling(false);
                setSelectedDonation(null);
                fetchHospitalData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to fulfill request");
        } finally {
            setSubmittingFulfill(false);
        }
    };

    const handleFindMatches = async (requestId: string) => {
        setIsMatching(true);
        setShowMatches(requestId);
        try {
            const res = await api.get(`/match/donors/${requestId}`);
            setSuggestedDonors(res.data.data);
        } catch (error) {
            toast.error("Failed to find matches");
        } finally {
            setIsMatching(false);
        }
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!window.confirm("Are you sure you want to remove this mission/drive? This will stop all network visibility.")) return;

        try {
            await api.delete(`/requests/${requestId}`);
            toast.success("Mission/Drive removed.");
            fetchHospitalData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to remove.");
        }
    };

    const handleDeleteAppointment = async (id: string) => {
        if (!window.confirm("Cancel this appointment?")) return;
        try {
            await api.delete(`/appointments/${id}`);
            toast.success("Appointment cancelled.");
            fetchAppointments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to cancel.");
        }
    };

    const handleRequestConnection = async (donorId: string, requestId: string) => {
        try {
            await api.post('/connections', { receiverId: donorId, requestId });
            toast.success("Connection request sent! Donor will be notified.");
            // Optionally update UI state to show "Pending" or similar
            setSuggestedDonors(prev => prev.map(d => d._id === donorId ? { ...d, connectionStatus: 'pending' } : d));
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to send request");
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-8">
            <div className="relative">
                <Loader2 className="animate-spin text-[#FF1744]" size={64} />
                <div className="absolute inset-0 m-auto w-3 h-3 bg-red-500 rounded-full animate-ping" />
            </div>
            <p className="font-black text-gray-900 uppercase tracking-[0.4em] text-[10px] bg-white px-6 py-2 rounded-full border border-gray-100 shadow-sm">Calibrating Command Center</p>
        </div>
    );

    const totalStock = stock.reduce((acc: number, curr: any) => acc + (curr.units || 0), 0);

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* Main Welcome & Operational Control */}
            <div className="flex flex-col xl:flex-row items-start justify-between gap-16 pt-14 px-8 text-left">
                <div className="space-y-6 flex-1">
                    <div className="flex gap-4">
                        <Button onClick={() => setIsManagingStock(true)} className="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                            <Settings size={16} className="mr-2" /> Manage Stock
                        </Button>
                        <Button onClick={() => setIsStartingDrive(true)} className="h-14 px-8 bg-[#FF1744] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all shadow-red-200">
                            <Plus size={16} className="mr-2" /> Start Drive
                        </Button>
                    </div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-[0.85] uppercase">
                        {user?.facilityName || 'Facility Center'}
                    </h1>
                    <p className="text-lg sm:text-xl font-bold text-gray-400 max-w-2xl leading-relaxed">Precision blood bank management and emergency coordination console.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <Button
                        onClick={() => navigate('/dashboard/messages')}
                        className="h-20 px-10 bg-white border-2 border-gray-100 hover:border-red-100 text-gray-900 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-100 transition-all flex items-center justify-center gap-4 group relative"
                    >
                        <MessageCircle size={18} className="text-[#FF1744]" />
                        Communications
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#FF1744] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                                {pendingCount}
                            </span>
                        )}
                    </Button>
                    <Button
                        onClick={() => setIsManagingStock(true)}
                        className="h-20 px-10 bg-gray-900 hover:bg-black text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 transition-all flex items-center justify-center gap-4 group"
                    >
                        <Database size={18} className="group-hover:scale-110 transition-transform" />
                        Update Inventory
                    </Button>
                    <Button
                        onClick={() => setIsStartingDrive(true)}
                        className="h-20 px-10 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-200 transition-all flex items-center justify-center gap-4 group"
                    >
                        <Globe size={18} className="animate-pulse" />
                        Launch Drive
                    </Button>
                </div>
            </div>

            {/* Central Intelligence Grid */}
            <div className="grid lg:grid-cols-12 gap-10 px-4">

                {/* 1. Real-time Blood Bank Display - Sidebar Console */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                            <Database size={20} className="text-[#FF1744]" /> Bank Stats
                        </h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{totalStock} Total Units</span>
                    </div>

                    <div className="glass-panel rounded-[48px] p-8 border-white/50 shadow-2xl shadow-gray-200/50">
                        <div className="grid grid-cols-2 gap-4">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => {
                                const item = stock.find((s: any) => s.bloodType === type);
                                const units = item?.units || 0;
                                return (
                                    <motion.div
                                        key={type}
                                        whileHover={{ y: -4 }}
                                        className={cn(
                                            "p-6 rounded-[32px] border-2 transition-all relative overflow-hidden group",
                                            units > 5 ? "bg-white border-gray-50" : units > 0 ? "bg-amber-50/30 border-amber-100" : "bg-gray-50/50 border-gray-100 opacity-60"
                                        )}
                                    >
                                        {units === 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{type}</p>
                                        <div className="flex items-end gap-1">
                                            <span className={cn("text-4xl font-black tracking-tighter", units > 0 ? "text-gray-900" : "text-gray-300")}>
                                                {units}
                                            </span>
                                            <span className="text-[9px] font-black text-gray-400 mb-1.5 uppercase">Units</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* NEW: Communications Quick Access */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => navigate('/dashboard/messages')}
                        className="glass-panel rounded-[48px] p-8 border-[#FF1744]/10 shadow-2xl shadow-red-100/30 cursor-pointer group bg-gradient-to-br from-white to-red-50/30"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 bg-red-50 rounded-[22px] flex items-center justify-center text-[#FF1744] group-hover:scale-110 transition-transform shadow-inner">
                                <MessageCircle size={24} />
                            </div>
                            {pendingCount > 0 && (
                                <span className="px-4 py-2 bg-[#FF1744] text-white text-[10px] font-black rounded-full shadow-lg shadow-red-200 animate-bounce">
                                    {pendingCount} NEW
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Communications</h3>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-wider">Coordinate with donors and other facilities.</p>
                        <div className="mt-6 flex items-center gap-2 text-[#FF1744] font-black text-[10px] uppercase tracking-widest">
                            Open Inbox <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.div>
                </div>

                {/* 2. Operations Center - Missions & Appointments Grid */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-8 border-b-2 border-gray-100 w-full mb-4">
                            <button
                                onClick={() => setActiveDashboardTab('missions')}
                                className={cn(
                                    "px-4 pb-4 text-xl font-black uppercase tracking-tight transition-all relative",
                                    activeDashboardTab === 'missions' ? "text-gray-900" : "text-gray-300 hover:text-gray-400"
                                )}
                            >
                                Active Missions
                                {activeDashboardTab === 'missions' && <motion.div layoutId="tab-underline" className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#FF1744] rounded-full" />}
                            </button>
                            <button
                                onClick={() => setActiveDashboardTab('appointments')}
                                className={cn(
                                    "px-4 pb-4 text-xl font-black uppercase tracking-tight transition-all relative",
                                    activeDashboardTab === 'appointments' ? "text-gray-900" : "text-gray-300 hover:text-gray-400"
                                )}
                            >
                                Appointments
                                {activeDashboardTab === 'appointments' && <motion.div layoutId="tab-underline" className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#FF1744] rounded-full" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {activeDashboardTab === 'missions' ? (
                            activeDonations.length > 0 ? (
                                <AnimatePresence>
                                    {activeDonations.map((req) => (
                                        <motion.div
                                            key={req._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white rounded-[48px] p-6 sm:p-8 border border-gray-100 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.06)] group/card hover:shadow-[0_48px_96px_-32px_rgba(0,0,0,0.12)] transition-all relative overflow-hidden flex flex-col h-full"
                                        >
                                            <div className="flex flex-col gap-10 flex-1">
                                                <div className="flex flex-col md:flex-row items-start gap-10 w-full">
                                                    <div className="w-20 h-20 bg-red-50 text-[#FF1744] rounded-[28px] flex flex-col items-center justify-center shadow-inner border border-red-100/50 shrink-0 group-hover/card:scale-110 transition-transform">
                                                        <span className="text-3xl font-black tracking-tighter">{req.bloodType}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Req</span>
                                                    </div>

                                                    <div className="flex-1 space-y-6 w-full text-left">
                                                        <div className="space-y-4">
                                                            <div className="flex flex-wrap items-center gap-4">
                                                                <h4 className="font-black text-gray-900 text-2xl tracking-tight leading-tight uppercase">{req.bloodType} Emergency Support</h4>
                                                                {req.urgency === 'Critical' && (
                                                                    <span className="px-3 py-1 bg-red-100 text-[#FF1744] rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse border border-red-200">
                                                                        Critical Urgency
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-4">
                                                                <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 w-fit">
                                                                    <MapPin size={14} className="text-red-400" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 truncate max-w-[150px]">{req.location?.address?.split(',')[0]}</span>
                                                                </div>
                                                                {req.patientName && (
                                                                    <div className="flex items-center gap-2.5 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 w-fit">
                                                                        <User size={14} className="text-blue-500" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Patient: {req.patientName}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* (NEW) Case Description */}
                                                            {(req.description || req.aiReasoning) && (
                                                                <div className="bg-red-50/30 p-4 rounded-3xl border border-red-100/50 mt-2">
                                                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-2 italic">
                                                                        <MessageSquare size={10} /> Clinical Brief
                                                                    </p>
                                                                    <p className="text-xs font-bold text-gray-600 leading-relaxed italic">
                                                                        "{req.description || req.aiReasoning}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-4 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                                                            <div className="flex justify-between items-end">
                                                                <div className="text-right ml-auto">
                                                                    <p className="text-2xl font-black text-[#FF1744] tracking-tighter leading-none">{req.collectedUnits || 0} / {req.units}</p>
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Units Secured</p>
                                                                </div>
                                                            </div>
                                                            <div className="h-4 bg-gray-200/50 rounded-full overflow-hidden p-1 border border-gray-100">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(100, ((req.collectedUnits || 0) / req.units) * 100)}%` }}
                                                                    className="h-full bg-gradient-to-r from-[#FF1744] to-pink-500 rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full shrink-0">
                                                    <Button onClick={() => handleFindMatches(req._id)} className="h-16 px-6 bg-blue-50 text-blue-600 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-100 transition-all flex-1 min-w-[140px]">
                                                        Find Matches <Search size={16} className="ml-2" />
                                                    </Button>

                                                    {req.collectedUnits < req.units && !req.isMine && (
                                                        <Button
                                                            onClick={() => { setSelectedDonation(req); setIsDirectFulfilling(true); setDirectFulfillUnits(1); }}
                                                            className="h-16 px-6 bg-amber-50 text-amber-600 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-100 transition-all flex-1 min-w-[140px]"
                                                        >
                                                            Donate from Stock <Database size={16} className="ml-2" />
                                                        </Button>
                                                    )}

                                                    {req.isMine && (
                                                        <Button
                                                            onClick={() => { setSelectedDonation(req); setQrToken(null); }}
                                                            className="h-16 px-6 bg-[#FF1744] text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#D50000] flex-1 min-w-[140px]"
                                                        >
                                                            {req.isCreator ? "Verify Donor" : req.collectedUnits >= req.units ? "Initiate Handover" : "Verify Collection"} <QrCode size={16} className="ml-2" />
                                                        </Button>
                                                    )}

                                                    {req.isMine && req.collectedUnits === 0 && (
                                                        <Button
                                                            onClick={() => handleDeleteRequest(req._id)}
                                                            variant="ghost"
                                                            className="h-16 w-16 bg-red-50 text-red-500 hover:bg-red-100 rounded-[24px] flex items-center justify-center transition-all shrink-0"
                                                        >
                                                            <X size={20} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="py-40 text-center glass-panel rounded-[48px] flex flex-col items-center gap-8 shadow-sm xl:col-span-2 w-full">
                                    <ClipboardList size={48} className="text-gray-300" />
                                    <h3 className="text-2xl font-black text-gray-900 uppercase">No Active Missions</h3>
                                </div>
                            )
                        ) : (
                            appointments.length > 0 ? (
                                appointments.map((apt) => (
                                    <motion.div key={apt._id} className="bg-white rounded-[48px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group h-fit">
                                        <div className="space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="w-14 h-14 bg-red-50 text-[#FF1744] rounded-2xl flex items-center justify-center font-black text-xl">
                                                        {apt.bloodType}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participant</p>
                                                        <h4 className="text-xl font-black text-gray-900 uppercase">{apt.donor.name}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {apt.status === 'Pending' && (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    disabled={new Date() < new Date(apt.scheduledAt)}
                                                                    onClick={() => handleUpdateAptStatus(apt._id, 'Confirmed')}
                                                                    className={cn(
                                                                        "h-12 text-white rounded-xl font-black text-[9px] uppercase px-4 transition-all",
                                                                        new Date() < new Date(apt.scheduledAt)
                                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                                            : "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100"
                                                                    )}
                                                                >
                                                                    Confirm
                                                                </Button>
                                                                <Button onClick={() => handleDeleteAppointment(apt._id)} className="h-12 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase px-4">Reject</Button>
                                                            </div>
                                                            {new Date() < new Date(apt.scheduledAt) && (
                                                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest text-right mt-1">Available at {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {apt.status === 'Confirmed' && (
                                                        <span className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Confirmed</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                                <Clock size={16} className="text-gray-400" />
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-gray-900">{new Date(apt.scheduledAt).toLocaleDateString()} @ {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-40 text-center glass-panel rounded-[48px] flex flex-col items-center gap-8 shadow-sm xl:col-span-2 w-full">
                                    <Calendar size={48} className="text-gray-300" />
                                    <h3 className="text-2xl font-black text-gray-900 uppercase">No Appointments</h3>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Inventory Modal (Existing) */}
                {isManagingStock && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-2xl w-full">
                            <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden">
                                <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                    <div className="space-y-2 text-left">
                                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Inventory Console</h3>
                                    </div>
                                    <button onClick={() => setIsManagingStock(false)} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-colors"><X size={28} /></button>
                                </CardHeader>
                                <CardContent className="p-12 space-y-10">
                                    {/* Input Logic Same as Before */}
                                    {/* Simplified for brevity in Rewrite, assuming logic copied */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type: string) => {
                                            const val = editableStock.find((s: any) => s.bloodType === type)?.units || 0;
                                            return (
                                                <div key={type} className="flex items-center justify-between p-6 bg-gray-50 rounded-[32px] border-2 border-gray-100 focus-within:border-red-200 focus-within:bg-white transition-all">
                                                    <span className="text-2xl font-black text-gray-900">{type}</span>
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => {
                                                            const newStock = [...editableStock];
                                                            const idx = newStock.findIndex(s => s.bloodType === type);
                                                            if (idx >= 0) newStock[idx].units = Math.max(0, newStock[idx].units - 1);
                                                            else newStock.push({ bloodType: type, units: 0 });
                                                            setEditableStock(newStock);
                                                        }} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><Minus size={18} /></button>
                                                        <span className="w-12 text-center font-black text-xl text-[#FF1744]">{val}</span>
                                                        <button onClick={() => {
                                                            const newStock = [...editableStock];
                                                            const idx = newStock.findIndex(s => s.bloodType === type);
                                                            if (idx >= 0) newStock[idx].units += 1;
                                                            else newStock.push({ bloodType: type, units: 1 });
                                                            setEditableStock(newStock);
                                                        }} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-green-50 hover:text-green-500 transition-colors"><Plus size={18} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Button onClick={handleUpdateStock} disabled={isSavingStock} className="w-full h-24 bg-gray-900 hover:bg-black text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4">{isSavingStock ? <Loader2 className="animate-spin" /> : <Save size={24} />} Commit Changes</Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}

                {/* Start Drive Modal (Existing) */}
                {isStartingDrive && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full">
                            <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden">
                                <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                    <div className="space-y-2 text-left">
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Initiate Drive</h3>
                                    </div>
                                    <button onClick={() => setIsStartingDrive(false)} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                                </CardHeader>
                                <CardContent className="p-12 space-y-8">
                                    {/* Inputs simplified */}
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block text-left">Target Blood Type</label><select value={driveData.bloodType} onChange={(e) => setDriveData({ ...driveData, bloodType: e.target.value })} className="w-full h-20 bg-gray-50 border-none rounded-[28px] px-8 text-xl font-black tracking-widest outline-none">{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block text-left">Units Required</label><input type="number" value={driveData.units} onChange={(e) => setDriveData({ ...driveData, units: parseInt(e.target.value) })} className="w-full h-20 bg-gray-50 border-none rounded-[28px] px-8 text-xl font-black outline-none" /></div>
                                    <Button onClick={handleStartDrive} className="w-full h-20 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-200">Launch Network Broadcast</Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}

                {/* Direct Fulfill Modal (NEW) */}
                {selectedDonation && isDirectFulfilling && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full">
                            <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden">
                                <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                    <div className="space-y-2 text-left">
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Direct Stock Donation</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contribution from your bank.</p>
                                    </div>
                                    <button onClick={() => { setIsDirectFulfilling(false); setSelectedDonation(null); }} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                                </CardHeader>
                                <CardContent className="p-12 space-y-8">
                                    <div className="p-6 bg-red-50 rounded-[32px] border border-red-100 text-left">
                                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Requesting Facility</p>
                                        <h4 className="text-xl font-black text-gray-900">{selectedDonation.hospitalName}</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 text-left block">Units to Donate (Your Stock)</label>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setDirectFulfillUnits(Math.max(1, directFulfillUnits - 1))} className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100"><Minus size={20} /></button>
                                            <input
                                                type="number"
                                                value={directFulfillUnits}
                                                onChange={(e) => {
                                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                                    const remaining = selectedDonation.units - (selectedDonation.collectedUnits || 0);
                                                    setDirectFulfillUnits(Math.min(remaining, val));
                                                }}
                                                className="flex-1 h-14 bg-gray-50 border-none rounded-2xl text-center text-2xl font-black outline-none text-[#FF1744]"
                                            />
                                            <button
                                                onClick={() => {
                                                    const remaining = selectedDonation.units - (selectedDonation.collectedUnits || 0);
                                                    setDirectFulfillUnits(Math.min(remaining, directFulfillUnits + 1));
                                                }}
                                                className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-center font-bold text-gray-400">Available Stock: {stock.find((s: any) => s.bloodType === selectedDonation.bloodType)?.units || 0} Units</p>
                                    </div>

                                    <Button
                                        onClick={handleDirectFulfill}
                                        disabled={submittingFulfill}
                                        className="w-full h-20 bg-gray-900 hover:bg-black text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3"
                                    >
                                        {submittingFulfill ? <Loader2 className="animate-spin" /> : <Database size={18} />}
                                        Confirm Donation
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}

                {/* Verify Donor Modal (Updated with Units Input) */}
                {selectedDonation && !isDirectFulfilling && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-xl w-full">
                            <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden">
                                <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-red-50 text-[#FF1744] rounded-[24px] flex items-center justify-center">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Security OTP</h3>
                                            <p className="text-sm font-bold text-gray-400">Generate secure verification code.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedDonation(null)} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                                </CardHeader>
                                <CardContent className="p-12 space-y-10">
                                    <div className="p-10 bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200 text-center space-y-8">
                                        {!qrToken ? (
                                            <>
                                                <QrCode size={80} className="mx-auto text-gray-200 mt-4" />
                                                <p className="text-base font-bold text-gray-500 max-w-[320px] mx-auto leading-relaxed">
                                                    Generate a 6-digit verification OTP for the donor/receiver to enter in their dashboard to authorize this handover.
                                                </p>
                                                <Button
                                                    onClick={() => handleGenerateCode(selectedDonation._id)}
                                                    disabled={generatingQr}
                                                    className="w-full h-20 bg-gray-900 hover:bg-black text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-gray-200"
                                                >
                                                    {generatingQr ? <Loader2 className="animate-spin" /> : "Verify Donor"}
                                                </Button>
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] text-center">
                                                    Need new OTP? Refresh and generate again.
                                                </p>
                                            </>
                                        ) : (
                                            <div className="space-y-10 py-6">
                                                <div className="relative inline-block">
                                                    <div className="h-48 w-64 bg-white border-4 border-red-500 rounded-[40px] flex items-center justify-center shadow-2xl shadow-red-100">
                                                        <span className="text-6xl font-black text-gray-900 tracking-[0.2em]">{qrToken}</span>
                                                    </div>
                                                    <div className="absolute -top-6 -right-6 w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                                                        <CheckCircle2 size={32} />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <p className="text-2xl font-black text-gray-900 tracking-tight">OTP System Ready</p>
                                                    <p className="text-sm font-bold text-gray-400">Provide this code to the donor. They must enter it in their dashboard to finalize the donation.</p>
                                                </div>
                                                <button onClick={() => setQrToken(null)} className="text-[10px] font-black text-[#FF1744] uppercase tracking-widest hover:underline">
                                                    Refresh Protocol?
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
                {/* Match Suggestions Modal (NEW) */}
                {showMatches && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-2xl w-full">
                            <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden">
                                <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                    <div className="space-y-1 text-left">
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Suggested Donors</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matched by location & blood type</p>
                                    </div>
                                    <button onClick={() => { setShowMatches(null); setSuggestedDonors([]); }} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                                </CardHeader>
                                <CardContent className="p-12 space-y-8">
                                    {isMatching ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="animate-spin text-blue-500" size={48} />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Network...</p>
                                        </div>
                                    ) : suggestedDonors.length > 0 ? (
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                            {suggestedDonors.map((donor) => (
                                                <div key={donor._id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[32px] border border-gray-100 group hover:border-blue-100 transition-all">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-300">
                                                            {donor.profileImage && donor.profileImage !== 'no-photo.jpg' ? (
                                                                <img src={donor.profileImage} className="w-full h-full object-cover rounded-2xl" alt="" />
                                                            ) : <User size={24} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 text-lg">{donor.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg">Available</span>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <MapPin size={8} /> {donor.location?.address?.split(',')[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        disabled={donor.connectionStatus === 'pending'}
                                                        onClick={() => handleRequestConnection(donor._id, showMatches!)}
                                                        className={cn(
                                                            "h-12 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm transition-all",
                                                            donor.connectionStatus === 'pending'
                                                                ? "bg-gray-100 text-gray-400"
                                                                : "bg-white border border-gray-100 hover:border-blue-200 text-blue-600"
                                                        )}
                                                    >
                                                        {donor.connectionStatus === 'pending' ? "Pending" : "Request Access"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
                                            <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4" />
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No matching donors found nearby</p>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => { setShowMatches(null); setSuggestedDonors([]); }}
                                        className="w-full h-20 bg-gray-900 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em]"
                                    >
                                        Close Console
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};
