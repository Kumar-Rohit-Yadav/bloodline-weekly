import { Request, Response } from 'express';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req: any, res: Response) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20 notifications

        // Count unread
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req: any, res: Response) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        // Make sure user owns notification
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized'
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllRead = async (req: any, res: Response) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// HELPER: Create Notification (Internal Use)
export const createNotification = async (
    recipientId: mongoose.Types.ObjectId | string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    link?: string,
    senderId?: mongoose.Types.ObjectId | string
) => {
    try {
        await Notification.create({
            recipient: recipientId,
            sender: senderId,
            title,
            message,
            type,
            relatedId,
            link
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
