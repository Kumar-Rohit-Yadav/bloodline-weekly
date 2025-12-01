import { Request, Response } from 'express';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendOTPEmail } from '../utils/sendEmail';

// Generate 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Verify OTP and mark email as verified
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        let { email, otp } = req.body;

        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and OTP'
            });
        }

        // Normalize email
        email = email.trim().toLowerCase();
        otp = otp.trim();

        console.log('------------------------------------------------');
        console.log('🔍 VERIFICATION DEBUG:');
        console.log(`📧 Normalized Search Email: '${email}'`);
        console.log(`🔑 Input OTP: '${otp}'`);

        // 1. Check if ANY OTP exists for this email and purpose first
        const anyOtp = await OTP.findOne({ email, purpose: 'signup' });

        console.log(`💾 DB Search Result: ${anyOtp ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
        if (anyOtp) {
            console.log(`   - Stored OTP: ${anyOtp.otp}`);
            console.log(`   - Stored Email: '${anyOtp.email}'`);
            console.log(`   - Expires At: ${anyOtp.expiresAt}`);
            console.log(`   - Current Time: ${new Date()}`);
        }
        console.log('------------------------------------------------');

        if (!anyOtp) {
            return res.status(400).json({
                success: false,
                error: 'No verification code found for this email. Please request a new one.'
            });
        }

        // 2. Check if the code matches
        if (anyOtp.otp !== otp) {
            return res.status(400).json({
                success: false,
                error: 'The verification code you entered is incorrect.'
            });
        }

        // 3. Check for expiration
        if (anyOtp.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'This verification code has expired. Please request a new one.'
            });
        }

        const otpRecord = anyOtp;

        // Find and update the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update email verification status
        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });

        // Delete the OTP record
        await OTP.deleteOne({ _id: otpRecord._id });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error: any) {
        console.error('Error in verifyEmail:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify email'
        });
    }
};

// @desc    Resend OTP for email verification
// @route   POST /api/auth/resend-verification-otp
// @access  Public
export const resendVerificationOTP = async (req: Request, res: Response) => {
    try {
        let { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email'
            });
        }

        // Normalize email
        email = email.trim().toLowerCase();

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email already verified'
            });
        }

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
        console.log('🔄 RESEND OTP DEBUG:');
        console.log(`📧 Resend Email (Normalized): '${email}'`);
        console.log(`🔑 Generated OTP: ${otp}`);
        console.log(`💾 OTP Saved to DB with ID: ${otpRecord._id}`);
        console.log('------------------------------------------------');

        // Send OTP email
        await sendOTPEmail(email, otp, 'signup');

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to login.',
            expiresIn: expiryMinutes
        });
    } catch (error: any) {
        console.error('Error in resendVerificationOTP:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send OTP'
        });
    }
};
