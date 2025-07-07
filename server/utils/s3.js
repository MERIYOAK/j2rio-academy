const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateSignedUrl = (key) => {
  try {
    console.log('🔑 Generating signed URL for key:', key);
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 60 * 60 // 1 hour
    };

    console.log('🔑 S3 params:', {
      Bucket: params.Bucket,
      Key: params.Key,
      Expires: params.Expires
    });

    const signedUrl = s3.getSignedUrl('getObject', params);
    console.log('✅ Signed URL generated successfully');
    
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw error;
  }
};

module.exports = generateSignedUrl; 