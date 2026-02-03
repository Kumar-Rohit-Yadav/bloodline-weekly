import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface User {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role: 'donor' | 'receiver' | 'hospital' | 'admin';
    bloodType: string;
    location?: {
        type: 'Point';
        coordinates: number[];
        address?: string;
        city?: string;
    };
    facilityName?: string;
    facilityAddress?: string;
    verificationImage?: string;
    profileImage?: string;
    isVerified?: boolean;
    isEmailVerified?: boolean;
    medicalNotes?: string;
    lastDonationDate?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    register: (userData: any) => Promise<{ needsVerification: boolean; email?: string }>;
    verifyEmail: (email: string, otp: string) => Promise<void>;
    resendOtp: (email: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkUserLoggedIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            console.log("[AUTH] 👔 Checking session via /api/auth/me...");
            const res = await api.get<{ user: User }>('/auth/me');
            console.log("[AUTH] ✅ Session valid. User:", res.data.user?.name);
            setUser(res.data.user);
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.warn("[AUTH] 🛑 Session invalid (401). User is unauthenticated.");
            } else {
                console.error("[AUTH] ❌ Error checking session:", error.message);
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: any) => {
        try {
            const res = await api.post<{ message: string }>('/auth/register', userData);
            toast.success(res.data.message || 'OTP sent to your email!');
            return { needsVerification: true, email: userData.email };
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Registration failed');
            throw error;
        }
    };

    const verifyEmail = async (email: string, otp: string) => {
        try {
            await api.post('/auth/verify-email', { email, otp });
            toast.success('Email verified! Redirecting to login...');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Invalid OTP');
            throw error;
        }
    };

    const resendOtp = async (email: string) => {
        try {
            const res = await api.post('/auth/resend-verification-otp', { email });
            toast.success(res.data.message || 'New OTP sent to your email!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to resend OTP');
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const res = await api.post<{ user: User }>('/auth/login', { email, password });
            setUser(res.data.user);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error: any) {
            const errorData = error.response?.data;
            if (errorData?.needsVerification) {
                toast.error('Please verify your email first. Check your inbox for the OTP.');
            } else {
                toast.error(errorData?.error || 'Login failed');
            }
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
            setUser(null);
            navigate('/login');
            toast.info('Logged out');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            register,
            verifyEmail,
            resendOtp,
            login,
            logout,
            checkUserLoggedIn
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
