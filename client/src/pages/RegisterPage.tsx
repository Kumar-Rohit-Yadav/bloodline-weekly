import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleSelection } from '@/components/frontend/RoleSelection';
import { HospitalSearch } from '@/components/frontend/HospitalSearch';

export default function RegisterPage() {
    const [role, setRole] = useState('donor');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        facilityName: '',
        facilityAddress: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleHospitalSelect = (hospital: any) => {
        setFormData({
            ...formData,
            name: hospital.name,
            facilityName: hospital.name,
            facilityAddress: hospital.address
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const registerData = {
                ...formData,
                role,
                // Ensure name is set for hospitals if not already
                name: role === 'hospital' ? formData.facilityName : formData.name
            };
            const result = await register(registerData);
            if (result.needsVerification) {
                navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
            }
        } catch (error) {
            // Error is handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-red-100 selection:text-[#FF1744]">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-red-50 rounded-full blur-3xl opacity-40" />
            </div>

            <div className="w-full max-w-[900px] grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">

                {/* Left Side: Branding & Info */}
                <div className="hidden lg:flex flex-col space-y-12">
                    <Link to="/" className="inline-flex items-center gap-3 group">
                        <div className="bg-[#FF1744] p-3 rounded-2xl shadow-2xl shadow-red-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <Droplet className="text-white w-8 h-8 fill-current" />
                        </div>
                        <span className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase">BloodLine</span>
                    </Link>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-black text-[#1A1A1A] leading-[1.1] tracking-tighter">
                            Join our community of <span className="text-[#FF1744]">Life Savers.</span>
                        </h1>
                        <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-md">
                            Whether you're looking to donate or in need of help, we're here to bridge the gap and save lives together.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 py-6 border-y border-gray-100">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full bg-gray-100 border-4 border-white flex items-center justify-center text-xs font-black text-gray-400">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                            <span className="text-[#FF1744] block text-xl leading-none">5,000+</span>
                            verified rescuers
                        </p>
                    </div>
                </div>

                {/* Right Side: Step-by-Step Form */}
                <div className="space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select your account type</h2>
                                <p className="text-[10px] font-bold text-gray-400 ml-1">Choose how you want to participate in the BloodLine network.</p>
                            </div>
                            <RoleSelection selectedRole={role} onSelect={setRole} />
                        </div>

                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex justify-between items-end">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Complete your profile</h2>
                            </div>
                            <div className="grid sm:grid-cols-1 gap-5">
                                {role === 'hospital' ? (
                                    <HospitalSearch onSelect={handleHospitalSelect} />
                                ) : (
                                    <Input
                                        label="FULL NAME"
                                        name="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                )}
                                <Input
                                    label="EMAIL ADDRESS"
                                    type="email"
                                    name="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="CREATE PASSWORD"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-8 text-lg font-black rounded-3xl shadow-2xl shadow-red-200 group relative overflow-hidden"
                            isLoading={isLoading}
                            disabled={role === 'hospital' && !formData.facilityName}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Create Account
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>

                        <p className="text-center text-sm font-bold text-gray-400">
                            Already part of the community?{' '}
                            <Link to="/login" className="text-[#FF1744] hover:underline font-black">
                                Sign in here
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
