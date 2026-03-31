import { Response } from 'express';
import BloodRequest from '../models/BloodRequest';
import User from '../models/User';
import ActivityHistory from '../models/ActivityHistory';
import { AuthRequest } from '../middlewares/auth';
import { analyzeSeverity } from '../services/aiService';
import { getIO } from '../socket';
import { createNotification } from './notificationController';
import { sendUrgentRequestEmail } from '../utils/sendEmail';

// @desc    Create a blood request
// @route   POST /api/requests
// @access  Private
export const createRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { bloodType, units, description, location, hospitalName, patientName, manualUrgency, isPublicDrive } = req.body;

        // NEW VALIDATION: Non-hospital requests MUST have a hospital name (facility association)
        if (req.user?.role !== 'hospital' && !hospitalName) {
            return res.status(400).json({
                success: false,
                error: "Please select a medical facility. Donations must be coordinated through a hospital for verification."
            });
        }

        const aiResult = await analyzeSeverity(description);

        const request = await BloodRequest.create({
            requester: req.user?._id,
            bloodType,
            units,
            description,
            location,
            hospitalName,
            patientName,
            urgency: manualUrgency || aiResult.severity,
            aiReasoning: aiResult.reasoning,
            isPublicDrive: isPublicDrive || false,
            status: 'Open'
        });

        // NOTIFICATION TRIGGER 1: Urgent Request Broadcasting & Email Notifications
        if (request.urgency === 'Critical' || request.urgency === 'Urgent') {
            const [lng, lat] = request.location.coordinates;

            // 1. Fetch Recipients for In-App Notifications
            const donors = await User.find({
                role: 'donor',
                bloodType: request.bloodType
            }).select('_id');

            const hospitals = await User.find({
                role: 'hospital',
                'inventory': {
                    $elemMatch: {
                        bloodType: request.bloodType,
                        units: { $gt: 0 }
                    }
                }
            }).select('_id');

            // 2. Fetch Facility Email for EMAIL Notification
            let facilityEmail = '';
            if (req.user?.role === 'hospital') {
                facilityEmail = req.user.email;
            } else if (hospitalName) {
                const facility = await User.findOne({
                    role: 'hospital',
                    facilityName: hospitalName
                }).select('email');
                if (facility) facilityEmail = facility.email;
            }

            const startNotificationJob = async () => {
                // 1. In-App Notifications (Still for all matching donors/hospitals)
                const inAppRecipients = [...donors, ...hospitals];
                for (const user of inAppRecipients) {
                    await createNotification(
                        user._id,
                        'URGENT BLOOD REQUEST',
                        `Urgent need for ${request.bloodType} blood at ${request.hospitalName}. Can you help?`,
                        'URGENT_REQUEST',
                        request._id.toString(),
                        '/dashboard'
                    );
                }

                // 2. Email Notification (ONLY for target facility)
                if (facilityEmail) {
                    const emailDetails = {
                        bloodType: request.bloodType,
                        units: request.units,
                        patientName: request.patientName,
                        hospitalName: request.hospitalName,
                        urgency: request.urgency,
                        aiReasoning: request.aiReasoning,
                        description: request.description
                    };
                    await sendUrgentRequestEmail(facilityEmail, emailDetails);
                }
            };
            // Run in background
            startNotificationJob();
        }

        res.status(201).json({ success: true, data: request });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get all requests created by me
// @route   GET /api/requests
// @access  Private
export const getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await BloodRequest.find({
            requester: req.user?._id,
            status: { $ne: 'Fulfilled' }
        }).sort('-createdAt');
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single request by ID
// @route   GET /api/requests/:id
// @access  Private
export const getRequestById = async (req: AuthRequest, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        res.status(200).json({ success: true, data: request });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get nearby matching requests for donors
// @route   GET /api/requests/nearby
// @access  Private
export const getNearbyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?._id);
        if (!user || !user.location || !user.location.coordinates || user.location.coordinates.length < 2) {
            return res.status(200).json({ success: true, count: 0, data: [], message: 'Location not fully set' });
        }

        const [lng, lat] = user.location.coordinates;

        // Increase search radius for Hospitals (500km) to see distant Public Drives
        // Or keep standard 50km for Donors
        const maxDistance = 500000; // 500km covers most of Nepal

        const requests = await BloodRequest.find({
            status: { $in: ['Open', 'Matched'] },
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: maxDistance
                }
            }
        }).populate('requester', 'name profileImage');

        // Custom sort by medical urgency (Critical > Urgent > Normal > Low)
        const urgencyPriority: Record<string, number> = {
            'Critical': 4,
            'Urgent': 3,
            'Normal': 2,
            'Low': 1
        };

        const sortedRequests = requests.sort((a, b) => {
            const priorityA = urgencyPriority[a.urgency as keyof typeof urgencyPriority] || 0;
            const priorityB = urgencyPriority[b.urgency as keyof typeof urgencyPriority] || 0;
            return priorityB - priorityA;
        });

        // Add user-specific pledge status
        const requestsWithStatus = sortedRequests.map(bloodReq => {
            const myPledge = bloodReq.pledges?.find(p => p.donor && p.donor.toString() === req.user?._id.toString());
            return {
                ...bloodReq.toObject(),
                myPledgeStatus: myPledge ? myPledge.status : null
            };
        });

        res.status(200).json({ success: true, count: requestsWithStatus.length, data: requestsWithStatus });
    } catch (error: any) {
        console.error("GET_NEARBY_ERROR:", error);
        res.status(500).json({ success: false, error: "Failed to fetch nearby requests. Ensure location index is ready." });
    }
};

// @desc    Pledge to a request (Donor commits to help)
export const pledgeToRequest = async (req: AuthRequest, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

        const { units } = req.body;
        const requestedUnits = Number(units) || 1;

        const isAlreadyPledged = request.pledges.find(p => p.donor.toString() === req.user?._id.toString());
        if (isAlreadyPledged) return res.status(400).json({ success: false, error: 'Already pledged' });

        request.pledges.push({
            donor: req.user?._id as any,
            status: 'pending',
            units: requestedUnits,
            pledgedAt: new Date()
        });
        await request.save();

        res.status(200).json({ success: true, data: request });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Fulfill Request Directly (Hospital to Hospital / Public Drive)
// @route   POST /api/requests/:id/fulfill-direct
// @access  Private (Hospital Only)
export const fulfillRequestDirectly = async (req: AuthRequest, res: Response) => {
    try {
        const { units } = req.body;
        const requestedUnits = Number(units);

        if (!requestedUnits || requestedUnits <= 0) {
            return res.status(400).json({ success: false, error: "Invalid units. Must be greater than 0." });
        }

        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, error: "Request not found" });
        if (request.status === 'Fulfilled') return res.status(400).json({ success: false, error: "Mission already fulfilled" });

        // Authorization Checks
        if (req.user?.role !== 'hospital') {
            return res.status(403).json({ success: false, error: "Only hospitals can fulfill requests directly." });
        }

        // Prevent Creator from fulfilling their own PUBLIC DRIVE directly (per user requirement)
        if (request.isPublicDrive && request.requester.toString() === req.user._id.toString()) {
            return res.status(403).json({ success: false, error: "You cannot directly fulfill your own public drive. Please wait for external donations." });
        }

        // Check Inventory of Fulfilling Hospital
        const fulfillingHospital = await User.findById(req.user._id);
        if (!fulfillingHospital || !fulfillingHospital.inventory) {
            return res.status(404).json({ success: false, error: "Hospital profile not found." });
        }

        // Limit Check: Prevent donating more than remaining needed
        const remainingNeeded = request.units - (request.collectedUnits || 0);
        if (requestedUnits > remainingNeeded) {
            return res.status(400).json({
                success: false,
                error: `Limit exceeded. This mission only needs ${remainingNeeded} more units of ${request.bloodType}.`
            });
        }

        const inventoryItem = fulfillingHospital.inventory.find(item => item.bloodType === request.bloodType);

        if (!inventoryItem || inventoryItem.units < requestedUnits) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock. You only have ${inventoryItem?.units || 0} units of ${request.bloodType}.`
            });
        }

        // Deduct Stock
        inventoryItem.units -= requestedUnits;
        fulfillingHospital.markModified('inventory');
        await fulfillingHospital.save();

        // Update Request Progress
        request.collectedUnits = (request.collectedUnits || 0) + requestedUnits;
        if (!request.fulfilledBy) request.fulfilledBy = [];
        if (!request.fulfilledBy.includes(req.user._id)) {
            request.fulfilledBy.push(req.user._id);
        }

        // FINAL ARCHIVE LOGIC: 
        // 1. If Public Drive reaching total units -> Archive automatically (Hospital is the receiver)
        if (request.isPublicDrive && request.collectedUnits >= request.units) {
            request.status = 'Fulfilled';
            request.fulfilledAt = new Date();
        } else if (request.collectedUnits >= request.units) {
            request.status = 'Matched';
        }

        await request.save();

        // Record History
        await ActivityHistory.create({
            user: req.user._id,
            type: 'facilitation', // Contributing stock
            roleAtTime: 'hospital',
            description: `Donated ${requestedUnits} units of ${request.bloodType} from stock to support drive at ${request.hospitalName}.`,
            linkedRequest: request._id,
            linkedUser: request.requester,
            bloodType: request.bloodType,
            units: requestedUnits,
            facilityName: fulfillingHospital.facilityName
        });

        // Notify Request Creator
        await createNotification(
            request.requester,
            'STOCK DONATION RECEIVED',
            `${fulfillingHospital.facilityName} has donated ${requestedUnits} units from their stock to your drive.`,
            'DONATION_COMPLETE',
            request._id.toString(),
            '/dashboard'
        );

        // Broadcast Update
        const io = getIO();
        io.to(request._id.toString()).emit('MISSION_FULFILLED', {
            requestId: request._id,
            hospitalName: request.hospitalName,
            collected: request.collectedUnits,
            goal: request.units,
            status: request.status
        });

        res.status(200).json({ success: true, message: 'Donation processed successfully. Inventory updated.', data: request });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Verify a mission via QR token and fulfill it
// @route   POST /api/requests/verify-qr/:id
// @access  Private (Donor)
export const verifyMissionQR = async (req: AuthRequest, res: Response) => {
    try {
        const { token, units } = req.body; // Accept units from body
        const request = await BloodRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        if (request.status === 'Fulfilled') return res.status(400).json({ success: false, error: 'Mission already fulfilled' });
        if (request.verificationToken !== token) return res.status(400).json({ success: false, error: 'Invalid verification token' });

        // Identify the parties
        const userId = req.user?._id;
        const receiverId = request.requester;
        const isReceiverVerifying = userId?.toString() === receiverId.toString();

        // Determine Units to Verify
        // Prioritize explicit input (verified amount), fallback to pledge, fallback to 1
        const donorPledge = request.pledges.find(p => p.donor.toString() === userId.toString() && p.status === 'pending');

        let unitsToVerify = 1;
        if (units) {
            unitsToVerify = Number(units);
        } else if (donorPledge) {
            unitsToVerify = donorPledge.units;
        }

        // PREVENT OVER-DONATION: Check if this would exceed the total requirement
        // Only enforce for donations (not receiver confirmation as that doesn't increment)
        if (!isReceiverVerifying) {
            const remaining = request.units - (request.collectedUnits || 0);
            if (unitsToVerify > remaining) {
                return res.status(400).json({
                    success: false,
                    error: `Limit exceeded. Only ${remaining} units remaining for this request.`
                });
            }
        }

        // Logic for Inventory & History Updates
        // Scenario 1: Public Drive (Donation adds to Hospital Stock)
        // Scenario 2: Patient Request (Donation deducts from Stock IF fulfilling from bank, OR adds to Stock temporarily?)

        // Simplified Logic: 
        // If Request is Public Drive -> Add to Creator's Inventory
        // If Request is Patient -> Receiver "Receives" it (Inventory interactions happen at bank level logic, simplified here)

        let targetHospital = null;
        if (request.isPublicDrive) {
            targetHospital = await User.findById(request.requester);
        } else {
            targetHospital = await User.findOne({
                role: 'hospital',
                facilityName: request.hospitalName
            });
        }

        if (targetHospital) {
            let inventoryItem = targetHospital.inventory?.find(item => item.bloodType === request.bloodType);
            if (!inventoryItem) {
                targetHospital.inventory = targetHospital.inventory || [];
                const newItem = {
                    bloodType: request.bloodType as any,
                    units: 0,
                    status: 'Normal' as any
                };
                targetHospital.inventory.push(newItem);
                inventoryItem = targetHospital.inventory[targetHospital.inventory.length - 1];
            }

            if (inventoryItem) {
                if (request.isPublicDrive) {
                    // Start Drive -> Add donated blood to inventory
                    inventoryItem.units += unitsToVerify;
                } else {
                    // Patient Request -> If fulfilled from bank stock (isReceiverVerifying logic)
                    if (isReceiverVerifying) {
                        inventoryItem.units = Math.max(0, inventoryItem.units - unitsToVerify);
                    }
                }
            }
            targetHospital.markModified('inventory');
            await targetHospital.save();
        }

        // History Records (Simplified for brevity, assuming existing logic holds)
        const donorUser = !isReceiverVerifying ? await User.findById(userId) : null;
        const receiverUser = await User.findById(receiverId);

        if (isReceiverVerifying) {
            // ... existing receipt logic ...
            await ActivityHistory.create({
                user: receiverId,
                type: 'receipt',
                roleAtTime: 'receiver',
                description: `Received ${unitsToVerify} units of ${request.bloodType} directly from ${request.hospitalName} bank.`,
                linkedRequest: request._id,
                linkedUser: targetHospital?._id,
                bloodType: request.bloodType,
                units: unitsToVerify,
                facilityName: request.hospitalName
            });
        } else {
            // Standard Donation
            await ActivityHistory.create([
                {
                    user: request.requester, // Receiver needs record
                    type: 'receipt',
                    roleAtTime: 'receiver',
                    description: `Received ${unitsToVerify} units of ${request.bloodType} from donor ${donorUser?.name || 'Anonymous'} at ${request.hospitalName}.`,
                    linkedRequest: request._id,
                    linkedUser: userId,
                    bloodType: request.bloodType,
                    units: unitsToVerify,
                    facilityName: request.hospitalName
                },
                {
                    user: userId, // Donor needs record
                    type: 'donation',
                    roleAtTime: 'donor',
                    description: `Successfully donated ${unitsToVerify} units of ${request.bloodType} at ${request.hospitalName}.`,
                    linkedRequest: request._id,
                    linkedUser: receiverId,
                    bloodType: request.bloodType,
                    units: unitsToVerify,
                    facilityName: request.hospitalName
                }
            ]);

            // NOTIFICATION TRIGGER 3: Donation Complete
            if (request.requester.toString() !== userId.toString()) {
                await createNotification(
                    request.requester,
                    'DONATION RECEIVED',
                    `${donorUser?.name || 'A donor'} has successfully donated ${unitsToVerify} units for your request.`,
                    'DONATION_COMPLETE',
                    request._id.toString(),
                    '/dashboard'
                );
            }
        }

        // UPDATE PROGRESS: Only increment if this is a donation (Donor/Hospital -> Bank)
        // If it's the Receiver verifying, they are just confirming receipt of already collected units
        if (!isReceiverVerifying) {
            request.collectedUnits = (request.collectedUnits || 0) + unitsToVerify;
        }

        if (donorPledge) {
            donorPledge.status = 'accepted';
        }

        if (!request.fulfilledBy) request.fulfilledBy = [];
        if (!request.fulfilledBy.includes(userId)) {
            request.fulfilledBy.push(userId);
        }

        // FINAL ARCHIVE LOGIC: 
        // 1. Receiver verifying -> Archive
        // 2. Public Drive reaching total units -> Archive automatically (Hospital is the receiver)
        if ((isReceiverVerifying || request.isPublicDrive) && request.collectedUnits >= request.units) {
            request.status = 'Fulfilled';
            request.fulfilledAt = new Date();
        } else if (request.collectedUnits >= request.units) {
            request.status = 'Matched';
        }

        await request.save();

        const io = getIO();
        io.to(request._id.toString()).emit('MISSION_FULFILLED', {
            requestId: request._id,
            hospitalName: request.hospitalName,
            collected: request.collectedUnits,
            goal: request.units,
            status: request.status
        });

        res.status(200).json({ success: true, message: 'Mission verified and recorded successfully!' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete a blood request
// @route   DELETE /api/requests/:id
// @access  Private
export const deleteRequest = async (req: AuthRequest, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        // Only owner can delete
        if (request.requester.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this request' });
        }

        // Prevent deletion if already being fulfilled? 
        // For now, allow if it's 'Open' or 'Matched' but maybe cautious if units already collected.
        if (request.collectedUnits > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete request with active pledges or collected units. Please cancel individual pledges first.'
            });
        }

        await request.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getMyHistory = async (req: AuthRequest, res: Response) => {
    try {
        const history = await ActivityHistory.find({ user: req.user?._id })
            .populate('linkedUser', 'name profileImage')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: history });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
