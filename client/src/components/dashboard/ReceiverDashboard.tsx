import React, { useState, useEffect } from "react";
import { User as UserType } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Plus, Search, Clock, CheckCircle2, AlertCircle,
    ArrowRight, Droplet, MessageCircle, Loader2, ClipboardList, QrCode, X, Heart, Navigation, Zap, Hospital, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/utils";
import api from "@/config/api";
import { BloodBankExplorer } from "./BloodBankExplorer";
import { ActivityHistory } from "./ActivityHistory";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const ReceiverDashboard = ({ user }: { user: UserType }) => {
    const navigate = useNavigate();
    const [activeRequests, setActiveRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'missions' | 'explorer' | 'history'>('missions');
    const [verifyingMission, setVerifyingMission] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState("");
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);

    const fetchMyRequests = async () => {
        try {
            const res = await api.get('/requests');
            setActiveRequests(res.data.data);
        } catch (error) {
            console.error("Failed to fetch my requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const handleVerifyMission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyingMission || !verifyCode) return;

        setIsSubmittingCode(true);
        try {
            const res = await api.post(`/requests/${verifyingMission}/verify-qr`, { token: verifyCode });
            if (res.data.success) {
                toast.success("Reception confirmed! Bank stock updated.");
                setVerifyingMission(null);
                setVerifyCode("");
                fetchMyRequests();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Code incorrect.");
        } finally {
            setIsSubmittingCode(false);
        }
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!window.confirm("Are you sure you want to delete this broadcast? This cannot be undone.")) return;

        try {
            await api.delete(`/requests/${requestId}`);
            toast.success("Broadcast removed successfully.");
            fetchMyRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to remove request.");
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">

// MissionChat removed in favor of CommunicationsCenter

            {/* Premium Header Tabs */}
            <div className="px-4">
                <div className="flex items-center gap-2 bg-white/50 p-2 rounded-[32px] border border-gray-100 overflow-x-auto no-scrollbar glass-panel shadow-sm">
                    {[
                        { id: 'missions', label: 'My Requests', icon: Heart },
                        { id: 'explorer', label: 'Blood Banks', icon: Search },
                        { id: 'history', label: 'Health Ledger', icon: ClipboardList }
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shrink-0",
                                activeTab === tab.id
                                    ? "bg-gray-900 text-white shadow-xl scale-100"
                                    : "text-gray-400 hover:text-gray-900 hover:bg-white/80"
                            )}
                        >
                        </button>
                    ))}

                    <button
                        onClick={() => navigate('/dashboard/messages')}
                        className="ml-auto flex items-center gap-3 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shrink-0 bg-white border-2 border-gray-100 text-gray-900 hover:border-red-100 shadow-sm"
                    >
                        <MessageCircle size={16} className="text-[#FF1744]" />
                        Communications
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'missions' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        {/* Emergency Request CTA */}
                        <div className="px-4">
                            <div className="relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 border-2 border-red-100 rounded-[54px] p-8 sm:p-12 shadow-2xl shadow-red-100/20 group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF1744]/5 blur-[120px] -z-10 group-hover:scale-110 transition-transform duration-700" />

                                <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-left">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-red-500 rounded-[40px] blur-2xl opacity-20 animate-pulse" />
                                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white text-[#FF1744] rounded-[40px] flex items-center justify-center shadow-xl border border-red-50">
                                                <Droplet size={56} className="animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-lg font-black text-[9px] uppercase tracking-[0.2em] mb-2">
                                                <Zap size={10} className="fill-current" /> Critical Line
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-tight">Need Blood?</h2>
                                            <p className="text-base sm:text-lg font-bold text-gray-400 max-w-md">Activate the donor network and notify all nearby hospitals instantly.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/dashboard/create-request')}
                                        className="w-full xl:w-auto h-20 sm:h-24 px-12 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-200 transition-all hover:scale-105 active:scale-95 group"
                                    >
                                        Broadcast Emergency <ArrowRight size={20} className="ml-3 group-hover:translate-x-2 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Active List */}
                        <div className="grid gap-8 px-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                                    <div className="w-2 h-8 bg-gray-900 rounded-full" />
                                    My Requests
                                </h2>
                            </div>

                            {loading ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-6 glass-panel rounded-[54px]">
                                    <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Updating Records...</p>
                                </div>
                            ) : activeRequests.length > 0 ? (
                                <div className="grid xl:grid-cols-2 gap-8">
                                    {activeRequests.map((req: any) => (
                                        <motion.div
                                            key={req._id}
                                            layout
                                            className="bg-white rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
                                        >
                                            <div className="flex flex-col gap-10">
                                                <div className="flex items-center gap-8 w-full">
                                                    <div className="w-24 h-24 bg-red-50 text-[#FF1744] rounded-[32px] flex flex-col items-center justify-center shadow-inner border border-red-100/50">
                                                        <span className="text-4xl font-black tracking-tighter">{req.bloodType}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Type</span>
                                                    </div>
                                                    <div className="space-y-4 flex-1">
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <h4 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">{req.bloodType} Blood Request</h4>
                                                            <span className={cn(
                                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2",
                                                                req.status === 'Fulfilled' ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-500 border-blue-100"
                                                            )}>
                                                                {req.status === 'Fulfilled' ? <CheckCircle2 size={10} /> : <Activity size={10} className="animate-pulse" />}
                                                                {req.status === 'Fulfilled' ? 'Mission Succeeded' : 'Broadcasting Network'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 w-fit">
                                                            <Hospital size={16} className="text-[#FF1744]" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{req.hospitalName}</span>
                                                        </div>

                                                        {/* Fulfillment Progress */}
                                                        <div className="space-y-4 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                                                            <div className="flex justify-between items-end">
                                                                <div className="space-y-1 text-left">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none">Response Status</p>
                                                                    <p className="text-lg font-black text-gray-900 tracking-tight">
                                                                        {req.status === 'Fulfilled'
                                                                            ? "Mission Succeeded"
                                                                            : req.handoverInitiated
                                                                                ? "Ready for Collection"
                                                                                : req.collectedUnits >= req.units
                                                                                    ? "Awaiting Handover"
                                                                                    : "Gathering Resources"}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-black text-[#FF1744] tracking-tighter leading-none">{req.collectedUnits || 0} / {req.units}</p>
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Units Secured</p>
                                                                </div>
                                                            </div>
                                                            <div className="h-4 bg-gray-200/50 rounded-full overflow-hidden p-1 border border-gray-100">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(100, ((req.collectedUnits || 0) / req.units) * 100)}%` }}
                                                                    className="h-full bg-gradient-to-r from-[#FF1744] to-pink-500 rounded-full shadow-[0_0_20px_rgba(255,23,68,0.3)]"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 w-full flex items-center gap-4">
                                                    {req.status === 'Open' && (
                                                        <Button
                                                            onClick={() => handleDeleteRequest(req._id)}
                                                            variant="ghost"
                                                            className="h-20 w-24 bg-red-50 text-red-500 hover:bg-red-100 rounded-[32px] flex items-center justify-center transition-all"
                                                            title="Delete Request"
                                                        >
                                                            <X size={24} />
                                                        </Button>
                                                    )}
                                                    {req.status !== 'Fulfilled' && req.handoverInitiated ? (
                                                        <Button
                                                            onClick={() => setVerifyingMission(req._id)}
                                                            className="w-full h-20 bg-green-500 hover:bg-green-600 text-white rounded-[32px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-green-100 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            <CheckCircle2 size={20} /> Confirm Collection
                                                        </Button>
                                                    ) : req.status === 'Fulfilled' ? (
                                                        <div className="h-20 glass-panel text-green-600 rounded-[32px] flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest border border-green-100 bg-green-50/30">
                                                            <CheckCircle2 size={20} /> Fulfilled
                                                        </div>
                                                    ) : req.collectedUnits >= req.units ? (
                                                        <div className="h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] border border-indigo-100 animate-pulse">
                                                            <Clock size={16} /> Awaiting Hospital Handover
                                                        </div>
                                                    ) : (
                                                        <div className="h-20 bg-gray-50 text-gray-400 rounded-[32px] flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] border border-gray-100">
                                                            <Clock size={16} /> Awaiting Donations
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-40 text-center glass-panel rounded-[60px] flex flex-col items-center gap-8 shadow-sm">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                        <ClipboardList size={56} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Ledger is Clean</h3>
                                        <p className="text-gray-400 font-bold max-w-sm mx-auto">No active blood requests found in your account history. Start one if needed.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeTab === 'explorer' && <BloodBankExplorer />}
            {activeTab === 'history' && <ActivityHistory />}

            {/* Collection Verification Modal */}
            {
                verifyingMission && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <Card className="max-w-md w-full bg-white rounded-[60px] border-none shadow-2xl animate-in zoom-in-95 overflow-hidden">
                            <CardHeader className="p-12 pb-0 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Collected Blood?</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Transaction</p>
                                </div>
                                <button onClick={() => setVerifyingMission(null)} className="p-4 bg-gray-50 rounded-3xl"><X size={24} /></button>
                            </CardHeader>
                            <CardContent className="p-12 space-y-8">
                                <p className="text-lg font-bold text-gray-500 text-center leading-relaxed">
                                    Enter the 6-digit code provided by the hospital after you receive the blood units.
                                </p>
                                <form onSubmit={handleVerifyMission} className="space-y-10">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value)}
                                        className="w-full h-24 text-center text-5xl font-black tracking-[0.4em] bg-gray-50 border-4 border-transparent focus:border-red-500 rounded-[32px] transition-all outline-none text-gray-900 placeholder:text-gray-100"
                                        autoFocus
                                    />
                                    <Button
                                        type="submit"
                                        disabled={verifyCode.length !== 6 || isSubmittingCode}
                                        className="w-full h-20 bg-gray-900 hover:bg-black text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl"
                                    >
                                        {isSubmittingCode ? <Loader2 className="animate-spin" /> : "Confirm & Close Case"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};
