import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { uploadCourse } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './UploadCourse.css';

const UploadCourse = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    language: '',
    price: '',
    level: 'beginner'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [courseId, setCourseId] = useState(null);

  if (!user || user.role !== 'instructor') return <div className="container"><p>{t('notAuthorized')}</p></div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    
    try {
      const res = await uploadCourse(formData);
      if (res.success) {
        setSuccess(t('courseCreated'));
        setCourseId(res.course._id);
        setFormData({ title: '', description: '', category: '', language: '', price: '', level: 'beginner' });
      } else {
        setError(res.error || t('uploadFailed'));
      }
    } catch (err) {
      setError(t('networkError'));
    }
    setLoading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !courseId) return;

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(t('videoUploaded'));
        setCourseId(null); // Reset for new course
      } else {
        setError(result.message || t('videoUploadFailed'));
      }
    } catch (err) {
      setError(t('networkError'));
    }
    setLoading(false);
  };

  return (
    <div className="upload-course-page container">
      {loading && (
        <div className="upload-overlay">
          <div className="upload-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <div className="loading-content">
              <h3>{t('uploadingVideo')}</h3>
              <p className="loading-message">{t('pleaseWaitVideoUpload')}</p>
              <p className="loading-note">{t('dontCloseOrNavigate')}</p>
            </div>
          </div>
        </div>
      )}
      <h1>{t('uploadNewCourse')}</h1>
      
      {!courseId ? (
        <form className="upload-course-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('title')}</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              className="form-control" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>{t('description')}</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="form-control" 
              rows="3" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>{t('category')}</label>
            <input 
              type="text" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              className="form-control" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>{t('language')}</label>
            <select 
              name="language" 
              value={formData.language} 
              onChange={handleChange} 
              className="form-control" 
              required
            >
              <option value="">{t('selectLanguage')}</option>
              <option value="english">English</option>
              <option value="tigrigna">Tigrigna</option>
              <option value="amharic">Amharic</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{t('level')}</label>
            <select 
              name="level" 
              value={formData.level} 
              onChange={handleChange} 
              className="form-control" 
              required
            >
              <option value="beginner">{t('beginner')}</option>
              <option value="intermediate">{t('intermediate')}</option>
              <option value="advanced">{t('advanced')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{t('price')}</label>
            <input 
              type="number" 
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              className="form-control" 
              min="0" 
              step="0.01" 
              required 
            />
          </div>
          
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          
          <button 
            className="btn btn-primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? t('creating') : t('createCourse')}
          </button>
        </form>
      ) : (
        <div className="video-upload-section">
          <h2>{t('uploadVideo')}</h2>
          <p>{t('courseCreatedUploadVideo')}</p>
          
          <div className="form-group">
            <label>{t('videoFile')}</label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleVideoUpload} 
              className="form-control" 
            />
          </div>
          
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          
          <button 
            className="btn btn-secondary" 
            onClick={() => setCourseId(null)}
            disabled={loading}
          >
            {t('createAnotherCourse')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadCourse; 