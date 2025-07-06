import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { scrollToTop } from '../utils/scrollUtils';
import './Register.css';

const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    bio: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Get redirect information from location state
  const redirectTo = location.state?.redirectTo || '/dashboard';
  const message = location.state?.message;

  console.log('📝 Register page: Component initialized');
  console.log('📝 Register page: Redirect to:', redirectTo);
  console.log('📝 Register page: Message:', message);
  console.log('📝 Register page: Location state:', location.state);

  // Ensure page scrolls to top when component mounts
  useEffect(() => {
    console.log('📝 Register page: Scrolling to top');
    scrollToTop();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('requiredField');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('minLength', { min: 2 });
    }

    if (!formData.email) {
      newErrors.email = t('requiredField');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('requiredField');
    } else if (formData.password.length < 6) {
      newErrors.password = t('weakPassword');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('requiredField');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }

    if (!formData.role) {
      newErrors.role = t('requiredField');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Please select a valid image file (JPEG, PNG, GIF)'
        }));
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profileImage: 'Profile image must be less than 5MB'
        }));
        return;
      }
      
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({
        ...prev,
        profileImage: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    console.log('📝 Register: Form submission started');
    console.log('📝 Register: Redirect to:', redirectTo);
    
    if (!validateForm()) {
      console.log('📝 Register: Form validation failed');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📝 Register: Calling register function...');
      const result = await register(formData, profileImage);
      console.log('📝 Register: Register result:', result);
      
      if (result.success) {
        console.log('📝 Register: Registration successful, navigating to:', redirectTo);
        // Navigate to the redirect URL or dashboard
        navigate(redirectTo);
      } else {
        console.log('📝 Register: Registration failed:', result.error);
        setSubmitError(result.error);
      }
    } catch (error) {
      console.log('📝 Register: Registration error:', error);
      setSubmitError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div className="register-container">
          <div className="register-card">
            <div className="register-header">
              <h1>{t('register')}</h1>
              <p>{t('joinThousands')}</p>
              {message && (
                <div className="alert alert-info">
                  {message}
                </div>
              )}
            </div>

            {submitError && (
              <div className="alert alert-error">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">{t('name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  placeholder={t('name')}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder={t('email')}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="role">{t('role')}</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`form-control ${errors.role ? 'error' : ''}`}
                >
                  <option value="student">{t('student')}</option>
                  <option value="instructor">{t('instructor')}</option>
                </select>
                {errors.role && <span className="error-message">{errors.role}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="bio">{t('bio')}</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-control"
                  placeholder={t('bio')}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder={t('password')}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder={t('confirmPassword')}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="profileImage">{t('profileImage')}</label>
                <div className="profile-image-upload">
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={`form-control ${errors.profileImage ? 'error' : ''}`}
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Profile preview" />
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => {
                          setProfileImage(null);
                          setImagePreview(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                {errors.profileImage && <span className="error-message">{errors.profileImage}</span>}
                <small className="form-help">Upload a profile picture (JPEG, PNG, GIF, max 5MB)</small>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary register-btn"
                disabled={loading}
              >
                {loading ? t('loading') : t('register')}
              </button>
            </form>

            <div className="register-footer">
              <p>
                {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;