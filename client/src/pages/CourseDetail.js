import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getCourseDetail, enrollInCourse, postReview, getPublicThumbnailUrl } from '../utils/api';
import CoursePlayer from '../components/CoursePlayer';
import './CourseDetail.css';

const CourseDetail = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [secureThumbnailUrl, setSecureThumbnailUrl] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await getCourseDetail(id);
        if (res.success) {
          setCourse(res.course);
          setEnrolled(res.enrolled);
        } else {
          console.error('Failed to fetch course:', res.error);
          setError(res.error || 'Failed to load course details');
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
        setError('Failed to load course details');
      }
      setLoading(false);
    };
    fetchCourse();
  }, [id]);

  // Load public thumbnail URL
  useEffect(() => {
    const loadPublicThumbnail = async () => {
      if (course && course.thumbnail) {
        try {
          console.log('🖼️ CourseDetail: Loading public thumbnail for course:', course._id);
          const result = await getPublicThumbnailUrl(course._id);
          if (result.success) {
            console.log('✅ CourseDetail: Thumbnail loaded successfully:', result.url);
            setSecureThumbnailUrl(result.url);
          } else {
            console.warn('❌ CourseDetail: Failed to load thumbnail:', result.error);
          }
        } catch (error) {
          console.error('❌ CourseDetail: Failed to load public thumbnail:', error);
        }
      }
    };
    loadPublicThumbnail();
  }, [course]);

  useEffect(() => {
    console.log('🖼️ CourseDetail: Component mounted');
    console.log('🖼️ CourseDetail: Current course ID:', id);
    console.log('🖼️ CourseDetail: User:', user ? { id: user._id, role: user.role } : 'No user');
    
    // Check if any global CSS classes might be interfering
    const thumbnailElements = document.querySelectorAll('.course-thumbnail');
    console.log('🖼️ CourseDetail: Found thumbnail elements:', thumbnailElements.length);
    thumbnailElements.forEach((el, index) => {
      console.log(`🖼️ CourseDetail: Thumbnail ${index}:`, {
        className: el.className,
        parentClassName: el.parentElement?.className,
        hasOverlay: !!el.querySelector('.course-overlay')
      });
    });
  }, [id, user]);

  const handleEnroll = async () => {
    console.log('🎯 CourseDetail: Enroll button clicked');
    console.log('🎯 CourseDetail: Current user:', user ? { id: user._id, role: user.role, name: user.name } : 'No user');
    console.log('🎯 CourseDetail: Course ID:', id);
    console.log('🎯 CourseDetail: Course instructor ID:', course?.instructorId);
    
    if (!user) {
      console.log('👤 CourseDetail: No user, redirecting to register');
      console.log('👤 CourseDetail: Will redirect back to:', `/course/${id}`);
      // Redirect to register with return URL
      navigate('/register', { 
        state: { 
          message: 'Please register to enroll in this course',
          redirectTo: `/course/${id}`
        }
      });
      return;
    }

    // Check if user is a student or instructor
    if (user.role !== 'student' && user.role !== 'instructor') {
      console.log('❌ CourseDetail: User has invalid role for enrollment:', user.role);
      alert('Only students and instructors can enroll in courses.');
      return;
    }

    // Check if instructor is trying to enroll in their own course
    if (user.role === 'instructor' && course?.instructorId?.toString() === user._id?.toString()) {
      console.log('❌ CourseDetail: Instructor trying to enroll in own course');
      alert('You cannot enroll in your own course!');
      return;
    }

    console.log('💳 CourseDetail: All checks passed, redirecting to payment page');
    console.log('💳 CourseDetail: Payment URL:', `/course/${id}/payment`);
    // Redirect to payment page
    navigate(`/course/${id}/payment`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const reviewResult = await postReview(id, { rating, text: review });
      if (reviewResult.success) {
        setReview('');
        setRating(5);
        // Refresh course details to show new review
        const res = await getCourseDetail(id);
        if (res.success) {
          setCourse(res.course);
        } else {
          console.error('Failed to refresh course after review:', res.error);
        }
      } else {
        setError(reviewResult.error || t('reviewSubmitError'));
      }
    } catch (err) {
      setError(t('reviewSubmitError'));
    }
    setSubmitting(false);
  };

  const handleThumbnailClick = (e) => {
    console.log('🖼️ CourseDetail: Thumbnail clicked');
    console.log('🖼️ CourseDetail: Event target:', e.target);
    console.log('🖼️ CourseDetail: Event currentTarget:', e.currentTarget);
    console.log('🖼️ CourseDetail: Event type:', e.type);
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
  };

  const handleThumbnailMouseEnter = (e) => {
    console.log('🖼️ CourseDetail: Thumbnail mouse enter');
    console.log('🖼️ CourseDetail: Event target:', e.target);
    console.log('🖼️ CourseDetail: Event currentTarget:', e.currentTarget);
  };

  const handleThumbnailMouseLeave = (e) => {
    console.log('🖼️ CourseDetail: Thumbnail mouse leave');
    console.log('🖼️ CourseDetail: Event target:', e.target);
    console.log('🖼️ CourseDetail: Event currentTarget:', e.currentTarget);
  };

  if (loading) return <div className="container"><p>{t('loading')}</p></div>;
  if (!course) return <div className="container"><p>{t('courseNotFound')}</p></div>;

  return (
    <div className="course-detail-page container">
      <div className="course-header">
        <h1>{course.title}</h1>
        <p className="course-description">{course.description}</p>
        <div className="course-meta">
          <span><strong>{t('instructor')}:</strong> {course.instructor?.name}</span>
          <span><strong>{t('language')}:</strong> {course.language}</span>
          <span><strong>{t('level')}:</strong> {course.level}</span>
          <span><strong>{t('price')}:</strong> ${course.price}</span>
        </div>
      </div>

      <div className="course-content">
        {course.thumbnail && (
          <div className="course-thumbnail-section">
            <img 
              src={secureThumbnailUrl || course.thumbnail} 
              alt={course.title}
              className="course-thumbnail"
              onClick={handleThumbnailClick}
              onMouseEnter={handleThumbnailMouseEnter}
              onMouseLeave={handleThumbnailMouseLeave}
            />
          </div>
        )}

        {enrolled ? (
          <div className="video-section">
            <h2>{t('courseVideo')}</h2>
            <CoursePlayer courseId={course._id} />
          </div>
        ) : (
          <div className="enrollment-section">
            <div className="enrollment-card">
              <h2>{t('enrollInCourse')}</h2>
              <div className="enrollment-info">
                <p><strong>{t('coursePrice')}:</strong> ${course.price}</p>
                <p><strong>{t('whatYouGet')}:</strong></p>
                <ul>
                  <li>✅ {t('fullVideoAccess')}</li>
                  <li>✅ {t('courseMaterials')}</li>
                  <li>✅ {t('certificate')}</li>
                  <li>✅ {t('lifetimeAccess')}</li>
                </ul>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button 
                className="btn btn-primary" 
                onClick={handleEnroll}
                disabled={submitting}
                style={{ 
                  fontSize: '1.1rem', 
                  padding: '12px 24px',
                  minWidth: '200px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? t('processing') : t('enrollNow')} - ${course.price}
              </button>
              {!user && (
                <p className="login-prompt">
                  {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="reviews-section">
        <h2>{t('reviews')}</h2>
        <div className="average-rating">
          <b>{t('averageRating')}:</b> {course.averageRating?.toFixed(1) || '-'} / 5
        </div>
        <ul className="review-list">
          {course.reviews && course.reviews.length > 0 ? course.reviews.map((r, idx) => (
            <li key={idx} className="review-item">
              <div className="review-header">
                <span className="review-author">{r.user?.name || t('anonymous')}</span>
                <span className="review-rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <div className="review-text">{r.text}</div>
            </li>
          )) : <li>{t('noReviewsYet')}</li>}
        </ul>
        {enrolled && user && (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h3>{t('leaveAReview')}</h3>
            <div className="form-group">
              <label>{t('rating')}</label>
              <select value={rating} onChange={e => setRating(Number(e.target.value))}>
                {[5,4,3,2,1].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('review')}</label>
              <textarea value={review} onChange={e => setReview(e.target.value)} rows="3" required />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-secondary" type="submit" disabled={submitting || !review}>
              {submitting ? t('submitting') : t('submitReview')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CourseDetail; 