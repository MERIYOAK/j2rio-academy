const express = require('express');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireInstructor } = require('../middlewares/auth');

const router = express.Router();

// Get instructor stats
router.get('/stats', verifyToken, requireInstructor, async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments({ instructorId: req.user._id });
        
        const enrollments = await Enrollment.find({
            courseId: { $in: await Course.find({ instructorId: req.user._id }).select('_id') }
        });
        
        const totalEnrollments = enrollments.length;
        
        // Calculate total revenue (assuming $10 per enrollment for demo)
        const totalRevenue = totalEnrollments * 10;
        
        res.json({
            totalCourses,
            totalEnrollments,
            totalRevenue
        });
    } catch (error) {
        console.error('Get instructor stats error:', error);
        res.status(500).json({ message: 'Error fetching instructor stats' });
    }
});

// Get instructor revenue
router.get('/revenue', verifyToken, requireInstructor, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({
            courseId: { $in: await Course.find({ instructorId: req.user._id }).select('_id') }
        }).populate('courseId', 'title price');
        
        const revenue = enrollments.map(enrollment => ({
            courseTitle: enrollment.courseId.title,
            amount: enrollment.courseId.price,
            date: enrollment.enrolledAt
        }));
        
        res.json(revenue);
    } catch (error) {
        console.error('Get instructor revenue error:', error);
        res.status(500).json({ message: 'Error fetching instructor revenue' });
    }
});

// Get instructor enrollments
router.get('/enrollments', verifyToken, requireInstructor, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({
            courseId: { $in: await Course.find({ instructorId: req.user._id }).select('_id') }
        }).populate([
            { path: 'courseId', select: 'title' },
            { path: 'userId', select: 'name email' }
        ]).sort({ enrolledAt: -1 });
        
        res.json(enrollments);
    } catch (error) {
        console.error('Get instructor enrollments error:', error);
        res.status(500).json({ message: 'Error fetching instructor enrollments' });
    }
});

module.exports = router; 