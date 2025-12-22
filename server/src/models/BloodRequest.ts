import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
    requester: mongoose.Types.ObjectId;
    bloodType: string;
    units: number;
    urgency: 'Critical' | 'Urgent' | 'Normal' | 'Low';
    description: string;
    location: {
        type: string;
        coordinates: number[];
        address?: string;
    };
    hospitalName?: string;
    facilityAddress?: string;
    receiverAddress?: string;
    patientName?: string;
    status: 'Open' | 'Matched' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Fulfilled';
    pledges: {
        donor: mongoose.Types.ObjectId;
        status: 'pending' | 'accepted' | 'declined';
        units: number;
        pledgedAt: Date;
    }[];
    collectedUnits: number;
    fulfilledBy?: mongoose.Types.ObjectId[];
    aiReasoning?: string;
    fulfilledAt?: Date;
    verificationToken?: string;
    handoverInitiated?: boolean;
    isPublicDrive?: boolean;
    createdAt: Date;
}

const BloodRequestSchema: Schema = new Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bloodType: {
        type: String,
        required: [true, 'Please specify blood type'],
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    units: {
        type: Number,
        default: 1
    },
    urgency: {
        type: String,
        enum: ['Critical', 'Urgent', 'Normal', 'Low'],
        default: 'Normal'
    },
    description: {
        type: String,
        required: [true, 'Please provide details about the requirement']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number]
        },
        address: String
    },
    hospitalName: String,
    facilityAddress: String,
    receiverAddress: String,
    patientName: String,
    collectedUnits: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Open', 'Matched', 'Scheduled', 'Completed', 'Cancelled', 'Fulfilled'],
        default: 'Open'
    },
    pledges: [{
        donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
        units: { type: Number, default: 1 },
        pledgedAt: { type: Date, default: Date.now }
    }],
    fulfilledBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    fulfilledAt: Date,
    verificationToken: String,
    handoverInitiated: { type: Boolean, default: false },
    isPublicDrive: { type: Boolean, default: false },
    aiReasoning: String
}, {
    timestamps: true
});

// Create geospatial index for the entire location object
BloodRequestSchema.index({ location: '2dsphere' });

export default mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);
