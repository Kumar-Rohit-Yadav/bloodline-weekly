"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldCheck, Users, TrendingUp, Activity, CheckCircle2, 
    BarChart3, PieChart, Building2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import api from "@/config/api";
import { motion } from "framer-motion";

const HeartIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

export const AdminDashboard = ({ user }: { user: any }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const fetchAdminData = async () => {
        try {
            const res = await api.get('/admin/stats');
            if (res.data.success) setStats(res.data.data);
        } catch (error) {
            console.error("Failed to fetch admin stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

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
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white/50 p-8 rounded-[48px] border border-gray-100">
                <div className="space-y-2 text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Command Overview</h1>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Global Platform Statistics & Performance</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                    <BarChart3 size={16} className="text-[#FF1744]" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.1em]">Live Network Analytics</span>
                </div>
            </div>

            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {highlights.map((item, i) => (
                        <Card key={i} className="border-none shadow-xl shadow-gray-100/50 rounded-[40px] overflow-hidden group">
                            <CardContent className="p-10 space-y-6 relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${item.bg} ${item.color}`}>
                                    <item.icon size={28} />
                                </div>
                                <div className="text-left">
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
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Units Collected vs. Needed across active requests</p>
                            </div>
                            <PieChart className="text-gray-200" size={32} />
                        </div>
                        <div className="space-y-8">
                            {stats.demandStats?.map((stat: any) => (
                                <div key={stat._id} className="space-y-2">
                                    <div className="flex justify-between items-end px-2">
                                        <div className="flex items-center gap-3 text-left">
                                            <span className="w-10 h-10 bg-red-50 text-[#FF1744] rounded-xl flex items-center justify-center font-black text-xs border border-red-100/50">
                                                {stat._id}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                                {stat.count} Mission(s)
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-black ${stat.collected >= stat.requested ? "text-green-500" : "text-gray-900"}`}>
                                                {stat.collected} / {stat.requested}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                                Units
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (stat.collected / stat.requested) * 100)}%` }}
                                            className="h-full bg-gradient-to-r from-red-400 to-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.3)]"
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!stats.demandStats || stats.demandStats.length === 0) && (
                                <div className="py-20 text-center text-gray-200 font-black text-[12px] uppercase tracking-widest">
                                    No active requirements detected
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Top Performers */}
                    <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-gray-900 text-white overflow-hidden relative group">
                        <TrendingUp className="absolute -top-10 -right-10 text-white/5 group-hover:text-white/10 transition-colors" size={160} />
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-1 text-left">
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Mission Leaders</h4>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Top Facilities by Mission Completion</p>
                            </div>
                            <div className="space-y-6">
                                {stats.topPerformers?.map((item: any, i: number) => (
                                    <div key={item._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group/item hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center font-black text-[10px] text-red-500">
                                                #{i + 1}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black truncate max-w-[120px]">{item.facilityName || item.name}</p>
                                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                                                    {item.isVerified ? "Verified Partner" : "Clinical Agency"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-red-500">{item.missionsDone}</p>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Units</p>
                                        </div>
                                    </div>
                                ))}
                                {(!stats.topPerformers || stats.topPerformers.length === 0) && (
                                    <div className="py-20 text-center text-white/10 font-black text-[10px] uppercase tracking-widest">
                                        Archive Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Velocity Overview */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-white">
                        <div className="flex items-center gap-3 mb-8 text-left">
                            <div className="w-2 h-8 bg-[#FF1744] rounded-full" />
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Growth Analytics (30D)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center gap-3 group hover:bg-white hover:shadow-xl transition-all">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500 group-hover:scale-110 transition-transform">
                                    <Activity size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-1">{stats.summary?.recentActivity?.requests || 0}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">New Inbounds</p>
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center gap-3 group hover:bg-white hover:shadow-xl transition-all">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-1">{stats.summary?.recentActivity?.fulfilled || 0}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Resolutions</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl rounded-[48px] p-10 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col justify-between">
                        <div className="space-y-2 text-left">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                                <Building2 size={24} />
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tight leading-tight">Expansion Strategy</h4>
                            <p className="text-white/60 text-xs font-bold leading-relaxed max-w-sm">
                                Track platform growth and hospital onboarding velocity to ensure optimal coverage across all regions.
                            </p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[40px] font-black leading-none tracking-tighter">{stats.summary?.totalHospitals || 0}</p>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Partner Hospitals</p>
                            </div>
                            <button className="h-14 px-8 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                                Platform Health: Optimal
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
