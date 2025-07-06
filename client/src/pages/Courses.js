import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourses, getSecureThumbnailUrl, getPublicThumbnailUrl } from '../utils/api';
import './Courses.css';
import { scrollToTop } from '../utils/scrollUtils';

const Courses = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [instructor, setInstructor] = useState('');
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [levels, setLevels] = useState([]);
  const [thumbnailUrls, setThumbnailUrls] = useState({});

   // Ensure page scrolls to top when component mounts
   useEffect(() => {
    console.log('🔐 Login page: Scrolling to top');
    scrollToTop();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('🚀 Courses page: Starting to fetch courses');
      console.log('👤 Current user:', user ? { id: user._id, role: user.role, name: user.name } : 'Not logged in');
      console.log('🔍 Current filters:', { search, category, instructor, language, level });
      
      setLoading(true);
      setError('');
      
      try {
        // Build query parameters
        const params = {
          published: true, // Only fetch published courses
          limit: 50 // Limit to 50 courses for performance
        };
        
        if (search) params.search = search;
        if (category) params.category = category;
        if (instructor) params.instructor = instructor;
        if (language) params.language = language;
        if (level) params.level = level;
        

        console.log('📤 Sending request with params:', params);
        const res = await getCourses(params);
        
        console.log('📥 getCourses response:', res);
        
        if (res.success) {
          console.log('✅ Successfully fetched courses');
          console.log('📊 Courses received:', res.courses?.length || 0);
          
          setCourses(res.courses || []);
          
          // Extract unique values for filters
          const uniqueCategories = [...new Set(res.courses.map(c => c.category).filter(Boolean))];
          const uniqueInstructors = [...new Set(res.courses.map(c => c.instructor?.name).filter(Boolean))];
          const uniqueLanguages = [...new Set(res.courses.map(c => c.language).filter(Boolean))];
          const uniqueLevels = [...new Set(res.courses.map(c => c.level).filter(Boolean))];
          
          console.log('🏷️  Extracted filter options:', {
            categories: uniqueCategories,
            instructors: uniqueInstructors,
            languages: uniqueLanguages,
            levels: uniqueLevels
          });
          
          setCategories(uniqueCategories);
          setInstructors(uniqueInstructors);
          setLanguages(uniqueLanguages);
          setLevels(uniqueLevels);
        } else {
          console.error('❌ Failed to fetch courses:', res.error);
          console.error('❌ Error status:', res.status);
          console.error('❌ Error details:', res.details);
          setError(res.error || 'Failed to fetch courses');
        }
      } catch (err) {
        console.error('💥 Unexpected error in fetchCourses:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        console.log('🏁 Finished fetching courses');
        setLoading(false);
      }
    };

    fetchCourses();
  }, [search, category, instructor, language, level]);

  // Load secure thumbnail URLs for all courses
  useEffect(() => {
    const loadThumbnailUrls = async () => {
      console.log('🖼️  Starting to load thumbnail URLs for', courses.length, 'courses');
      
      if (courses.length > 0) {
        const thumbnailUrlMap = {};
        for (const course of courses) {
          if (course.thumbnail) {
            console.log('🖼️  Loading thumbnail for course:', course._id, course.title);
            try {
              // Use public endpoint for unauthenticated users, secure endpoint for authenticated users
              const result = user 
                ? await getSecureThumbnailUrl(course._id)
                : await getPublicThumbnailUrl(course._id);
              
              console.log('🖼️  Thumbnail result for', course._id, ':', result);
              
              if (result.success) {
                thumbnailUrlMap[course._id] = result.url;
                console.log('✅ Thumbnail URL set for course:', course._id);
              } else {
                console.warn('⚠️  Failed to get thumbnail URL for course:', course._id, result.error);
              }
            } catch (error) {
              console.error('❌ Error loading thumbnail for course:', course._id, error);
            }
          } else {
            console.log('📹 No thumbnail for course:', course._id, course.title);
          }
        }
        console.log('🖼️  Final thumbnail URL map:', thumbnailUrlMap);
        setThumbnailUrls(thumbnailUrlMap);
      }
    };
    loadThumbnailUrls();
  }, [courses, user]);

  const handleCourseClick = (course) => {
    // If user is not logged in, redirect to register
    if (!user) {
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
      navigate(`/courses/${course._id}`);
      return;
    }

    // If user is enrolled, go to course detail
    navigate(`/courses/${course._id}`);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setInstructor('');
    setLanguage('');
    setLevel('');
  };

  return (
    <div className="courses-page container">
      <div className="courses-header">
        <h1>{t('courses')}</h1>
        <p>{t('exploreAllCourses')}</p>
      </div>

      <div className="courses-filters">
        <div className="filters-row">
          <input
            type="text"
            placeholder={t('searchCourses')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-input search-input"
          />
          <button onClick={clearFilters} className="btn btn-secondary clear-filters">
            {t('clearFilters')}
          </button>
        </div>
        
        <div className="filters-row">
          <select value={category} onChange={e => setCategory(e.target.value)} className="filter-select">
            <option value="">{t('allCategories')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select value={instructor} onChange={e => setInstructor(e.target.value)} className="filter-select">
            <option value="">{t('allInstructors')}</option>
            {instructors.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
          
          <select value={language} onChange={e => setLanguage(e.target.value)} className="filter-select">
            <option value="">{t('allLanguages')}</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          
          <select value={level} onChange={e => setLevel(e.target.value)} className="filter-select">
            <option value="">{t('allLevels')}</option>
            {levels.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="courses-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              {t('tryAgain')}
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="no-courses">
            <p>{t('noCoursesFound')}</p>
            <button onClick={clearFilters} className="btn btn-primary">
              {t('clearFilters')}
            </button>
          </div>
        ) : (
          <>
            <div className="courses-stats">
              <p>{t('showing')} {courses.length} {t('courses')}</p>
            </div>
            
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course._id} className="course-card" onClick={() => handleCourseClick(course)}>
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
                          <span className="action-text">{t('registerToAccess')}</span>
                        </div>
                      ) : course.isEnrolled ? (
                        <div className="course-action enrolled">
                          <span className="action-text">{t('continueLearning')}</span>
                        </div>
                      ) : (
                        <div className="course-action">
                          <span className="action-text">{t('enrollNow')}</span>
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
                    <div className="course-stats">
                      <span className="course-rating">
                        ⭐ {course.rating?.toFixed(1) || 'N/A'} ({course.reviewCount || 0} {t('reviews')})
                      </span>
                      <span className="course-enrollments">
                        👥 {course.enrollmentCount || 0} {t('enrolled')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Courses; 