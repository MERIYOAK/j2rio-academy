import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourseDetail, updateCourse, uploadVideo, uploadThumbnail } from '../utils/api';
import './CreateCourse.css';

const EditCourse = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editType = searchParams.get('editType') || 'full';
  
  const [course, setCourse] = useState(null);
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
  const [loading, setLoading] = useState(true);
  
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    languages: [],
    levels: []
  });

  // Determine edit restrictions based on editType
  const isRestricted = editType === 'restricted';
  const isPartial = editType === 'partial';

  console.log('🔧 EditCourse initialized:', {
    courseId: id,
    editType,
    isRestricted,
    isPartial
  });

  // Load course data on component mount
  useEffect(() => {
    const loadCourse = async () => {
      try {
        console.log('📡 Loading course data for editing...');
        const result = await getCourseDetail(id);
        
        if (result.success) {
          console.log('✅ Course data loaded:', result.course);
          setCourse(result.course);
          
          // Populate form with existing course data
          setFormData({
            title: result.course.title || '',
            description: result.course.description || '',
            language: result.course.language || '',
            price: result.course.price?.toString() || '',
            category: result.course.category || '',
            level: result.course.level || ''
          });
        } else {
          console.error('❌ Failed to load course:', result.error);
          alert('Failed to load course data. Please try again.');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('❌ Error loading course:', error);
        alert('Error loading course data. Please try again.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [id, navigate]);

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
    console.log('Input change:', name, value);
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
    if (isRestricted) {
      alert('❌ Video editing is disabled for this course due to enrolled students.');
      return;
    }
    
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
    if (isRestricted) {
      alert('❌ Thumbnail editing is disabled for this course due to enrolled students.');
      return;
    }
    
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.language) {
      newErrors.language = 'Language is required';
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.level) {
      newErrors.level = 'Level is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Submitting course edit:', {
      courseId: id,
      editType,
      formData,
      hasVideoFile: !!videoFile,
      hasThumbnailFile: !!thumbnailFile
    });
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('Updating course information...');
    
    try {
      // Update basic course information
      console.log('📡 Updating course information...');
      const updateResult = await updateCourse(id, {
        title: formData.title,
        description: formData.description,
        language: formData.language,
        price: parseFloat(formData.price),
        category: formData.category,
        level: formData.level
      });
      
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }
      
      console.log('✅ Course information updated successfully');
      
      // Upload new video if provided (and not restricted)
      if (videoFile && !isRestricted) {
        setUploadStatus('Uploading new video...');
        console.log('📡 Uploading new video...');
        
        const videoResult = await uploadVideo(id, videoFile);
        if (!videoResult.success) {
          throw new Error(`Video upload failed: ${videoResult.error}`);
        }
        
        console.log('✅ Video uploaded successfully');
      }
      
      // Upload new thumbnail if provided (and not restricted)
      if (thumbnailFile && !isRestricted) {
        setUploadStatus('Uploading new thumbnail...');
        console.log('📡 Uploading new thumbnail...');
        
        const thumbnailResult = await uploadThumbnail(id, thumbnailFile);
        if (!thumbnailResult.success) {
          throw new Error(`Thumbnail upload failed: ${thumbnailResult.error}`);
        }
        
        console.log('✅ Thumbnail uploaded successfully');
      }
      
      setUploadStatus('Course updated successfully!');
      setShowSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error updating course:', error);
      setUploadStatus(`Error: ${error.message}`);
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="create-course-page container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading course data...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="create-course-page container">
        <div className="error-message">
          <p>Course not found or you don't have permission to edit it.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-course-page container">
      <div className="create-course-header">
        <h1>Edit Course</h1>
        <p className="course-title">{course.title}</p>
        
        {/* Edit Type Indicator */}
        <div className={`edit-type-indicator ${editType}`}>
          {editType === 'restricted' && (
            <div className="restricted-warning">
              <span>🔒</span> Restricted Editing - Video and thumbnail editing disabled
            </div>
          )}
          {editType === 'partial' && (
            <div className="partial-warning">
              <span>⚠️</span> Partial Editing - Video and thumbnail changes will affect enrolled students
            </div>
          )}
          {editType === 'full' && (
            <div className="full-edit">
              <span>✅</span> Full Editing - No restrictions
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-course-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Course Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="Enter course title"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe your course"
              rows="4"
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="language">Language *</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className={errors.language ? 'error' : ''}
              >
                <option value="">Select Language</option>
                {filterOptions.languages?.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {errors.language && <span className="error-message">{errors.language}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="price">Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={errors.price ? 'error' : ''}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select Category</option>
                {filterOptions.categories?.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="level">Level *</label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className={errors.level ? 'error' : ''}
              >
                <option value="">Select Level</option>
                {filterOptions.levels?.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.level && <span className="error-message">{errors.level}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Course Content</h3>
          
          <div className="form-group">
            <label htmlFor="video">Video File</label>
            <input
              type="file"
              id="video"
              name="video"
              onChange={handleVideoChange}
              accept="video/*"
              disabled={isRestricted}
              className={errors.video ? 'error' : ''}
            />
            {isRestricted && (
              <div className="disabled-message">
                🔒 Video editing disabled - course has enrolled students
              </div>
            )}
            {isPartial && (
              <div className="warning-message">
                ⚠️ Video changes will affect enrolled students
              </div>
            )}
            {course.videoUrl && (
              <div className="current-file">
                Current: {course.videoUrl.split('/').pop()}
              </div>
            )}
            {errors.video && <span className="error-message">{errors.video}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail Image</label>
            <input
              type="file"
              id="thumbnail"
              name="thumbnail"
              onChange={handleThumbnailChange}
              accept="image/*"
              disabled={isRestricted}
              className={errors.thumbnail ? 'error' : ''}
            />
            {isRestricted && (
              <div className="disabled-message">
                🔒 Thumbnail editing disabled - course has enrolled students
              </div>
            )}
            {isPartial && (
              <div className="warning-message">
                ⚠️ Thumbnail changes will affect enrolled students
              </div>
            )}
            {course.thumbnail && (
              <div className="current-file">
                Current: {course.thumbnail.split('/').pop()}
              </div>
            )}
            {errors.thumbnail && <span className="error-message">{errors.thumbnail}</span>}
          </div>
        </div>

        {uploadStatus && (
          <div className={`upload-status ${showSuccess ? 'success' : ''}`}>
            {uploadStatus}
          </div>
        )}

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isUploading}
          >
            {isUploading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse; 