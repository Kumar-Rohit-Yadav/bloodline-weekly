import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Info, Heart, Shield, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import api from '@/config/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    _id: string;
    type: 'URGENT_REQUEST' | 'VERIFICATION_ALERT' | 'VERIFICATION_SUCCESS' | 'DONATION_COMPLETE' | 'PROFILE_UPDATE' | 'MESSAGE_ALERT' | 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'SUCCESS';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationButton = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string, link?: string) => {
        try {
            await api.put(`/notifications/${id}/read`);

            // Update local state
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (link) {
                setIsOpen(false);
                navigate(link);
            }
        } catch (error) {
            console.error('Error marking as read');
        }
    };

    const markAllRead = async () => {
        try {
            setLoading(true);
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to update notifications');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'URGENT_REQUEST': return <Info className="text-red-500" size={18} />;
            case 'VERIFICATION_SUCCESS': return <Shield className="text-blue-500" size={18} />;
            case 'VERIFICATION_ALERT': return <Shield className="text-orange-500" size={18} />;
            case 'DONATION_COMPLETE': return <Heart className="text-pink-500" size={18} />;
            case 'PROFILE_UPDATE': return <Check className="text-purple-500" size={18} />;
            case 'MESSAGE_ALERT':
            case 'CONNECTION_REQUEST': return <MessageCircle className="text-blue-500" size={18} />;
            case 'CONNECTION_ACCEPTED':
            case 'SUCCESS': return <CheckCircle2 className="text-green-500" size={18} />;
            default: return <Bell className="text-gray-500" size={18} />;
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-2xl relative text-gray-400 hover:text-[#FF1744] hover:bg-red-50/50 transition-colors"
            >
                <Bell size={22} className="sm:size-[24px]" />
                {unreadCount > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#FF1744] rounded-full border-2 border-white animate-pulse" />
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-14 w-[380px] z-50 transform origin-top-right"
                    >
                        <div className="bg-white rounded-[24px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden ring-1 ring-black/5">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        disabled={loading}
                                        className="text-[10px] font-bold text-gray-400 hover:text-[#FF1744] uppercase tracking-widest transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
                                        <Bell className="mb-3 opacity-20" size={40} />
                                        <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                onClick={() => markAsRead(notification._id, notification.link)}
                                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative ${!notification.isRead ? 'bg-red-50/30' : ''}`}
                                            >
                                                {!notification.isRead && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF1744] opacity-50" />
                                                )}
                                                <div className="flex gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 ${!notification.isRead ? 'bg-white' : 'bg-gray-50'}`}>
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className={`text-sm font-bold leading-none ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider pt-1">
                                                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
