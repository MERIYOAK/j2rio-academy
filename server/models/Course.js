const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    language: {
        type: String,
        enum: ['en', 'ti', 'am', 'english', 'tigrigna', 'amharic', 'English', 'Tigrigna', 'Amharic', 'Arabic', 'French', 'Spanish'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoUrl: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    category: {
        type: String,
        default: 'General'
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert', 'all levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels'],
        default: 'beginner'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed', 'archived'],
        default: 'draft'
    },
    enrollmentCount: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    reviews: [reviewSchema]
}, {
    timestamps: true
});

// Virtual for instructor info
courseSchema.virtual('instructor', {
    ref: 'User',
    localField: 'instructorId',
    foreignField: '_id',
    justOne: true
});

// Virtual for average rating
courseSchema.virtual('averageRating').get(function() {
    if (!Array.isArray(this.reviews) || this.reviews.length === 0) return 0;
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / this.reviews.length;
});

// Method to update rating and review count
courseSchema.methods.updateRatingStats = function() {
    this.rating = this.averageRating;
    this.reviewCount = this.reviews.length;
    return this.save();
};

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema); 