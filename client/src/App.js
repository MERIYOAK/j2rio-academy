import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Import i18n configuration
import './i18n';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ScrollToTopButton';

// Import pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UploadCourse from './pages/UploadCourse';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

// Import context
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main App Component
const AppContent = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  // Handle language change
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    setCurrentLanguage(language);
  };

  // Set initial language
  useEffect(() => {
    i18n.changeLanguage(currentLanguage);
  }, [currentLanguage, i18n]);

  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <Header 
          currentLanguage={currentLanguage} 
          onLanguageChange={changeLanguage} 
        />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Payment routes - must come before course detail route */}
            <Route 
              path="/course/:courseId/payment" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Course detail route */}
            <Route path="/course/:id" element={<CourseDetail />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/upload-course" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <UploadCourse />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-course" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <CreateCourse />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/course/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <EditCourse />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            
            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Footer />
        <ScrollToTopButton />
      </div>
    </Router>
  );
};

// App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 