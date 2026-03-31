import React from "react";
import { BloodBankExplorer } from "@/components/dashboard/BloodBankExplorer";

export default function BloodBankExplorerPage() {
    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                    <div className="flex items-center gap-6">
                        <div className="text-left">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Blood Bank Explorer</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 ml-0.5">Real-time Global Inventory & Capacity Map</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[60px] border border-gray-100 shadow-xl p-10">
                    <BloodBankExplorer />
                </div>
            </div>
        </div>
    );
}
