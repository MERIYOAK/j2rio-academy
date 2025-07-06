const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { verifyToken } = require('../middlewares/auth');
const { uploadProfileImageToS3 } = require('../utils/s3Upload');

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadProfileImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
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

// Register user with profile image
router.post('/register', uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
        const { name, email, password, role, language } = req.body;

        console.log('📝 User registration request:');
        console.log('   Name:', name);
        console.log('   Email:', email);
        console.log('   Role:', role);
        console.log('   Profile image:', req.file ? 'Uploaded' : 'None');

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user first (without profile image)
        const user = new User({
            name,
            email,
            password,
            role: role || 'student',
            language: language || 'en'
        });

        await user.save();
        console.log('✅ User created successfully with ID:', user._id);

        let profilePictureUrl = '';

        // Handle profile image upload after user creation
        if (req.file) {
            console.log('🖼️ Processing profile image upload...');
            
            // Check if S3 is configured
            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
                // Upload to S3 using the actual user ID
                const uploadResult = await uploadProfileImageToS3(
                    req.file.path,
                    req.file.originalname,
                    user._id.toString() // Use actual user ID
                );

                if (uploadResult.success) {
                    profilePictureUrl = uploadResult.profileImageUrl;
                    console.log('✅ Profile image uploaded to S3:', profilePictureUrl);
                    
                    // Update user with profile image URL
                    user.profilePicture = profilePictureUrl;
                    await user.save();
                    console.log('✅ User profile updated with S3 image URL');
                } else {
                    console.log('⚠️ S3 upload failed, using local storage');
                    profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
                    user.profilePicture = profilePictureUrl;
                    await user.save();
                }
            } else {
                // Use local storage
                profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
                user.profilePicture = profilePictureUrl;
                await user.save();
                console.log('✅ Profile image saved locally:', profilePictureUrl);
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User registration completed successfully');

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                language: user.language,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Clean up uploaded file if user creation failed
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Cleaned up uploaded file after error');
            } catch (cleanupError) {
                console.error('❌ Error cleaning up file:', cleanupError);
            }
        }
        
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 User login attempt:');
        console.log('   Email:', email);
        console.log('   Password provided:', password ? 'Yes' : 'No');

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ Login failed: User not found');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        console.log('✅ User found:', {
            id: user._id,
            name: user.name,
            role: user.role,
            email: user.email
        });

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('❌ Login failed: Invalid password');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        console.log('✅ Password validated successfully');

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ JWT token generated, login successful');

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
    try {
        console.log('👤 Profile request for user:', {
            id: req.user._id,
            name: req.user.name,
            role: req.user.role
        });

        res.json({
            user: req.user.toJSON()
        });
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update user profile with image
router.put('/me', verifyToken, uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
        const { name, bio, language } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (language) updates.language = language;

        // Handle profile image upload
        if (req.file) {
            console.log('🖼️ Processing profile image update...');
            
            // Check if S3 is configured
            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
                // Upload to S3 using the new organized structure
                const uploadResult = await uploadProfileImageToS3(
                    req.file.path,
                    req.file.originalname,
                    req.user._id.toString()
                );

                if (uploadResult.success) {
                    updates.profilePicture = uploadResult.profileImageUrl;
                    console.log('✅ Profile image updated on S3:', uploadResult.profileImageUrl);
                } else {
                    console.log('⚠️ S3 upload failed, using local storage');
                    updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
                }
            } else {
                // Use local storage
                updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
                console.log('✅ Profile image updated locally:', updates.profilePicture);
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        console.log('✅ Profile updated successfully');

        res.json({
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile: ' + error.message });
    }
});

module.exports = router; 