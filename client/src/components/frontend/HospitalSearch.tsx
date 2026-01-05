import React, { useState } from 'react';
import { Search, Building2, Loader2, Check } from 'lucide-react';
import api from '@/config/api';
import { cn } from '@/utils/utils';

interface Hospital {
    _id: string;
    name: string;
    address: string;
    location: {
        coordinates: [number, number];
    };
}

interface HospitalSearchProps {
    onSelect: (hospital: Hospital) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

export const HospitalSearch: React.FC<HospitalSearchProps> = ({
    onSelect,
    placeholder = "Search for a medical facility...",
    className,
    label = "MEDICAL FACILITY"
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setHospitals([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.get(`/hospitals/search?name=${encodeURIComponent(val)}`);
            if (res.data.success) {
                setHospitals(res.data.data);
            }
        } catch (error) {
            console.error("Failed to search hospitals", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (h: Hospital) => {
        setSelectedHospital(h);
        setSearchQuery("");
        setHospitals([]);
        onSelect(h);
    };

    return (
        <div className={cn("space-y-2", className)}>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                {label}
            </label>

            <div className="relative group z-[9999]">
                <div className={cn(
                    "flex items-center bg-gray-50 rounded-2xl border-2 transition-all duration-300",
                    selectedHospital ? "border-green-100 bg-green-50/30" : "border-transparent focus-within:border-red-100 focus-within:bg-white"
                )}>
                    <div className="pl-6 text-gray-400">
                        {isLoading ? <Loader2 size={18} className="animate-spin text-red-500" /> : <Search size={18} />}
                    </div>
                    <input
                        type="text"
                        value={selectedHospital ? selectedHospital.name : searchQuery}
                        onChange={(e) => {
                            if (selectedHospital) {
                                setSelectedHospital(null);
                                handleSearch(e.target.value);
                            } else {
                                handleSearch(e.target.value);
                            }
                        }}
                        placeholder={placeholder}
                        className="w-full h-14 bg-transparent border-none px-4 text-sm font-bold focus:ring-0 outline-none placeholder:text-gray-300 text-gray-900"
                    />
                    {selectedHospital && (
                        <div className="pr-6 text-green-500 animate-in zoom-in">
                            <Check size={18} strokeWidth={3} />
                        </div>
                    )}
                </div>

                {/* Results Dropdown */}
                {hospitals.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="max-h-[240px] overflow-y-auto space-y-1">
                            {hospitals.map((h) => (
                                <button
                                    key={h._id}
                                    type="button"
                                    onClick={() => handleSelect(h)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-gray-900 truncate tracking-tight">{h.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 truncate tracking-tight">{h.address}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
