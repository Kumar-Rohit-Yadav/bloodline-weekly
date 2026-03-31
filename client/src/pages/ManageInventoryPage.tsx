import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Save, Loader2, Plus, Minus, Database, 
    ShieldCheck, Info, AlertTriangle, TrendingUp, Droplets
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/config/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function ManageInventoryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stock, setStock] = useState<any[]>([]);
    const [editableStock, setEditableStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await api.get('/hospital/inventory');
                const inventory = res.data.data || [];
                setStock(inventory);
                setEditableStock(inventory);
            } catch (error) {
                toast.error("Failed to fetch inventory data");
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const handleUpdateStock = async () => {
        setIsSaving(true);
        try {
            await api.put('/hospital/inventory', { inventory: editableStock });
            toast.success("Blood Bank Inventory Sync Successful!");
            navigate('/dashboard');
        } catch (error) {
            toast.error("Failed to update inventory. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateUnit = (type: string, delta: number) => {
        const newStock = [...editableStock];
        const idx = newStock.findIndex(s => s.bloodType === type);
        if (idx >= 0) {
            newStock[idx].units = Math.max(0, newStock[idx].units + delta);
        } else if (delta > 0) {
            newStock.push({ bloodType: type, units: delta });
        }
        setEditableStock(newStock);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-red-500" size={48} />
            </div>
        );
    }

    const totalUnits = editableStock.reduce((acc, curr) => acc + curr.units, 0);

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                    <div className="flex items-center gap-6">
                        <div className="text-left">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Blood Bank Management</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Strategic Resource Allocation Console</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-left">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Banked Reserves</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xl font-black text-gray-900">{totalUnits}</span>
                                <span className="text-[10px] font-black text-red-500 uppercase">Units</span>
                            </div>
                        </div>
                        <Button 
                            onClick={handleUpdateStock} 
                            disabled={isSaving}
                            className="h-16 px-8 bg-gray-900 hover:bg-black text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-transform active:scale-95"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            Sync Inventory
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid sm:grid-cols-2 gap-6">
                            {bloodTypes.map((type) => {
                                const val = editableStock.find(s => s.bloodType === type)?.units || 0;
                                const isLow = val < 5;
                                return (
                                    <motion.div 
                                        key={type}
                                        whileHover={{ y: -4 }}
                                        className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-xl hover:shadow-gray-200/50"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl transition-colors ${isLow ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-900 group-hover:bg-[#FF1744] group-hover:text-white'}`}>
                                                {type}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Available Stock</p>
                                                <p className="text-2xl font-black text-gray-900 tracking-tight">{val} <span className="text-sm">Units</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => updateUnit(type, -1)}
                                                className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 active:scale-90"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <button 
                                                onClick={() => updateUnit(type, 1)}
                                                className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-green-50 hover:text-green-500 transition-all border border-gray-100 active:scale-90"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar: Insights & Status */}
                    <div className="space-y-8">
                        <Card className="rounded-[40px] border-none shadow-xl bg-gray-900 text-white p-10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10 space-y-6 text-left">
                                <div className="p-3 bg-white/10 w-fit rounded-2xl border border-white/10">
                                    <ShieldCheck className="text-red-400" size={24} />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight uppercase leading-tight">Critical Stock Monitor</h3>
                                <p className="text-sm text-gray-400 font-bold leading-relaxed">System automatically flags blood types falling below the 5-unit threshold.</p>
                                
                                <div className="pt-6 space-y-4">
                                    {bloodTypes.filter(t => (editableStock.find(s => s.bloodType === t)?.units || 0) < 5).map(t => (
                                        <div key={t} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle size={14} className="text-amber-400" />
                                                <span className="font-black text-xs uppercase tracking-widest">{t} Restricted</span>
                                            </div>
                                            <span className="text-xs font-black text-red-400">{editableStock.find(s => s.bloodType === t)?.units || 0} U</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 border border-gray-100">
                             <div className="space-y-6 text-left">
                                <div className="p-3 bg-red-50 w-fit rounded-2xl">
                                    <TrendingUp className="text-[#FF1744]" size={24} />
                                </div>
                                <h3 className="text-xl font-black tracking-tight uppercase leading-tight text-gray-900">Optimization Tip</h3>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed">
                                    Maintaining balanced stock across all blood types ensures your facility can respond to multi-patient emergencies without network delay.
                                </p>
                                <div className="pt-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Balance</p>
                                        <Droplets size={16} className="text-red-400" />
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#FF1744]" style={{ width: `${Math.min(100, (totalUnits / 400) * 100)}%` }} />
                                    </div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mt-2 text-right">Target Reserve: 400 Units</p>
                                </div>
                             </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
