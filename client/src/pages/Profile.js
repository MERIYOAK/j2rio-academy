import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getSecureProfileImageUrl } from '../utils/api';
import './Profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    language: 'en'
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentProfileImage, setCurrentProfileImage] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        language: user.language || 'en'
      });
      
      // Load current profile image
      if (user.profilePicture) {
        loadProfileImage(user._id);
      }
    }
  }, [user]);

  const loadProfileImage = async (userId) => {
    try {
      console.log('🖼️ Loading profile image for user:', userId);
      const result = await getSecureProfileImageUrl(userId);
      if (result.success) {
        console.log('✅ Profile image loaded successfully');
        setCurrentProfileImage(result.url);
      } else {
        console.warn('⚠️ Failed to load profile image:', result.error);
        setCurrentProfileImage('');
      }
    } catch (error) {
      console.warn('⚠️ Profile image loading error:', error.message);
      setCurrentProfileImage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('requiredField');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('minLength', { min: 2 });
    }

    if (!formData.language) {
      newErrors.language = t('requiredField');
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
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await updateProfile(formData, profileImage);
      if (result.success) {
        setSuccessMessage(t('profileUpdated'));
        setProfileImage(null);
        setImagePreview(null);
        // Reload profile image if updated
        if (profileImage) {
          setTimeout(() => {
            loadProfileImage(user._id);
          }, 1000);
        }
      } else {
        setSubmitError(result.error);
      }
    } catch (error) {
      setSubmitError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page container">
      <h1>{t('profile')}</h1>
      
      {submitError && (
        <div className="alert alert-error">
          {submitError}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-image-section">
          <h3>{t('profileImage')}</h3>
          <div className="current-profile-image">
            {(currentProfileImage || imagePreview) ? (
              <img 
                src={imagePreview || currentProfileImage} 
                alt="Profile" 
                className="profile-image"
              />
            ) : (
              <div className="no-profile-image">
                <span>👤</span>
                <p>{t('noProfileImage')}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
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
            <label htmlFor="bio">{t('bio')}</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="form-control"
              placeholder={t('bio')}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">{t('language')}</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className={`form-control ${errors.language ? 'error' : ''}`}
            >
              <option value="en">English</option>
              <option value="am">Amharic</option>
              <option value="ti">Tigrigna</option>
            </select>
            {errors.language && <span className="error-message">{errors.language}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="profileImage">{t('updateProfileImage')}</label>
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
                  <img src={imagePreview} alt="Preview" />
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
            <small className="form-help">Upload a new profile picture (JPEG, PNG, GIF, max 5MB)</small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? t('updating') : t('updateProfile')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile; 