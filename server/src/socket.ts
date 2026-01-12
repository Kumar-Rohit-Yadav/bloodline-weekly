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
        // console.log(`Connected: ${socket.id}`.cyan); // Colors might not be available, use standard log

        // Join a specific room (Mission or Direct Connection)
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            // console.log(`User joined room: ${roomId}`);
        });

        // Handle Chat Message
        socket.on('send_message', async (data) => {
            const { requestId, connectionId, content, sender } = data;

            try {
                const messageData: any = {
                    request: requestId,
                    sender: sender._id,
                    content
                };

                if (connectionId) {
                    messageData.connection = connectionId;
                }

                const newMessage = await Message.create(messageData);

                // If it's a direct connection, update the connection metadata
                if (connectionId) {
                    const ChatConnection = (await import('./models/ChatConnection')).default;
                    await ChatConnection.findByIdAndUpdate(connectionId, {
                        lastMessage: content,
                        lastMessageAt: new Date()
                    });
                }

                // Broadcast to the room (Either requestId or connectionId)
                const targetRoom = connectionId || requestId;
                io.to(targetRoom).emit('new_message', {
                    ...newMessage.toObject(),
                    sender: {
                        _id: sender._id,
                        name: sender.name,
                        profileImage: sender.profileImage,
                        role: sender.role,
                        facilityName: sender.facilityName
                    }
                });

                // NOTIFICATION LOGIC
                // ... existing logic remains similar but can be refined for direct connections
                const BloodRequest = (await import('./models/BloodRequest')).default;
                const request = await BloodRequest.findById(requestId);
                if (request) {
                    // Calculate recipients (Sender != User)
                    const senderId = sender._id ? sender._id.toString() : '';
                    const requesterId = request.requester.toString();
                    let recipients: string[] = [];

                    if (senderId === requesterId) {
                        // Sender is Requester -> Notify all Donors who pledged
                        // Filter accepted/pending pledges
                        recipients = request.pledges
                            .map(p => p.donor.toString())
                            .filter(id => id !== senderId); // Safety check
                    } else {
                        // Sender is Donor -> Notify Requester
                        if (requesterId !== senderId) {
                            recipients.push(requesterId);
                        }
                    }

                    // Send notifications
                    // Use Set to avoid duplicates
                    const uniqueRecipients = [...new Set(recipients)];

                    for (const recipientId of uniqueRecipients) {
                        await createNotification(
                            recipientId as any,
                            'NEW MESSAGE',
                            `New message from ${sender.name} in mission chat.`,
                            'MESSAGE_ALERT',
                            requestId,
                            '/dashboard' // Ideally deep link strictly to chat
                        );
                    }
                }

            } catch (error) {
                console.error("Socket Message Error:", error);
            }
        });

        socket.on('disconnect', () => {
            // console.log(`Disconnected: ${socket.id}`.red);
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
