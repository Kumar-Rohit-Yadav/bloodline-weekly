import { Request, Response } from 'express';
import User from '../models/User';
import BloodRequest from '../models/BloodRequest';

// @desc    Get requests near a donor (matching blood type)
// @route   GET /api/match/requests
// @access  Private/Donor
export const getRecommendedRequests = async (req: any, res: Response) => {
    try {
        const donor = await User.findById(req.user.id);
        if (!donor || !donor.location) {
            return res.status(400).json({ success: false, error: 'Donor location not set' });
        }

        const [lng, lat] = donor.location.coordinates;

        // Find requests within 20km that match donor's blood type OR O- requests (if donor is O-)
        const requests = await BloodRequest.find({
            status: 'Open',
            bloodType: donor.bloodType, // Exact match for now
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 20000 // 20km
                }
            }
        });

        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get donors near a request
// @route   GET /api/match/donors/:requestId
// @access  Private/Hospital/Admin
export const getNearbyDonors = async (req: Request, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.requestId);
        if (!request || !request.location) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        const [lng, lat] = request.location.coordinates;

        // Find donors within 50km with matching blood type
        const donors = await User.find({
            role: 'donor',
            bloodType: request.bloodType,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 50000 // 50km
                }
            }
        }).select('-password');

        res.status(200).json({ success: true, count: donors.length, data: donors });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
