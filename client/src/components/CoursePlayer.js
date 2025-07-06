import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CoursePlayer.css';

const CoursePlayer = ({ courseId, onError }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        console.log('🎬 Fetching secure video URL for course:', courseId);
        
        const res = await axios.get(`http://localhost:5000/api/video/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('✅ Video URL received:', res.data);
        setVideoUrl(res.data.url);
        
      } catch (err) {
        console.error('❌ Error loading video:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load video';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchVideoUrl();
    }
  }, [courseId, onError]);

  if (loading) {
    return (
      <div className="course-player">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-player">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Video Unavailable</h3>
          <p>{error}</p>
          <p className="error-help">
            Make sure you are enrolled in this course and have a valid session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-player">
      {videoUrl ? (
        <video 
          controls 
          width="100%" 
          className="course-video"
          onError={(e) => {
            console.error('Video playback error:', e);
            setError('Video playback failed. Please try again.');
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="no-video">
          <p>No video available for this course.</p>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer; 