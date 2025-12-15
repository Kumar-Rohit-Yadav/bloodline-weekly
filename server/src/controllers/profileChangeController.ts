import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import ProfileChangeRequest from '../models/ProfileChangeRequest';
import User from '../models/User';

// @desc    Get all profile change requests (Admin only)
// @route   GET /api/admin/profile-change-requests
// @access  Private/Admin
export const getProfileChangeRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await ProfileChangeRequest.find()
            .populate('hospitalId', 'name email facilityName profileImage isVerified')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Review profile change request (approve/reject)
// @route   POST /api/admin/profile-change-requests/:id/review
// @access  Private/Admin
export const reviewProfileChangeRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { action, adminNotes } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be "approve" or "reject"'
            });
        }

        const changeRequest = await ProfileChangeRequest.findById(id).populate('hospitalId');
        if (!changeRequest) {
            return res.status(404).json({
                success: false,
                error: 'Profile change request not found'
            });
        }

        if (changeRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'This request has already been reviewed'
            });
        }

        // Update request status
        changeRequest.status = action === 'approve' ? 'approved' : 'rejected';
        changeRequest.adminNotes = adminNotes;
        changeRequest.reviewedAt = new Date();
        changeRequest.reviewedBy = req.user?._id;
        await changeRequest.save();

        // If approved, apply the changes to the hospital profile
        if (action === 'approve') {
            const updateData: any = {};

            if (changeRequest.requestedChanges.profileImage) {
                updateData.profileImage = changeRequest.requestedChanges.profileImage;
            }
            if (changeRequest.requestedChanges.facilityName) {
                updateData.facilityName = changeRequest.requestedChanges.facilityName;
            }
            if (changeRequest.requestedChanges.address || changeRequest.requestedChanges.coordinates) {
                updateData.location = {
                    type: 'Point',
                    coordinates: changeRequest.requestedChanges.coordinates || changeRequest.currentData.coordinates,
                    address: changeRequest.requestedChanges.address || changeRequest.currentData.address
                };
            }

            await User.findByIdAndUpdate(
                changeRequest.hospitalId,
                { $set: updateData },
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: `Profile change request ${action}d successfully`,
            data: changeRequest
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get profile change requests for current hospital
// @route   GET /api/auth/my-profile-change-requests
// @access  Private (Hospital only)
export const getMyProfileChangeRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await ProfileChangeRequest.find({ hospitalId: req.user?._id })
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
