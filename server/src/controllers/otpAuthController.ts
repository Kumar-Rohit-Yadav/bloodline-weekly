import { Request, Response } from 'express';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendOTPEmail } from '../utils/sendEmail';
import jwt from 'jsonwebtoken';

// Generate 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Request OTP for signup
// @route   POST /api/auth/request-signup-otp
// @access  Public
export const requestSignupOTP = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide name, email, and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Calculate expiry time
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email, purpose: 'signup' });

        // Store OTP with user data in database
        await OTP.create({
            email,
            otp,
            purpose: 'signup',
            userData: {
                name,
                password, // Will be hashed when user is created
                role: role || 'donor'
            },
            expiresAt
        });

        // Send OTP email
        await sendOTPEmail(email, otp, 'signup');

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            expiresIn: expiryMinutes
        });
    } catch (error: any) {
        console.error('Error in requestSignupOTP:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send OTP'
        });
    }
};

// @desc    Verify OTP and complete signup
// @route   POST /api/auth/verify-signup-otp
// @access  Public
export const verifySignupOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and OTP'
            });
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email,
            otp,
            purpose: 'signup',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired OTP'
            });
        }

        // Create user with the stored data
        const user = await User.create({
            name: otpRecord.userData?.name,
            email: otpRecord.email,
            password: otpRecord.userData?.password,
            role: otpRecord.userData?.role || 'donor',
            isEmailVerified: true
        });

        // Delete the OTP record
        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
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
            .status(201)
            .cookie('token', token, options)
            .json({
                success: true,
                message: 'Registration successful!',
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
    } catch (error: any) {
        console.error('Error in verifySignupOTP:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify OTP'
        });
    }
};

// @desc    Request OTP for login
// @route   POST /api/auth/request-login-otp
// @access  Public
export const requestLoginOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'No account found with this email'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Calculate expiry time
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email, purpose: 'login' });

        // Store OTP in database
        await OTP.create({
            email,
            otp,
            purpose: 'login',
            expiresAt
        });

        // Send OTP email
        await sendOTPEmail(email, otp, 'login');

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to login.',
            expiresIn: expiryMinutes
        });
    } catch (error: any) {
        console.error('Error in requestLoginOTP:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send OTP'
        });
    }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-login-otp
// @access  Public
export const verifyLoginOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and OTP'
            });
        }

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email,
            otp,
            purpose: 'login',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired OTP'
            });
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update email verification if not already verified
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            await user.save({ validateBeforeSave: false });
        }

        // Delete the OTP record
        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
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
            .status(200)
            .cookie('token', token, options)
            .json({
                success: true,
                message: 'Login successful!',
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
    } catch (error: any) {
        console.error('Error in verifyLoginOTP:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify OTP'
        });
    }
};
