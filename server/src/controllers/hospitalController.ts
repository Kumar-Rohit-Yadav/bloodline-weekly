import { Request, Response } from 'express';
import User from '../models/User';
import BloodRequest from '../models/BloodRequest';
import { AuthRequest } from '../middlewares/auth';

// @desc    Get hospital inventory
// @route   GET /api/hospital/inventory
// @access  Private/Hospital
export const getInventory = async (req: AuthRequest, res: Response) => {
    try {
        const hospital = await User.findById(req.user?._id);
        if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });

        res.status(200).json({ success: true, count: hospital.inventory?.length, data: hospital.inventory });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update hospital inventory
// @route   PUT /api/hospital/inventory
// @access  Private/Hospital
export const updateInventory = async (req: AuthRequest, res: Response) => {
    try {
        const { inventory } = req.body;
        const hospital = await User.findByIdAndUpdate(
            req.user?._id,
            { inventory },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: hospital?.inventory });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get hospital specific requests (Initiated by them OR targeting them)
// @route   GET /api/hospital/my-requests
// @access  Private/Hospital
export const getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const hospital = await User.findById(req.user?._id);
        if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });

        // Find requests created by this hospital OR targeting this hospital by facility name
        const requests = await BloodRequest.find({
            $or: [
                { requester: req.user?._id },
                { hospitalName: hospital.facilityName }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all public blood bank inventory
// @route   GET /api/hospital/public-inventory
// @access  Public
export const getPublicInventory = async (req: Request, res: Response) => {
    try {
        const hospitals = await User.find({ role: 'hospital', isVerified: true })
            .select('facilityName facilityAddress location inventory')
            .sort('facilityName');

        res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Log a manual (walk-in) donation
// @route   POST /api/hospital/log-donation
// @access  Private/Hospital
export const logManualDonation = async (req: AuthRequest, res: Response) => {
    try {
        const { bloodType, units, donorId, donorName } = req.body;
        const hospital = await User.findById(req.user?._id);
        if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });

        // Update inventory
        const inventoryItem = hospital.inventory?.find(item => item.bloodType === bloodType);
        if (inventoryItem) {
            inventoryItem.units += units;
        } else {
            hospital.inventory?.push({ bloodType, units, status: 'Normal' });
        }
        await hospital.save();

        // Log to Activity History
        const ActivityHistory = require('../models/ActivityHistory').default;
        await ActivityHistory.create({
            user: hospital._id,
            type: 'manual_donation', // Used in frontend as "Manual Stock Entry"
            roleAtTime: 'hospital',
            description: `Manually added ${units} units of ${bloodType} to bank stock (Donor: ${donorName || 'Walk-in'}).`,
            bloodType,
            units,
            facilityName: hospital.facilityName
        });

        res.status(200).json({ success: true, message: 'Donation logged and inventory updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Generate a unique QR token for a mission
// @route   GET /api/hospital/generate-qr/:requestId
// @access  Private/Hospital
export const generateMissionQR = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const request = await BloodRequest.findById(requestId);

        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

        // Generate a random 6-digit token and store it
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        request.verificationToken = token;

        // If goal met, this QR is for the final Handover to Receiver
        if (request.collectedUnits >= request.units) {
            request.handoverInitiated = true;
        }

        await request.save();

        res.status(200).json({ success: true, data: { token } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
