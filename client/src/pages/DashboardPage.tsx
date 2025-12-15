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
        <div className="min-h-screen bg-[#F8FAFC]">
            <nav className="h-20 sm:h-24 sticky top-0 z-[100] transition-all duration-300 bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
                    >
                        <div className="bg-[#FF1744] p-2 sm:p-3 rounded-2xl group-hover:rotate-12 transition-all shadow-xl shadow-red-200">
                            <Droplet className="text-white w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                        </div>
                        <div className="hidden xs:block">
                            <span className="font-black text-xl sm:text-2xl tracking-tighter uppercase block leading-none text-gray-900">BloodLine</span>
                            <span className="text-[9px] sm:text-[10px] font-black text-[#FF1744] uppercase tracking-[0.2em] mt-1 ml-0.5">Control Center</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <NotificationButton />
                            <Button
                                onClick={() => navigate('/dashboard/profile')}
                                variant="ghost"
                                className="hidden sm:inline-flex w-12 h-12 p-0 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-100/50 transition-colors"
                            >
                                <Settings size={24} />
                            </Button>
                        </div>

                        <div className="h-8 w-[1px] bg-gray-200/60 mx-1 sm:mx-2" />

                        <div
                            className="flex items-center gap-3 sm:gap-4 pl-1 group cursor-pointer"
                            onClick={() => navigate('/dashboard/profile')}
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-black text-gray-900 leading-none group-hover:text-red-600 transition-colors">{user.name}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{user.role} console</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[20px] bg-white border-2 border-gray-100 shadow-sm overflow-hidden flex items-center justify-center text-[#FF1744] font-black text-lg transition-all group-hover:scale-105 group-hover:border-red-200 group-hover:shadow-lg group-hover:shadow-red-50">
                                {user.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                                    <img src={user.profileImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="text-gray-700">{user.name.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-10 mb-12 sm:mb-20"
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
        </div>
    );
}
