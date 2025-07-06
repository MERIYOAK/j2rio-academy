# Edu Platform Frontend

A React frontend for the educational platform with multilingual support, authentication, and course management.

## Features

- Multilingual support (English, Tigrigna, Amharic)
- User authentication and authorization
- Course browsing and enrollment
- Instructor dashboard
- Student dashboard
- Video player integration
- Stripe payment integration
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
REACT_APP_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   ├── Footer.js       # Footer component
│   └── *.css           # Component styles
├── pages/              # Page components
│   ├── Home.js         # Home page
│   ├── Courses.js      # Course listing
│   ├── CourseDetail.js # Single course view
│   ├── Login.js        # Login page
│   ├── Register.js     # Registration page
│   ├── Dashboard.js    # User dashboard
│   └── UploadCourse.js # Course upload (instructor)
├── context/            # React context providers
│   └── AuthContext.js  # Authentication context
├── utils/              # Utility functions
│   └── api.js          # API client
├── i18n/               # Internationalization
│   ├── index.js        # i18n configuration
│   └── locales/        # Translation files
├── assets/             # Static assets
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles
```

## Technologies Used

- React 18
- React Router DOM
- Axios for API calls
- React i18next for internationalization
- CSS3 with responsive design

## Language Support

The application supports three languages:
- English (en)
- Tigrigna (ti)
- Amharic (am)

Language can be changed using the language switcher in the header.

## API Integration

The frontend communicates with the backend API through the `api.js` utility. All API calls include automatic authentication token handling and error management.

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Development

To add new features:

1. Create new components in the `components/` directory
2. Add new pages in the `pages/` directory
3. Update routing in `App.js`
4. Add translations to the locale files
5. Style components with CSS

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder. 