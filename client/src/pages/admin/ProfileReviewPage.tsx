import React, { useState, useEffect } from "react";
import { 
    FileText, CheckCircle2, AlertCircle, Building2, 
    ArrowRight, Settings, Loader2, Info, X, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/config/api";
import { toast } from "sonner";
import { cn } from "@/utils/utils";

export default function ProfileReviewPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState("");

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/profile-change-requests');
            if (res.data.success) setRequests(res.data.data);
        } catch (error) {
            console.error("Failed to fetch profile change requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
        try {
            const res = await api.post(`/admin/profile-change-requests/${requestId}/review`, {
                action,
                adminNotes: rejectionNotes
            });
            if (res.data.success) {
                toast.success(`Profile changes ${action}d successfully`);
                setSelectedRequest(null);
                setRejectionNotes("");
                fetchRequests();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${action} profile change`);
        }
    };

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 text-left">
                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-500 text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-amber-100">
                                <FileText size={28} />
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Profile Reviews</h1>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-0.5">Approve or reject clinical facility profile updates</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-60 flex flex-col items-center justify-center gap-6">
                        <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Awaiting Requests...</p>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-10">
                        {/* Pending Section */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-4">
                                <div className="w-2 h-6 bg-amber-500 rounded-full" />
                                Pending Review ({requests.filter(r => r.status === 'pending').length})
                            </h3>
                            {requests.filter(r => r.status === 'pending').map((request) => (
                                <motion.div key={request._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="border-none shadow-2xl rounded-[40px] bg-white group hover:-translate-y-1 transition-all overflow-hidden border-2 border-transparent hover:border-amber-100">
                                        <CardContent className="p-8">
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-gray-300 shadow-inner group-hover:scale-105 transition-transform">
                                                        {request.hospitalId?.profileImage && request.hospitalId.profileImage !== 'no-photo.jpg' ? (
                                                            <img src={request.hospitalId.profileImage} className="w-full h-full object-cover" alt="" />
                                                        ) : <Building2 size={36} />}
                                                    </div>
                                                    <div className="text-left space-y-1.5">
                                                        <h4 className="text-2xl font-black text-gray-900 line-clamp-1">{request.hospitalId?.facilityName || request.hospitalId?.name}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Requested {new Date(request.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={() => setSelectedRequest(request)}
                                                    className="h-16 px-8 bg-gray-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95 hover:bg-[#FF1744]"
                                                >
                                                    Audit Changes <ArrowRight size={16} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                            {requests.filter(r => r.status === 'pending').length === 0 && (
                                <div className="py-40 text-center bg-gray-50 rounded-[60px] border-4 border-dashed border-gray-100 flex flex-col items-center gap-6">
                                    <CheckCircle2 size={48} className="text-green-500" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Queue Cleared</p>
                                </div>
                            )}
                        </div>

                        {/* History Section */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-4">
                                <div className="w-2 h-6 bg-gray-200 rounded-full" />
                                Audit History
                            </h3>
                            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-4 scrollbar-hide">
                                {requests.filter(r => r.status !== 'pending').map((request) => (
                                    <div key={request._id} className={cn(
                                        "p-6 rounded-[32px] border-2 flex items-center justify-between",
                                        request.status === 'approved' ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                                request.status === 'approved' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                            )}>
                                                {request.status === 'approved' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-gray-900 text-sm">{request.hospitalId?.facilityName}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                    {request.status.toUpperCase()} AT {new Date(request.reviewedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {requests.filter(r => r.status !== 'pending').length === 0 && (
                                    <div className="py-20 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest opacity-50">Discovery Archive Empty</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Comparison Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[1000] bg-gray-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#FAFAFA] rounded-[60px] shadow-3xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
                            <div className="p-8 lg:p-12 space-y-10 overflow-y-auto scrollbar-hide">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2 text-left">
                                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Side-by-Side Review</h2>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auditing {selectedRequest.hospitalId?.facilityName}</p>
                                    </div>
                                    <button onClick={() => setSelectedRequest(null)} className="p-5 bg-white border border-gray-100 rounded-3xl hover:bg-gray-50 transition-colors shadow-sm">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    {/* Existing Version */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Production Version</p>
                                        </div>
                                        <div className="p-10 bg-white rounded-[48px] border border-gray-100 shadow-inner space-y-8">
                                            {selectedRequest.currentData.profileImage && (
                                                <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-gray-50 mb-6 border-4 border-white shadow-lg mx-auto md:mx-0">
                                                    <img src={selectedRequest.currentData.profileImage} className="w-full h-full object-cover" alt="Old Profile" />
                                                </div>
                                            )}
                                            <div className="space-y-6">
                                                {Object.entries(selectedRequest.requestedData).map(([key, newValue]) => {
                                                    const oldValue = selectedRequest.currentData[key];
                                                    return (
                                                        <div key={key} className="space-y-1 text-left">
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                            <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 truncate opacity-60">
                                                                {String(oldValue || '—')}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requested Version */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2.5 h-2.5 bg-[#FF1744] rounded-full animate-pulse" />
                                            <p className="text-[10px] font-black text-[#FF1744] uppercase tracking-widest">Proposed Revision</p>
                                        </div>
                                        <div className="p-10 bg-white rounded-[48px] border-2 border-amber-200/50 shadow-2xl shadow-amber-100/20 space-y-8 relative">
                                            <div className="absolute -top-4 -right-4 bg-amber-500 text-white p-3 rounded-2xl shadow-lg rotate-12">
                                                <Settings size={20} />
                                            </div>
                                            {selectedRequest.requestedData.profileImage && (
                                                <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-white mb-6 border-4 border-amber-100 shadow-xl shadow-amber-100/50 mx-auto md:mx-0">
                                                    <img src={selectedRequest.requestedData.profileImage} className="w-full h-full object-cover" alt="New Profile" />
                                                </div>
                                            )}
                                            <div className="space-y-6">
                                                {Object.entries(selectedRequest.requestedData).map(([key, newValue]) => {
                                                    const oldValue = selectedRequest.currentData[key];
                                                    const isChanged = oldValue !== newValue;
                                                    return (
                                                        <div key={key} className="space-y-1 text-left">
                                                            <p className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest ml-1",
                                                                isChanged ? "text-amber-600" : "text-gray-300"
                                                            )}>{key.replace(/([A-Z])/g, ' $1')}</p>
                                                            <div className={cn(
                                                                "p-5 rounded-2xl border text-sm font-bold truncate transition-all",
                                                                isChanged ? "bg-amber-50 border-amber-200 text-gray-900 shadow-inner" : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"
                                                            )}>
                                                                {String(newValue || '—')}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 block text-left">Audit Remarks (Required for Rejection)</label>
                                        <textarea 
                                            placeholder="Provide reason for rejection or special administrative notes..."
                                            value={rejectionNotes}
                                            onChange={(e) => setRejectionNotes(e.target.value)}
                                            className="w-full h-32 bg-gray-50 border-none rounded-[28px] p-6 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-amber-50 transition-all resize-none shadow-inner"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        <Button 
                                            onClick={() => handleReview(selectedRequest._id, 'reject')}
                                            disabled={!rejectionNotes.trim()}
                                            className="flex-1 h-20 bg-gray-900 hover:bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-30"
                                        >
                                            Reject Changes & Issue Note
                                        </Button>
                                        <Button 
                                            onClick={() => handleReview(selectedRequest._id, 'approve')}
                                            className="flex-1 h-20 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[28px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-red-200"
                                        >
                                            Confirm Production Migration
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
