import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import Message from './models/Message';
import BloodRequest from './models/BloodRequest';
import { createNotification } from './controllers/notificationController';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`[SOCKET] 🟢 New Connection Attempt: ${socket.id}`.cyan);

        // Join a specific room (Mission or Direct Connection)
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`[SOCKET] 🚪 User ${socket.id} joined Room: ${roomId}`.green);
        });

        // Handle Chat Message
        socket.on('send_message', async (data) => {
            const { requestId, connectionId, content, sender } = data;
            const targetRoom = connectionId || requestId;
            
            console.log(`[SOCKET] 📤 Message Sending...`);
            console.log(`   - FROM: ${sender?.name} (ID: ${sender?._id || sender?.id})`);
            console.log(`   - ROOM: ${targetRoom}`);
            console.log(`   - CONTENT: "${content?.substring(0, 50)}..."`);

            try {
                const messageData: any = {
                    request: requestId,
                    sender: sender._id || sender.id,
                    content
                };

                if (connectionId) {
                    messageData.connection = connectionId;
                }

                const newMessage = await Message.create(messageData);
                console.log(`[SOCKET] ✅ Message saved to DB (ID: ${newMessage._id})`);

                // If it's a direct connection, update the connection metadata
                if (connectionId) {
                    try {
                        const ChatConnection = (await import('./models/ChatConnection')).default;
                        await ChatConnection.findByIdAndUpdate(connectionId, {
                            lastMessage: content,
                            lastMessageAt: new Date()
                        });
                        console.log(`[SOCKET] 🔄 Updated ChatConnection lastMessage`);
                    } catch (e) {
                        console.error("[SOCKET] ❌ Error updating ChatConnection:", e);
                    }
                }

                // Broadcast to the room (Either requestId or connectionId)
                const payload = {
                    ...newMessage.toObject(),
                    sender: {
                        _id: sender._id || sender.id,
                        name: sender.name,
                        profileImage: sender.profileImage,
                        role: sender.role,
                        facilityName: sender.facilityName
                    }
                };

                // Check room participants
                const clients = await io.in(targetRoom).fetchSockets();
                console.log(`[SOCKET] 📢 Broadcasting to ${clients.length} clients in Room: ${targetRoom}`);

                io.to(targetRoom).emit('new_message', payload);

                // NOTIFICATION LOGIC
                // ... (existing logic)
                const BloodRequest = (await import('./models/BloodRequest')).default;
                const request = await BloodRequest.findById(requestId);
                if (request) {
                    const senderId = (sender._id || sender.id)?.toString() || '';
                    const requesterId = request.requester.toString();
                    let recipients: string[] = [];

                    if (senderId === requesterId) {
                        recipients = request.pledges.map(p => p.donor.toString()).filter(id => id !== senderId);
                    } else {
                        if (requesterId !== senderId) recipients.push(requesterId);
                    }
                    const uniqueRecipients = [...new Set(recipients)];
                    for (const recipientId of uniqueRecipients) {
                        await createNotification(
                            recipientId as any,
                            'NEW MESSAGE',
                            `New message from ${sender.name} in mission chat.`,
                            'MESSAGE_ALERT',
                            requestId,
                            '/dashboard/messages'
                        );
                    }
                    console.log(`[SOCKET] 🔔 Notifications sent to ${uniqueRecipients.length} users`);
                }

            } catch (error) {
                console.error("[SOCKET] ❌ Send Error:", error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] 🛑 Disconnected: ${socket.id}`.red);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
