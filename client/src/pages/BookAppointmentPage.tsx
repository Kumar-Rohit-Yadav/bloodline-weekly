import React, { useState, useEffect } from "react";
import { 
    Calendar, Clock, X, MapPin, Building2, 
    Droplet, ArrowRight, Loader2, Info, CheckCircle2, AlertCircle, Plus, Minus
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/utils/utils";

export default function BookAppointmentPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingData, setBookingData] = useState({
        hospitalId: "",
        bloodType: user?.bloodType || "O+",
        scheduledAt: "",
        notes: ""
    });

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments/me');
            setAppointments(res.data.data);
        } catch (error) {
            console.error("Failed to fetch appointments");
        } finally {
            setLoading(false);
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

    useEffect(() => {
        fetchAppointments();
        fetchHospitals();
    }, []);

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/appointments', bookingData);
            if (res.data.success) {
                toast.success("Appointment booked! Waiting for hospital confirmation.");
                fetchAppointments();
                setBookingData({
                    ...bookingData,
                    hospitalId: "",
                    scheduledAt: "",
                    notes: ""
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Booking failed");
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                    <div className="text-left">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Book Appointment</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 ml-0.5">Secure Donor-Hospital Coordination</p>
                    </div>
                </div>

                <div className="grid xl:grid-cols-3 gap-12">
                    {/* Booking Form */}
                    <div className="xl:col-span-1">
                        <Card className="bg-white rounded-[60px] border-none shadow-2xl overflow-hidden sticky top-32">
                            <CardHeader className="p-10 pb-0">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">Schedule Donation</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-0.5">Pick your preferred slot</p>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8">
                                <form onSubmit={handleCreateAppointment} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block text-left">Target Hospital</label>
                                        <select 
                                            required
                                            value={bookingData.hospitalId}
                                            onChange={(e) => setBookingData({ ...bookingData, hospitalId: e.target.value })}
                                            className="w-full h-16 bg-gray-50 border-none rounded-[24px] px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#FF1744]/10 transition-all cursor-pointer"
                                        >
                                            <option value="">Choose Hospital...</option>
                                            {hospitals.map(h => (
                                                <option key={h._id} value={h._id}>{h.facilityName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block text-left">Blood Group</label>
                                            <select 
                                                value={bookingData.bloodType}
                                                onChange={(e) => setBookingData({ ...bookingData, bloodType: e.target.value })}
                                                className="w-full h-16 bg-gray-50 border-none rounded-[24px] px-6 text-sm font-bold outline-none"
                                            >
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block text-left">Shift & Date</label>
                                            <input 
                                                required
                                                type="datetime-local"
                                                value={bookingData.scheduledAt}
                                                onChange={(e) => setBookingData({ ...bookingData, scheduledAt: e.target.value })}
                                                className="w-full h-16 bg-gray-50 border-none rounded-[24px] px-6 text-[10px] font-black uppercase outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block text-left">Medical Notes (Optional)</label>
                                        <textarea 
                                            placeholder="Any special medical context..."
                                            value={bookingData.notes}
                                            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                            className="w-full h-32 bg-gray-50 border-none rounded-[24px] p-6 text-sm font-bold outline-none resize-none"
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full h-20 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-100 transition-all active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Logistics"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tracker Section */}
                    <div className="xl:col-span-2 space-y-12">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-gray-900 rounded-full" />
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Your Schedule Tracker</h2>
                        </div>

                        {loading ? (
                            <div className="py-40 flex flex-col items-center justify-center gap-6 glass-panel rounded-[60px]">
                                <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Updating Ledger...</p>
                            </div>
                        ) : appointments.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-8">
                                {appointments.map((apt) => (
                                    <motion.div
                                        key={apt._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-[48px] p-8 sm:p-10 border border-gray-100 shadow-sm relative overflow-hidden group"
                                    >
                                        <div className={cn(
                                            "absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 transition-all group-hover:scale-150 duration-700",
                                            apt.status === 'Confirmed' ? "bg-green-500" : "bg-amber-500"
                                        )} />
                                        
                                        <div className="space-y-8 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical Facility</p>
                                                    <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{apt.hospital.facilityName}</h4>
                                                </div>
                                                <div className="w-16 h-16 bg-red-50 text-[#FF1744] rounded-[24px] flex flex-col items-center justify-center border border-red-100">
                                                    <span className="text-2xl font-black">{apt.bloodType}</span>
                                                    <span className="text-[7px] font-black uppercase opacity-60">Group</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm">
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                                            {new Date(apt.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] font-black text-[#FF1744] uppercase tracking-widest mt-0.5">
                                                            {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className={cn(
                                                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                                                    apt.status === 'Confirmed' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", apt.status === 'Confirmed' ? "bg-green-500" : "bg-amber-500")} />
                                                    {apt.status}
                                                </div>
                                                {apt.status === 'Pending' && (
                                                    <Button 
                                                        onClick={() => handleDeleteAppointment(apt._id)}
                                                        variant="ghost" 
                                                        className="h-12 px-6 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                                    >
                                                        <X size={14} className="mr-2" /> Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-40 text-center glass-panel rounded-[60px] flex flex-col items-center gap-8 shadow-sm">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                    <Calendar size={56} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">No Scheduled Logistics</h3>
                                    <p className="text-gray-400 font-bold max-w-sm mx-auto">You haven't booked any donation appointments recently. Start one on the left.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
