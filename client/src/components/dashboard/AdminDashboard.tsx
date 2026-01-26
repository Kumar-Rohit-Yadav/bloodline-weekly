"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldCheck, Users, Droplet, FileText, Settings, Search, Bell,
    ArrowRight, UserPlus, AlertCircle, TrendingUp, Loader2, Building2,
    Camera, Activity, Database, CheckCircle2, MapPin, Calendar, Clock,
    Trash2, ExternalLink, Filter, BarChart3, PieChart, Mail
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/utils";
import api from "@/config/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const HeartIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

export const AdminDashboard = ({ user }: { user: any }) => {
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'stats' | 'users' | 'requests' | 'profile-changes'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [profileChangeRequests, setProfileChangeRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [selectedChangeRequest, setSelectedChangeRequest] = useState<any | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState("");

    const fetchAdminData = async () => {
        try {
            const [usersRes, statsRes, requestsRes, profileChangesRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats'),
                api.get('/admin/requests'),
                api.get('/admin/profile-change-requests')
            ]);

            if (usersRes.data.success) setUsers(usersRes.data.data);
            if (statsRes.data.success) setStats(statsRes.data.data);
            if (requestsRes.data.success) setRequests(requestsRes.data.data);
            if (profileChangesRes.data.success) setProfileChangeRequests(profileChangesRes.data.data);
        } catch (error) {
            console.error("Failed to fetch admin data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
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

    const handleDeleteRequest = async (requestId: string) => {
        if (!confirm("Delete this blood request?")) return;
        try {
            await api.delete(`/admin/requests/${requestId}`);
            setRequests(requests.filter(r => r._id !== requestId));
            toast.success("Request removed");
        } catch (error) {
            toast.error("Failed to remove request");
        }
    };

    const handleReviewProfileChange = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
        try {
            const res = await api.post(`/admin/profile-change-requests/${requestId}/review`, {
                action,
                adminNotes: notes
            });
            if (res.data.success) {
                fetchAdminData();
                toast.success(`Profile change ${action}d successfully`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${action} profile change`);
        }
    };

    if (loading || !stats) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-100 border-t-[#FF1744] rounded-full animate-spin" />
                <Activity className="absolute inset-0 m-auto text-[#FF1744] animate-pulse" size={32} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Calibrating Command Center...</p>
        </div>
    );

    const highlights = [
        { label: "Total Users", value: stats.summary?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50/50" },
        { label: "Total Donors", value: stats.summary?.totalDonors || 0, icon: HeartIcon, color: "text-[#FF1744]", bg: "bg-red-50/50" },
        { label: "Open Requests", value: stats.summary?.liveRequests || 0, icon: Activity, color: "text-amber-500", bg: "bg-amber-50/50" },
        { label: "Fulfillment Rate", value: `${Math.round(stats.summary?.fulfillmentRate || 0)}%`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50/50" },
    ];

    return (
        <div className="space-y-12 pb-20">
            {/* Professional Verification Review Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-gray-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
                        >
                            {/* Left Side: Document Preview */}
                            <div className="lg:w-3/5 bg-gray-50 p-8 flex flex-col border-r border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Verification Document</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted Proof & Credentials</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={selectedUser.verificationImage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-white hover:bg-gray-100 rounded-2xl border border-gray-100 text-gray-400 transition-colors"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 p-2 group relative">
                                    <img
                                        src={selectedUser.verificationImage}
                                        className="w-full h-full object-contain rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
                                        alt="Proof"
                                    />
                                    <div className="absolute inset-x-0 bottom-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Scroll or Pinch to Zoom
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Profile Details */}
                            <div className="lg:w-2/5 p-10 flex flex-col bg-white">
                                <div className="flex justify-end mb-8">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex-1 space-y-10 overflow-y-auto pr-4 scrollbar-hide">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-gray-300 overflow-hidden ring-4 ring-gray-50">
                                                {selectedUser.profileImage && selectedUser.profileImage !== 'no-photo.jpg' ? (
                                                    <img src={selectedUser.profileImage} className="w-full h-full object-cover" alt="" />
                                                ) : <Building2 size={40} />}
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                                                    {selectedUser.facilityName || selectedUser.name}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                                        Hospital Access
                                                    </span>
                                                    {selectedUser.isVerified && <VerifiedBadge size={14} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { icon: Mail, label: "Official Email", value: selectedUser.email },
                                                { icon: MapPin, label: "Facility Address", value: selectedUser.location?.address || "No Address Set" },
                                                { icon: Database, label: "Database ID", value: selectedUser._id },
                                                { icon: Calendar, label: "Registered On", value: new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('en-US', { dateStyle: 'long' }) }
                                            ].map((info, i) => (
                                                <div key={i} className="p-5 bg-gray-50 rounded-[28px] flex items-start gap-4 border border-gray-100/50">
                                                    <div className="p-3 bg-white rounded-xl text-gray-400 shadow-sm">
                                                        <info.icon size={18} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{info.label}</p>
                                                        <p className="text-sm font-bold text-gray-700 break-all">{info.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 flex flex-col gap-3">
                                    <Button
                                        onClick={() => {
                                            handleToggleVerify(selectedUser._id);
                                            setSelectedUser(null);
                                        }}
                                        className={cn(
                                            "w-full h-16 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95",
                                            selectedUser.isVerified
                                                ? "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                : "bg-[#FF1744] text-white hover:bg-black shadow-red-200"
                                        )}
                                    >
                                        <CheckCircle2 size={18} className="mr-3" />
                                        {selectedUser.isVerified ? "Revoke Verification" : "Approve & Verify Agency"}
                                    </Button>
                                    <p className="text-[9px] font-black text-gray-300 text-center uppercase tracking-widest">
                                        Reviewing hospital since {new Date(selectedUser.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. Header & Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white/50 p-8 rounded-[48px] border border-gray-100">
                <div className="space-y-2 text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Admin Dashboard</h1>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Platform Management & Overview</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-[28px]">
                    {[
                        { id: 'stats', label: 'Statistics', icon: BarChart3 },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'requests', label: 'Requests', icon: Activity },
                        { id: 'profile-changes', label: 'Profile Changes', icon: FileText }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                tab === t.id ? "bg-white text-[#FF1744] shadow-lg shadow-red-100/50" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <t.icon size={14} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'stats' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {highlights.map((item, i) => (
                            <Card key={i} className="border-none shadow-xl shadow-gray-100/50 rounded-[40px] overflow-hidden group">
                                <CardContent className="p-10 space-y-6 relative">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm", item.bg, item.color)}>
                                        <item.icon size={28} />
                                    </div>
                                    <div>
                                        <p className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">{item.value}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
                                    </div>
                                    <div className="absolute top-8 right-8 text-gray-100 group-hover:text-gray-200 transition-colors">
                                        <TrendingUp size={48} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Supply vs Demand */}
                        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[48px] p-10 bg-white">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1 text-left">
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">Requirement Progress</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Units Collected vs. Needed across active requests</p>
                                </div>
                                <PieChart className="text-gray-200" size={32} />
                            </div>
                            <div className="space-y-8">
                                {stats.demandStats?.map((stat: any) => (
                                    <div key={stat._id} className="space-y-2">
                                        <div className="flex justify-between items-end px-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 h-10 bg-red-50 text-[#FF1744] rounded-xl flex items-center justify-center font-black text-xs border border-red-100">
                                                    {stat._id}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {stat.count} Mission(s).
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-lg font-black",
                                                    stat.collected >= stat.requested ? "text-green-500" : "text-gray-900"
                                                )}>
                                                    {stat.collected} / {stat.requested}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                                    {stat.collected >= stat.requested ? "Units (Goal Met)" : "Units"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (stat.collected / stat.requested) * 100)}%` }}
                                                className="h-full bg-gradient-to-r from-red-400 to-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.3)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!stats.demandStats || stats.demandStats.length === 0) && (
                                    <div className="py-10 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest">
                                        No active missions to track
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Top Performers (replacing hospital stock) */}
                        <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-gray-900 text-white overflow-hidden relative">
                            <TrendingUp className="absolute -top-10 -right-10 text-white/5" size={160} />
                            <div className="relative z-10 space-y-10">
                                <div className="space-y-1 text-left">
                                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Mission Leaders</h4>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Top Hospitals by Fulfilled Requests</p>
                                </div>
                                <div className="space-y-6">
                                    {stats.topPerformers?.map((item: any, i: number) => (
                                        <div key={item._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center font-black text-[10px] text-red-500">
                                                    #{i + 1}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black truncate max-w-[120px]">{item.facilityName || item.name}</p>
                                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                                                        {item.isVerified ? "Verified Partner" : "Hospital"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-red-500">{item.missionsDone}</p>
                                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Done</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats.topPerformers || stats.topPerformers.length === 0) && (
                                        <div className="py-10 text-center text-white/20 font-black text-[8px] uppercase tracking-widest">
                                            No performance data yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Pending Actions */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-white">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 border-l-4 border-[#FF1744] pl-4 text-left">Hospital Verifications</h4>
                            <div className="space-y-4">
                                {users.filter(u => !u.isVerified && u.role === 'hospital').map(h => (
                                    <div key={h._id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors">
                                                <Building2 size={24} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-gray-900">{h.facilityName}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{h.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {h.verificationImage && (
                                                <button
                                                    onClick={() => setSelectedUser(h)}
                                                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center justify-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <Camera size={10} /> View Proof
                                                </button>
                                            )}
                                            <Button
                                                onClick={() => handleToggleVerify(h._id)}
                                                className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-100"
                                            >
                                                Verify Hospital
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {users.filter(u => !u.isVerified && u.role === 'hospital').length === 0 && (
                                    <div className="py-8 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center gap-3">
                                        <CheckCircle2 size={32} className="text-green-500" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No pending verifications</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-white">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 border-l-4 border-blue-500 pl-4 text-left">Mission Velocity (Last 30 Days)</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center gap-3">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
                                        <Activity size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-gray-900">{stats.summary?.recentActivity?.requests || 0}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">New Requests</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center gap-3">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-gray-900">{stats.summary?.recentActivity?.fulfilled || 0}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Fulfilled</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Quick Insight</p>
                                    <p className="text-xs font-bold text-blue-800">
                                        {stats.summary?.recentActivity?.fulfilled > 0
                                            ? `Scaling up! ${stats.summary.recentActivity.fulfilled} lives saved this month.`
                                            : "Awaiting first mission completion for the period."}
                                    </p>
                                </div>
                                <Activity className="text-blue-200" size={32} />
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {(tab === 'users' || tab === 'requests') && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full max-w-xl group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF1744] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={tab === 'users' ? "Search users by name, email or hospital..." : "Search requests by patient, hospital or blood type..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-20 pl-16 pr-8 bg-white border border-gray-100 rounded-[32px] shadow-xl shadow-gray-100/30 focus:border-[#FF1744] focus:ring-8 focus:ring-red-50 outline-none transition-all font-bold text-lg text-gray-900"
                            />
                        </div>
                        {tab === 'users' && (
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
                                {['all', 'donor', 'hospital', 'receiver'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setFilterRole(r)}
                                        className={cn(
                                            "flex-1 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                                            filterRole === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                                        )}
                                    >
                                        {r}s
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-white">
                        <CardContent className="p-10 pt-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            {tab === 'users' ? (
                                                <>
                                                    <th className="p-10">User Profile</th>
                                                    <th className="p-10">Role</th>
                                                    <th className="p-10">Status</th>
                                                    <th className="p-10 text-right">Actions</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="p-10">Patient & Hospital</th>
                                                    <th className="p-10">Progress</th>
                                                    <th className="p-10">Urgency</th>
                                                    <th className="p-10 text-right">Manage</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {tab === 'users' ? users
                                            .filter(u => u.role !== 'admin')
                                            .filter(u => filterRole === 'all' || u.role === filterRole)
                                            .filter(u => (u.name + u.email + (u.facilityName || "")).toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((item) => (
                                                <tr key={item._id} className="group hover:bg-gray-50/50 transition-all">
                                                    <td className="p-10">
                                                        <div className="flex items-center gap-5 text-left">
                                                            <div className="w-14 h-14 bg-gray-50 rounded-[20px] flex items-center justify-center text-gray-300 font-black text-sm">
                                                                {item.profileImage && item.profileImage !== 'no-photo.jpg' ? (
                                                                    <img src={item.profileImage} className="w-full h-full object-cover rounded-[20px]" alt="" />
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
                                                        <div className="flex flex-col gap-1 text-left">
                                                            <span className={cn(
                                                                "w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                                item.role === 'hospital' ? "bg-blue-50 text-blue-500" :
                                                                    item.role === 'donor' ? "bg-red-50 text-[#FF1744]" : "bg-purple-50 text-purple-500"
                                                            )}>
                                                                {item.role}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight ml-1">UID: {item._id.slice(-8)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-10">
                                                        {item.role === 'hospital' ? (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("w-2 h-2 rounded-full", item.isVerified ? "bg-green-500" : "bg-amber-500")} />
                                                                    <button
                                                                        onClick={() => handleToggleVerify(item._id)}
                                                                        className={cn(
                                                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                                                            item.isVerified ? "border-green-100 text-green-600 bg-green-50" : "border-amber-100 text-amber-600 bg-amber-50"
                                                                        )}
                                                                    >
                                                                        {item.isVerified ? 'Verified' : 'Pending'}
                                                                    </button>
                                                                </div>
                                                                {item.verificationImage && (
                                                                    <button
                                                                        onClick={() => setSelectedUser(item)}
                                                                        className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors"
                                                                    >
                                                                        <Camera size={10} /> View Proof
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 text-gray-300 bg-gray-50 text-center">
                                                                N/A
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-10 text-right">
                                                        <button
                                                            onClick={() => handleDeleteUser(item._id)}
                                                            className="w-12 h-12 bg-gray-50 text-gray-300 hover:bg-[#FF1744] hover:text-white rounded-2xl transition-all inline-flex items-center justify-center group/btn"
                                                        >
                                                            <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : requests
                                                .filter(r => (r.patientName + r.hospitalName + r.bloodType).toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((req) => (
                                                    <tr key={req._id} className="group hover:bg-gray-50/50 transition-all">
                                                        <td className="p-10">
                                                            <div className="flex items-center gap-5 text-left">
                                                                <div className="w-14 h-14 bg-red-50 text-[#FF1744] rounded-[24px] flex items-center justify-center font-black text-xl border border-red-100/50">
                                                                    {req.bloodType}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-gray-900 text-lg uppercase tracking-tight">{req.patientName || 'Emergency Patient'}</span>
                                                                    <span className="text-xs text-gray-400 font-bold flex items-center gap-2">
                                                                        <Building2 size={12} /> {req.hospitalName}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-10">
                                                            <div className="flex flex-col gap-3 text-left">
                                                                <div className="flex items-center justify-between gap-10">
                                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{req.collectedUnits} / {req.units} Units</span>
                                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{Math.round((req.collectedUnits / req.units) * 100)}%</span>
                                                                </div>
                                                                <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[#FF1744]" style={{ width: `${(req.collectedUnits / req.units) * 100}%` }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-10">
                                                            <span className={cn(
                                                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                                req.urgency === 'Critical' ? "bg-[#FF1744] text-white" :
                                                                    req.urgency === 'Urgent' ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"
                                                            )}>
                                                                {req.urgency}
                                                            </span>
                                                        </td>
                                                        <td className="p-10 text-right">
                                                            <button
                                                                onClick={() => handleDeleteRequest(req._id)}
                                                                className="h-12 px-6 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-[#FF1744] rounded-2xl text-[9px] font-black uppercase tracking-widest border border-transparent hover:border-red-100 transition-all"
                                                            >
                                                                Delete Request
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {tab === 'profile-changes' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-white">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8 flex items-center gap-4">
                            <div className="w-2 h-10 bg-[#FF1744] rounded-full" />
                            Hospital Profile Change Requests
                        </h3>

                        {profileChangeRequests.length === 0 ? (
                            <div className="py-20 text-center bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
                                <CheckCircle2 size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No pending profile change requests</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {profileChangeRequests.filter(r => r.status === 'pending').map((request) => (
                                    <Card key={request._id} className="border-2 border-amber-100 bg-amber-50/30 rounded-[40px] overflow-hidden group hover:border-[#FF1744]/30 transition-all">
                                        <CardContent className="p-8">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 bg-white rounded-[24px] shadow-sm flex items-center justify-center text-gray-300 overflow-hidden ring-4 ring-white">
                                                        {request.hospitalId?.profileImage && request.hospitalId.profileImage !== 'no-photo.jpg' ? (
                                                            <img src={request.hospitalId.profileImage} className="w-full h-full object-cover" alt="" />
                                                        ) : <Building2 size={36} />}
                                                    </div>
                                                    <div className="text-left space-y-1">
                                                        <h4 className="text-2xl font-black text-gray-900 leading-none">
                                                            {request.hospitalId?.facilityName || request.hospitalId?.name}
                                                        </h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{request.hospitalId?.email}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                                Requested {new Date(request.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => setSelectedChangeRequest(request)}
                                                    className="h-16 px-10 bg-white text-gray-900 border-2 border-gray-100 hover:bg-gray-900 hover:text-white hover:border-gray-900 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-100/30 transition-all flex items-center gap-3"
                                                >
                                                    Review Changes
                                                    <ArrowRight size={18} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Reviewed Requests */}
                                {profileChangeRequests.filter(r => r.status !== 'pending').length > 0 && (
                                    <div className="mt-12">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Previously Reviewed</h4>
                                        <div className="space-y-4">
                                            {profileChangeRequests.filter(r => r.status !== 'pending').map((request) => (
                                                <Card key={request._id} className={cn(
                                                    "rounded-[32px] overflow-hidden border-2",
                                                    request.status === 'approved' ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"
                                                )}>
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                                    request.status === 'approved' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                                                )}>
                                                                    {request.status === 'approved' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="font-black text-gray-900">{request.hospitalId?.facilityName}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400">
                                                                        {request.status === 'approved' ? 'Approved' : 'Rejected'} on {new Date(request.reviewedAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            )}
            {/* Profile Change Review Modal */}
            <AnimatePresence>
                {selectedChangeRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-gray-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#FAFAFA] rounded-[50px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20"
                        >
                            <div className="p-8 lg:p-12 space-y-10 overflow-y-auto scrollbar-hide">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center">
                                                <Settings size={20} />
                                            </div>
                                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Review Profile Changes</h2>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Side-by-side comparison for {selectedChangeRequest.hospitalId?.facilityName}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedChangeRequest(null);
                                            setRejectionNotes("");
                                        }}
                                        className="w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-400 rounded-2xl border border-gray-100"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Current State */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Version</p>
                                        </div>
                                        <div className="p-8 bg-white rounded-[40px] border border-gray-100 space-y-8">
                                            {selectedChangeRequest.currentData.profileImage && (
                                                <div className="space-y-3">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Avatar</p>
                                                    <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-gray-50">
                                                        <img src={selectedChangeRequest.currentData.profileImage} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-6">
                                                {[
                                                    { icon: Building2, label: "Facility Name", value: selectedChangeRequest.currentData.facilityName },
                                                    { icon: MapPin, label: "Address", value: selectedChangeRequest.currentData.address }
                                                ].map((item, i) => item.value && (
                                                    <div key={i} className="flex gap-4 items-start">
                                                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                                            <item.icon size={16} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{item.label}</p>
                                                            <p className="text-sm font-bold text-gray-500">{item.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requested Changes */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest font-black">Requested Version</p>
                                        </div>
                                        <div className="p-8 bg-white rounded-[40px] border-2 border-green-100 shadow-2xl shadow-green-100/20 space-y-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4">
                                                <ArrowRight className="text-green-500 animate-bounce-x" size={24} />
                                            </div>

                                            {selectedChangeRequest.requestedChanges.profileImage && (
                                                <div className="space-y-3">
                                                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">New Avatar</p>
                                                    <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-green-50 shadow-lg">
                                                        <img src={selectedChangeRequest.requestedChanges.profileImage} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                {[
                                                    { icon: Building2, label: "New Facility Name", value: selectedChangeRequest.requestedChanges.facilityName, current: selectedChangeRequest.currentData.facilityName },
                                                    { icon: MapPin, label: "New Address", value: selectedChangeRequest.requestedChanges.address, current: selectedChangeRequest.currentData.address }
                                                ].map((item, i) => item.value && (
                                                    <div key={i} className={cn(
                                                        "flex gap-4 items-start p-4 rounded-2xl transition-colors",
                                                        item.value !== item.current ? "bg-green-50" : "bg-gray-50/50"
                                                    )}>
                                                        <div className={cn("p-3 rounded-xl shadow-sm", item.value !== item.current ? "bg-white text-green-500" : "bg-white text-gray-400")}>
                                                            <item.icon size={16} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className={cn("text-[9px] font-black uppercase tracking-widest", item.value !== item.current ? "text-green-500" : "text-gray-300")}>
                                                                {item.label}
                                                            </p>
                                                            <p className={cn("text-sm font-black", item.value !== item.current ? "text-gray-900" : "text-gray-500")}>
                                                                {item.value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Actions */}
                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Feedback / Rejection Reason</label>
                                        <textarea
                                            value={rejectionNotes}
                                            onChange={(e) => setRejectionNotes(e.target.value)}
                                            placeholder="Explain why the changes were approved or rejected (Visible to hospital)..."
                                            className="w-full min-h-[120px] p-6 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-4 focus:ring-red-50 focus:border-[#FF1744] transition-all font-bold text-gray-700 shadow-inner"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button
                                            onClick={() => {
                                                handleReviewProfileChange(selectedChangeRequest._id, 'reject', rejectionNotes);
                                                setSelectedChangeRequest(null);
                                                setRejectionNotes("");
                                            }}
                                            className="flex-1 h-20 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-[32px] font-black text-xs uppercase tracking-widest border-none transition-all active:scale-95 shadow-sm"
                                        >
                                            Reject Changes
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                handleReviewProfileChange(selectedChangeRequest._id, 'approve', rejectionNotes);
                                                setSelectedChangeRequest(null);
                                                setRejectionNotes("");
                                            }}
                                            className="flex-[2] h-20 bg-[#FF1744] hover:bg-black text-white rounded-[32px] font-black text-xs uppercase tracking-widest border-none shadow-2xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-4"
                                        >
                                            <CheckCircle2 size={24} />
                                            Approve & Apply Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
