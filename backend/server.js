const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Visitor = require('./models/Visitor');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const os = require('os');

const app = express();

// Helper to get local IP
const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
};

const getFormattedDate = (date, fallback) => {
    const rawDate = date || fallback;
    if (!rawDate) return '--';
    return new Date(rawDate).toLocaleDateString('en-GB').split('/').join('-');
};
app.use(cors());
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Nodemailer transporter (Gmail)
// Note: Use App Password for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// In-memory store for mock mode with file persistence
const MOCK_FILE = path.join(__dirname, 'mock_visitors.json');

const loadMockVisitors = () => {
    try {
        if (fs.existsSync(MOCK_FILE)) {
            const data = fs.readFileSync(MOCK_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading mock data:', err);
    }
    return [
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
};

const saveMockVisitors = (data) => {
    try {
        fs.writeFileSync(MOCK_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving mock data:', err);
    }
};

let mockVisitors = loadMockVisitors();

// Routes
const isMongooseConnected = () => mongoose.connection.readyState === 1;

app.get('/api/db-status', (req, res) => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized',
    };
    const state = mongoose.connection.readyState;
    res.json({
        status: isMongooseConnected() ? 'healthy' : 'degraded',
        connectionState: states[state] || 'unknown',
        dbName: mongoose.connection.name || 'none',
        timestamp: new Date()
    });
});

app.post('/api/visitors', async (req, res) => {
    try {
        const { name, mobile, company, email, purpose, meeting_person, appointment_with, photo, visit_date } = req.body;
        console.log('--- NEW REGISTRATION ATTEMPT ---');
        console.log(`Name: ${name}, Office: ${appointment_with}`);
        console.log(`Photo Size: ${photo ? photo.length : 'NONE'}`);

        if (isMongooseConnected()) {
            const visitor = new Visitor({ name, mobile, company, email, purpose, appointment_with, photo, visit_date });
            try {
                await visitor.save();
                console.log(`Saved to DB: ${visitor._id}`);

                // Start email in background
                sendRegistrationEmail(visitor).catch(err => console.error('BG Registration Email Error:', err));

                return res.status(201).json({ message: 'Submitted', id: visitor._id });
            } catch (saveError) {
                console.error('Mongoose Save Error:', saveError);
                // If validation error, return 400
                if (saveError.name === 'ValidationError') {
                    return res.status(400).json({ error: saveError.message });
                }
                throw saveError;
            }
        } else {
            // Mock Mode
            const newVisitor = {
                _id: `mock_${Date.now()}`,
                name, mobile, company, email, purpose, appointment_with, photo, visit_date,
                status: 'pending',
                createdAt: new Date(),
                checkInTime: new Date()
            };
            mockVisitors.unshift(newVisitor);
            saveMockVisitors(mockVisitors);
            console.log('Mock Visitor Added:', newVisitor._id);
            // Start email in background
            sendRegistrationEmail(newVisitor).catch(err => console.error('BG Registration Email Error:', err));
            return res.status(201).json({ message: 'Submitted (Mock)', id: newVisitor._id });
        }
    } catch (error) {
        console.error('General Server Error (POST /api/visitors):', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper for registration email
async function sendRegistrationEmail(visitor) {
    const officeName = visitor.appointment_with || 'TripVenza Holidays / Ellora Manpower';
    const subject = `Visitation Request Received - ${officeName}`;
    const text = `Dear ${visitor.name},

Thank you for reaching out to ${officeName}. Your visitation request has been successfully received.

Details of your request:
- Office: ${officeName}
- Purpose: ${visitor.purpose}
- Proposed Date: ${getFormattedDate(visitor.visit_date, visitor.createdAt)}
- Proposed Time: ${new Date(visitor.visit_date || visitor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

We are currently reviewing your request and will notify you as soon as your status is updated.

Best regards,
The ${officeName} Team`;

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: visitor.email,
        subject,
        text
    }).then(info => {
        console.log(`Registration email sent to ${visitor.email}: ${info.messageId}`);
    }).catch(mailErr => {
        console.error('Registration email failed:', mailErr);
    });
}

app.get('/api/config', (req, res) => {
    const ip = getLocalIp();
    // Use the origin port if available, otherwise fallback to 5173
    const origin = req.get('origin');
    let port = '5173';
    if (origin) {
        try {
            port = new URL(origin).port || port;
        } catch (e) { }
    }
    res.json({ registrationUrl: `http://${ip}:${port}` });
});

app.get('/api/visitors', async (req, res) => {
    try {
        console.log(`GET /api/visitors - Count: ${isMongooseConnected() ? 'DB' : mockVisitors.length} (Mock)`);
        if (isMongooseConnected()) {
            const visitors = await Visitor.find().sort({ createdAt: -1 });
            res.json(visitors);
        } else {
            res.json(mockVisitors);
        }
    } catch (error) {
        console.error('General Server Error (GET /api/visitors):', error);
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

            // Start email in background
            sendEmailUpdate(visitor, status, appointment_time).catch(err => console.error('BG Update Email Error:', err));

            res.json(visitor);
        } else {
            // Mock Mode
            const index = mockVisitors.findIndex(v => v._id === req.params.id);
            if (index === -1) return res.status(404).json({ error: 'Visitor not found' });

            mockVisitors[index] = { ...mockVisitors[index], status, appointment_time };
            saveMockVisitors(mockVisitors);

            // Start email in background
            sendEmailUpdate(mockVisitors[index], status, appointment_time).catch(err => console.error('BG Update Email Error:', err));

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

            // Start thank you email in background
            sendEmailUpdate(visitor, 'checked-out').catch(err => console.error('BG Checkout Email Error:', err));

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
            saveMockVisitors(mockVisitors);

            // Start email for mock mode
            sendEmailUpdate(mockVisitors[index], 'checked-out').catch(err => console.error('BG Checkout Email Error:', err));

            res.json(mockVisitors[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/visitors/:id', async (req, res) => {
    try {
        if (isMongooseConnected()) {
            const visitor = await Visitor.findByIdAndDelete(req.params.id);
            if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
            res.json({ message: 'Deleted' });
        } else {
            const index = mockVisitors.findIndex(v => v._id === req.params.id);
            if (index === -1) return res.status(404).json({ error: 'Visitor not found' });
            mockVisitors.splice(index, 1);
            saveMockVisitors(mockVisitors);
            res.json({ message: 'Deleted (Mock)' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper for email sending to reduce duplication
async function sendEmailUpdate(visitor, status, appointment_time) {
    if (status === 'approved' || status === 'rejected' || status === 'checked-out') {
        const isApproved = status === 'approved';
        const isCheckedOut = status === 'checked-out';
        const isRejected = status === 'rejected';

        const officeName = visitor.appointment_with || 'TripVenza Holidays / Ellora Manpower';

        let subject = '';
        let text = '';

        if (isApproved) {
            subject = `Great News! Your ${officeName} Meeting is Confirmed 🌍`;
            text = `Dear ${visitor.name},

We are delighted to confirm your meeting with ${officeName}! We have officially reserved your slot and are excited to discuss your plans.

🗓 Date: ${getFormattedDate(visitor.visit_date, visitor.createdAt)}
🕒 Time: ${appointment_time}

We look forward to welcoming you. See you soon!

Best regards,
The ${officeName} Team`;
        } else if (isRejected) {
            subject = 'Meeting Request Update - TripVenza Holidays';
            text = `Dear ${visitor.name},

We regret to inform you that your meeting request at ${officeName} has been rejected at this time.

Best regards,
The ${officeName} Team`;
        } else if (isCheckedOut) {
            subject = `Thank you for visiting ${officeName} ✨`;
            text = `Dear ${visitor.name},

It was a pleasure having you at our office today. We hope your meeting was productive.

If you have any further questions or follow-up items, please don't hesitate to reach out to us.

Have a wonderful day ahead!

Best regards,
The ${officeName} Team`;
        }

        return transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: visitor.email,
            subject,
            text
        }).then(info => {
            console.log(`Update email (${status}) sent to ${visitor.email}: ${info.messageId}`);
        }).catch(mailErr => {
            console.error(`Update email (${status}) failed:`, mailErr);
        });
    }
}


// Connect to Database and Start Server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
            console.log(`✅ System local time: ${new Date().toLocaleString()}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
