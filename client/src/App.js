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
  
  console.log('🔒 ProtectedRoute check:');
  console.log('   User:', user ? { id: user._id, role: user.role, name: user.name } : 'Not logged in');
  console.log('   Loading:', loading);
  console.log('   Allowed roles:', allowedRoles);
  
  if (loading) {
    console.log('⏳ Route protection: Loading state, showing spinner');
    return <div className="loading"><div className="spinner"></div></div>;
  }
  
  if (!user) {
    console.log('❌ Route protection: No user, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('❌ Route protection: User role not allowed, redirecting to dashboard');
    console.log('   User role:', user.role);
    console.log('   Required roles:', allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('✅ Route protection: Access granted');
  return children;
};

// Main App Component
const AppContent = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  console.log('🌍 App initialized with language:', currentLanguage);

  // Handle language change
  const changeLanguage = (language) => {
    console.log('🌍 Language change requested:', language);
    console.log('   Previous language:', currentLanguage);
    console.log('   New language:', language);
    
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    setCurrentLanguage(language);
    
    console.log('✅ Language changed successfully');
  };

  // Set initial language
  useEffect(() => {
    console.log('🌍 Setting initial language:', currentLanguage);
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
              element={<PaymentPage />}
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