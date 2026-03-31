import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplet, Settings, Bell, AlertCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationButton } from '@/components/dashboard/NotificationButton';

import { DonorDashboard } from '@/components/dashboard/DonorDashboard';
import { HospitalDashboard } from '@/components/dashboard/HospitalDashboard';
import { ReceiverDashboard } from '@/components/dashboard/ReceiverDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
        if (!loading && user && user.role !== 'admin') {
            const hasNoLocation = !user.location || !user.location.address;
            const needsBloodType = user.role === 'donor' || user.role === 'receiver';
            const hasNoBloodType = user.bloodType === 'unknown';

            if (hasNoLocation || (needsBloodType && hasNoBloodType)) {
                navigate('/complete-profile');
            }
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-20 h-20 border-t-4 border-r-4 border-red-500 rounded-full"
                        />
                        <Droplet className="absolute inset-0 m-auto text-red-500 animate-pulse" size={32} />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const renderDashboard = () => {
        switch (user.role) {
            case 'donor': return <DonorDashboard user={user} />;
            case 'hospital': return <HospitalDashboard user={user} />;
            case 'receiver': return <ReceiverDashboard user={user} />;
            case 'admin': return <AdminDashboard user={user} />;
            default: return (
                <div className="p-20 text-center rounded-[48px] border-dashed border-2 border-gray-200">
                    <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="font-black text-gray-500 uppercase tracking-widest text-sm">Access Restricted: Undefined Role</p>
                </div>
            );
        }
    };

    return (
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12 sm:mb-20 text-left"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl shadow-gray-200">
                            <Activity size={10} className="text-red-400" /> System Active
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 text-gray-500 rounded-full font-black text-[9px] uppercase tracking-widest">
                            {user.role} access
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                        Welcome back, <br className="sm:hidden" />
                        <span className="text-[#FF1744] inline-block hover:scale-105 transition-transform cursor-default">
                            {user.name.split(' ')[0]}
                        </span>.
                    </h1>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={user.role}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    {renderDashboard()}
                </motion.div>
            </AnimatePresence>
        </main>
    );
}
