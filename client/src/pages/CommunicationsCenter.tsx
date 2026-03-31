import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    Search, MessageSquare, Send, X, MoreVertical,
    Calendar, MapPin, Droplet, ShieldCheck,
    ArrowLeft, Loader2, User, Building2,
    CheckCircle2, Clock, Inbox, Filter
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/config/api";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Connection {
    _id: string;
    participants: any[];
    request: any;
    status: string;
    lastMessage?: string;
    lastMessageAt?: string;
    createdAt: string;
    updatedAt: string;
}

export default function CommunicationsCenter() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const formatDate = (date: string | Date, formatStr: string = 'p') => {
        const d = new Date(date);
        if (formatStr === 'p') {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (formatStr === 'PPPP') {
            return d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        return d.toLocaleDateString();
    };

    const fetchConnections = async () => {
        try {
            const [connRes, pendingRes] = await Promise.all([
                api.get('/connections'),
                api.get('/connections/pending')
            ]);
            setConnections(connRes.data.data);
            setPendingRequests(pendingRes.data.data);
        } catch (error) {
            console.error("Failed to fetch connection data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (connectionId: string) => {
        setMessagesLoading(true);
        try {
            const res = await api.get(`/messages/connection/${connectionId}`);
            setMessages(res.data.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setMessagesLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    useEffect(() => {
        if (selectedConnection) {
            fetchMessages(selectedConnection._id);
            socket?.emit('join_room', selectedConnection._id);
        }

        return () => {
            if (selectedConnection) {
                socket?.emit('leave_room', selectedConnection._id);
            }
        }
    }, [selectedConnection, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            console.log("[CHAT] 📩 New Message Event Received via Socket:", msg);
            
            const currentConnId = selectedConnection?._id?.toString();
            const msgConnId = (msg.connection?._id || msg.connection)?.toString();

            console.log(`[CHAT] Check matching room: Incoming(${msgConnId}) === Current(${currentConnId})`);

            if (msgConnId === currentConnId) {
                console.log("[CHAT] ✅ Room match! Updating messages list.");
                setMessages(prev => {
                    // Check if message already exists (either by real ID or by content+sender+recent for optimistic ones)
                    const exists = prev.find(m =>
                        m._id === msg._id ||
                        (m.sender?._id === msg.sender?._id && m.content === msg.content && typeof m._id === 'string' && m._id.startsWith('0.'))
                    );
                    if (exists) {
                        console.log("[CHAT] 🔄 Replacing optimistic message with real DB record.");
                        return prev.map(m => (m.content === msg.content && typeof m._id === 'string' && m._id.startsWith('0.')) ? msg : m);
                    }
                    return [...prev, msg];
                });
            } else {
                console.warn("[CHAT] ⚠️ Room mismatch. Ignoring message.");
            }
            // Update last message in connections list
            setConnections(prev => prev.map(conn =>
                conn._id === msg.connection
                    ? { ...conn, lastMessage: msg.content, lastMessageAt: msg.createdAt }
                    : conn
            ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()));
        };

        socket.on('new_message', handleNewMessage);

        socket.on('connection_requested', (data: any) => {
            setPendingRequests(prev => [...prev, data]);
            toast.info(`New connection request from ${data.sender.name}`);
        });

        socket.on('connection_accepted', (data: any) => {
            fetchConnections();
            toast.success(`${data.acceptedBy} accepted your connection request!`);
        });

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('connection_requested');
            socket.off('connection_accepted');
        };
    }, [socket, selectedConnection]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("[CHAT] 📤 Attempting to send message...");

        if (!newMessage.trim()) return;
        if (!selectedConnection) { console.error("[CHAT] ❌ No connection selected!"); return; }
        if (!socket) { console.error("[CHAT] ❌ Socket not initialized!"); return; }
        if (!user) { console.error("[CHAT] ❌ User not authenticated!"); return; }

        const msgData = {
            connectionId: selectedConnection._id,
            requestId: selectedConnection.request?._id || selectedConnection.request,
            content: newMessage,
            sender: {
                _id: user?._id || user?.id,
                name: user?.name,
                profileImage: user?.profileImage,
                role: user?.role,
                facilityName: user?.facilityName
            }
        };

        console.log("[CHAT] 📡 Emitting 'send_message' with data:", msgData);
        socket.emit('send_message', msgData);

        // Add locally
        setMessages(prev => [...prev, {
            ...msgData,
            _id: Math.random().toString(),
            createdAt: new Date().toISOString(),
            sender: msgData.sender
        }]);

        setNewMessage("");
    };

    const handleAcceptRequest = async (connId: string) => {
        try {
            await api.put(`/connections/${connId}`, { status: 'accepted' });
            toast.success("Connection accepted!");
            fetchConnections();
        } catch (error) {
            toast.error("Failed to accept connection");
        }
    };

    const handleDeleteConnection = async (id: string) => {
        if (!window.confirm("Remove this connection? Chat history will be permanently lost for both participants.")) return;
        try {
            await api.delete(`/connections/${id}`);
            toast.success("Connection removed.");
            setSelectedConnection(null);
            fetchConnections();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to remove connection");
        }
    };

    const getOtherParticipant = (conn: Connection) => {
        if (!conn || !conn.participants) return null;

        const myId = (user?._id || user?.id)?.toString();
        const other = conn.participants.find(p => {
            const pid = (p._id || p.id)?.toString();
            return pid !== myId;
        });

        return other;
    };

    const filteredConnections = connections.filter(conn => {
        const other = getOtherParticipant(conn);
        const nameMatch = (other?.facilityName || other?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        // Also check if user search for the requester name if the "other" is Nobel
        const requestMatch = (conn.request?.bloodType || "").toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || requestMatch;
    });

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar: Connection List */}
            <div className={cn(
                "w-full md:w-[400px] bg-white border-r border-gray-100 flex flex-col transition-all",
                selectedConnection ? "hidden md:flex" : "flex"
            )}>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                                <ArrowLeft size={20} className="text-gray-400" />
                            </Link>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Inbox</h1>
                        </div>
                        <div className="flex gap-2">
                            {pendingRequests.length > 0 && (
                                <div className="px-3 py-1 bg-red-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                    {pendingRequests.length} New
                                </div>
                            )}
                            <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                                <Inbox size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search missions or contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-red-500/5 transition-all outline-none text-gray-900 placeholder:text-gray-300"
                        />
                    </div>

                    {pendingRequests.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connect Requests</p>
                                <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-sm animate-pulse">
                                    {pendingRequests.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {pendingRequests.map(req => (
                                    <motion.div
                                        key={req.connectionId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-5 bg-gradient-to-br from-red-50 to-white rounded-[32px] border border-red-100 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-red-50 flex items-center justify-center overflow-hidden">
                                                {req.sender?.profileImage && req.sender.profileImage !== 'no-photo.jpg' ? (
                                                    <img src={req.sender.profileImage} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="text-red-500"><User size={20} /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate tracking-tight">{req.sender?.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                                                    <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Wants to Connect</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/50 rounded-2xl border border-red-100/50">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Mission Context</p>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
                                                {req.request?.bloodType} Support Request
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleAcceptRequest(req.connectionId)}
                                                className="flex-1 h-12 bg-gray-900 hover:bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-gray-200"
                                            >
                                                Accept Mission
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setPendingRequests(prev => prev.filter(p => p.connectionId !== req.connectionId))}
                                                className="w-12 h-12 p-0 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl border border-gray-100 transition-all"
                                            >
                                                <X size={18} />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 no-scrollbar">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-red-500" size={32} />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading Inbox...</p>
                        </div>
                    ) : filteredConnections.length === 0 ? (
                        <div className="py-20 text-center space-y-4 px-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 mx-auto">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-sm font-bold text-gray-400">No mission chats found. Connect with someone to get started.</p>
                        </div>
                    ) : (
                        filteredConnections.map((conn) => {
                            const other = getOtherParticipant(conn);
                            const isActive = selectedConnection?._id === conn._id;

                            return (
                                <button
                                    key={conn._id}
                                    onClick={() => setSelectedConnection(conn)}
                                    className={cn(
                                        "w-full p-5 rounded-[32px] flex items-center gap-4 transition-all group",
                                        isActive
                                            ? "bg-gray-900 text-white shadow-2xl shadow-gray-200 scale-[1.02]"
                                            : "hover:bg-gray-50 text-gray-900"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black overflow-hidden ring-4 transition-all",
                                            isActive ? "ring-white/10" : "bg-gray-50 ring-transparent group-hover:ring-gray-100"
                                        )}>
                                            {other?.profileImage && other.profileImage !== 'no-photo.jpg' ? (
                                                <img src={other.profileImage} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                other?.role === 'hospital' ? <Building2 /> : <User />
                                            )}
                                        </div>
                                        {other?.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                <VerifiedBadge size={14} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-black text-sm truncate tracking-tight">
                                                {other?.role === 'hospital' ? (other?.facilityName || other?.name) : other?.name}
                                            </h4>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest shrink-0",
                                                isActive ? "text-white/40" : "text-gray-300"
                                            )}>
                                                {conn.lastMessageAt ? formatDate(conn.lastMessageAt) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                                isActive ? "bg-white/10 text-white/60" : "bg-red-50 text-red-500"
                                            )}>
                                                {conn.request?.bloodType} Mission
                                            </span>
                                            <p className={cn(
                                                "text-[11px] font-bold truncate flex-1",
                                                isActive ? "text-white/60" : "text-gray-400"
                                            )}>
                                                {conn.lastMessage || "Start the coordination..."}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Content: Chat View */}
            <div className={cn(
                "flex-1 flex flex-col bg-white transition-all",
                !selectedConnection ? "hidden md:flex" : "flex"
            )}>
                {selectedConnection ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-24 px-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedConnection(null)}
                                    className="md:hidden p-3 bg-gray-50 rounded-2xl text-gray-400"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 font-black overflow-hidden shadow-sm">
                                        {getOtherParticipant(selectedConnection)?.profileImage && getOtherParticipant(selectedConnection)?.profileImage !== 'no-photo.jpg' ? (
                                            <img src={getOtherParticipant(selectedConnection)?.profileImage} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            getOtherParticipant(selectedConnection)?.role === 'hospital' ? <Building2 size={20} /> : <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-gray-900 tracking-tight">
                                                {getOtherParticipant(selectedConnection)?.role === 'hospital'
                                                    ? (getOtherParticipant(selectedConnection)?.facilityName || getOtherParticipant(selectedConnection)?.name)
                                                    : getOtherParticipant(selectedConnection)?.name}
                                            </h3>
                                            {getOtherParticipant(selectedConnection)?.isVerified && <VerifiedBadge size={16} />}
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            Active Coordination
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#FF1744] shadow-sm font-black text-xs">
                                        {selectedConnection.request?.bloodType}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Reference Mission</p>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
                                            {selectedConnection.request?.units} Units Required
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteConnection(selectedConnection._id)}
                                    className="p-4 hover:bg-red-50 rounded-2xl transition-colors text-gray-400 hover:text-red-500 group"
                                    title="Remove Connection"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/30">
                            {messagesLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="animate-spin text-red-500" size={32} />
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Securely loading history...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col items-center justify-center space-y-4 mb-20">
                                        <div className="p-4 bg-white rounded-full shadow-sm border border-gray-100 flex items-center gap-3">
                                            <ShieldCheck className="text-green-500" size={16} />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End-to-End Secure Coordination</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center max-w-xs leading-loose">
                                            This mission channel was opened on {formatDate(selectedConnection.createdAt, 'PPPP')} to coordinate the {selectedConnection.request?.bloodType} donation.
                                        </p>
                                    </div>

                                    {messages.map((msg, idx) => {
                                        const myId = (user?._id || user?.id)?.toString();
                                        const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
                                        const isMe = senderId === myId || msg.sender === 'me';
                                        return (
                                            <div
                                                key={msg._id || idx}
                                                className={cn(
                                                    "flex gap-4 group",
                                                    isMe ? "flex-row-reverse" : "flex-row"
                                                )}
                                            >
                                                {/* Message Avatar */}
                                                {!isMe && (
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center font-black text-[10px] text-gray-300">
                                                        {msg.sender?.profileImage && msg.sender.profileImage !== 'no-photo.jpg' ? (
                                                            <img src={msg.sender.profileImage} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            msg.sender?.role === 'hospital' ? <Building2 size={16} /> : <User size={16} />
                                                        )}
                                                    </div>
                                                )}

                                                <div className={cn(
                                                    "flex flex-col space-y-2 max-w-[70%]",
                                                    isMe ? "items-end" : "items-start"
                                                )}>
                                                    <div className={cn(
                                                        "p-6 text-sm font-bold shadow-xl leading-relaxed transition-all",
                                                        isMe
                                                            ? "bg-gray-900 text-white rounded-[32px] rounded-tr-none"
                                                            : "bg-white text-gray-700 rounded-[32px] rounded-tl-none border border-gray-100"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2">
                                                        {!isMe && (
                                                            <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">
                                                                {msg.sender?.role === 'hospital'
                                                                    ? (msg.sender?.facilityName || msg.sender?.name)
                                                                    : msg.sender?.name}
                                                            </span>
                                                        )}
                                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                                                            {formatDate(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={scrollRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-8 border-t border-gray-100 bg-white">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-center gap-4 bg-gray-50 p-2 rounded-[32px] border-2 border-transparent focus-within:border-red-500/10 focus-within:bg-white transition-all shadow-inner"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a professional message..."
                                    className="flex-1 h-14 bg-transparent border-none px-6 text-sm font-bold focus:ring-0 outline-none text-gray-900"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-14 w-14 p-0 bg-[#FF1744] hover:bg-black text-white rounded-[24px] shadow-xl shadow-red-100 transition-all active:scale-95 shrink-0"
                                >
                                    <Send size={20} />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/30">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#FF1744]/10 blur-3xl animate-pulse rounded-full" />
                            <div className="relative w-32 h-32 bg-white rounded-[48px] shadow-2xl flex items-center justify-center text-[#FF1744] border-4 border-white">
                                <MessageSquare size={56} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Communication Hub</h2>
                            <p className="text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">
                                Select a mission channel from the left to start coordinating with donors and hospitals securely.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <ShieldCheck className="text-green-500" size={18} />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">End-to-End Encrypted</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


// Removed duplicate export
