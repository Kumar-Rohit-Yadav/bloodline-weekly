import mongoose, { Document, Schema } from 'mongoose';

export interface IVerifiedHospital extends Document {
    name: string;
    address: string;
    location: {
        type: 'Point';
        coordinates: number[];
    };
    category: 'Government' | 'Private' | 'Community';
    contact: string;
}

const verifiedHospitalSchema: Schema<IVerifiedHospital> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a hospital name'],
        unique: true
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    category: {
        type: String,
        enum: ['Government', 'Private', 'Community'],
        default: 'Private'
    },
    contact: String
}, {
    timestamps: true
});

export default mongoose.model<IVerifiedHospital>('VerifiedHospital', verifiedHospitalSchema);
