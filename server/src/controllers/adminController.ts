import { Request, Response } from 'express';
import User from '../models/User';
import BloodRequest from '../models/BloodRequest';
import { createNotification } from './notificationController';

// @desc    Get all users with basic info
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle user verification (hospitals only)
// @route   PUT /api/admin/verify/:id
// @access  Private/Admin
export const verifyUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Only hospitals can be verified
        if (user.role !== 'hospital') {
            return res.status(400).json({
                success: false,
                error: 'Only hospitals can be verified. Donors and receivers do not require verification.'
            });
        }

        user.isVerified = !user.isVerified;
        await user.save();

        // NOTIFICATION TRIGGER 2: Verification Success
        if (user.isVerified) {
            await createNotification(
                user._id,
                'VERIFICATION APPROVED',
                'Your hospital verification has been approved! You now have the verified badge.',
                'VERIFICATION_SUCCESS',
                user._id.toString(),
                '/dashboard/profile' // Link to profile to see blue tick
            );
        }

        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update any user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-password');

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete any user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Also delete their blood requests
        await BloodRequest.deleteMany({ requester: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all blood requests
// @route   GET /api/admin/requests
// @access  Private/Admin
export const getAllRequests = async (req: Request, res: Response) => {
    try {
        const requests = await BloodRequest.find().populate('requester', 'name email');
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete any blood request
// @route   DELETE /api/admin/requests/:id
// @access  Private/Admin
export const deleteRequest = async (req: Request, res: Response) => {
    try {
        const request = await BloodRequest.findByIdAndDelete(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getPlatformStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalHospitals = await User.countDocuments({ role: 'hospital' });
        const totalDonors = await User.countDocuments({ role: 'donor' });

        // Mission Stats
        const totalRequests = await BloodRequest.countDocuments();
        const fulfilledRequests = await BloodRequest.countDocuments({ status: 'Fulfilled' });
        const liveRequestsCount = await BloodRequest.countDocuments({ status: { $in: ['Open', 'Matched'] } });

        // Calculate Fulfillment Rate
        const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 0;

        // Request Status Distribution
        const statusStats = await BloodRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Blood type distribution (Demand vs Supply) - ONLY for Active Missions
        const demandStats = await BloodRequest.aggregate([
            { $match: { status: { $in: ['Open', 'Matched'] } } },
            {
                $group: {
                    _id: '$bloodType',
                    requested: { $sum: '$units' },
                    collected: { $sum: '$collectedUnits' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Activity metrics: Recent requests (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRequests = await BloodRequest.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const recentFulfilled = await BloodRequest.countDocuments({
            status: 'Fulfilled',
            updatedAt: { $gte: thirtyDaysAgo }
        });

        // Top Hospitals (by contribution - completed missions)
        const topPerformers = await BloodRequest.aggregate([
            { $match: { status: 'Fulfilled' } },
            { $group: { _id: '$requester', missionsDone: { $sum: 1 } } },
            { $sort: { missionsDone: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'hospital'
                }
            },
            { $unwind: '$hospital' },
            {
                $project: {
                    facilityName: '$hospital.facilityName',
                    name: '$hospital.name',
                    missionsDone: 1,
                    isVerified: '$hospital.isVerified'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalHospitals,
                    totalDonors,
                    totalRequests,
                    fulfilledRequests,
                    fulfillmentRate,
                    liveRequests: liveRequestsCount,
                    recentActivity: {
                        requests: recentRequests,
                        fulfilled: recentFulfilled
                    }
                },
                statusStats,
                demandStats,
                topPerformers
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
