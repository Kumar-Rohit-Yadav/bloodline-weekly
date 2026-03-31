import React, { useState, useEffect } from "react";
import { 
    Activity, Search, Trash2, Droplet, Building2, 
    Zap, Clock, CheckCircle2, Loader2, Heart, User, MapPin
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import api from "@/config/api";
import { toast } from "sonner";
import { cn } from "@/utils/utils";

export default function RequestManagementPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/requests');
            if (res.data.success) setRequests(res.data.data);
        } catch (error) {
            console.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleDeleteRequest = async (requestId: string) => {
        if (!confirm("Delete this blood request? This cannot be undone.")) return;
        try {
            await api.delete(`/admin/requests/${requestId}`);
            setRequests(requests.filter(r => r._id !== requestId));
            toast.success("Request removed permanently");
        } catch (error) {
            toast.error("Failed to remove request");
        }
    };

    const filteredRequests = requests.filter(r => 
        (r.patientName + r.hospitalName + r.bloodType).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 text-left">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#FF1744] text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-red-100">
                                <Activity size={28} />
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Mission Auditing</h1>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-0.5">Audit live blood requirements and emergency missions</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF1744] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search missions by patient, hospital..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[28px] shadow-xl shadow-gray-100/30 focus:border-[#FF1744] focus:ring-4 focus:ring-red-50 outline-none transition-all font-bold text-sm text-gray-900"
                        />
                    </div>
                </div>

                {/* Requests List */}
                <Card className="border-none shadow-2xl rounded-[60px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-60 flex flex-col items-center justify-center gap-6">
                                <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Scanning Network...</p>
                            </div>
                        ) : filteredRequests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[1000px]">
                                    <thead className="bg-gray-50/50">
                                        <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <th className="p-10">Patient & Blood Type</th>
                                            <th className="p-10">Facility Context</th>
                                            <th className="p-10">Progress</th>
                                            <th className="p-10">Urgency</th>
                                            <th className="p-10 text-right">Audit Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredRequests.map((req) => (
                                            <tr key={req._id} className="group hover:bg-gray-50/30 transition-all">
                                                <td className="p-10">
                                                    <div className="flex items-center gap-5 text-left">
                                                        <div className="w-16 h-16 bg-red-50 text-[#FF1744] rounded-[24px] flex flex-col items-center justify-center border border-red-100 shadow-sm transition-transform group-hover:scale-105">
                                                            <span className="text-2xl font-black">{req.bloodType}</span>
                                                            <span className="text-[8px] font-black uppercase opacity-60">Group</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-900 text-lg uppercase tracking-tight">{req.patientName || 'Emergency Patient'}</span>
                                                            <span className="text-xs text-gray-400 font-bold flex items-center gap-2 uppercase tracking-widest">
                                                                <User size={12} /> {req.requester?.name || 'Authorized Lab'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-10">
                                                    <div className="space-y-2 text-left">
                                                        <p className="font-black text-gray-900 text-sm flex items-center gap-2">
                                                            <Building2 size={14} className="text-blue-500" />
                                                            {req.hospitalName}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                                                            <MapPin size={12} /> {req.location?.address?.split(',')[0]}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="p-10">
                                                    <div className="flex flex-col gap-3 text-left w-56">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{req.collectedUnits} / {req.units} Units</span>
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest",
                                                                req.collectedUnits >= req.units ? "text-green-500" : "text-[#FF1744]"
                                                            )}>{Math.round((req.collectedUnits / req.units) * 100)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(100, (req.collectedUnits / req.units) * 100)}%` }}
                                                                className={cn(
                                                                    "h-full transition-all duration-1000",
                                                                    req.collectedUnits >= req.units ? "bg-green-500" : "bg-[#FF1744]"
                                                                )} 
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-10">
                                                    <div className={cn(
                                                        "px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 w-fit",
                                                        req.urgency === 'Critical' ? "bg-[#FF1744] text-white shadow-red-100" :
                                                            req.urgency === 'Urgent' ? "bg-amber-500 text-white shadow-amber-100" : "bg-gray-100 text-gray-500 shadow-sm"
                                                    )}>
                                                        {req.urgency === 'Critical' ? <Zap size={14} /> : <Clock size={14} />}
                                                        {req.urgency}
                                                    </div>
                                                </td>
                                                <td className="p-10 text-right">
                                                    <button
                                                        onClick={() => handleDeleteRequest(req._id)}
                                                        className="h-14 px-8 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-[#FF1744] hover:border-red-100 border-2 border-transparent rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                                    >
                                                        Delete Mission
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-60 text-center flex flex-col items-center gap-10">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                    <Activity size={56} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">No Active Missions</h3>
                                    <p className="text-gray-400 font-bold">The platform is currently clear of blood requests.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
