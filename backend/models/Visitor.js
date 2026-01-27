const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    company: { type: String },
    email: { type: String, required: true },
    appointment_with: { type: String, required: true },
    purpose: { type: String, required: true },
    meeting_person: { type: String }, // Field for who they are meeting
    photo: { type: String }, // Base64 encoded image
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'checked-out', 'checked-in'], default: 'pending' },
    appointment_time: { type: String },
    checkOutTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Visitor', VisitorSchema);
