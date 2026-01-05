import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const fixDonorNames = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodline');
        console.log('Connected to MongoDB.');

        // Find all non-hospital users who have a facilityName
        const corruptedUsers = await User.find({
            role: { $ne: 'hospital' },
            facilityName: { $exists: true, $ne: null }
        });

        console.log(`Found ${corruptedUsers.length} non-hospital users with facility names.`);

        if (corruptedUsers.length > 0) {
            const result = await User.updateMany(
                { role: { $ne: 'hospital' } },
                { $unset: { facilityName: "", facilityAddress: "" } }
            );
            console.log(`Successfully cleared facility data for ${result.modifiedCount} users.`);
        } else {
            console.log('No data cleanup needed.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

fixDonorNames();
