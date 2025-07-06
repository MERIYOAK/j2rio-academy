const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Debug: Check if .env file is being loaded
console.log('🔍 Environment check:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure .env file exists in the server directory');
    console.error('2. Check that .env file has no extra spaces or quotes');
    console.error('3. Verify the file format: KEY=value (no spaces around =)');
    console.error('4. Try restarting the server after creating .env file');
    process.exit(1);
}

// Database connection
const mongoUri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('💡 Please check your MongoDB URI in the .env file');
    process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/instructor', require('./routes/instructor'));
app.use('/api/video', require('./routes/video'));

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ 
        message: 'Edu Platform API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV}`);
}); 