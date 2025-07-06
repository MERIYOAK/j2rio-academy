const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireInstructor } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const { uploadVideoToS3, uploadThumbnailToS3 } = require('../utils/s3Upload');

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer for video files only
const uploadVideo = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|avi|mov|wmv|flv|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'));
        }
    }
});

// Multer for mixed files (video and images)
const uploadMixed = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow video files
        const videoTypes = /mp4|avi|mov|wmv|flv|webm/;
        const videoExtname = videoTypes.test(path.extname(file.originalname).toLowerCase());
        const videoMimetype = videoTypes.test(file.mimetype);
        
        // Allow image files
        const imageTypes = /jpeg|jpg|png|gif/;
        const imageExtname = imageTypes.test(path.extname(file.originalname).toLowerCase());
        const imageMimetype = /^image\/(jpeg|jpg|png|gif)$/.test(file.mimetype);
        
        if ((videoMimetype && videoExtname) || (imageMimetype && imageExtname)) {
            return cb(null, true);
        } else {
            cb(new Error('Only video and image files are allowed!'));
        }
    }
});

// Multer for image files only
const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /^image\/(jpeg|jpg|png|gif)$/.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF) are allowed!'));
        }
    }
});

// Debug route to check database status
router.get('/debug/status', async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments();
        const publishedCourses = await Course.countDocuments({ isPublished: true });
        const unpublishedCourses = await Course.countDocuments({ isPublished: false });
        
        const sampleCourses = await Course.find()
            .populate('instructor', 'name email')
            .limit(5)
            .select('title isPublished instructorId createdAt');
        
        console.log('🔍 Database Status:');
        console.log('   Total courses:', totalCourses);
        console.log('   Published courses:', publishedCourses);
        console.log('   Unpublished courses:', unpublishedCourses);
        console.log('   Sample courses:', sampleCourses);
        
        res.json({
            totalCourses,
            publishedCourses,
            unpublishedCourses,
            sampleCourses
        });
    } catch (error) {
        console.error('❌ Debug status error:', error);
        res.status(500).json({ message: 'Error checking database status' });
    }
});

// Get all published courses with enhanced filtering
router.get('/', async (req, res) => {
    try {
        const { language, category, level, search, instructor, minPrice, maxPrice, sortBy, published, limit } = req.query;
        
        console.log('📡 GET /courses request received with query params:', req.query);
        
        const filter = { isPublished: true };

        // Handle published parameter (frontend sends 'published', backend uses 'isPublished')
        if (published !== undefined) {
            filter.isPublished = published === 'true' || published === true;
        }

        if (language) filter.language = language;
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (instructor) {
            // Frontend sends instructor name, so we need to find by instructor name
            // We'll use a lookup to find courses by instructor name
            console.log('👨‍🏫 Filtering by instructor name:', instructor);
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('🔍 Applied filter:', filter);

        let sortOptions = { createdAt: -1 };
        if (sortBy === 'price') sortOptions = { price: 1 };
        if (sortBy === 'rating') sortOptions = { rating: -1 };
        if (sortBy === 'enrollmentCount') sortOptions = { enrollmentCount: -1 };

        // Build query with limit
        let query;
        
        if (instructor) {
            // Use aggregation to filter by instructor name
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'instructorId',
                        foreignField: '_id',
                        as: 'instructor'
                    }
                },
                { $unwind: '$instructor' },
                {
                    $match: {
                        'instructor.name': { $regex: instructor, $options: 'i' }
                    }
                },
                { $sort: sortOptions }
            ];
            
            if (limit) {
                pipeline.push({ $limit: parseInt(limit) });
            }
            
            query = Course.aggregate(pipeline);
        } else {
            // Regular query without instructor filter
            query = Course.find(filter)
                .populate('instructor', 'name email')
                .sort(sortOptions);
            
            if (limit) {
                query = query.limit(parseInt(limit));
            }
        }

        const courses = await query;
        
        console.log('✅ Found', courses.length, 'courses');
        if (courses.length > 0) {
            console.log('📋 Sample course:', {
                id: courses[0]._id,
                title: courses[0].title,
                instructor: courses[0].instructor?.name,
                isPublished: courses[0].isPublished,
                hasThumbnail: !!courses[0].thumbnail,
                hasVideo: !!courses[0].videoUrl
            });
        }

        res.json({ courses });
    } catch (error) {
        console.error('❌ Get courses error:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Get single course with enrollment status and reviews
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email bio')
            .populate('reviews.userId', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is enrolled (only if authenticated)
        let enrolled = false;
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Check if user is the instructor
                if (course.instructorId.toString() === decoded.userId.toString()) {
                    enrolled = true;
                } else {
                    const enrollment = await Enrollment.findOne({
                        userId: decoded.userId,
                        courseId: req.params.id
                    });
                    enrolled = !!enrollment;
                }
            } catch (error) {
                // Token is invalid, treat as unauthenticated
                console.log('Invalid token in course detail request');
            }
        }

        res.json({
            course,
            enrolled
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ message: 'Error fetching course' });
    }
});

// Post a review for a course (enrolled students only)
router.post('/:id/reviews', verifyToken, async (req, res) => {
    try {
        const { rating, text } = req.body;
        
        // Check if user is enrolled
        const enrollment = await Enrollment.findOne({
            userId: req.user._id,
            courseId: req.params.id
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'You must be enrolled to review this course' });
        }

        // Check if user already reviewed
        const course = await Course.findById(req.params.id);
        const existingReview = course.reviews.find(review => 
            review.userId.toString() === req.user._id.toString()
        );

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this course' });
        }

        // Add review
        course.reviews.push({
            userId: req.user._id,
            rating: parseInt(rating),
            text
        });

        // Update rating stats
        await course.updateRatingStats();

        res.json({
            message: 'Review posted successfully',
            course
        });
    } catch (error) {
        console.error('Post review error:', error);
        res.status(500).json({ message: 'Error posting review' });
    }
});

// Get course filter options
router.get('/filters/options', async (req, res) => {
    try {
        // Get existing categories from database
        const existingCategories = await Course.distinct('category');
        const existingLanguages = await Course.distinct('language');
        const existingLevels = await Course.distinct('level');
        
        // Comprehensive default options
        const defaultCategories = [
            'Programming & Development',
            'Web Development',
            'Mobile Development',
            'Data Science & Analytics',
            'Artificial Intelligence & Machine Learning',
            'Cybersecurity',
            'Cloud Computing',
            'Database Management',
            'Software Engineering',
            'UI/UX Design',
            'Graphic Design',
            'Digital Marketing',
            'Business & Entrepreneurship',
            'Project Management',
            'Finance & Accounting',
            'Language Learning',
            'Music & Audio',
            'Photography & Video',
            'Health & Fitness',
            'Cooking & Culinary Arts',
            'Art & Creativity',
            'Education & Teaching',
            'Personal Development',
            'Technology',
            'Science',
            'Mathematics',
            'History',
            'Literature',
            'Philosophy',
            'Religion & Spirituality',
            'Travel & Tourism',
            'Sports & Recreation',
            'Fashion & Beauty',
            'Automotive',
            'Home & Garden',
            'Parenting & Family',
            'Career Development',
            'Public Speaking',
            'Writing & Communication',
            'Research & Academic',
            'Environmental Science',
            'Medical & Healthcare',
            'Law & Legal Studies',
            'Agriculture',
            'Architecture',
            'Engineering',
            'Other'
        ];

        const defaultLanguages = [
            'English',
            'Tigrigna',
            'Amharic'
        ];

        const defaultLevels = [
            'Beginner',
            'Intermediate',
            'Advanced',
            'Expert',
            'All Levels'
        ];

        // Combine existing and default options, removing duplicates
        const categories = [...new Set([...existingCategories, ...defaultCategories])];
        const languages = [...new Set([...existingLanguages, ...defaultLanguages])];
        const levels = [...new Set([...existingLevels, ...defaultLevels])];
        
        res.json({
            categories: categories.sort(),
            languages: languages.sort(),
            levels: levels.sort()
        });
    } catch (error) {
        console.error('Get filter options error:', error);
        res.status(500).json({ message: 'Error fetching filter options' });
    }
});

// Create new course with video upload (instructor only)
router.post('/create-with-video', verifyToken, requireInstructor, uploadMixed.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, description, language, price, category, level } = req.body;

        console.log('📝 Course creation request received:');
        console.log('   Title:', title);
        console.log('   Files received:', req.files ? Object.keys(req.files) : 'No files');

        // Create course first
        const course = new Course({
            title,
            description,
            language,
            price: parseFloat(price),
            category,
            level,
            instructorId: req.user._id
        });

        await course.save();
        console.log('✅ Course created in database:', course._id);

        // Check if S3 is configured
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
            console.log('⚠️ S3 not configured, using local file storage as fallback');
            
            // Upload thumbnail if provided (local storage)
            if (req.files && req.files.thumbnail) {
                console.log('🖼️ Processing thumbnail upload (local)...');
                const thumbnailFile = req.files.thumbnail[0];
                const thumbnailUrl = `/uploads/${thumbnailFile.filename}`;
                course.thumbnail = thumbnailUrl;
                console.log('✅ Thumbnail saved locally:', thumbnailUrl);
            }

            // Upload video if provided (local storage)
            if (req.files && req.files.video) {
                console.log('📹 Processing video upload (local)...');
                const videoFile = req.files.video[0];
                const videoUrl = `/uploads/${videoFile.filename}`;
                course.videoUrl = videoUrl;
                console.log('✅ Video saved locally:', videoUrl);
            }

            // Update course with local URLs
            await course.save();

            res.status(201).json({
                message: 'Course created successfully with local file storage',
                course: {
                    _id: course._id,
                    title: course.title,
                    description: course.description,
                    language: course.language,
                    price: course.price,
                    category: course.category,
                    level: course.level,
                    videoUrl: course.videoUrl,
                    thumbnail: course.thumbnail,
                    instructorId: course.instructorId,
                    createdAt: course.createdAt
                }
            });
            return;
        }

        // S3 Upload Section
        console.log('☁️ S3 is configured, uploading to cloud storage...');

        // Upload thumbnail if provided
        if (req.files && req.files.thumbnail) {
            console.log('🖼️ Processing thumbnail upload to S3...');
            
            const thumbnailResult = await uploadThumbnailToS3(
                req.files.thumbnail[0].path,
                req.files.thumbnail[0].originalname,
                course._id.toString()
            );

            if (!thumbnailResult.success) {
                // Delete the course if thumbnail upload fails
                await Course.findByIdAndDelete(course._id);
                return res.status(500).json({ 
                    message: 'Failed to upload thumbnail to S3: ' + thumbnailResult.error,
                    error: thumbnailResult.error 
                });
            }

            course.thumbnail = thumbnailResult.thumbnailUrl;
            console.log('✅ Thumbnail uploaded to S3 successfully:', thumbnailResult.thumbnailUrl);
        } else {
            console.log('⚠️ No thumbnail file provided');
        }

        // Upload video if provided
        if (req.files && req.files.video) {
            console.log('📹 Processing video upload to S3...');
            
            const uploadResult = await uploadVideoToS3(
                req.files.video[0].path,
                req.files.video[0].originalname,
                course._id.toString()
            );

            if (!uploadResult.success) {
                // Delete the course if video upload fails
                await Course.findByIdAndDelete(course._id);
                return res.status(500).json({ 
                    message: 'Failed to upload video to S3: ' + uploadResult.error,
                    error: uploadResult.error 
                });
            }

            course.videoUrl = uploadResult.videoUrl;
            console.log('✅ Video uploaded to S3 successfully:', uploadResult.videoUrl);
        } else {
            console.log('⚠️ No video file provided');
        }

        // Update course with S3 URLs
        await course.save();
        console.log('💾 Course updated with S3 URLs in database');

        res.status(201).json({
            message: 'Course created successfully with S3 uploads',
            course: {
                _id: course._id,
                title: course.title,
                description: course.description,
                language: course.language,
                price: course.price,
                category: course.category,
                level: course.level,
                videoUrl: course.videoUrl,
                thumbnail: course.thumbnail,
                instructorId: course.instructorId,
                createdAt: course.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Create course with video error:', error);
        res.status(500).json({ message: 'Error creating course with video: ' + error.message });
    }
});

// Create new course (instructor only) - Keep existing route for backward compatibility
router.post('/', verifyToken, requireInstructor, async (req, res) => {
    try {
        const { title, description, language, price, category, level } = req.body;

        const course = new Course({
            title,
            description,
            language,
            price,
            category,
            level,
            instructorId: req.user._id
        });

        await course.save();

        res.status(201).json({
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Error creating course' });
    }
});

// Update course (instructor only)
router.put('/:id', verifyToken, requireInstructor, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Course updated successfully',
            course: updatedCourse
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Error updating course' });
    }
});

// Update course status (activate, close, archive)
router.patch('/:id/status', verifyToken, requireInstructor, async (req, res) => {
  console.log('🚀 updateCourseStatus route called');
  console.log('📥 Request details:', {
    courseId: req.params.id,
    status: req.body.status,
    userId: req.user._id,
    userRole: req.user.role
  });
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('🔍 Validating status:', status);
    
    // Validate status
    const validStatuses = ['draft', 'active', 'closed', 'archived'];
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status provided:', status);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    console.log('🔍 Finding course...');
    const course = await Course.findById(id);
    
    if (!course) {
      console.log('❌ Course not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    console.log('✅ Course found:', {
      courseId: course._id,
      title: course.title,
      currentStatus: course.status,
      instructorId: course.instructorId,
      isPublished: course.isPublished
    });
    
    // Check if user is the instructor
    if (course.instructorId.toString() !== req.user._id.toString()) {
      console.log('❌ User is not the instructor');
      return res.status(403).json({ 
        success: false, 
        message: 'Only the course instructor can update course status' 
      });
    }
    
    console.log('✅ User is authorized to update course');
    
    // Validate status transitions
    const currentStatus = course.status || (course.isPublished ? 'active' : 'draft');
    console.log('🔄 Status transition check:', { from: currentStatus, to: status });
    
    // Check if course can be activated
    if (status === 'active') {
      console.log('🔍 Checking activation requirements...');
      if (!course.videoUrl) {
        console.log('❌ Cannot activate: Missing video');
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot activate course: Video is required' 
        });
      }
      if (!course.thumbnail) {
        console.log('❌ Cannot activate: Missing thumbnail');
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot activate course: Thumbnail is required' 
        });
      }
      console.log('✅ Activation requirements met');
    }
    
    // Check if course can be archived
    if (status === 'archived') {
      console.log('🔍 Checking archive requirements...');
      const enrollmentCount = await Enrollment.countDocuments({ courseId: id });
      console.log('📊 Current enrollment count:', enrollmentCount);
      
      if (enrollmentCount > 0) {
        console.log('❌ Cannot archive: Course has enrolled students');
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot archive course: Students are currently enrolled. Close the course first.' 
        });
      }
      console.log('✅ Archive requirements met');
    }
    
    // Update course status
    console.log('🔄 Updating course status...');
    const oldStatus = course.status || (course.isPublished ? 'active' : 'draft');
    
    // Update both status and isPublished for backward compatibility
    const updateData = { status };
    if (status === 'active') {
      updateData.isPublished = true;
    } else if (status === 'draft') {
      updateData.isPublished = false;
    }
    
    console.log('📝 Update data:', updateData);
    
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    console.log('✅ Course updated successfully:', {
      courseId: updatedCourse._id,
      title: updatedCourse.title,
      newStatus: updatedCourse.status,
      isPublished: updatedCourse.isPublished
    });
    
    res.json({ 
      success: true, 
      message: `Course ${status}d successfully`,
      course: updatedCourse
    });
    
  } catch (error) {
    console.error('❌ Error in updateCourseStatus route:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Legacy publish route for backward compatibility
router.patch('/:id/publish', verifyToken, requireInstructor, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to publish this course' });
        }

        // Check if course has required content
        if (!course.videoUrl) {
            return res.status(400).json({ message: 'Course must have a video before publishing' });
        }

        if (!course.thumbnail) {
            return res.status(400).json({ message: 'Course must have a thumbnail before publishing' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { status: 'active', isPublished: true },
            { new: true }
        );

        res.json({
            message: 'Course published successfully',
            course: updatedCourse
        });
    } catch (error) {
        console.error('Publish course error:', error);
        res.status(500).json({ message: 'Error publishing course' });
    }
});

// Legacy unpublish route for backward compatibility
router.patch('/:id/unpublish', verifyToken, requireInstructor, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to unpublish this course' });
        }

        // Check if course has enrollments
        const enrollmentCount = await Enrollment.countDocuments({ courseId: req.params.id });
        if (enrollmentCount > 0) {
            return res.status(400).json({ 
                message: `Cannot unpublish course with ${enrollmentCount} enrolled students. Consider closing the course instead.` 
            });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { status: 'draft', isPublished: false },
            { new: true }
        );

        res.json({
            message: 'Course unpublished successfully',
            course: updatedCourse
        });
    } catch (error) {
        console.error('Unpublish course error:', error);
        res.status(500).json({ message: 'Error unpublishing course' });
    }
});

// Upload video for course to S3
router.post('/:id/video', verifyToken, requireInstructor, uploadVideo.single('video'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        // Check if S3 is configured
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
            console.log('⚠️ S3 not configured, using local file storage as fallback');
            
            // Use local file storage
            const videoUrl = `/uploads/${req.file.filename}`;
            course.videoUrl = videoUrl;
            await course.save();

            res.json({
                message: 'Video uploaded successfully to local storage',
                videoUrl: videoUrl
            });
            return;
        }

        // Upload to S3
        const uploadResult = await uploadVideoToS3(
            req.file.path,
            req.file.originalname,
            course._id.toString()
        );

        if (!uploadResult.success) {
            return res.status(500).json({ message: 'Failed to upload video to S3: ' + uploadResult.error });
        }

        // Update course with S3 video URL
        course.videoUrl = uploadResult.videoUrl;
        await course.save();

        res.json({
            message: 'Video uploaded successfully to S3',
            videoUrl: uploadResult.videoUrl
        });
    } catch (error) {
        console.error('Upload video error:', error);
        res.status(500).json({ message: 'Error uploading video' });
    }
});

// Upload thumbnail for course to S3
router.post('/:id/thumbnail', verifyToken, requireInstructor, uploadImage.single('thumbnail'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No thumbnail file uploaded' });
        }

        // Check if S3 is configured
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
            console.log('⚠️ S3 not configured, using local file storage as fallback');
            
            // Use local file storage
            const thumbnailUrl = `/uploads/${req.file.filename}`;
            course.thumbnail = thumbnailUrl;
            await course.save();

            res.json({
                message: 'Thumbnail uploaded successfully to local storage',
                thumbnailUrl: thumbnailUrl
            });
            return;
        }

        // Upload to S3
        const uploadResult = await uploadThumbnailToS3(
            req.file.path,
            req.file.originalname,
            course._id.toString()
        );

        if (!uploadResult.success) {
            return res.status(500).json({ message: 'Failed to upload thumbnail to S3: ' + uploadResult.error });
        }

        // Update course with S3 thumbnail URL
        course.thumbnail = uploadResult.thumbnailUrl;
        await course.save();

        res.json({
            message: 'Thumbnail uploaded successfully to S3',
            thumbnailUrl: uploadResult.thumbnailUrl
        });
    } catch (error) {
        console.error('Upload thumbnail error:', error);
        res.status(500).json({ message: 'Error uploading thumbnail' });
    }
});

// Get instructor's courses
router.get('/instructor/my-courses', verifyToken, requireInstructor, async (req, res) => {
    try {
        console.log('📡 Fetching instructor courses for user:', req.user._id);
        
        const courses = await Course.find({ instructorId: req.user._id })
            .select('title description language price category level thumbnail videoUrl instructorId createdAt status isPublished')
            .sort({ createdAt: -1 });

        console.log('📥 Found', courses.length, 'courses for instructor');
        
        // Add enrollment count for each course
        const coursesWithEnrollments = await Promise.all(
            courses.map(async (course) => {
                const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
                console.log(`📊 Course "${course.title}" has ${enrollmentCount} enrollments`);
                
                return {
                    ...course.toObject(),
                    enrollmentCount
                };
            })
        );

        if (coursesWithEnrollments.length > 0) {
            console.log('🔍 Sample course data:', {
                id: coursesWithEnrollments[0]._id,
                title: coursesWithEnrollments[0].title,
                status: coursesWithEnrollments[0].status,
                isPublished: coursesWithEnrollments[0].isPublished,
                enrollmentCount: coursesWithEnrollments[0].enrollmentCount,
                hasVideo: !!coursesWithEnrollments[0].videoUrl,
                hasThumbnail: !!coursesWithEnrollments[0].thumbnail
            });
        }

        res.json({ courses: coursesWithEnrollments });
    } catch (error) {
        console.error('❌ Get instructor courses error:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Get student's enrolled courses
router.get('/student/enrolled', verifyToken, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ userId: req.user._id })
            .populate({
                path: 'courseId',
                select: 'title description language price category level thumbnail videoUrl instructorId createdAt',
                populate: { path: 'instructor', select: 'name email' }
            })
            .sort({ enrolledAt: -1 });

        console.log('Student enrollments found:', enrollments.length);
        if (enrollments.length > 0) {
            console.log('Sample enrollment course data:', enrollments[0].courseId);
            console.log('Sample enrollment course instructorId:', enrollments[0].courseId.instructorId);
        }

        res.json({ courses: enrollments });
    } catch (error) {
        console.error('Get enrolled courses error:', error);
        res.status(500).json({ message: 'Error fetching enrolled courses' });
    }
});

// Check if user is enrolled in a course
router.get('/:id/enrollment-status', verifyToken, async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            userId: req.user._id,
            courseId: req.params.id
        });

        res.json({
            isEnrolled: !!enrollment,
            enrollment: enrollment || null
        });
    } catch (error) {
        console.error('Check enrollment error:', error);
        res.status(500).json({ message: 'Error checking enrollment' });
    }
});

// Enroll user in a course (after successful payment)
router.post('/:id/enroll', verifyToken, async (req, res) => {
    try {
        console.log('🎓 Enrollment request received:', {
            courseId: req.params.id,
            userId: req.user._id,
            userRole: req.user.role
        });

        // Check if user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                message: 'Only students can enroll in courses' 
            });
        }

        const courseId = req.params.id;
        const userId = req.user._id;

        // Check if course exists and is published/active
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check course status
        if (course.status === 'draft' || course.status === 'archived') {
            return res.status(400).json({ 
                message: 'This course is not available for enrollment' 
            });
        }

        // For legacy courses without status field, check isPublished
        if (!course.status && !course.isPublished) {
            return res.status(400).json({ 
                message: 'This course is not published yet' 
            });
        }

        // Check if user is already enrolled
        const existingEnrollment = await Enrollment.findOne({
            userId: userId,
            courseId: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ 
                message: 'You are already enrolled in this course' 
            });
        }

        // Create enrollment
        const enrollment = new Enrollment({
            userId: userId,
            courseId: courseId,
            enrolledAt: new Date(),
            paymentStatus: 'completed', // Since this is called after successful payment
            amount: course.price
        });

        await enrollment.save();

        // Update course enrollment count
        await Course.findByIdAndUpdate(courseId, {
            $inc: { enrollmentCount: 1 }
        });

        console.log('✅ Enrollment successful:', {
            courseId: courseId,
            userId: userId,
            enrollmentId: enrollment._id
        });

        res.json({
            success: true,
            message: 'Successfully enrolled in course',
            enrollment: {
                id: enrollment._id,
                courseId: enrollment.courseId,
                enrolledAt: enrollment.enrolledAt,
                paymentStatus: enrollment.paymentStatus,
                amount: enrollment.amount
            }
        });

    } catch (error) {
        console.error('❌ Enrollment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error enrolling in course',
            error: error.message 
        });
    }
});

module.exports = router; 