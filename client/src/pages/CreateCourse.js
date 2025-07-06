import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { uploadCourseWithVideo } from '../utils/api';
import './CreateCourse.css';

const CreateCourse = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: '',
    price: '',
    category: '',
    level: ''
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    languages: [],
    levels: []
  });

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Current form data:', formData);
  }, [formData]);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses/filters/options');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Filter options loaded:', data);
        setFilterOptions(data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Set comprehensive default options if API fails
        setFilterOptions({
          categories: [
            'Programming & Development',
            'Web Development',
            'Mobile Development',
            'Data Science & Analytics',
            'Artificial Intelligence & Machine Learning',
            'Cybersecurity',
            'Cloud Computing',
            'Database Management',
            'Software Engineering',
            'UI/UX Design',
            'Graphic Design',
            'Digital Marketing',
            'Business & Entrepreneurship',
            'Project Management',
            'Finance & Accounting',
            'Language Learning',
            'Music & Audio',
            'Photography & Video',
            'Health & Fitness',
            'Cooking & Culinary Arts',
            'Art & Creativity',
            'Education & Teaching',
            'Personal Development',
            'Technology',
            'Science',
            'Mathematics',
            'History',
            'Literature',
            'Philosophy',
            'Religion & Spirituality',
            'Travel & Tourism',
            'Sports & Recreation',
            'Fashion & Beauty',
            'Automotive',
            'Home & Garden',
            'Parenting & Family',
            'Career Development',
            'Public Speaking',
            'Writing & Communication',
            'Research & Academic',
            'Environmental Science',
            'Medical & Healthcare',
            'Law & Legal Studies',
            'Agriculture',
            'Architecture',
            'Engineering',
            'Other'
          ],
          languages: [
            'English',
            'Tigrigna',
            'Amharic'
          ],
          levels: [
            'Beginner',
            'Intermediate',
            'Advanced',
            'Expert',
            'All Levels'
          ]
        });
      }
    };
    
    fetchFilterOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value); // Debug log
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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          video: 'Please select a valid video file (MP4, AVI, MOV, WMV, FLV, WEBM)'
        }));
        return;
      }
      
      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          video: 'Video file size must be less than 500MB'
        }));
        return;
      }
      
      setVideoFile(file);
      setErrors(prev => ({
        ...prev,
        video: ''
      }));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          thumbnail: 'Please select a valid image file (JPEG, PNG, GIF)'
        }));
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          thumbnail: 'Thumbnail file size must be less than 5MB'
        }));
        return;
      }
      
      setThumbnailFile(file);
      setErrors(prev => ({
        ...prev,
        thumbnail: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.language) newErrors.language = 'Language is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.level) newErrors.level = 'Level is required';
    if (!videoFile) newErrors.video = 'Video file is required';
    if (!thumbnailFile) newErrors.thumbnail = 'Thumbnail image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('Please be patient while we create your course...');
    
    try {
      const result = await uploadCourseWithVideo(
        formData,
        videoFile,
        thumbnailFile,
        (progress) => {
          // Update status messages based on progress
          if (progress < 30) {
            setUploadStatus('Uploading thumbnail to cloud storage...');
          } else if (progress < 60) {
            setUploadStatus('Uploading video to cloud storage...');
          } else if (progress < 90) {
            setUploadStatus('Processing your course files...');
          } else {
            setUploadStatus('Finalizing course creation...');
          }
        }
      );
      
      if (result.success) {
        setUploadStatus('Course created successfully!');
        setShowSuccess(true);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setUploadStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Prevent navigation during upload
  useEffect(() => {
    if (isUploading) {
      // Add body class to disable all interactions
      document.body.classList.add('uploading');
      
      // Prevent browser back button
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Upload in progress. Are you sure you want to leave?';
        return 'Upload in progress. Are you sure you want to leave?';
      };

      // Prevent navigation
      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.pathname);

      return () => {
        document.body.classList.remove('uploading');
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isUploading]);

  if (showSuccess) {
    return (
      <div className="create-course-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Course Created Successfully!</h2>
          <p>Your course has been uploaded and is now available for students.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-container">
      {/* Full-screen overlay during upload */}
      {isUploading && (
        <div className="upload-overlay">
          <div className="upload-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <div className="loading-content">
              <h3>Creating Your Course...</h3>
              <p className="loading-message">{uploadStatus}</p>
              <p className="loading-note">Please don't close this page or navigate away</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="create-course-card">
        <h1>{t('createCourseTitle')}</h1>
        <p className="subtitle">{t('createCourseSubtitle')}</p>
        
        <form onSubmit={handleSubmit} className={`create-course-form ${isUploading ? 'uploading' : ''}`}>
          <div className="form-group">
            <label htmlFor="title">{t('title')} *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t('titlePlaceholder')}
              disabled={isUploading}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('description')} *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('descriptionPlaceholder')}
              rows="4"
              disabled={isUploading}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="language">{t('language')} *</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                disabled={isUploading}
                className={errors.language ? 'error' : ''}
              >
                <option value="">{t('selectLanguage')}</option>
                {filterOptions.languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {errors.language && <span className="error-message">{errors.language}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="price">{t('price')} *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isUploading}
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">{t('category')} *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isUploading}
                className={errors.category ? 'error' : ''}
              >
                <option value="">{t('selectCategory')}</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="level">{t('level')} *</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                disabled={isUploading}
                className={errors.level ? 'error' : ''}
              >
                <option value="">{t('selectLevel')}</option>
                {filterOptions.levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.level && <span className="error-message">{errors.level}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="video">{t('video')} *</label>
            <div className="file-upload">
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoChange}
                disabled={isUploading}
                className={errors.video ? 'error' : ''}
              />
              <div className="file-upload-info">
                <p>Supported formats: MP4, AVI, MOV, WMV, FLV, WEBM</p>
                <p>Maximum file size: 500MB</p>
                {videoFile && (
                  <p className="selected-file">Selected: {videoFile.name}</p>
                )}
              </div>
            </div>
            {errors.video && <span className="error-message">{errors.video}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">{t('thumbnail')} *</label>
            <div className="file-upload">
              <input
                type="file"
                id="thumbnail"
                accept="image/*"
                onChange={handleThumbnailChange}
                disabled={isUploading}
                className={errors.thumbnail ? 'error' : ''}
              />
              <div className="file-upload-info">
                <p>Supported formats: JPEG, PNG, GIF</p>
                <p>Maximum file size: 5MB</p>
                {thumbnailFile && (
                  <p className="selected-file">Selected: {thumbnailFile.name}</p>
                )}
              </div>
            </div>
            {errors.thumbnail && <span className="error-message">{errors.thumbnail}</span>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={isUploading}
              className="btn-secondary"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="btn-primary"
            >
              {isUploading ? t('creating') : t('createCourse')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse; 