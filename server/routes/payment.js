const express = require('express');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Initialize Stripe only if secret key is available
let stripe = null;
try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
} catch (error) {
    console.warn('Stripe not configured. Payment features will be disabled.');
}

// Create checkout session
router.post('/create-checkout-session', verifyToken, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ 
                message: 'Payment system is not configured. Please contact administrator.' 
            });
        }

        const { courseId } = req.body;

        // Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is already enrolled
        const existingEnrollment = await Enrollment.findOne({
            userId: req.user._id,
            courseId: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already enrolled in this course' });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.title,
                            description: course.description,
                            images: course.thumbnail ? [course.thumbnail] : []
                        },
                        unit_amount: Math.round(course.price * 100) // Convert to cents
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/course/${courseId}`,
            metadata: {
                courseId: courseId,
                userId: req.user._id.toString()
            }
        });

        // Create pending enrollment
        const enrollment = new Enrollment({
            userId: req.user._id,
            courseId: courseId,
            stripeSessionId: session.id,
            amount: course.price,
            currency: 'usd'
        });

        await enrollment.save();

        res.json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ message: 'Error creating checkout session' });
    }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ message: 'Webhook not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            
            try {
                // Update enrollment status
                const enrollment = await Enrollment.findOne({
                    stripeSessionId: session.id
                });

                if (enrollment) {
                    enrollment.paymentStatus = 'completed';
                    await enrollment.save();

                    // Update course enrollment count
                    await Course.findByIdAndUpdate(
                        enrollment.courseId,
                        { $inc: { enrollmentCount: 1 } }
                    );
                }
            } catch (error) {
                console.error('Error processing webhook:', error);
            }
            break;

        case 'checkout.session.expired':
            const expiredSession = event.data.object;
            
            try {
                // Update enrollment status to failed
                await Enrollment.findOneAndUpdate(
                    { stripeSessionId: expiredSession.id },
                    { paymentStatus: 'failed' }
                );
            } catch (error) {
                console.error('Error processing expired session:', error);
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Get payment status
router.get('/status/:sessionId', verifyToken, async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            stripeSessionId: req.params.sessionId,
            userId: req.user._id
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        res.json({
            paymentStatus: enrollment.paymentStatus,
            enrollment
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ message: 'Error fetching payment status' });
    }
});

// Get user's payment history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ userId: req.user._id })
            .populate('courseId', 'title thumbnail')
            .sort({ enrolledAt: -1 });

        res.json(enrollments);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Error fetching payment history' });
    }
});

module.exports = router; 