import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    request: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    receiver?: mongoose.Types.ObjectId; // Optional for group mission chat
    content: string;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest',
        required: true
    },
    connection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatConnection',
        required: false
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Ensure indexes for fast lookups in a specific request
MessageSchema.index({ request: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
