import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender?: mongoose.Types.ObjectId;
    type: 'URGENT_REQUEST' | 'VERIFICATION_ALERT' | 'VERIFICATION_SUCCESS' | 'DONATION_COMPLETE' | 'PROFILE_UPDATE' | 'MESSAGE_ALERT';
    title: string;
    message: string;
    relatedId?: string; // ID of Request, User, or Profile
    link?: string;      // Frontend route to redirect to
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['URGENT_REQUEST', 'VERIFICATION_ALERT', 'VERIFICATION_SUCCESS', 'DONATION_COMPLETE', 'PROFILE_UPDATE', 'MESSAGE_ALERT'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: String
    },
    link: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries on recipient and read status
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
