import React, { useState, useEffect } from "react";
import { 
    Users, Search, Filter, Trash2, Camera, ExternalLink, 
    CheckCircle2, Building2, Mail, MapPin, Database, Calendar,
    Loader2, ShieldCheck, Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/config/api";
import { toast } from "sonner";
import { cn } from "@/utils/utils";

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            if (res.data.success) setUsers(res.data.data);
        } catch (error) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleVerify = async (userId: string) => {
        try {
            const res = await api.put(`/admin/verify/${userId}`);
            if (res.data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, isVerified: !u.isVerified } : u));
                toast.success("Hospital verification updated");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update verification");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure? This will delete all user data and requests.")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
            toast.success("User deleted permanently");
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const filteredUsers = users
        .filter(u => u.role !== 'admin')
        .filter(u => filterRole === 'all' || u.role === filterRole)
        .filter(u => (u.name + u.email + (u.facilityName || "")).toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 text-left">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-900 text-white rounded-[20px] flex items-center justify-center">
                                <Users size={28} />
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">User Management</h1>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-0.5">Control access and verify identities across the network</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF1744] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email or hospital..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-[28px] shadow-xl shadow-gray-100/30 focus:border-[#FF1744] focus:ring-4 focus:ring-red-50 outline-none transition-all font-bold text-sm text-gray-900"
                            />
                        </div>
                        {/* Role Filter */}
                        <div className="flex bg-gray-100 p-1.5 rounded-3xl w-full md:w-auto">
                            {['all', 'donor', 'hospital', 'receiver'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setFilterRole(r)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all",
                                        filterRole === r ? "bg-white text-gray-900 shadow-sm border border-gray-50" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {r}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <Card className="border-none shadow-2xl rounded-[60px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-60 flex flex-col items-center justify-center gap-6">
                                <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Compiling Database...</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <div className="overflow-x-auto overflow-y-hidden">
                                <table className="w-full text-left min-w-[1000px]">
                                    <thead className="bg-gray-50/50">
                                        <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <th className="p-10">User Profile</th>
                                            <th className="p-10">Access Role</th>
                                            <th className="p-10">Status & Verification</th>
                                            <th className="p-10 text-right">Administrative</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.map((item) => (
                                            <tr key={item._id} className="group hover:bg-gray-50/30 transition-all">
                                                <td className="p-10">
                                                    <div className="flex items-center gap-5 text-left">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-[24px] border border-gray-100 flex items-center justify-center text-gray-300 font-black text-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                            {item.profileImage && item.profileImage !== 'no-photo.jpg' ? (
                                                                <img src={item.profileImage} className="w-full h-full object-cover" alt="" />
                                                            ) : (item.name?.charAt(0) || 'U')}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-900 text-lg flex items-center gap-2">
                                                                {item.facilityName || item.name}
                                                                {item.isVerified && <VerifiedBadge size={16} />}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-bold">{item.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-10">
                                                    <div className="flex flex-col gap-1.5 text-left">
                                                        <span className={cn(
                                                            "w-fit px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                                            item.role === 'hospital' ? "bg-blue-50 text-blue-500 border-blue-100" :
                                                                item.role === 'donor' ? "bg-red-50 text-[#FF1744] border-red-100" : "bg-purple-50 text-purple-500 border-purple-100"
                                                        )}>
                                                            {item.role}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight ml-1">UID: {item._id.slice(-8)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-10">
                                                    {item.role === 'hospital' ? (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("w-2 h-2 rounded-full", item.isVerified ? "bg-green-500" : "bg-amber-500")} />
                                                                <button
                                                                    onClick={() => handleToggleVerify(item._id)}
                                                                    className={cn(
                                                                        "px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm",
                                                                        item.isVerified ? "border-green-100 text-green-600 bg-green-50 hover:bg-green-100" : "border-amber-100 text-amber-600 bg-amber-50 hover:bg-amber-100"
                                                                    )}
                                                                >
                                                                    {item.isVerified ? 'Fully Verified' : 'Awaiting Review'}
                                                                </button>
                                                            </div>
                                                            {item.verificationImage && (
                                                                <button
                                                                    onClick={() => setSelectedUser(item)}
                                                                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:text-blue-700 transition-colors ml-6"
                                                                >
                                                                    <Camera size={12} /> View Credentials
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-gray-50 text-gray-300 bg-gray-50 group-hover:bg-white transition-colors text-center w-fit">
                                                            Standard Pass
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-10 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUser(item._id)}
                                                        className="w-14 h-14 bg-gray-50 text-gray-300 hover:bg-[#FF1744] hover:text-white rounded-[20px] transition-all inline-flex items-center justify-center group/btn shadow-sm hover:shadow-xl hover:shadow-red-100"
                                                    >
                                                        <Trash2 size={20} className="group-hover/btn:rotate-12 transition-transform" />
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
                                    <Users size={56} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">No Personnel Found</h3>
                                    <p className="text-gray-400 font-bold">Try adjusting your query or role filters.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Verification Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[1000] bg-gray-950/80 backdrop-blur-xl flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[50px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
                        >
                            <div className="flex-1 bg-gray-50 p-10 flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Document Review</h3>
                                    <a href={selectedUser.verificationImage} target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-2xl border border-gray-100 text-blue-500 hover:bg-blue-50 transition-colors">
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                                <div className="flex-1 overflow-auto rounded-[32px] border-4 border-white shadow-xl shadow-gray-200">
                                    <img src={selectedUser.verificationImage} className="w-full h-auto" alt="Verification" />
                                </div>
                            </div>
                            <div className="w-full lg:w-[400px] p-12 bg-white flex flex-col">
                                <div className="flex justify-end mb-10">
                                    <button onClick={() => setSelectedUser(null)} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400">✕</button>
                                </div>
                                <div className="flex-1 space-y-10">
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 bg-gray-50 rounded-[24px] overflow-hidden flex items-center justify-center text-gray-300">
                                            {selectedUser.profileImage && selectedUser.profileImage !== 'no-photo.jpg' ? (
                                                <img src={selectedUser.profileImage} className="w-full h-full object-cover" alt="" />
                                            ) : <Building2 size={36} />}
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 leading-none">{selectedUser.facilityName}</h2>
                                        <p className="text-sm font-bold text-gray-400">{selectedUser.email}</p>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { icon: MapPin, label: "Address", value: selectedUser.location?.address },
                                            { icon: Mail, label: "Official Contact", value: selectedUser.email },
                                            { icon: Database, label: "System Entry", value: selectedUser._id }
                                        ].map((info, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="bg-gray-50 p-3 rounded-xl text-gray-400"><info.icon size={16} /></div>
                                                <div className="text-left">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{info.label}</p>
                                                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{info.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-10">
                                    <Button
                                        onClick={() => { handleToggleVerify(selectedUser._id); setSelectedUser(null); }}
                                        className={cn(
                                            "w-full h-20 rounded-[32px] font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                                            selectedUser.isVerified ? "bg-gray-100 text-gray-400" : "bg-[#FF1744] text-white hover:bg-black shadow-red-200"
                                        )}
                                    >
                                        {selectedUser.isVerified ? "Revoke Verification" : "Approve credentials"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
