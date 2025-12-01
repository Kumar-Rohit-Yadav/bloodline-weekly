import express from 'express';
import { register, login, getMe, logout, forgotPassword, resetPassword, updatePassword } from '../controllers/authController';
import {
    requestSignupOTP,
    verifySignupOTP,
    requestLoginOTP,
    verifyLoginOTP
} from '../controllers/otpAuthController';
import { verifyEmail, resendVerificationOTP } from '../controllers/verificationController';
import { updateProfile } from '../controllers/profileController';
import { getMyProfileChangeRequests } from '../controllers/profileChangeController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// Traditional auth routes (with OTP verification required)
router.post('/register', register);
router.post('/login', login);

// Email verification endpoints
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-otp', resendVerificationOTP);

// OTP-based authentication routes (alternative flow)
router.post('/request-signup-otp', requestSignupOTP);
router.post('/verify-signup-otp', verifySignupOTP);
router.post('/request-login-otp', requestLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

// Password routes
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/updatepassword', protect, updatePassword);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.put('/profile', protect, updateProfile);
router.get('/my-profile-change-requests', protect, getMyProfileChangeRequests);

export default router;
