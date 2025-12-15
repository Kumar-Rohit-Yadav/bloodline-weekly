import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileChangeRequest extends Document {
    hospitalId: mongoose.Types.ObjectId;
    requestType: 'profile_update';
    status: 'pending' | 'approved' | 'rejected';
    requestedChanges: {
        profileImage?: string;
        facilityName?: string;
        address?: string;
        coordinates?: [number, number];
    };
    currentData: {
        profileImage?: string;
        facilityName?: string;
        address?: string;
        coordinates?: [number, number];
    };
    reason?: string;
    adminNotes?: string;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
}

const ProfileChangeRequestSchema = new Schema<IProfileChangeRequest>({
    hospitalId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestType: {
        type: String,
        enum: ['profile_update'],
        default: 'profile_update'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestedChanges: {
        profileImage: String,
        facilityName: String,
        address: String,
        coordinates: [Number]
    },
    currentData: {
        profileImage: String,
        facilityName: String,
        address: String,
        coordinates: [Number]
    },
    reason: String,
    adminNotes: String,
    reviewedAt: Date,
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.model<IProfileChangeRequest>('ProfileChangeRequest', ProfileChangeRequestSchema);
