import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/config/api";
import { toast } from "sonner";
import { cn } from "@/utils/utils";
import { Droplet, ArrowRight, Loader2, Info, MapPin, Hospital, Navigation, Search, Building2, ArrowLeft } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

const NepalMap = React.lazy(() => import("@/components/map/NepalMap"));

export default function CreateRequestPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isHospital = user?.role === 'hospital';

    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<{ severity: string, reasoning: string } | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState({
        bloodType: "",
        units: 1,
        description: "",
        hospitalName: user?.facilityName || "",
        patientName: "",
        receiverAddress: user?.location?.address || "",
        facilityAddress: user?.role === 'hospital' ? user?.location?.address : "",
        address: user?.location?.address || "",
        coordinates: (user?.location?.coordinates as [number, number]) || [85.324, 27.7172]
    });

    useEffect(() => {
        if (formData.description.length < 5) {
            setAiResult(null);
            return;
        }

        const timeout = setTimeout(async () => {
            setAiLoading(true);
            try {
                const res = await api.post('/ai/analyze-severity', { description: formData.description });
                if (res.data.success) {
                    setAiResult(res.data.data);
                }
            } catch (error) {
                console.error("AI Analysis failed");
            } finally {
                setAiLoading(false);
            }
        }, 1500);

        return () => clearTimeout(timeout);
    }, [formData.description]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported");

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData({
                    ...formData,
                    coordinates: [pos.coords.longitude, pos.coords.latitude]
                });
                setGettingLocation(false);
                toast.success("Location captured!");
            },
            (err) => {
                setGettingLocation(false);
                toast.error("Locaton access denied. Please pick manually on map.");
            }
        );
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData({
            ...formData,
            coordinates: [lng, lat]
        });
    };

    const searchCatalog = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setCatalog([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await api.get(`/hospitals/search?name=${val}`);
            if (res.data.success) setCatalog(res.data.data);
        } catch (error) {
            console.error("Catalog search failed");
        } finally {
            setIsSearching(false);
        }
    };

    const selectFacility = (facility: any) => {
        setFormData({
            ...formData,
            hospitalName: facility.name,
            facilityAddress: facility.address,
            coordinates: facility.location.coordinates
        });
        setCatalog([]);
        setSearchQuery("");
        toast.success(`Selected ${facility.name}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.bloodType) return toast.error("Please select a blood type");
        if (!formData.address) return toast.error("Please provide an address");

        // Governance check for non-hospital users
        if (!isHospital && !formData.hospitalName) {
            return toast.error("Please select a medical facility from the search below.");
        }
        if (!isHospital && !formData.patientName) {
            return toast.error("Please enter the patient's name.");
        }

        setLoading(true);
        try {
            await api.post('/requests', {
                ...formData,
                location: {
                    address: formData.facilityAddress || formData.address,
                    type: "Point",
                    coordinates: formData.coordinates
                },
                manualUrgency: aiResult?.severity,
                receiverAddress: formData.receiverAddress || formData.address
            });
            toast.success("Request Broadcasted Successfully!");
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create request");
        } finally {
            setLoading(false);
        }
    };

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

    return (
        <div className="py-20 px-4">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="relative text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-2xl text-[#FF1744] font-black text-xs uppercase tracking-[0.2em] mb-4">
                        <Droplet size={14} className="fill-current" />
                        Blood Request Center
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">Broadcast <span className="text-[#FF1744]">Emergency Request</span></h1>
                    <p className="text-gray-500 font-medium text-lg italic">"Connecting life-critical needs with immediate donor networks."</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-gray-100/50 rounded-[40px] overflow-hidden p-10">
                        <CardContent className="p-0 space-y-10">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Blood Group Needed</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {bloodTypes.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, bloodType: type })}
                                                className={cn(
                                                    "h-12 rounded-xl font-black text-sm transition-all border-2",
                                                    formData.bloodType === type
                                                        ? "bg-[#FF1744] border-[#FF1744] text-white shadow-lg shadow-red-200"
                                                        : "bg-white border-gray-100 text-gray-400 hover:border-red-100 hover:text-[#FF1744]"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Target Individual (Patient)</label>
                                    <Input
                                        required={!isHospital}
                                        placeholder="Enter patient name..."
                                        className="h-14 font-bold rounded-2xl"
                                        value={formData.patientName}
                                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Units Required</label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.units}
                                            onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                                            className="h-14 font-black text-lg text-center"
                                        />
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Units</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Urgency Status</label>
                                    <div className="h-14 flex items-center gap-3 px-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-400 text-xs font-bold">
                                        {aiResult?.severity || "AI will determine urgency based on description below..."}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Describe the Situation</label>
                                <div className="relative">
                                    <textarea
                                        required
                                        placeholder="Detailed situation..."
                                        className="w-full min-h-[160px] p-6 bg-gray-50 rounded-[32px] border-none focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    {aiLoading ? (
                                        <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl animate-pulse">
                                            <Loader2 size={14} className="animate-spin text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI analyzing...</span>
                                        </div>
                                    ) : aiResult && (
                                        <div className={cn(
                                            "mt-4 p-6 rounded-[28px] border-2 bg-opacity-50",
                                            aiResult.severity === 'Critical' ? "bg-red-50 border-red-100 text-red-700" : "bg-blue-50 border-blue-100 text-blue-700"
                                        )}>
                                            <span className="text-xs font-black uppercase tracking-widest">Severity: {aiResult.severity}</span>
                                            <p className="text-xs font-bold mt-1 leading-relaxed italic">"{aiResult.reasoning}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {!isHospital ? (
                        <Card className="border-none shadow-2xl shadow-gray-100/50 rounded-[40px] overflow-hidden p-10 bg-white">
                            <CardContent className="p-0 space-y-8">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
                                        <MapPin className="text-[#FF1744]" /> Pin Exact Location
                                    </h3>
                                    <Button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={gettingLocation}
                                        className="bg-red-50 text-[#FF1744] hover:bg-red-100 px-6 h-12 rounded-2xl font-black text-xs uppercase"
                                    >
                                        Detect Location
                                    </Button>
                                </div>
                                <div className="grid lg:grid-cols-2 gap-10">
                                    <div className="h-[300px] rounded-3xl overflow-hidden shadow-inner">
                                        <Suspense fallback={<div>Loading Map...</div>}>
                                            <NepalMap
                                                center={[formData.coordinates[1], formData.coordinates[0]]}
                                                onLocationSelect={handleLocationSelect}
                                                markerPosition={[formData.coordinates[1], formData.coordinates[0]]}
                                            />
                                        </Suspense>
                                    </div>
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Search Hospital..."
                                            value={searchQuery || formData.hospitalName}
                                            onChange={(e) => searchCatalog(e.target.value)}
                                            className="h-14 font-bold rounded-2xl"
                                        />
                                        {catalog.length > 0 && (
                                            <div className="bg-white rounded-2xl shadow-xl border p-2 max-h-40 overflow-y-auto">
                                                {catalog.map(h => (
                                                    <button
                                                        key={h._id}
                                                        type="button"
                                                        onClick={() => selectFacility(h)}
                                                        className="w-full text-left p-2 hover:bg-red-50 rounded-xl text-xs font-bold"
                                                    >
                                                        {h.name} - {h.address}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <textarea
                                            required
                                            placeholder="Complete Address..."
                                            className="w-full min-h-[100px] p-4 bg-gray-50 rounded-2xl resize-none outline-none font-bold text-sm"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="p-8 bg-blue-50 rounded-[32px] border-2 border-blue-100 flex items-center gap-4">
                            <Hospital className="text-blue-500" />
                            <div>
                                <p className="text-xs font-black text-blue-400 uppercase">Hospital Request</p>
                                <p className="text-lg font-black">{user?.facilityName}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !formData.bloodType || formData.description.length < 5}
                        className="w-full h-20 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-[32px] font-black text-xl shadow-2xl shadow-red-200"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Broadcast Emergency Request"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
