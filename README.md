# Edu Platform - Full Stack Educational Platform

A comprehensive educational platform built with the MERN stack (MongoDB, Express, React, Node.js) featuring multilingual support, video course management, and Stripe payment integration.

## 🌟 Features

### For Students
- Browse and search courses
- Enroll in courses with Stripe payments
- Watch video content
- Track learning progress
- Multilingual interface (English, Tigrigna, Amharic)

### For Instructors
- Create and upload video courses
- Manage course content
- Track student enrollments
- Set course pricing
- Publish/unpublish courses

### Technical Features
- JWT authentication
- Role-based access control
- Video upload and streaming
- Stripe payment integration
- Responsive design
- Internationalization (i18n)

## 🏗️ Project Structure

```
/edu-platform
├── /server            # Backend (Node.js + Express)
│   ├── /controllers   # Route controllers
│   ├── /models        # MongoDB models
│   ├── /routes        # API routes
│   ├── /middlewares   # Custom middlewares
│   ├── /utils         # Utility functions
│   ├── /uploads       # Video uploads
│   └── index.js       # Server entry point
├── /client            # Frontend (React)
│   ├── /src
│   │   ├── /components # Reusable components
│   │   ├── /pages      # Page components
│   │   ├── /context    # React context
│   │   ├── /utils      # Utility functions
│   │   ├── /i18n       # Internationalization
│   │   └── /assets     # Static assets
│   └── public          # Public files
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Stripe account (for payments)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
# Create .env file
MONGODB_URI=mongodb://localhost:27017/edu-platform
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
# Create .env file
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Course Endpoints
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create new course (instructor only)
- `PUT /api/courses/:id` - Update course (instructor only)
- `POST /api/courses/:id/video` - Upload video for course
- `GET /api/courses/instructor/my-courses` - Get instructor's courses
- `GET /api/courses/student/enrolled` - Get student's enrolled courses

### Payment Endpoints
- `POST /api/payment/create-checkout-session` - Create Stripe checkout
- `POST /api/payment/webhook` - Stripe webhook handler
- `GET /api/payment/status/:sessionId` - Get payment status
- `GET /api/payment/history` - Get payment history

## 🌍 Multilingual Support

The platform supports three languages:
- **English** (en) - Default language
- **Tigrigna** (ti) - Tigrigna language support
- **Amharic** (am) - Amharic language support

Language can be changed using the language switcher in the header.

## 💳 Payment Integration

The platform uses Stripe for payment processing:
- Secure checkout sessions
- Webhook handling for payment confirmation
- Support for multiple currencies
- Automatic enrollment after successful payment

## 🎥 Video Management

- Video upload support (MP4, AVI, MOV, WMV, FLV, WebM)
- File size limit: 500MB
- Local storage for development
- AWS S3 integration ready for production

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation and sanitization

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones

## 🛠️ Development

### Adding New Features

1. **Backend**: Add routes, controllers, and models in the server directory
2. **Frontend**: Create components and pages in the client directory
3. **Translations**: Add new keys to all language files in `/client/src/i18n/locales/`
4. **Styling**: Use component-scoped CSS files

### Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent indentation
- Use ES6+ features where appropriate

## 🚀 Deployment

### Backend Deployment
- Deploy to Render, Railway, or Heroku
- Set environment variables
- Configure MongoDB Atlas connection
- Set up Stripe webhooks

### Frontend Deployment
- Build the React app: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Configure environment variables

### Database
- Use MongoDB Atlas for production
- Set up proper indexes for performance
- Configure backup and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Future Enhancements

- Mobile app (React Native)
- Advanced analytics dashboard
- Course certificates
- Discussion forums
- Live streaming capabilities
- Advanced search and filtering
- Course recommendations
- Social learning features

---

**Built with ❤️ for education** 