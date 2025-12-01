import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'donor' | 'receiver' | 'hospital' | 'admin';
    bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
    isVerified: boolean;
    isEmailVerified: boolean;
    profileImage: string;
    location?: {
        type: 'Point';
        coordinates: number[];
        address?: string;
    };
    inventory?: Array<{
        bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
        units: number;
        status: 'Critical' | 'Low' | 'Normal' | 'High';
    }>;
    verificationImage?: string;
    facilityName?: string;
    facilityAddress?: string;
    medicalNotes?: string;
    lastDonationDate?: Date;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
    createdAt: Date;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [4, 'Password must be at least 4 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['donor', 'receiver', 'hospital', 'admin'],
        default: 'donor'
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
        default: 'unknown'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String,
        default: 'no-photo.jpg'
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        },
        address: String
    },
    inventory: [{
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        },
        units: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['Critical', 'Low', 'Normal', 'High'],
            default: 'Normal'
        }
    }],
    verificationImage: String,
    facilityName: String,
    facilityAddress: String,
    medicalNotes: {
        type: String,
        default: ''
    },
    lastDonationDate: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    return resetToken;
};

// Geospatial index for nearby donor matching
userSchema.index({ location: '2dsphere' });

export default mongoose.model<IUser>('User', userSchema);
