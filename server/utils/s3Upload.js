const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.AWS_S3_BUCKET;

// Debug function to check S3 configuration
const checkS3Config = () => {
    console.log('🔍 S3 Configuration Check:');
    console.log('   AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set');
    console.log('   AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set');
    console.log('   AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
    console.log('   AWS_S3_BUCKET:', bucketName || '❌ Not set');
};

// Upload video to S3 with organized folder structure
const uploadVideoToS3 = async (filePath, fileName, courseId) => {
    try {
        // Check S3 configuration first
        checkS3Config();
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        console.log('📁 File details:');
        console.log('   Path:', filePath);
        console.log('   Name:', fileName);
        console.log('   Size:', fs.statSync(filePath).size, 'bytes');
        console.log('   Course ID:', courseId);
        
        // Read file
        const fileContent = fs.readFileSync(filePath);
        console.log('📖 File read successfully, size:', fileContent.length, 'bytes');
        
        // Create unique key for S3 with organized folder structure
        const key = `courses/videos/${courseId}-${Date.now()}-${fileName}`;
        console.log('🔑 S3 Key:', key);
        
        // Upload parameters
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: 'video/mp4',
            Metadata: {
                'course-id': courseId,
                'upload-date': new Date().toISOString()
            }
        };
        
        console.log('🚀 Starting S3 upload...');
        
        // Upload to S3
        const result = await s3.upload(uploadParams).promise();
        
        console.log('✅ S3 upload successful!');
        console.log('   Location:', result.Location);
        console.log('   Key:', result.Key);
        
        // Clean up local file
        fs.unlinkSync(filePath);
        console.log('🗑️ Local file cleaned up');
        
        return {
            success: true,
            videoUrl: result.Location,
            key: result.Key
        };
        
    } catch (error) {
        console.error('❌ S3 upload error:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        
        // Clean up local file if it exists
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('🗑️ Local file cleaned up after error');
            } catch (cleanupError) {
                console.error('❌ Error cleaning up local file:', cleanupError.message);
            }
        }
        
        return {
            success: false,
            error: error.message,
            errorCode: error.code,
            errorName: error.name
        };
    }
};

// Upload thumbnail to S3 with organized folder structure
const uploadThumbnailToS3 = async (filePath, fileName, courseId) => {
    try {
        // Check S3 configuration first
        checkS3Config();
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        console.log('📁 Thumbnail file details:');
        console.log('   Path:', filePath);
        console.log('   Name:', fileName);
        console.log('   Size:', fs.statSync(filePath).size, 'bytes');
        console.log('   Course ID:', courseId);
        
        // Read file
        const fileContent = fs.readFileSync(filePath);
        console.log('📖 Thumbnail file read successfully, size:', fileContent.length, 'bytes');
        
        // Create unique key for S3 with organized folder structure
        const key = `courses/thumbnails/${courseId}-${Date.now()}-${fileName}`;
        console.log('🔑 S3 Thumbnail Key:', key);
        
        // Determine content type based on file extension
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'image/jpeg'; // default
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        
        // Upload parameters
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            Metadata: {
                'course-id': courseId,
                'upload-date': new Date().toISOString()
            }
        };
        
        console.log('🚀 Starting S3 thumbnail upload...');
        
        // Upload to S3
        const result = await s3.upload(uploadParams).promise();
        
        console.log('✅ S3 thumbnail upload successful!');
        console.log('   Location:', result.Location);
        console.log('   Key:', result.Key);
        
        // Clean up local file
        fs.unlinkSync(filePath);
        console.log('🗑️ Local thumbnail file cleaned up');
        
        return {
            success: true,
            thumbnailUrl: result.Location,
            key: result.Key
        };
        
    } catch (error) {
        console.error('❌ S3 thumbnail upload error:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        
        // Clean up local file if it exists
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('🗑️ Local thumbnail file cleaned up after error');
            } catch (cleanupError) {
                console.error('❌ Error cleaning up local thumbnail file:', cleanupError.message);
            }
        }
        
        return {
            success: false,
            error: error.message,
            errorCode: error.code,
            errorName: error.name
        };
    }
};

// Upload user profile image to S3 with organized folder structure
const uploadProfileImageToS3 = async (filePath, fileName, userId) => {
    try {
        // Check S3 configuration first
        checkS3Config();
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        console.log('📁 Profile image file details:');
        console.log('   Path:', filePath);
        console.log('   Name:', fileName);
        console.log('   Size:', fs.statSync(filePath).size, 'bytes');
        console.log('   User ID:', userId);
        
        // Read file
        const fileContent = fs.readFileSync(filePath);
        console.log('📖 Profile image file read successfully, size:', fileContent.length, 'bytes');
        
        // Create unique key for S3 with organized folder structure
        const key = `users/${userId}-${Date.now()}-${fileName}`;
        console.log('🔑 S3 Profile Image Key:', key);
        
        // Determine content type based on file extension
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'image/jpeg'; // default
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        
        // Upload parameters
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            Metadata: {
                'user-id': userId,
                'upload-date': new Date().toISOString()
            }
        };
        
        console.log('🚀 Starting S3 profile image upload...');
        
        // Upload to S3
        const result = await s3.upload(uploadParams).promise();
        
        console.log('✅ S3 profile image upload successful!');
        console.log('   Location:', result.Location);
        console.log('   Key:', result.Key);
        
        // Clean up local file
        fs.unlinkSync(filePath);
        console.log('🗑️ Local profile image file cleaned up');
        
        return {
            success: true,
            profileImageUrl: result.Location,
            key: result.Key
        };
        
    } catch (error) {
        console.error('❌ S3 profile image upload error:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        
        // Clean up local file if it exists
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('🗑️ Local profile image file cleaned up after error');
            } catch (cleanupError) {
                console.error('❌ Error cleaning up local profile image file:', cleanupError.message);
            }
        }
        
        return {
            success: false,
            error: error.message,
            errorCode: error.code,
            errorName: error.name
        };
    }
};

// Delete file from S3
const deleteFileFromS3 = async (key) => {
    try {
        const deleteParams = {
            Bucket: bucketName,
            Key: key
        };
        
        await s3.deleteObject(deleteParams).promise();
        return { success: true };
        
    } catch (error) {
        console.error('S3 delete error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    uploadVideoToS3,
    uploadThumbnailToS3,
    uploadProfileImageToS3,
    deleteFileFromS3,
    checkS3Config
}; 