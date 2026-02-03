import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Socket.io should connect to the base URL, not the /api route
        const SOCKET_URL = API_URL.replace('/api', '');
        
        const socketInstance = io(SOCKET_URL, {
            withCredentials: true
        });

        console.log(`[SOCKET] 🔗 Connecting to ${SOCKET_URL}...`);

        socketInstance.on('connect', () => {
            console.log(`[SOCKET] 🟢 Connected! Session ID: ${socketInstance.id}`);
            setIsConnected(true);
        });

        socketInstance.on('emergency_alert', (data: any) => {
            if (user.role === 'donor' && user.bloodType === data.bloodType) {
                toast.error(`CRITICAL: New ${data.bloodType} request within your area!`, {
                    description: `${data.hospitalName} needs help urgently.`,
                    duration: 10000,
                    action: {
                        label: 'View',
                        onClick: () => navigate('/dashboard')
                    }
                });
            }
        });

        socketInstance.on('new_message', (data: any) => {
            toast.info(`New message regarding mission ${data.request.slice(-4)}`);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        const handleMissionFulfilled = (data: any) => {
            if (user.role === 'donor' && user._id === data.donorId) {
                toast.success('Mission fulfilled! Thank you for your donation!');
            }
        };

        socketInstance.on('MISSION_FULFILLED', handleMissionFulfilled);

        setSocket(socketInstance);

        return () => {
            socketInstance.off('MISSION_FULFILLED', handleMissionFulfilled);
            socketInstance.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
