import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Droplet, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationButton } from '@/components/dashboard/NotificationButton';

export const DashboardNavbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    return (
        <nav className="h-20 sm:h-24 sticky top-0 z-[100] transition-all duration-300 bg-white shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full relative flex items-center justify-between">
                <div className="flex items-center gap-12 text-left">
                    <Link
                        to="/"
                        className="flex items-center gap-3 sm:gap-4 group cursor-pointer shrink-0"
                    >
                        <div className="bg-[#FF1744] p-2 sm:p-3 rounded-2xl group-hover:rotate-12 transition-all shadow-xl shadow-red-200">
                            <Droplet className="text-white w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                        </div>
                        <div className="hidden xs:block">
                            <span className="font-black text-xl sm:text-2xl tracking-tighter uppercase block leading-none text-gray-900">BloodLine</span>
                            <span className="text-[9px] sm:text-[10px] font-black text-[#FF1744] uppercase tracking-[0.2em] mt-1 ml-0.5">Control Center</span>
                        </div>
                    </Link>

                    {/* Integrated Hospital Navigation */}
                    {user.role === 'hospital' && (
                        <div className="hidden lg:flex items-center gap-1 p-1 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${location.pathname === '/dashboard' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                            >
                                Dashboard
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard/inventory')}
                                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${location.pathname === '/dashboard/inventory' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                            >
                                Blood Inventory
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard/request-blood')}
                                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${location.pathname === '/dashboard/request-blood' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                            >
                                Request Blood
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard/messages')}
                                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${location.pathname === '/dashboard/messages' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100/50'}`}
                            >
                                Messages
                            </button>
                        </div>
                    )}
                </div>

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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{user.role} dashboard</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[20px] bg-white border-2 border-gray-100 shadow-sm overflow-hidden flex items-center justify-center text-[#FF1744] font-black text-lg transition-all group-hover:scale-105 group-hover:border-red-200 group-hover:shadow-lg group-hover:shadow-red-50 text-left">
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
    );
};
