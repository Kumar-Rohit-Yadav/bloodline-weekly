import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import ChatConnection from '../models/ChatConnection';
import BloodRequest from '../models/BloodRequest';
import User from '../models/User';
import { createNotification } from './notificationController';
import { getIO } from '../socket';

// @desc    Send a connection request
// @route   POST /api/connections
// @access  Private
export const sendConnectionRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { receiverId, requestId } = req.body;
        const senderId = req.user?._id;

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, error: "Cannot connect with yourself" });
        }

        // Check if connection already exists
        const existing = await ChatConnection.findOne({
            participants: { $all: [senderId, receiverId] },
            request: requestId
        });

        if (existing) {
            return res.status(400).json({ success: false, error: "Connection already exists or pending" });
        }

        const connection = await ChatConnection.create({
            participants: [senderId, receiverId],
            sender: senderId,
            request: requestId,
            status: 'pending'
        });

        // Notify Receiver
        const sender = await User.findById(senderId);
        await createNotification(
            receiverId,
            'CONNECTION_REQUEST',
            `${sender?.name} wants to connect regarding a donation request.`,
            'MESSAGE_ALERT',
            requestId.toString(), // relatedId
            '/dashboard/messages'  // link
        );

        // Real-time notification via socket
        const bloodRequest = await BloodRequest.findById(requestId).select('bloodType');
        const io = getIO();
        io.to(receiverId.toString()).emit('connection_requested', {
            connectionId: connection._id,
            sender: { _id: sender?._id, name: sender?.name, profileImage: sender?.profileImage },
            request: { _id: requestId, bloodType: bloodRequest?.bloodType }
        });

        res.status(201).json({ success: true, data: connection });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Respond to connection request (Accept/Reject)
// @route   PUT /api/connections/:id
// @access  Private
export const respondToConnection = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'
        const { id } = req.params;
        const userId = req.user?._id;

        const connection = await ChatConnection.findById(id);
        if (!connection) {
            return res.status(404).json({ success: false, error: "Connection not found" });
        }

        // Only the receiver of the request should be able to accept/reject
        // The receiver is the one who didn't create the record, or we just check if userId is in participants
        // More strictly: we could track 'targetUser' in model, but for now participants is fine
        if (!connection.participants.map(p => p.toString()).includes(userId.toString())) {
            return res.status(403).json({ success: false, error: "Not authorized" });
        }

        connection.status = status;
        await connection.save();

        if (status === 'accepted') {
            const otherParticipantId = connection.participants.find(p => p.toString() !== userId.toString());
            const user = await User.findById(userId);

            await createNotification(
                otherParticipantId as any,
                'CONNECTION_ACCEPTED',
                `${user?.name} accepted your connection request. You can now chat!`,
                'SUCCESS',
                connection._id.toString(), // relatedId
                '/dashboard/messages'      // link
            );

            // Real-time socket event
            const io = getIO();
            io.to(otherParticipantId!.toString()).emit('connection_accepted', {
                connectionId: connection._id,
                acceptedBy: user?.name
            });
        }

        res.status(200).json({ success: true, data: connection });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get my chat connections
// @route   GET /api/connections
// @access  Private
export const getMyConnections = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        const connections = await ChatConnection.find({
            participants: userId,
            status: 'accepted'
        })
            .populate('participants', 'name profileImage role facilityName isVerified')
            .populate('request', 'bloodType status units location hospitalName')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: connections });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get pending connection requests for current user
// @route   GET /api/connections/pending
// @access  Private
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        const connections = await ChatConnection.find({
            participants: userId,
            sender: { $ne: userId },
            status: 'pending'
        })
            .populate('participants', 'name profileImage role facilityName isVerified')
            .populate('request', 'bloodType status units location hospitalName')
            .sort({ createdAt: -1 });

        // Transform for easier frontend use (find who sent it)
        const transformed = connections.map(conn => {
            const sender = conn.participants.find(p => p._id.toString() !== userId.toString());
            return {
                connectionId: conn._id,
                sender,
                request: conn.request,
                createdAt: conn.createdAt
            };
        });

        res.status(200).json({ success: true, data: transformed });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete a connection (mis-click cleanup)
// @route   DELETE /api/connections/:id
// @access  Private
export const deleteConnection = async (req: AuthRequest, res: Response) => {
    try {
        const connection = await ChatConnection.findById(req.params.id);

        if (!connection) {
            return res.status(404).json({ success: false, error: "Connection not found" });
        }

        const userId = req.user?._id;

        // Either participant can remove it
        if (!connection.participants.map(p => p.toString()).includes(userId.toString())) {
            return res.status(403).json({ success: false, error: "Not authorized" });
        }

        await connection.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
