import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const Hero = () => {
    const stats = [
        { label: "Registered Donors", value: "10,000+", color: "text-[#FF1744]" },
        { label: "Lives Saved", value: "5,000+", color: "text-[#FF1744]" },
        { label: "Partner Hospitals", value: "500+", color: "text-[#FF1744]" },
        { label: "Emergency Support", value: "24/7", color: "text-[#FF1744]" },
    ];

    return (
        <section className="relative pt-16 pb-24 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-red-50 rounded-full blur-3xl opacity-50 -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div className="space-y-10 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full text-[#FF1744] font-bold text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-700">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            Every Drop Counts
                        </div>

                        <h1 className="text-6xl sm:text-7xl font-black text-[#1A1A1A] leading-[0.95] tracking-tighter">
                            Connect Donors.<br />
                            <span className="text-[#FF1744]">Save Lives.</span>
                        </h1>

                        <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-lg">
                            BloodLine is a smart blood donation platform that connects verified donors with those in need, ensuring faster response times during emergencies.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/register">
                                <Button className="bg-[#FF1744] hover:bg-[#D50000] text-lg font-black px-10 py-7 shadow-2xl shadow-red-200 rounded-2xl group flex items-center gap-2">
                                    Become a Donor
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="outline" className="text-lg font-black px-10 py-7 border-2 border-gray-100 hover:bg-gray-50 rounded-2xl">
                                    Request Blood
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                                <span className="text-[#1A1A1A]">500+ donors</span> joined this week
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-red-50/50 p-10 rounded-[40px] border border-red-50 relative">
                            <div className="grid grid-cols-2 gap-6">
                                {stats.map((stat, idx) => (
                                    <Card key={idx} className="p-8 border-none shadow-xl shadow-red-50 flex flex-col items-center text-center space-y-2 group hover:-translate-y-1 transition-all duration-300">
                                        <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FF1744]/5 rounded-full blur-2xl -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
};
