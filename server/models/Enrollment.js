const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    stripeSessionId: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastWatchedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Ensure unique enrollment per user per course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Virtual for user info
enrollmentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Virtual for course info
enrollmentSchema.virtual('course', {
    ref: 'Course',
    localField: 'courseId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema); 