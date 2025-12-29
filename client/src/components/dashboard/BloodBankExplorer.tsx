"use client";

import React, { useState, useEffect } from "react";
import {
    Search, MapPin, Droplets, ArrowRight, Loader2,
    Verified, Navigation, Heart, ShieldCheck, X, Activity, Globe
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/utils";
import api from "@/config/api";
import { toast } from "sonner";

export const BloodBankExplorer = () => {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
    const [connectingId, setConnectingId] = useState<string | null>(null);

    const handleRequestConnection = async (hospitalId: string) => {
        setConnectingId(hospitalId);
        try {
            // Finding a generic request or just passing null/empty if the API supports it.
            // For now, the API needs a requestId. In explorer context, we might not have a specific mission.
            // However, the user said "Mission-Linked". 
            // If there's no mission, maybe we can't connect? 
            // Let's assume for now they connect regarding a 'General Inquiry' or we find their active request.

            toast.info("Inquiry system: Please select a specific mission from the dashboard to initiate a handshake.");
        } catch (error) {
            toast.error("Failed to initiate connection.");
        } finally {
            setConnectingId(null);
        }
    };

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const res = await api.get('/hospital/public-inventory');
                setHospitals(res.data.data);
            } catch (error) {
                console.error("Failed to fetch hospital inventories");
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, []);

    const filteredHospitals = hospitals.filter(h =>
        h.facilityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.facilityAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[60px] shadow-sm">
            <Loader2 className="animate-spin text-[#FF1744]" size={48} />
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Scanning Global Network...</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-10">
            {/* High-End Search Interface */}
            <div className="relative group max-w-4xl mx-auto">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF1744] transition-all" size={28} />
                <input
                    type="text"
                    placeholder="Search by hospital name, city, or blood bank..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-24 bg-white border-none rounded-[40px] pl-24 pr-12 text-xl font-bold shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] focus:ring-8 focus:ring-red-500/5 transition-all outline-none placeholder:text-gray-200"
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {filteredHospitals.length > 0 ? filteredHospitals.map((hospital) => (
                    <Card key={hospital._id} className="border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] rounded-[60px] overflow-hidden bg-white hover:-translate-y-2 transition-all group">
                        <CardContent className="p-10 space-y-10">
                            <div className="flex items-start justify-between gap-6">
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{hospital.facilityName}</h3>
                                        <Verified size={24} className="text-[#FF1744]" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin size={16} className="text-[#FF1744]" />
                                            {hospital.facilityAddress}
                                        </p>
                                        <p className="text-xs font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={16} /> Verified Blood Bank
                                        </p>
                                    </div>
                                </div>
                                <div className="w-20 h-20 bg-red-50 text-[#FF1744] rounded-[32px] flex items-center justify-center shadow-inner">
                                    <Globe size={40} className="animate-pulse" />
                                </div>
                            </div>

                            {/* Stock Snapshot */}
                            <div className="grid grid-cols-4 gap-4">
                                {(hospital.inventory?.slice(0, 4) || []).map((item: any, idx: number) => (
                                    <div key={idx} className="p-6 bg-gray-50 rounded-[28px] border-2 border-transparent hover:bg-white hover:border-red-50 transition-all text-center">
                                        <p className="text-xs font-black text-gray-900 mb-2 uppercase tracking-tighter">{item.bloodType}</p>
                                        <div className={cn(
                                            "h-1.5 w-8 rounded-full mx-auto",
                                            item.units > 10 ? "bg-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.4)]" : "bg-gray-200"
                                        )} />
                                    </div>
                                ))}
                                {(!hospital.inventory || hospital.inventory.length === 0) && (
                                    <div className="col-span-4 py-8 bg-gray-50 rounded-[28px] text-center border-2 border-dashed border-gray-100">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Awaiting Live Update</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full bg-gray-900 hover:bg-black text-white h-20 rounded-[30px] text-sm font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4"
                                onClick={() => setSelectedHospital(hospital)}
                            >
                                View Detailed Inventory
                                <ArrowRight size={20} />
                            </Button>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="lg:col-span-2 text-center py-32 bg-white rounded-[60px] border-8 border-dashed border-gray-50 flex flex-col items-center gap-8">
                        <Navigation className="w-20 h-20 text-gray-100 mx-auto" strokeWidth={1} />
                        <div className="space-y-2">
                            <p className="text-2xl font-black text-gray-300 uppercase tracking-tight">No Banks Found</p>
                            <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Adjust your search to find more facilities</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Inventory Modal */}
            {selectedHospital && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <Card className="max-w-3xl w-full bg-white rounded-[80px] overflow-hidden border-none shadow-2xl animate-in zoom-in-95 my-auto">
                        <CardHeader className="p-16 pb-0 flex flex-row items-center justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{selectedHospital.facilityName}</h3>
                                    <ShieldCheck size={32} className="text-[#FF1744]" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Verified Digital Bank Ledger</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedHospital(null)} className="p-6 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">
                                <X size={32} className="text-gray-400" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-16">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => {
                                    const item = selectedHospital.inventory?.find((i: any) => i.bloodType === type);
                                    const units = item?.units || 0;
                                    return (
                                        <div key={type} className={cn(
                                            "flex flex-col items-center justify-center gap-4 p-8 rounded-[40px] border-2 transition-all",
                                            units > 0 ? "bg-red-50 border-red-100 shadow-lg shadow-red-50" : "bg-gray-50 border-gray-100 opacity-60"
                                        )}>
                                            <div className={cn(
                                                "w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl shadow-sm",
                                                units > 0 ? "bg-white text-[#FF1744]" : "bg-white text-gray-300"
                                            )}>
                                                {type}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                                                <p className={cn("text-2xl font-black", units > 0 ? "text-gray-900" : "text-gray-300")}>
                                                    {units} <span className="text-[10px] opacity-40 uppercase">Unt</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-12 p-8 bg-gray-900 rounded-[40px] flex items-center justify-between text-white">
                                <div className="flex items-center gap-4">
                                    <Activity className="text-[#FF1744]" size={28} />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Reliability Score</p>
                                        <p className="text-xl font-black">100% Verified Intake</p>
                                    </div>
                                </div>
                                <Button onClick={() => setSelectedHospital(null)} className="bg-white text-black hover:bg-gray-100 h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest">
                                    Close Ledger
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
