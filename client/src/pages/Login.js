import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { scrollToTop } from '../utils/scrollUtils';
import './Login.css';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  // Ensure page scrolls to top when component mounts
  useEffect(() => {
    console.log('🔐 Login page: Scrolling to top');
    scrollToTop();
  }, []);

  const validateForm = () => {
    const newErrors = {};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(formData);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setSubmitError(result.error);
      }
    } catch (error) {
      setSubmitError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1>{t('login')}</h1>
              <p>{t('welcomeBack')}</p>
            </div>

            {submitError && (
              <div className="alert alert-error">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
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
                  autoComplete="email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
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
                  autoComplete="current-password"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={loading}
              >
                {loading ? t('loading') : t('login')}
              </button>
            </form>

            <div className="login-footer">
              <p>
                {t('dontHaveAccount')} <Link to="/register">{t('register')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 