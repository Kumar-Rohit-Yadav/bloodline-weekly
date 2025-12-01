import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Loader2, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '@/config/api';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        if (password.length < 4) {
            return toast.error("Password must be at least 4 characters");
        }

        setLoading(true);
        try {
            const res = await api.put(`/auth/resetpassword/${token}`, { password });
            if (res.data.success) {
                setSuccess(true);
                toast.success("Password reset successfully!");
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Reset failed. Token may be expired.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <Card className="max-w-md w-full border-none shadow-2xl rounded-[48px] p-12 bg-white text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">SUCCESS!</h2>
                        <p className="text-gray-500 font-bold leading-relaxed">
                            Your password has been updated. Redirecting you to login...
                        </p>
                    </div>
                    <Link to="/login" className="block">
                        <Button className="w-full h-16 bg-gray-900 text-white hover:bg-black rounded-2xl font-black text-[10px] uppercase tracking-widest">
                            Login Now
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <Card className="max-w-md w-full border-none shadow-2xl rounded-[48px] p-10 bg-white space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-red-50 text-[#FF1744] rounded-3xl flex items-center justify-center mx-auto shadow-sm rotate-3">
                        <Lock size={36} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">New Password</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Secure your account access</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3 text-left">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Create Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF1744] transition-colors" size={18} />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-16 pl-14 font-bold rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-red-50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3 text-left">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF1744] transition-colors" size={18} />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-16 pl-14 font-bold rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-red-50 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-18 bg-[#FF1744] hover:bg-[#D50000] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Lock size={16} />}
                        Update Password
                    </Button>

                    <Link to="/login" className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </form>
            </Card>
        </div>
    );
}
