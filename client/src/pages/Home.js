import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getCourses, getPublicThumbnailUrl } from '../utils/api';
import './Home.css';
import { scrollToTop } from '../utils/scrollUtils';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  
  

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      setLoading(true);
      try {
        console.log('🏠 Home page: Fetching featured courses...');
        // Fetch published courses for public display
        const res = await getCourses({ limit: 6, published: true });
        console.log('🏠 Home page: Featured courses result:', res);
        setFeaturedCourses(res.courses || []);
      } catch (error) {
        console.error('🏠 Home page: Failed to fetch featured courses:', error);
        // Don't redirect on error, just show empty state
        setFeaturedCourses([]);
      }
      setLoading(false);
    };
    fetchFeaturedCourses();
  }, []);

  // Load secure thumbnail URLs for featured courses
  useEffect(() => {
    const loadThumbnailUrls = async () => {
      if (featuredCourses.length > 0) {
        const thumbnailUrlMap = {};
        for (const course of featuredCourses) {
          if (course.thumbnail) {
            try {
              console.log('🏠 Home page: Loading thumbnail for course:', course._id);
              
              // Use public endpoint for all users (thumbnails are public content)
              const result = await getPublicThumbnailUrl(course._id);
              
              if (result.success) {
                thumbnailUrlMap[course._id] = result.url;
                console.log('🏠 Home page: Thumbnail loaded successfully for course:', course._id);
              } else {
                console.warn('🏠 Home page: Failed to load thumbnail for course:', course._id, result.error);
              }
            } catch (error) {
              console.error('🏠 Home page: Failed to load thumbnail for course:', course._id, error);
              // Don't redirect, just continue without thumbnail
            }
          }
        }
        setThumbnailUrls(thumbnailUrlMap);
      }
    };
    loadThumbnailUrls();
  }, [featuredCourses, user]);

  const handleCourseClick = (course) => {
    console.log('🏠 Home: Course card clicked:', course.title);
    console.log('🏠 Home: User:', user ? { id: user._id, role: user.role } : 'No user');
    console.log('🏠 Home: Course enrolled:', course.isEnrolled);
    
    // If user is not logged in, redirect to register
    if (!user) {
      console.log('🏠 Home: No user, redirecting to register');
      navigate('/register', { 
        state: { 
          message: 'Please register to access course details',
          redirectTo: `/courses/${course._id}`
        }
      });
      return;
    }

    // If user is logged in but not enrolled, redirect to course detail for enrollment
    if (user && !course.isEnrolled) {
      console.log('🏠 Home: User not enrolled, redirecting to course detail');
      navigate(`/courses/${course._id}`);
      return;
    }

    // If user is enrolled, go to course detail
    console.log('🏠 Home: User enrolled, redirecting to course detail');
    navigate(`/courses/${course._id}`);
  };

  const handleCourseCardMouseEnter = (course) => {
    console.log('🏠 Home: Course card mouse enter:', course.title);
  };

  const handleCourseCardMouseLeave = (course) => {
    console.log('🏠 Home: Course card mouse leave:', course.title);
  };

  return (
    <div className="home">
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>{t('welcome')}</h1>
            <p className="hero-subtitle">
              {t('learn')} • {t('teach')} • {t('grow')}
            </p>
            <p className="hero-description">
              {t('joinThousands')} {t('startLearning')}
            </p>
            <div className="hero-buttons">
              <Link to="/courses" className="btn btn-primary">
                {t('exploreCourses')}
              </Link>
              <Link to="/register" className="btn btn-secondary">
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>{t('featuredCourses')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📚 {t('learn')}</h3>
              <p>{t('exploreCourses')} {t('startLearning')}</p>
            </div>
            <div className="feature-card">
              <h3>👨‍🏫 {t('teach')}</h3>
              <p>{t('becomeInstructor')}</p>
            </div>
            <div className="feature-card">
              <h3>🌱 {t('grow')}</h3>
              <p>{t('joinThousands')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses Section */}
      <div className="featured-courses-section">
        <div className="container">
          <h2>{t('featuredCourses')}</h2>
          {loading ? (
            <p>{t('loading')}</p>
          ) : (
            <div className="featured-courses-grid">
              {featuredCourses.map(course => (
                <div key={course._id} className="featured-course-card" onClick={() => handleCourseClick(course)} onMouseEnter={() => handleCourseCardMouseEnter(course)} onMouseLeave={() => handleCourseCardMouseLeave(course)}>
                  <div className="course-thumbnail">
                    {course.thumbnail ? (
                      <img 
                        src={thumbnailUrls[course._id] || course.thumbnail} 
                        alt={course.title}
                        onError={(e) => {
                          console.error('Course thumbnail failed to load:', course.thumbnail);
                        }}
                      />
                    ) : (
                      <div className="no-thumbnail">
                        <span>📹</span>
                      </div>
                    )}
                    <div className="course-overlay">
                      <div className="course-price">${course.price}</div>
                      {!user ? (
                        <div className="course-action">
                          <span className="action-text">Register to Access</span>
                        </div>
                      ) : course.isEnrolled ? (
                        <div className="course-action enrolled">
                          <span className="action-text">Continue Learning</span>
                        </div>
                      ) : user.role === 'instructor' && course.instructorId?.toString() === user._id?.toString() ? (
                        <div className="course-action">
                          <span className="action-text">Your Course</span>
                        </div>
                      ) : (
                        <div className="course-action">
                          <span className="action-text">Enroll Now</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="course-meta">
                      <span className="course-instructor">{course.instructor?.name}</span>
                      <span className="course-level">{course.level}</span>
                      <span className="course-language">{course.language}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="view-all-courses">
            <Link to="/courses" className="btn btn-primary">
              {t('viewAllCourses')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 