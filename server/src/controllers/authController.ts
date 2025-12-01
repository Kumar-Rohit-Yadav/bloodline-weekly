import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import OTP from '../models/OTP';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/sendEmail';

// Generate 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { name, email, password, role, facilityName, facilityAddress } = req.body;

        // Normalize email
        email = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Create user with isEmailVerified = false
        const user = await User.create({
            name,
            email,
            password,
            role,
            facilityName,
            facilityAddress,
            isEmailVerified: false
        });

        // Generate OTP
        const otp = generateOTP();

        // Calculate expiry time
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email, purpose: 'signup' });

        // Store OTP in database
        const otpRecord = await OTP.create({
            email,
            otp,
            purpose: 'signup',
            expiresAt
        });

        console.log('------------------------------------------------');
        console.log('📝 REGISTRATION DEBUG:');
        console.log(`📧 Input Email (Normalized): '${email}'`);
        console.log(`🔑 Generated OTP: ${otp}`);
        console.log(`💾 OTP Saved to DB with ID: ${otpRecord._id}`);
        console.log(`⏰ OTP Expires At: ${expiresAt}`);
        console.log('------------------------------------------------');

        // Send OTP email
        await sendOTPEmail(email, otp, 'signup');

        res.status(201).json({
            success: true,
            message: 'Account created! OTP sent to your email. Please verify to login.',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                isEmailVerified: user.isEmailVerified
            },
            expiresIn: expiryMinutes
        });
    } catch (error: any) {
        console.error('❌ REGISTRATION ERROR:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { email, password } = req.body;

        // Normalize email if provided
        if (email) email = email.toLowerCase();

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your email before logging in. Check your email for the OTP verification link.',
                needsVerification: true
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
        expiresIn: '30d'
    });

    const options: {
        expires: Date;
        httpOnly: boolean;
        secure?: boolean;
    } = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                bloodType: user.bloodType,
                isVerified: user.isVerified,
                isEmailVerified: user.isEmailVerified,
                profileImage: user.profileImage,
                location: user.location,
                facilityName: user.facilityName,
                facilityAddress: user.facilityAddress,
                verificationImage: user.verificationImage
            }
        });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ success: false, error: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, resetUrl);

            res.status(200).json({ success: true, message: 'Email sent' });
        } catch (err) {
            console.error('Email send error:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ success: false, error: 'Email could not be sent' });
        }
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken as string)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Check current password
        const isMatch = await user.matchPassword(req.body.currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Password is incorrect' });
        }

        user.password = req.body.newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};
