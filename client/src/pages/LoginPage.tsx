import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, ArrowRight, X, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/config/api';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Forgot Password States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (error: any) {
            if (error.response?.data?.needsVerification) {
                navigate(`/verify-email?email=${encodeURIComponent(email)}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsForgotLoading(true);
        try {
            await api.post('/auth/forgotpassword', { email: forgotEmail });
            setForgotSuccess(true);
            toast.success("Reset link sent to your email!");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to send reset link");
        } finally {
            setIsForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 selection:bg-red-100 selection:text-[#FF1744]">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-red-50 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Logo & Header */}
                <div className="text-center space-y-4">
                    <Link to="/" className="inline-flex items-center gap-2 group">
                        <div className="bg-[#FF1744] p-2.5 rounded-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-red-100">
                            <Droplet className="text-white w-7 h-7 fill-current" />
                        </div>
                        <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">BloodLine</span>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Welcome Back</h1>
                        <p className="text-gray-400 font-bold text-sm tracking-wide uppercase">Login to your account</p>
                    </div>
                </div>

                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
                    <CardHeader className="pt-8 px-8 text-center">
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="EMAIL ADDRESS"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/50"
                            />

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-bold text-gray-700">PASSWORD</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForgotModal(true);
                                            setForgotSuccess(false);
                                            setForgotEmail('');
                                        }}
                                        className="text-xs font-black text-[#FF1744] hover:underline uppercase tracking-wider"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/50"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full text-base font-black py-7 rounded-2xl group shadow-2xl shadow-red-200"
                                isLoading={isLoading}
                            >
                                Sign In
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="bg-gray-50/50 border-t border-gray-100/50 p-8 flex justify-center">
                        <p className="text-sm font-bold text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-[#FF1744] hover:underline font-black">
                                Create one
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                    SECURE 256-BIT SSL ENCRYPTION
                </p>
            </div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForgotModal(false)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
                        >
                            <button
                                onClick={() => setShowForgotModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>

                            {forgotSuccess ? (
                                <div className="text-center space-y-6 py-6 font-bold">
                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-gray-900 uppercase">Email Sent!</h3>
                                        <p className="text-gray-500 text-sm">We've sent a recovery link to <span className="text-gray-900">{forgotEmail}</span>. The link expires in 10 minutes.</p>
                                    </div>
                                    <Button
                                        onClick={() => setShowForgotModal(false)}
                                        className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="text-left space-y-2">
                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Recover Password</h3>
                                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Enter your email to receive a reset link</p>
                                    </div>

                                    <form onSubmit={handleForgotSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Input
                                                label="RECOVERY EMAIL"
                                                type="email"
                                                placeholder="Enter your registered email"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                required
                                                className="h-16 rounded-2xl"
                                                icon={<Mail size={18} />}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full py-8 bg-[#FF1744] hover:bg-[#D50000] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100"
                                            isLoading={isForgotLoading}
                                        >
                                            {isForgotLoading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
