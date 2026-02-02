const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI ||
            process.env.MONGO_URL ||
            process.env.MONGODB_URI ||
            process.env.STORAGE_URL ||
            'mongodb://localhost:27017/tripvenza_visitors';

        // Event Listeners
        mongoose.connection.on('connected', () => {
            console.log('✅ Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ Mongoose disconnected');
        });

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`🔴 Critical DB Error: ${error.message} - Starting in MOCK MODE`);
        return false;
    }
};

module.exports = connectDB;
