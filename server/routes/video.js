const express = require('express');
const router = express.Router();
const generateSignedUrl = require('../utils/s3');
const { verifyToken } = require('../middlewares/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @route GET /api/video/:courseId
// @desc  Return pre-signed URL for video if user is enrolled or is the instructor
// @access Private (must be enrolled or be the instructor)
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    console.log('🔐 Video access request:');
    console.log('   Course ID:', courseId);
    console.log('   User ID:', userId);

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the instructor of this course
    const isInstructor = course.instructorId.toString() === userId.toString();
    
    if (isInstructor) {
      console.log('✅ User is the instructor, allowing access without enrollment check');
    } else {
      // Check if user is enrolled in this course
      const enrollment = await Enrollment.findOne({
        userId: userId,
        courseId: courseId
      });

      if (!enrollment) {
        console.log('❌ User not enrolled in course and not the instructor');
        return res.status(403).json({ 
          message: 'You must be enrolled in this course to access the video' 
        });
      }
      console.log('✅ User is enrolled, allowing access');
    }

    // Check if course has a video
    if (!course.videoUrl) {
      console.log('❌ Course has no video');
      return res.status(404).json({ message: 'This course has no video content' });
    }

    // Extract the S3 key from the video URL
    // Assuming videoUrl is like: https://bucket.s3.region.amazonaws.com/courses/courseId/videos/filename.mp4
    const videoUrl = course.videoUrl;
    let s3Key = '';

    if (videoUrl.includes('amazonaws.com/')) {
      // Extract key from S3 URL and decode it
      const urlParts = videoUrl.split('amazonaws.com/');
      s3Key = decodeURIComponent(urlParts[1]);
      console.log('🔑 Original S3 Video URL:', videoUrl);
      console.log('🔑 Extracted and decoded S3 Video Key:', s3Key);
    } else if (videoUrl.startsWith('/uploads/')) {
      // Local file - return the URL directly
      console.log('✅ Local video file, returning direct URL');
      return res.json({ 
        url: `http://localhost:5000${videoUrl}`,
        type: 'local'
      });
    } else {
      console.log('❌ Invalid video URL format');
      return res.status(500).json({ message: 'Invalid video URL format' });
    }

    console.log('🔑 S3 Key extracted:', s3Key);

    // Generate pre-signed URL
    const signedUrl = generateSignedUrl(s3Key);
    
    console.log('✅ Pre-signed URL generated successfully');
    console.log('   Presigned Video URL:', signedUrl);
    console.log('   Expires in: 1 hour');
    console.log('   Access type:', isInstructor ? 'Instructor (No Enrollment Required)' : 'Enrolled Student');

    res.json({ 
      url: signedUrl,
      type: 's3',
      expiresIn: 3600, // 1 hour in seconds
      accessType: isInstructor ? 'instructor' : 'enrolled'
    });

  } catch (err) {
    console.error('❌ Video access error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/video/thumbnail/:courseId
// @desc  Return pre-signed URL for thumbnail if user is enrolled or is the instructor
// @access Private (must be enrolled or be the instructor)
router.get('/thumbnail/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    console.log('🖼️ Thumbnail access request:');
    console.log('   Course ID:', courseId);
    console.log('   User ID:', userId);
    console.log('   User object:', {
      _id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      email: req.user.email
    });

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('✅ Course found:', {
      courseId: course._id,
      title: course.title,
      instructorId: course.instructorId,
      hasThumbnail: !!course.thumbnail,
      thumbnailUrl: course.thumbnail
    });

    // Check if user is the instructor of this course
    const isInstructor = course.instructorId.toString() === userId.toString();
    
    console.log('🔍 Instructor check:', {
      courseInstructorId: course.instructorId.toString(),
      userId: userId.toString(),
      isInstructor: isInstructor
    });
    
    if (isInstructor) {
      console.log('✅ User is the instructor, allowing thumbnail access without enrollment check');
    } else {
      // Check if user is enrolled in this course
      const enrollment = await Enrollment.findOne({
        userId: userId,
        courseId: courseId
      });

      console.log('🔍 Enrollment check:', {
        enrollmentFound: !!enrollment,
        enrollmentDetails: enrollment ? {
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          enrolledAt: enrollment.createdAt
        } : null
      });

      if (!enrollment) {
        console.log('❌ User not enrolled in course and not the instructor');
        return res.status(403).json({ 
          message: 'You must be enrolled in this course to access the thumbnail' 
        });
      }
      console.log('✅ User is enrolled, allowing thumbnail access');
    }

    // Check if course has a thumbnail
    if (!course.thumbnail) {
      console.log('❌ Course has no thumbnail');
      return res.status(404).json({ message: 'This course has no thumbnail' });
    }

    // Extract the S3 key from the thumbnail URL
    const thumbnailUrl = course.thumbnail;
    let s3Key = '';

    if (thumbnailUrl.includes('amazonaws.com/')) {
      // Extract key from S3 URL and decode it
      const urlParts = thumbnailUrl.split('amazonaws.com/');
      s3Key = decodeURIComponent(urlParts[1]);
      console.log('🔑 Original S3 Thumbnail URL:', thumbnailUrl);
      console.log('🔑 Extracted and decoded S3 Thumbnail Key:', s3Key);
    } else if (thumbnailUrl.startsWith('/uploads/')) {
      // Local file - return the URL directly
      console.log('✅ Local thumbnail file, returning direct URL');
      return res.json({ 
        url: `http://localhost:5000${thumbnailUrl}`,
        type: 'local'
      });
    } else {
      console.log('❌ Invalid thumbnail URL format');
      return res.status(500).json({ message: 'Invalid thumbnail URL format' });
    }

    console.log('🔑 S3 Thumbnail Key extracted:', s3Key);

    // Generate pre-signed URL
    const signedUrl = generateSignedUrl(s3Key);
    
    console.log('✅ Pre-signed thumbnail URL generated successfully');
    console.log('   Access type:', isInstructor ? 'Instructor (No Enrollment Required)' : 'Enrolled Student');

    res.json({ 
      url: signedUrl,
      type: 's3',
      expiresIn: 3600, // 1 hour in seconds
      accessType: isInstructor ? 'instructor' : 'enrolled'
    });

  } catch (err) {
    console.error('❌ Thumbnail access error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/video/thumbnail/public/:courseId
// @desc  Return pre-signed URL for thumbnail for public course browsing (no auth required)
// @access Public (for course listings and home page)
router.get('/thumbnail/public/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    console.log('🖼️ Public thumbnail access request:');
    console.log('   Course ID:', courseId);

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if course has a thumbnail
    if (!course.thumbnail) {
      console.log('❌ Course has no thumbnail');
      return res.status(404).json({ message: 'This course has no thumbnail' });
    }

    // Extract the S3 key from the thumbnail URL
    const thumbnailUrl = course.thumbnail;
    let s3Key = '';

    if (thumbnailUrl.includes('amazonaws.com/')) {
      // Extract key from S3 URL and decode it
      const urlParts = thumbnailUrl.split('amazonaws.com/');
      s3Key = decodeURIComponent(urlParts[1]);
      console.log('🔑 Original S3 Thumbnail URL:', thumbnailUrl);
      console.log('🔑 Extracted and decoded S3 Thumbnail Key:', s3Key);
    } else if (thumbnailUrl.startsWith('/uploads/')) {
      // Local file - return the URL directly
      console.log('✅ Local thumbnail file, returning direct URL');
      return res.json({ 
        url: `http://localhost:5000${thumbnailUrl}`,
        type: 'local'
      });
    } else {
      console.log('❌ Invalid thumbnail URL format');
      return res.status(500).json({ message: 'Invalid thumbnail URL format' });
    }

    console.log('🔑 S3 Thumbnail Key extracted:', s3Key);

    // Generate pre-signed URL
    const signedUrl = generateSignedUrl(s3Key);
    
    console.log('✅ Public pre-signed thumbnail URL generated successfully');
    console.log('   Access type: Public (for course browsing)');

    res.json({ 
      url: signedUrl,
      type: 's3',
      expiresIn: 3600, // 1 hour in seconds
      accessType: 'public'
    });

  } catch (err) {
    console.error('❌ Public thumbnail access error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/video/profile/:userId
// @desc  Return pre-signed URL for profile image
// @access Private (authenticated users only)
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    console.log('🖼️ Profile image access request:');
    console.log('   Requested User ID:', userId);
    console.log('   Current User ID:', currentUserId);

    // Find the user
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a profile picture
    if (!user.profilePicture) {
      console.log('❌ User has no profile picture');
      return res.status(404).json({ message: 'User has no profile picture' });
    }

    // Extract the S3 key from the profile picture URL
    const profilePictureUrl = user.profilePicture;
    let s3Key = '';

    if (profilePictureUrl.includes('amazonaws.com/')) {
      // Extract key from S3 URL and decode it
      const urlParts = profilePictureUrl.split('amazonaws.com/');
      s3Key = decodeURIComponent(urlParts[1]);
      console.log('🔑 Original S3 URL:', profilePictureUrl);
      console.log('🔑 Extracted and decoded S3 Key:', s3Key);
    } else if (profilePictureUrl.startsWith('/uploads/')) {
      // Local file - return the URL directly
      console.log('✅ Local profile image, returning direct URL');
      return res.json({ 
        url: `http://localhost:5000${profilePictureUrl}`,
        type: 'local'
      });
    } else {
      console.log('❌ Invalid profile image URL format');
      return res.status(500).json({ message: 'Invalid profile image URL format' });
    }

    // Generate pre-signed URL
    const signedUrl = generateSignedUrl(s3Key);
    
    console.log('✅ Pre-signed profile image URL generated successfully');

    res.json({ 
      url: signedUrl,
      type: 's3',
      expiresIn: 3600 // 1 hour in seconds
    });

  } catch (err) {
    console.error('❌ Profile image access error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/video/demo/:courseId
// @desc  Demo endpoint to show presigned URL generation (for testing)
// @access Private
router.get('/demo/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    console.log('🎬 Demo Video URL Generation:');
    console.log('   Course ID:', courseId);
    console.log('   User ID:', userId);

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found',
        demo: {
          courseId,
          userId,
          access: 'denied',
          reason: 'Course not found'
        }
      });
    }

    // Check if user is the instructor
    const isInstructor = course.instructorId.toString() === userId.toString();
    
    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId
    });
    const isEnrolled = !!enrollment;

    // Determine access
    let accessGranted = false;
    let accessType = 'denied';
    let reason = 'Not authorized';

    if (isInstructor) {
      accessGranted = true;
      accessType = 'instructor';
      reason = 'User is the course instructor';
    } else if (isEnrolled) {
      accessGranted = true;
      accessType = 'enrolled';
      reason = 'User is enrolled in the course';
    }

    // Prepare demo response
    const demoResponse = {
      courseId,
      userId,
      courseTitle: course.title,
      instructorId: course.instructorId,
      isInstructor,
      isEnrolled,
      accessGranted,
      accessType,
      reason,
      hasVideo: !!course.videoUrl,
      hasThumbnail: !!course.thumbnail,
      videoUrl: course.videoUrl,
      thumbnailUrl: course.thumbnail
    };

    if (accessGranted && course.videoUrl) {
      // Extract S3 key and generate signed URL
      const videoUrl = course.videoUrl;
      let s3Key = '';

      if (videoUrl.includes('amazonaws.com/')) {
        const urlParts = videoUrl.split('amazonaws.com/');
        s3Key = decodeURIComponent(urlParts[1]);
        
        const signedUrl = generateSignedUrl(s3Key);
        demoResponse.presignedVideoUrl = signedUrl;
        demoResponse.s3Key = s3Key;
        demoResponse.expiresIn = '1 hour';
      } else if (videoUrl.startsWith('/uploads/')) {
        demoResponse.presignedVideoUrl = `http://localhost:5000${videoUrl}`;
        demoResponse.type = 'local';
      }
    }

    if (accessGranted && course.thumbnail) {
      // Extract S3 key and generate signed URL for thumbnail
      const thumbnailUrl = course.thumbnail;
      let s3Key = '';

      if (thumbnailUrl.includes('amazonaws.com/')) {
        const urlParts = thumbnailUrl.split('amazonaws.com/');
        s3Key = decodeURIComponent(urlParts[1]);
        
        const signedUrl = generateSignedUrl(s3Key);
        demoResponse.presignedThumbnailUrl = signedUrl;
        demoResponse.thumbnailS3Key = s3Key;
      } else if (thumbnailUrl.startsWith('/uploads/')) {
        demoResponse.presignedThumbnailUrl = `http://localhost:5000${thumbnailUrl}`;
      }
    }

    console.log('✅ Demo response generated:', {
      accessGranted,
      accessType,
      hasPresignedVideo: !!demoResponse.presignedVideoUrl,
      hasPresignedThumbnail: !!demoResponse.presignedThumbnailUrl
    });

    res.json({
      message: accessGranted ? 'Access granted' : 'Access denied',
      demo: demoResponse
    });

  } catch (err) {
    console.error('❌ Demo error:', err);
    res.status(500).json({ 
      message: 'Server error',
      demo: {
        error: err.message
      }
    });
  }
});

module.exports = router; 