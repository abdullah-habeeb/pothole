import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pothole from './models/Pothole.js';

dotenv.config();

const checkDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const count = await Pothole.countDocuments();
        console.log(`Total Potholes: ${count}`);

        const potholes = await Pothole.find().sort({ createdAt: -1 }).limit(5);
        console.log('Most recent 5 potholes:');
        potholes.forEach(p => {
            console.log({
                id: p._id,
                severity: p.severity,
                lat: p.latitude,
                lng: p.longitude,
                createdAt: p.createdAt
            });
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDb();
