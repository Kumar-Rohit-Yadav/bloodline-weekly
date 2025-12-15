import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { createNotification } from './notificationController';

// @desc    Update user profile (Blood Group, Location, etc.)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { bloodType, address, coordinates, facilityName, facilityAddress, verificationImage, profileImage, name, medicalNotes, lastDonationDate } = req.body;

        // Fetch current user to check verification status
        const currentUser = await User.findById(req.user?._id);
        if (!currentUser) return res.status(404).json({ success: false, error: 'User not found' });

        const fieldsToUpdate: any = {};

        // Basic Profile Info
        if (name) fieldsToUpdate.name = name;
        if (profileImage) fieldsToUpdate.profileImage = profileImage;
        if (bloodType) fieldsToUpdate.bloodType = bloodType;
        if (medicalNotes !== undefined) fieldsToUpdate.medicalNotes = medicalNotes;
        if (lastDonationDate) fieldsToUpdate.lastDonationDate = lastDonationDate;

        // Facility Protection: Locked for Hospitals who have submitted verification or are already verified
        const isHospitalLocked = currentUser.role === 'hospital' && (currentUser.isVerified || !!currentUser.verificationImage);

        if (isHospitalLocked) {
            const isPendingOnly = !currentUser.isVerified && !!currentUser.verificationImage;

            if (isPendingOnly) {
                return res.status(403).json({
                    success: false,
                    error: 'Profile is locked while verification is pending. Please wait for Admin review.'
                });
            }

            // Check if they are trying to change sensitive data
            const sensitiveChanges = facilityName || address || coordinates || (profileImage && profileImage !== currentUser.profileImage);

            if (sensitiveChanges) {
                // Create a profile change request instead of blocking
                const ProfileChangeRequest = (await import('../models/ProfileChangeRequest')).default;

                const changeRequest = await ProfileChangeRequest.create({
                    hospitalId: currentUser._id,
                    requestType: 'profile_update',
                    status: 'pending',
                    requestedChanges: {
                        profileImage: profileImage || undefined,
                        facilityName: facilityName || undefined,
                        address: address || undefined,
                        coordinates: coordinates || undefined
                    },
                    currentData: {
                        profileImage: currentUser.profileImage,
                        facilityName: currentUser.facilityName,
                        address: currentUser.location?.address,
                        coordinates: currentUser.location?.coordinates as [number, number]
                    },
                    reason: 'Profile update request from verified hospital'
                });

                // NOTIFICATION TRIGGER 4: Profile Change Request
                const admins = await User.find({ role: 'admin' });
                // Use Promise.all to ensure all notifications are sent without blocking response too long
                Promise.all(admins.map(admin =>
                    createNotification(
                        admin._id,
                        'PROFILE UPDATE REQUEST',
                        `${currentUser.name} (Hospital) has requested profile changes. Review needed.`,
                        'PROFILE_UPDATE',
                        changeRequest._id.toString(),
                        '/dashboard'
                    )
                ));

                return res.status(200).json({
                    success: true,
                    message: 'Sensitive changes submitted for Admin review.',
                    requestId: changeRequest._id,
                    isChangeRequestPending: true
                });
            }
        }
        else {
            // Non-verified or other roles can update
            if (facilityName) fieldsToUpdate.facilityName = facilityName;
            if (facilityAddress) fieldsToUpdate.facilityAddress = facilityAddress;
            if (verificationImage) {
                fieldsToUpdate.verificationImage = verificationImage;

                // NOTIFICATION TRIGGER 2A: Verification Submission
                if (currentUser.role === 'hospital') {
                    const admins = await User.find({ role: 'admin' });
                    Promise.all(admins.map(admin =>
                        createNotification(
                            admin._id,
                            'VERIFICATION SUBMISSION',
                            `${currentUser.name} has submitted verification proof.`,
                            'VERIFICATION_ALERT',
                            currentUser._id.toString(),
                            '/dashboard'
                        )
                    ));
                }
            }

            if (address || coordinates) {
                fieldsToUpdate.location = {
                    type: 'Point',
                    coordinates: coordinates || [0, 0],
                    address: address
                };
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            user
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
