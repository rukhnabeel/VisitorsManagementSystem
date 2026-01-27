const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tripvenza_visitors', {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`Error: ${error.message} - Starting in MOCK MODE`);
        return false;
    }
};

module.exports = connectDB;
