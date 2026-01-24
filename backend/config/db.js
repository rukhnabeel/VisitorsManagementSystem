const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tripvenza_visitors');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message} - Starting in MOCK MODE`);
        // process.exit(1);
        return false;
    }
};

module.exports = connectDB;
