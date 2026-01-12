import { Response } from 'express';
import Message from '../models/Message';
import { AuthRequest } from '../middlewares/auth';

// @desc    Get messages for a specific request/mission
// @route   GET /api/messages/:requestId
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;

        const messages = await Message.find({ request: requestId })
            .populate('sender', 'name profileImage role')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get messages for a specific connection
// @route   GET /api/messages/connection/:connectionId
// @access  Private
export const getConnectionMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { connectionId } = req.params;

        const messages = await Message.find({ connection: connectionId })
            .populate('sender', 'name profileImage role facilityName')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
