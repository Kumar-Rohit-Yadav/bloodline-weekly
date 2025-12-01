import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Droplet, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/frontend/OTPInput';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const { verifyEmail, resendOtp } = useAuth();

    useEffect(() => {
        if (!email) {
            navigate('/register');
            return;
        }

        let timer: any;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer, email, navigate]);

    const handleVerifyOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }
        setIsLoading(true);
        try {
            await verifyEmail(email, otp);
            navigate('/login');
        } catch (error) {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setIsLoading(true);
        try {
            await resendOtp(email);
            setResendTimer(60);
            setOtp('');
            toast.success('A new verification code has been sent!');
        } catch (error) {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
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
                <div className="text-center space-y-4">
                    <Link to="/" className="inline-flex items-center gap-2 group">
                        <div className="bg-[#FF1744] p-2.5 rounded-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-red-100">
                            <Droplet className="text-white w-7 h-7 fill-current" />
                        </div>
                        <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">BloodLine</span>
                    </Link>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-8">
                    <div className="space-y-4 text-center">
                        <div className="w-16 h-16 mx-auto bg-red-50 rounded-3xl flex items-center justify-center animate-bounce">
                            <Mail className="w-8 h-8 text-[#FF1744]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Verify Your Email</h2>
                            <p className="text-sm font-medium text-gray-500 mt-2">
                                We've sent a 6-digit OTP to<br />
                                <span className="font-black text-[#FF1744]">{email}</span>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleVerifyOTP} className="space-y-8">
                        <OTPInput
                            value={otp}
                            onChange={setOtp}
                        />

                        <Button
                            type="submit"
                            className="w-full py-7 text-base font-black rounded-2xl shadow-2xl shadow-red-200 group relative overflow-hidden"
                            isLoading={isLoading}
                            disabled={otp.length !== 6}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Verify & Continue
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>

                        <div className="text-center space-y-4">
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Didn't receive the code?
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || isLoading}
                                    className={`text-sm font-black transition-all ${resendTimer > 0
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-[#FF1744] hover:underline cursor-pointer'
                                        }`}
                                >
                                    {resendTimer > 0
                                        ? `Resend available in ${resendTimer}s`
                                        : 'Resend Verification Code'}
                                </button>
                            </div>

                            <Link
                                to="/register"
                                className="inline-block text-[10px] font-black text-gray-400 hover:text-[#FF1744] uppercase tracking-[0.2em] transition-colors"
                            >
                                ← Back to registration
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
