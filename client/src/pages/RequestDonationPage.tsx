import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Send, Loader2, Droplet, 
    MessageSquare, AlertCircle, Globe, Zap,
    Building2, ClipboardList, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/config/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function RequestDonationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        bloodType: "A+",
        units: 5,
        description: "",
        urgency: "Normal"
    });

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const urgencyLevels = ['Low', 'Normal', 'Urgent', 'Critical'];

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.location || !user?.location.coordinates) {
            return toast.error("Facility location missing. Please update your profile.");
        }

        setSubmitting(true);
        try {
            const res = await api.post('/requests', {
                bloodType: formData.bloodType,
                units: formData.units,
                description: formData.description || `General donation drive for ${user.facilityName} to support local patients and replenish reserves.`,
                location: user.location,
                hospitalName: user.facilityName,
                manualUrgency: formData.urgency,
                isPublicDrive: true // This is the primary donation drive mechanism
            });

            if (res.data.success) {
                toast.success("Broadcast successful! Your request is now live in the donor network.");
                navigate('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Broadcast failure. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                    <div className="flex items-center gap-6">
                        <div className="text-left">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Request Blood Donation</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 ml-0.5">Global Network Broadcast Console</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-red-50 rounded-2xl border border-red-100">
                        <Globe size={18} className="text-red-500 animate-pulse" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Network Pulse: Active</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-12">
                    {/* Form Panel */}
                    <div className="lg:col-span-3">
                        <Card className="rounded-[60px] border-none shadow-2xl bg-white p-12 overflow-hidden border border-gray-50/50">
                            <form onSubmit={handleCreateRequest} className="space-y-10">
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-3 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Requested Type</label>
                                        <div className="relative">
                                            <Droplet className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                                            <select 
                                                value={formData.bloodType}
                                                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                                className="w-full h-16 pl-14 pr-6 bg-gray-50 border-none rounded-2xl appearance-none font-black text-gray-900 outline-none focus:ring-4 focus:ring-red-50 transition-all cursor-pointer"
                                            >
                                                {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Required Units</label>
                                        <div className="relative">
                                            <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                                            <input 
                                                type="number"
                                                min="1"
                                                value={formData.units}
                                                onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 1 })}
                                                className="w-full h-16 pl-14 pr-6 bg-gray-50 border-none rounded-2xl font-black text-gray-900 outline-none focus:ring-4 focus:ring-red-50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Priority</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {urgencyLevels.map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, urgency: lvl })}
                                                className={`h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${formData.urgency === lvl ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-red-100 hover:text-red-500'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Medical/AI Request Description</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-5 top-5 text-gray-300" size={18} />
                                        <textarea 
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Provide clinical details or patient context. This helps the matching AI prioritize your request..."
                                            className="w-full min-h-[160px] p-6 pl-14 bg-gray-50 border-none rounded-[32px] outline-none font-bold text-sm text-gray-900 focus:ring-4 focus:ring-red-50 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-24 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[40px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-4"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                                    Launch Broadcast
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* Insights Panel */}
                    <div className="lg:col-span-2 space-y-12">
                         <div className="space-y-8">
                             <div className="flex items-start gap-6 p-10 bg-white rounded-[48px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                                 <div className="p-4 bg-red-50 text-[#FF1744] rounded-2xl relative z-10 shrink-0">
                                     <Building2 size={28} />
                                 </div>
                                 <div className="text-left space-y-3 relative z-10">
                                     <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Smart Matching</h3>
                                     <p className="text-sm text-gray-400 font-bold leading-relaxed">
                                         Our AI will analyze your description to calculate urgency and broadcast alerts to matching donors within 50km of your facility.
                                     </p>
                                 </div>
                             </div>

                             <div className="p-10 bg-gray-900 text-white rounded-[60px] shadow-2xl border border-gray-800 space-y-8 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                                 
                                 <div className="flex items-center justify-between border-b border-white/10 pb-6 relative z-10">
                                     <div className="text-left">
                                         <p className="text-[10px] font-black uppercase tracking-widest text-[#FF1744] mb-1">Network Reach</p>
                                         <h4 className="text-3xl font-black tracking-tighter uppercase">5,842+</h4>
                                     </div>
                                     <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                         <Globe size={24} className="text-white/60 animate-spin-slow" />
                                     </div>
                                 </div>

                                 <div className="space-y-6 relative z-10 text-left">
                                     <p className="text-xs font-bold text-gray-400 leading-relaxed">
                                         Hospitals on BloodLine can utilize the network to quickly find donors when their internal blood bank reserves are insufficient for emergency cases.
                                     </p>
                                     <div className="space-y-3">
                                         <div className="flex items-center gap-3">
                                             <ShieldCheck className="text-green-400" size={16} />
                                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">Verified Donor Network</span>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <ClipboardList className="text-blue-400" size={16} />
                                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">Secure Audit Trail</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
