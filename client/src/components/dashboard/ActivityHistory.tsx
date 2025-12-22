"use client";

import React, { useEffect, useState } from "react";
import {
    Clock, CheckCircle2, ArrowRight, Droplet,
    Hospital, User, Calendar, Loader2, ShieldCheck, Heart, ArrowUpRight, ArrowDownLeft, Activity, Globe,
    FileText, Download, Printer
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import api from "@/config/api";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/Button";

export const ActivityHistory = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/requests/history');
                setHistory(res.data.data);
            } catch (error) {
                console.error("Failed to fetch history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDownloadCertificate = (item: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const date = new Date(item.createdAt).toLocaleDateString();
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Donation Certificate - ${item.facilityName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
                    .cert-card { width: 800px; padding: 60px; background: white; border-radius: 40px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.1); border: 20px solid #fef2f2; position: relative; overflow: hidden; }
                    .cert-card::before { content: ''; position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: #ef4444; opacity: 0.03; border-radius: 50%; }
                    .header { text-align: center; margin-bottom: 60px; }
                    .logo { font-size: 32px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 10px; }
                    .title { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 4px; }
                    .main-content { text-align: center; }
                    .congrats { font-size: 48px; font-weight: 900; color: #1e293b; margin: 0 0 20px 0; letter-spacing: -2px; }
                    .text { font-size: 18px; color: #64748b; line-height: 1.6; margin-bottom: 40px; }
                    .donor-name { font-size: 32px; font-weight: 900; color: #ef4444; border-bottom: 4px solid #fecaca; display: inline-block; padding: 0 20px 10px 20px; }
                    .details { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-top: 60px; padding: 30px; background: #f8fafc; border-radius: 20px; }
                    .detail-box { text-align: center; }
                    .label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
                    .value { font-size: 16px; font-weight: 900; color: #1e293b; }
                    .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .signature-box { border-top: 2px solid #e2e8f0; padding-top: 10px; width: 200px; text-align: center; }
                    .watermark { position: absolute; bottom: -50px; left: -50px; font-size: 200px; font-weight: 900; color: #ef4444; opacity: 0.02; transform: rotate(-15deg); pointer-events: none; }
                    @media print { body { background: white; } .cert-card { box-shadow: none; border-color: #f1f5f9; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="cert-card">
                    <div class="watermark">${item.bloodType}</div>
                    <div class="header">
                        <div class="logo">BloodLine™</div>
                        <div class="title">Official Verification of Life Donation</div>
                    </div>
                    <div class="main-content">
                        <p class="congrats">Life Saved.</p>
                        <p class="text"> This certificate is proudly presented to acknowledge the exceptional contribution and heroic spirit demonstrated through voluntary blood donation.</p>
                        <div class="donor-name">${item.linkedUser?.name || 'Anonymous Hero'}</div>
                    </div>
                    <div class="details">
                        <div class="detail-box">
                            <div class="label">Blood Group</div>
                            <div class="value">${item.bloodType}</div>
                        </div>
                        <div class="detail-box">
                            <div class="label">Verification Date</div>
                            <div class="value">${date}</div>
                        </div>
                        <div class="detail-box">
                            <div class="label">Facility</div>
                            <div class="value">${item.facilityName}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class="signature-box">
                            <div class="value" style="font-family: cursive; font-size: 20px; color: #64748b;">${item.facilityName}</div>
                            <div class="label">Medical Director</div>
                        </div>
                        <div class="signature-box" style="text-align: right;">
                            <div class="value">AID-${item._id.slice(-6).toUpperCase()}</div>
                            <div class="label">Certificate ID</div>
                        </div>
                    </div>
                    <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 40px; right: 40px; padding: 20px 40px; background: #1e293b; color: white; border: none; border-radius: 20px; font-weight: 900; cursor: pointer; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">Print Protocol</button>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[60px] shadow-sm">
                <Loader2 className="animate-spin text-[#FF1744]" size={48} />
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Loading history...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-32 bg-gray-50 rounded-[60px] border-8 border-dashed border-gray-100 flex flex-col items-center gap-8">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-100">
                    <HistoryIcon size={48} />
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-black text-gray-300 uppercase tracking-tight">No actions yet</p>
                    <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Complete a donation or request to see history.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 px-4 max-w-7xl mx-auto">
            <div className="text-left space-y-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase flex items-center gap-4">
                    <div className="w-2 h-8 bg-[#FF1744] rounded-full" />
                    Activity History
                </h2>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-6">Full history of all blood donations and receptions.</p>
            </div>

            <div className="space-y-6">
                {history.map((item) => (
                    <Card key={item._id} className="border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] bg-white rounded-[40px] overflow-hidden group hover:-translate-y-1 transition-all">
                        <CardContent className="p-6 sm:p-10">
                            <div className="flex flex-col gap-6">
                                {/* Top Section - Icon + Title + Blood Type */}
                                <div className="flex items-start gap-6">
                                    <div className={cn(
                                        "w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] flex items-center justify-center shrink-0 shadow-lg border-4",
                                        item.type === 'donation' || item.type === 'manual_donation' ? "bg-red-50 text-[#FF1744] border-red-100" :
                                            item.type === 'receipt' ? "bg-green-50 text-green-600 border-green-100" :
                                                "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                        {item.type === 'donation' || item.type === 'manual_donation' ? <Heart size={36} className="fill-current" /> :
                                            item.type === 'receipt' ? <ArrowDownLeft size={36} strokeWidth={3} /> :
                                                <ShieldCheck size={36} />}
                                    </div>
                                    <div className="flex-1 space-y-3 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <h4 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-tight">
                                                {item.type === 'donation' ? "Life Donation" :
                                                    item.type === 'manual_donation' ? "Manual Stock Entry" :
                                                        item.type === 'receipt' ? "Blood Received" :
                                                            "Mission Facilitated"}
                                            </h4>
                                            <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-2 self-start">
                                                <Droplet size={14} className="text-[#FF1744] fill-current" />
                                                <span className="text-lg font-black text-gray-900 tracking-tight">
                                                    {item.bloodType}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-base sm:text-lg font-bold text-gray-400 leading-tight">{item.description}</p>
                                    </div>
                                    {(item.type === 'donation' || item.type === 'manual_donation') && (
                                        <Button
                                            onClick={() => handleDownloadCertificate(item)}
                                            className="h-14 px-6 bg-gray-900 border border-gray-100 rounded-2xl hover:bg-black transition-all shadow-sm text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-3 ml-auto"
                                        >
                                            <FileText size={16} /> Get Certificate
                                        </Button>
                                    )}
                                </div>

                                {/* Bottom Section - Metadata */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50">
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                            <Calendar size={16} className="text-[#FF1744]" />
                                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </div>
                                        {item.linkedUser && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                                <User size={12} /> {item.roleAtTime === 'donor' ? 'Receiver' : 'Donor'}: {item.linkedUser.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 sm:ml-auto">
                                        <Hospital size={16} className="text-[#FF1744]" />
                                        <span className="truncate max-w-[300px]">{item.facilityName || "Verified Facility"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const HistoryIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
    </svg>
);
