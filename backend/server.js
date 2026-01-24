const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Visitor = require('./models/Visitor');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Nodemailer transporter (Gmail)
// Note: Use App Password for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
// In-memory store for mock mode
let mockVisitors = [
    {
        _id: "mock_1",
        name: "John Doe",
        mobile: "1234567890",
        company: "Tech Corp",
        email: "john@example.com",
        purpose: "Meeting",
        status: "pending",
        createdAt: new Date(),
        checkInTime: new Date()
    }
];

// Routes
const isMongooseConnected = () => mongoose.connection.readyState === 1;

app.post('/api/visitors', async (req, res) => {
    try {
        const { name, mobile, company, email, purpose } = req.body;

        if (isMongooseConnected()) {
            const visitor = new Visitor({ name, mobile, company, email, purpose });
            await visitor.save();
            return res.status(201).json({ message: 'Submitted', id: visitor._id });
        } else {
            // Mock Mode
            const newVisitor = {
                _id: `mock_${Date.now()}`,
                name, mobile, company, email, purpose,
                status: 'pending',
                createdAt: new Date(),
                checkInTime: new Date()
            };
            mockVisitors.unshift(newVisitor);
            console.log('Mock Visitor Added:', newVisitor);
            return res.status(201).json({ message: 'Submitted (Mock)', id: newVisitor._id });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/visitors', async (req, res) => {
    try {
        if (isMongooseConnected()) {
            const visitors = await Visitor.find().sort({ createdAt: -1 });
            res.json(visitors);
        } else {
            res.json(mockVisitors);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/visitors/:id', async (req, res) => {
    try {
        if (isMongooseConnected()) {
            const visitor = await Visitor.findById(req.params.id);
            if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
            res.json(visitor);
        } else {
            const visitor = mockVisitors.find(v => v._id === req.params.id);
            if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
            res.json(visitor);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/visitors/:id', async (req, res) => {
    try {
        const { status, appointment_time } = req.body;

        if (isMongooseConnected()) {
            const visitor = await Visitor.findByIdAndUpdate(
                req.params.id,
                { status, appointment_time },
                { new: true }
            );

            if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
            await sendEmailUpdate(visitor, status, appointment_time);
            res.json(visitor);
        } else {
            // Mock Mode
            const index = mockVisitors.findIndex(v => v._id === req.params.id);
            if (index === -1) return res.status(404).json({ error: 'Visitor not found' });

            mockVisitors[index] = { ...mockVisitors[index], status, appointment_time };
            await sendEmailUpdate(mockVisitors[index], status, appointment_time);
            res.json(mockVisitors[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/visitors/:id/checkout', async (req, res) => {
    try {
        if (isMongooseConnected()) {
            const visitor = await Visitor.findByIdAndUpdate(
                req.params.id,
                { status: 'checked-out', checkOutTime: new Date() },
                { new: true }
            );
            if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
            res.json(visitor);
        } else {
            // Mock Mode
            const index = mockVisitors.findIndex(v => v._id === req.params.id);
            if (index === -1) return res.status(404).json({ error: 'Visitor not found' });

            mockVisitors[index] = {
                ...mockVisitors[index],
                status: 'checked-out',
                checkOutTime: new Date()
            };
            res.json(mockVisitors[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper for email sending to reduce duplication
async function sendEmailUpdate(visitor, status, appointment_time) {
    if (status === 'approved' || status === 'rejected') {
        const isApproved = status === 'approved';
        const subject = isApproved ? 'Meeting Approved - TripVenza Holidays' : 'Meeting Request Update - TripVenza Holidays';
        const text = isApproved
            ? `Dear ${visitor.name},\n\nYour meeting at TripVenza Holidays has been approved.\nTime: ${appointment_time}\n\nWe look forward to seeing you.`
            : `Dear ${visitor.name},\n\nWe regret to inform you that your meeting request has been rejected at this time.\n\nBest regards,\nTripVenza Team`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: visitor.email,
                subject,
                text
            });
            console.log(`Email sent to ${visitor.email}`);
        } catch (mailErr) {
            console.error('Mail sending failed:', mailErr);
        }
    }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
