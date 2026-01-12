import mongoose, { Schema, Document } from 'mongoose';

export interface IChatConnection extends Document {
    participants: mongoose.Types.ObjectId[];
    sender: mongoose.Types.ObjectId;
    request: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt: Date;
}

const ChatConnectionSchema: Schema = new Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    lastMessage: {
        type: String,
        trim: true
    },
    lastMessageAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Ensure only one connection exists between two people for a specific request
ChatConnectionSchema.index({ participants: 1, request: 1 }, { unique: true });

export default mongoose.model<IChatConnection>('ChatConnection', ChatConnectionSchema);
