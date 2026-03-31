import mongoose from 'mongoose';
import VerifiedHospital from './models/VerifiedHospital';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const hospitals = [
    // Kathmandu
    { name: "T.U. Teaching Hospital (TUTH)", address: "Maharajgunj, Kathmandu", location: { type: "Point", coordinates: [85.3301, 27.7345] }, category: "Government", contact: "01-4412404" },
    { name: "Bir Hospital", address: "Kanti Path, Kathmandu", location: { type: "Point", coordinates: [85.3134, 27.7056] }, category: "Government", contact: "01-4221111" },
    { name: "Nepal Mediciti Hospital", address: "Bhaisepati, Lalitpur", location: { type: "Point", coordinates: [85.3015, 27.6450] }, category: "Private", contact: "01-4217777" },
    { name: "Patan Hospital", address: "Lagankhel, Lalitpur", location: { type: "Point", coordinates: [85.3213, 27.6685] }, category: "Government", contact: "01-5522295" },
    { name: "Norvic International Hospital", address: "Thapathali, Kathmandu", location: { type: "Point", coordinates: [85.3197, 27.6934] }, category: "Private", contact: "01-4258554" },
    { name: "Grande International Hospital", address: "Dhapasi, Kathmandu", location: { type: "Point", coordinates: [85.3400, 27.7500] }, category: "Private", contact: "01-5159266" },
    { name: "Kanti Children's Hospital", address: "Maharajgunj, Kathmandu", location: { type: "Point", coordinates: [85.3315, 27.7355] }, category: "Government", contact: "01-4411550" },
    { name: "Shahid Gangalal National Heart Center", address: "Bansbari, Kathmandu", location: { type: "Point", coordinates: [85.3415, 27.7410] }, category: "Government", contact: "01-4371322" },
    { name: "Shree Birendra Hospital (Army Hospital)", address: "Chhauni, Kathmandu", location: { type: "Point", coordinates: [85.2915, 27.7050] }, category: "Government", contact: "01-4271815" },
    { name: "Nepal Police Hospital", address: "Maharajgunj, Kathmandu", location: { type: "Point", coordinates: [85.3330, 27.7320] }, category: "Government", contact: "01-4412530" },

    // Lalitpur & Bhaktapur
    { name: "Bhaktapur Cancer Hospital", address: "Dudhpati, Bhaktapur", location: { type: "Point", coordinates: [85.4180, 27.6740] }, category: "Government", contact: "01-6611532" },
    { name: "Sumeru Hospital", address: "Dhapakhel, Lalitpur", location: { type: "Point", coordinates: [85.3180, 27.6480] }, category: "Private", contact: "01-5573331" },
    { name: "Alka Hospital", address: "Jawalakhel, Lalitpur", location: { type: "Point", coordinates: [85.3120, 27.6720] }, category: "Private", contact: "01-5555555" },

    // Pokhara
    { name: "Manipal Teaching Hospital", address: "Phulbari, Pokhara", location: { type: "Point", coordinates: [83.9900, 28.2300] }, category: "Private", contact: "061-526416" },
    { name: "Gandaki Medical College", address: "Prithvi Chowk, Pokhara", location: { type: "Point", coordinates: [83.9850, 28.2120] }, category: "Private", contact: "061-538595" },
    { name: "Western Regional Hospital", address: "Ramghat, Pokhara", location: { type: "Point", coordinates: [83.9950, 28.2210] }, category: "Government", contact: "061-520067" },

    // Chitwan
    { name: "BP Koirala Memorial Cancer Hospital", address: "Bharatpur, Chitwan", location: { type: "Point", coordinates: [84.4200, 27.6800] }, category: "Government", contact: "056-524501" },
    { name: "College of Medical Sciences", address: "Bharatpur, Chitwan", location: { type: "Point", coordinates: [84.4350, 27.6750] }, category: "Private", contact: "056-524203" },
    { name: "Chitwan Medical College", address: "Bharatpur, Chitwan", location: { type: "Point", coordinates: [84.4250, 27.6820] }, category: "Private", contact: "056-532933" },

    // Lumbini & Butwal
    { name: "Lumbini Provincial Hospital", address: "Butwal, Rupandehi", location: { type: "Point", coordinates: [83.4500, 27.7000] }, category: "Government", contact: "071-540131" },
    { name: "Universal College of Medical Sciences", address: "Bhairahawa", location: { type: "Point", coordinates: [83.4550, 27.5050] }, category: "Private", contact: "071-522122" },
    { name: "Crimson Hospital", address: "Manigram, Butwal", location: { type: "Point", coordinates: [83.4650, 27.6550] }, category: "Private", contact: "071-562777" },

    // Biratnagar & Sunsari
    { name: "Koshi Hospital", address: "Biratnagar, Morang", location: { type: "Point", coordinates: [87.2800, 26.4500] }, category: "Government", contact: "021-522204" },
    { name: "Nobel Medical College", address: "Biratnagar, Morang", location: { type: "Point", coordinates: [87.2950, 26.4650] }, category: "Private", contact: "021-460736" },
    { name: "BP Koirala Institute of Health Sciences (BPKIHS)", address: "Dharan, Sunsari", location: { type: "Point", coordinates: [87.2850, 26.8150] }, category: "Government", contact: "025-525555" },

    // Nepalgunj & West
    { name: "Bheri Hospital", address: "Nepalgunj, Banke", location: { type: "Point", coordinates: [81.6200, 28.0550] }, category: "Government", contact: "081-520111" },
    { name: "Nepalgunj Medical College", address: "Kohalpur/Nepalgunj", location: { type: "Point", coordinates: [81.6850, 28.1850] }, category: "Private", contact: "081-550111" },
    { name: "Seti Provincial Hospital", address: "Dhangadhi, Kailali", location: { type: "Point", coordinates: [80.5900, 28.7050] }, category: "Government", contact: "091-524230" },

    // Janakpur
    { name: "Janakpur Provincial Hospital", address: "Janakpur, Dhanusa", location: { type: "Point", coordinates: [85.9250, 26.7250] }, category: "Government", contact: "041-520133" },
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodline');

        console.log('Clearing existing records...');
        await VerifiedHospital.deleteMany({});
        await User.deleteMany({});

        console.log(`Seeding ${hospitals.length} Verified Hospitals Master List...`);
        await VerifiedHospital.insertMany(hospitals);

        console.log('Creating System Admin...');
        await User.create({
            name: "System Admin",
            email: "admin@bloodline.com",
            password: "password123",
            role: "admin",
            isVerified: true,
            isEmailVerified: true
        });

        const hospitalsToCreate = [
            {
                name: "T.U. Teaching Hospital",
                email: "tuth@hospital.com",
                password: "password123",
                role: "hospital",
                isVerified: true,
                isEmailVerified: true,
                facilityName: "T.U. Teaching Hospital (TUTH)",
                facilityAddress: "Maharajgunj, Kathmandu",
                location: { type: "Point", coordinates: [85.3301, 27.7345] },
                inventory: [
                    { bloodType: 'A+', units: 15, status: 'Normal' },
                    { bloodType: 'O+', units: 8, status: 'Low' },
                    { bloodType: 'AB-', units: 2, status: 'Critical' }
                ]
            },
            {
                name: "Bir Hospital",
                email: "bir@hospital.com",
                password: "password123",
                role: "hospital",
                isVerified: true,
                isEmailVerified: true,
                facilityName: "Bir Hospital",
                facilityAddress: "Kanti Path, Kathmandu",
                location: { type: "Point", coordinates: [85.3134, 27.7056] },
                inventory: [
                    { bloodType: 'B+', units: 20, status: 'High' },
                    { bloodType: 'O-', units: 5, status: 'Low' }
                ]
            },
            {
                name: "Nepal Mediciti",
                email: "mediciti@hospital.com",
                password: "password123",
                role: "hospital",
                isVerified: true,
                isEmailVerified: true,
                facilityName: "Nepal Mediciti Hospital",
                facilityAddress: "Bhaisepati, Lalitpur",
                location: { type: "Point", coordinates: [85.3015, 27.6450] },
                inventory: [
                    { bloodType: 'A-', units: 12, status: 'Normal' },
                    { bloodType: 'AB+', units: 10, status: 'Normal' }
                ]
            }
        ];

        console.log('Creating Sample Hospital Users...');
        for (const h of hospitalsToCreate) {
            await User.create(h);
        }

        console.log('Creating Sample Donors...');
        await User.create({
            name: "Premium Donor",
            email: "donor@bloodline.com",
            password: "password123",
            role: "donor",
            bloodType: "A+",
            isVerified: true,
            isEmailVerified: true,
            location: { type: "Point", coordinates: [85.3311, 27.7355] } // Near TUTH
        });

        await User.create({
            name: "Universal Donor",
            email: "universal@bloodline.com",
            password: "password123",
            role: "donor",
            bloodType: "O-",
            isVerified: true,
            isEmailVerified: true,
            location: { type: "Point", coordinates: [85.3144, 27.7066] } // Near Bir
        });

        await User.create({
            name: "Verified Receiver",
            email: "receiver@bloodline.com",
            password: "password123",
            role: "receiver",
            isVerified: true,
            isEmailVerified: true,
            location: { type: "Point", coordinates: [85.3200, 27.6950] } // Near Norvic
        });

        console.log(`Success: ${hospitals.length} Master List Items & ${hospitalsToCreate.length} Operational Hospital Users Created!`);
        console.log('Admin Email: admin@bloodline.com | Password: password123');
        console.log('Hospital 1: tuth@hospital.com | Password: password123');
        console.log('Donor 1: donor@bloodline.com | Password: password123');
        console.log('Receiver 1: receiver@bloodline.com | Password: password123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
