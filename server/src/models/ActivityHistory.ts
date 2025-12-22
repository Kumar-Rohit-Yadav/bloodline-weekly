import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityHistory extends Document {
    user: mongoose.Types.ObjectId; // The owner of this history record
    type: 'donation' | 'received' | 'receipt' | 'facilitation' | 'request_fulfilled' | 'verification';
    roleAtTime: string;
    description: string;
    linkedRequest?: mongoose.Types.ObjectId;
    linkedUser?: mongoose.Types.ObjectId; // Matching party
    bloodType?: string;
    units?: number;
    facilityName?: string;
    createdAt: Date;
}

const ActivityHistorySchema: Schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['donation', 'received', 'receipt', 'facilitation', 'verification', 'request_fulfilled'],
        required: true
    },
    roleAtTime: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    linkedRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest'
    },
    linkedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bloodType: String,
    units: Number,
    facilityName: String
}, {
    timestamps: true
});

ActivityHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IActivityHistory>('ActivityHistory', ActivityHistorySchema);
