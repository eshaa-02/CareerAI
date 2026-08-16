const app = require('../app');
const connectDB = require('../config/db');

let dbPromise = null;

module.exports = async (req, res) => {
    try {
        if (!dbPromise) {
            dbPromise = connectDB();
        }

        await dbPromise;

        return app(req, res);
    } catch (error) {
        console.error('MongoDB connection failed:', error);

        return res.status(500).json({
            success: false,
            error: 'Database connection failed',
        });
    }
};