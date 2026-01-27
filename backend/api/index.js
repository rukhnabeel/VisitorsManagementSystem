const app = require('../server');
const connectDB = require('../config/db');

let isConnected = false;

module.exports = async (req, res) => {
    // Connect to DB if not already connected
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            console.log('✅ DB connected in serverless function');
        } catch (error) {
            console.error('❌ DB connection failed:', error);
        }
    }

    // Handle the request with Express app
    return app(req, res);
};
