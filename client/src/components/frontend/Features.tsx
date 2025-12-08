"use client";

import { Users, Navigation, MessageSquare, ShieldCheck, Clock, Heart } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const Features = () => {
    const features = [
        {
            title: "Multi-Role Platform",
            desc: "Dedicated interfaces for donors, receivers, hospitals, and administrators.",
            icon: Users,
        },
        {
            title: "Location-Based Matching",
            desc: "Find compatible donors near you with real-time GPS integration.",
            icon: Navigation,
        },
        {
            title: "Real-Time Communication",
            desc: "Instant chat and notifications between donors and receivers.",
            icon: MessageSquare,
        },
        {
            title: "Verified Donors",
            desc: "All donors are verified to ensure safety and reliability.",
            icon: ShieldCheck,
        },
        {
            title: "Emergency Response",
            desc: "Urgent blood requests with priority matching system.",
            icon: Clock,
        },
        {
            title: "Save Lives Together",
            desc: "Join thousands of donors making a difference every day.",
            icon: Heart,
        },
    ];

    return (
        <section id="features" className="py-32 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                    <h2 className="text-5xl font-black text-[#1A1A1A] tracking-tighter">Everything You Need</h2>
                    <p className="text-lg text-gray-500 font-medium">
                        A comprehensive platform designed to streamline blood donation and save more lives.
                    </p>
                    <div className="h-1.5 w-24 bg-[#FF1744] mx-auto rounded-full mt-6" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <Card key={idx} className="p-10 border-none shadow-2xl shadow-gray-200/50 group hover:-translate-y-2 transition-all duration-500">
                            <div className="space-y-6">
                                <div className="inline-flex p-4 rounded-2xl bg-red-50 text-[#FF1744] group-hover:scale-110 group-hover:bg-[#FF1744] group-hover:text-white transition-all duration-500">
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight">{feature.title}</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};
