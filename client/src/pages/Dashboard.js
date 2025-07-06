import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getMyCourses, getInstructorStats, getSecureProfileImageUrl, getPublicThumbnailUrl, updateCourseStatus } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import CoursePlayer from '../components/CoursePlayer';
import './Dashboard.css';

/**
 * COURSE EDIT POLICY:
 * 
 * Based on course status and enrollment count:
 * 
 * 📝 DRAFT / 🔴 ARCHIVED:
 * - ✅ FULLY EDITABLE (no students enrolled)
 * - All fields: title, description, category, level, language, price, video, thumbnail
 * 
 * 🟢 ACTIVE:
 * - ✅ ALWAYS EDITABLE: title, description, category, level, language, price
 * - ❌ NEVER EDITABLE: video, thumbnail (protects enrolled students)
 * - 🔒 Edit button shows "Edit 🔒" with red styling for restricted editing
 * 
 * 🟡 CLOSED:
 * - ✅ ALWAYS EDITABLE: title, description, category, level, language, price
 * - ⚠️ EDITABLE WITH WARNINGS: video, thumbnail (affects enrolled students)
 * - Edit button shows "Edit ⚠️" with warning styling
 * 
 * LEGACY COURSES (no status field):
 * - Uses isPublished + enrollmentCount to determine restrictions
 * - Published courses with students = restricted editing (no video/thumbnail)
 * 
 * Edit Types:
 * - 'full': No restrictions
 * - 'restricted': No video/thumbnail editing (active courses with students)
 * - 'partial': Video/thumbnail editing with warnings (closed courses with students)
 * 
 * EDIT PAGE IMPLEMENTATION:
 * The edit page should read the editType URL parameter and:
 * - 'restricted': Disable video/thumbnail upload fields completely
 * - 'partial': Show warnings on video/thumbnail fields but allow editing
 * - 'full': No restrictions on any fields
 */

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [thumbnailUrls, setThumbnailUrls] = useState({});
  const [updatingCourse, setUpdatingCourse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (user?.role === 'instructor') {
        console.log('📡 Fetching instructor courses...');
        const res = await getMyCourses('instructor');
        console.log('📥 Instructor courses response:', res); // Debug log
        
        if (res.success) {
          console.log('📥 Instructor courses:', res.courses); // Debug log
          if (res.courses && res.courses.length > 0) {
            console.log('🔍 First course details:', {
              id: res.courses[0]._id,
              title: res.courses[0].title,
              thumbnail: res.courses[0].thumbnail,
              videoUrl: res.courses[0].videoUrl,
              hasThumbnail: !!res.courses[0].thumbnail,
              hasVideo: !!res.courses[0].videoUrl,
              status: res.courses[0].status,
              isPublished: res.courses[0].isPublished
            });
          }
          setCourses(res.courses || []);
        } else {
          console.error('❌ Failed to fetch instructor courses:', res.error);
          setCourses([]);
        }
        
        console.log('📡 Fetching instructor stats...');
        const statsRes = await getInstructorStats();
        console.log('📥 Instructor stats response:', statsRes);
        setStats(statsRes.stats || null);
      } else {
        console.log('📡 Fetching student enrollments...');
        const res = await getMyCourses('student');
        console.log('📥 Student enrollments response:', res); // Debug log
        
        if (res.success) {
          console.log('📥 Student enrollments:', res.courses); // Debug log
          // For students, courses are nested in enrollment objects
          const studentCourses = res.courses ? res.courses.map(enrollment => enrollment.courseId) : [];
          console.log('📥 Student courses extracted:', studentCourses); // Debug log
          if (studentCourses.length > 0) {
            console.log('🔍 First student course details:', {
              id: studentCourses[0]._id,
              title: studentCourses[0].title,
              thumbnail: studentCourses[0].thumbnail,
              videoUrl: studentCourses[0].videoUrl,
              hasThumbnail: !!studentCourses[0].thumbnail,
              hasVideo: !!studentCourses[0].videoUrl,
              status: studentCourses[0].status,
              isPublished: studentCourses[0].isPublished
            });
          }
          setCourses(studentCourses);
        } else {
          console.error('❌ Failed to fetch student enrollments:', res.error);
          setCourses([]);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Load secure thumbnail URLs for all courses
  useEffect(() => {
    const loadThumbnailUrls = async () => {
      if (courses.length > 0) {
        const thumbnailUrlMap = {};
        for (const course of courses) {
          if (course.thumbnail) {
            try {
              const result = await getPublicThumbnailUrl(course._id);
              if (result.success) {
                thumbnailUrlMap[course._id] = result.url;
              }
            } catch (error) {
              console.error('Failed to load thumbnail for course:', course._id, error);
            }
          }
        }
        setThumbnailUrls(thumbnailUrlMap);
      }
    };
    loadThumbnailUrls();
  }, [courses]);

  // Load profile image
  useEffect(() => {
    const loadProfileImage = async () => {
      if (user && user.profilePicture) {
        try {
          console.log('🖼️ Loading profile image for user:', user._id);
          const result = await getSecureProfileImageUrl(user._id);
          if (result.success) {
            console.log('✅ Profile image loaded successfully');
            setProfileImageUrl(result.url);
          } else {
            console.warn('⚠️ Failed to load profile image:', result.error);
            setProfileImageUrl('');
          }
        } catch (error) {
          console.warn('⚠️ Profile image loading error:', error.message);
          setProfileImageUrl('');
        }
      }
    };
    loadProfileImage();
  }, [user]);

  const handleThumbnailClick = (course) => {
    console.log('Thumbnail clicked for course:', course); // Debug log
    console.log('Course video URL:', course.videoUrl); // Debug log
    console.log('Current user role:', user.role); // Debug log
    console.log('Course instructor ID:', course.instructorId); // Debug log
    console.log('Current user ID:', user._id); // Debug log
    
    // Check if user is the instructor of this course
    // Convert both IDs to strings for proper comparison
    const courseInstructorId = course.instructorId?.toString();
    const currentUserId = user._id?.toString();
    const isInstructor = user.role === 'instructor' && courseInstructorId === currentUserId;
    
    console.log('Course instructor ID (string):', courseInstructorId);
    console.log('Current user ID (string):', currentUserId);
    console.log('Is instructor check:', isInstructor);
    
    if (course.videoUrl && isInstructor) {
      console.log('✅ User is instructor, allowing video playback'); // Debug log
      setSelectedVideo(course);
      setShowVideoModal(true);
    } else if (course.videoUrl && !isInstructor) {
      console.log('❌ User is not instructor, showing thumbnail only'); // Debug log
      // Show a message that only instructors can play their own videos
      alert('Only the course instructor can play the video. Students must enroll to access course content.');
    } else {
      console.log('No video URL found for course'); // Debug log
    }
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showVideoModal) {
        closeVideoModal();
      }
    };

    if (showVideoModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showVideoModal]);

  const handleEditCourse = (course) => {
    console.log('✏️ Edit course requested:', {
      courseId: course._id,
      title: course.title,
      status: course.status,
      enrollmentCount: course.enrollmentCount,
      hasVideo: !!course.videoUrl,
      hasThumbnail: !!course.thumbnail
    });

    // Determine edit restrictions based on status
    let canEdit = true;
    let warningMessage = '';
    let editType = 'full';

    if (course.status === 'draft' || course.status === 'archived') {
      // Full editing allowed
      editType = 'full';
      console.log('✅ Full editing allowed - no students enrolled');
    } else if (course.status === 'active') {
      if (course.enrollmentCount > 0) {
        // Restricted editing - no video/thumbnail changes for active courses with students
        editType = 'restricted';
        warningMessage = `⚠️ This active course has ${course.enrollmentCount} enrolled student${course.enrollmentCount > 1 ? 's' : ''}.\n\n` +
          `✅ You can edit: title, description, category, level, language, price\n` +
          `❌ You cannot edit: video, thumbnail (to protect enrolled students)\n\n` +
          `Are you sure you want to edit this course?`;
        console.log('❌ Restricted editing - active course with enrolled students');
      } else {
        // Full editing allowed (no students)
        editType = 'full';
        console.log('✅ Full editing allowed - active course with no students');
      }
    } else if (course.status === 'closed') {
      if (course.enrollmentCount > 0) {
        // Partial editing with warnings for closed courses
        editType = 'partial';
        warningMessage = `⚠️ This closed course has ${course.enrollmentCount} enrolled student${course.enrollmentCount > 1 ? 's' : ''}.\n\n` +
          `✅ You can edit: title, description, category, level, language, price\n` +
          `⚠️ Video and thumbnail changes will affect enrolled students\n\n` +
          `Are you sure you want to edit this course?`;
        console.log('⚠️ Partial editing with warnings - closed course with students');
      } else {
        // Full editing allowed (no students)
        editType = 'full';
        console.log('✅ Full editing allowed - closed course with no students');
      }
    } else {
      // Legacy courses without status field
      if (course.isPublished && course.enrollmentCount > 0) {
        // Treat legacy published courses as active for edit restrictions
        editType = 'restricted';
        warningMessage = `⚠️ This published course has ${course.enrollmentCount} enrolled student${course.enrollmentCount > 1 ? 's' : ''}.\n\n` +
          `✅ You can edit: title, description, category, level, language, price\n` +
          `❌ You cannot edit: video, thumbnail (to protect enrolled students)\n\n` +
          `Are you sure you want to edit this course?`;
        console.log('❌ Legacy course - restricted editing (treated as active)');
      } else {
        editType = 'full';
        console.log('✅ Legacy course - full editing allowed');
      }
    }

    // Show confirmation if needed
    if (warningMessage) {
      const confirmed = window.confirm(warningMessage);
      if (!confirmed) {
        console.log('❌ User cancelled edit due to warnings');
        return;
      }
      console.log('✅ User confirmed edit despite restrictions');
    }
    
    // Navigate to edit page with edit type info
    console.log('🚀 Navigating to edit page with edit type:', editType);
    navigate(`/course/${course._id}/edit?editType=${editType}`);
  };

  const getEditButtonText = (course) => {
    // Determine edit type for button text
    if (course.status === 'draft' || course.status === 'archived') {
      return t('edit');
    } else if (course.status === 'active') {
      if (course.enrollmentCount > 0) {
        return `${t('edit')} 🔒`; // Lock icon for restricted editing
      } else {
        return t('edit');
      }
    } else if (course.status === 'closed') {
      if (course.enrollmentCount > 0) {
        return `${t('edit')} ⚠️`;
      } else {
        return t('edit');
      }
    } else {
      // Legacy courses
      if (course.isPublished && course.enrollmentCount > 0) {
        return `${t('edit')} 🔒`; // Lock icon for restricted editing
      } else {
        return t('edit');
      }
    }
  };

  const getEditButtonClass = (course) => {
    // Determine edit type for button styling
    if (course.status === 'draft' || course.status === 'archived') {
      return 'btn btn-secondary';
    } else if (course.status === 'active') {
      if (course.enrollmentCount > 0) {
        return 'btn btn-danger'; // Red for restricted editing
      } else {
        return 'btn btn-secondary';
      }
    } else if (course.status === 'closed') {
      if (course.enrollmentCount > 0) {
        return 'btn btn-warning';
      } else {
        return 'btn btn-secondary';
      }
    } else {
      // Legacy courses
      if (course.isPublished && course.enrollmentCount > 0) {
        return 'btn btn-danger'; // Red for restricted editing
      } else {
        return 'btn btn-secondary';
      }
    }
  };

  const getEditButtonTitle = (course) => {
    if (course.status === 'draft' || course.status === 'archived') {
      return 'Edit course (no restrictions)';
    } else if (course.status === 'active') {
      if (course.enrollmentCount > 0) {
        return `Edit course with ${course.enrollmentCount} enrolled student${course.enrollmentCount > 1 ? 's' : ''} (video/thumbnail editing disabled)`;
      } else {
        return 'Edit course (no students enrolled)';
      }
    } else if (course.status === 'closed') {
      if (course.enrollmentCount > 0) {
        return `Edit closed course with ${course.enrollmentCount} enrolled student${course.enrollmentCount > 1 ? 's' : ''} (some restrictions apply)`;
      } else {
        return 'Edit course (no students enrolled)';
      }
    } else {
      // Legacy courses
      if (course.isPublished && course.enrollmentCount > 0) {
        return `Edit published course with ${course.enrollmentCount} enrolled student${course.enrollmentCount > 1 ? 's' : ''} (video/thumbnail editing disabled)`;
      } else {
        return 'Edit course';
      }
    }
  };

  const getPublishRequirements = (course) => {
    const requirements = [];
    if (!course.videoUrl) requirements.push('Video');
    if (!course.thumbnail) requirements.push('Thumbnail');
    return requirements;
  };

  const canPublish = (course) => {
    return course.videoUrl && course.thumbnail;
  };

  const getPublishButtonTitle = (course) => {
    if (canPublish(course)) {
      return 'Publish course to make it available to students';
    } else {
      const missing = getPublishRequirements(course);
      return `Cannot publish: Missing ${missing.join(' and ')}`;
    }
  };

  const getStatusDisplay = (course) => {
    // Handle legacy courses that might not have status field
    if (!course.status) {
      if (course.isPublished) {
        return { text: `🟢 Active • ${course.enrollmentCount || 0} enrolled`, class: 'status-active' };
      } else {
        return { text: '📝 Draft', class: 'status-draft' };
      }
    }
    
    switch (course.status) {
      case 'draft':
        return { text: '📝 Draft', class: 'status-draft' };
      case 'active':
        return { text: `🟢 Active • ${course.enrollmentCount || 0} enrolled`, class: 'status-active' };
      case 'closed':
        return { text: `🟡 Closed • ${course.enrollmentCount || 0} enrolled`, class: 'status-closed' };
      case 'archived':
        return { text: '🔴 Archived', class: 'status-archived' };
      default:
        return { text: '📝 Draft', class: 'status-draft' };
    }
  };

  const getAvailableActions = (course) => {
    const actions = [];
    
    // Debug: Log course status
    console.log('🔍 Course status check:', {
      courseId: course._id,
      title: course.title,
      status: course.status,
      isPublished: course.isPublished,
      hasVideo: !!course.videoUrl,
      hasThumbnail: !!course.thumbnail,
      enrollmentCount: course.enrollmentCount
    });
    
    // Handle legacy courses that might not have status field
    if (!course.status) {
      console.log('⚠️ Legacy course detected - no status field');
      if (course.isPublished) {
        console.log('📝 Legacy published course - treating as active');
        // Legacy published course - treat as active
        actions.push({ action: 'close', label: t('close'), class: 'btn-warning' });
        if (course.enrollmentCount === 0) {
          actions.push({ action: 'archive', label: t('archive'), class: 'btn-danger' });
        }
      } else {
        console.log('📝 Legacy unpublished course - treating as draft');
        // Legacy unpublished course - treat as draft
        if (canPublish(course)) {
          console.log('✅ Legacy course can be activated');
          actions.push({ action: 'activate', label: t('activate'), class: 'btn-success' });
        } else {
          console.log('❌ Legacy course missing requirements');
          // Show what's missing for legacy draft courses
          const missing = getPublishRequirements(course);
          actions.push({ 
            action: 'requirements', 
            label: `Missing: ${missing.join(', ')}`, 
            class: 'btn-secondary',
            disabled: true 
          });
        }
      }
    } else {
      console.log('📝 Modern course with status field:', course.status);
      switch (course.status) {
        case 'draft':
          console.log('📝 Course is draft');
          if (canPublish(course)) {
            console.log('✅ Draft course can be activated');
            actions.push({ action: 'activate', label: t('activate'), class: 'btn-success' });
          } else {
            console.log('❌ Draft course missing requirements');
            // Show what's missing for draft courses
            const missing = getPublishRequirements(course);
            actions.push({ 
              action: 'requirements', 
              label: `Missing: ${missing.join(', ')}`, 
              class: 'btn-secondary',
              disabled: true 
            });
          }
          break;
        case 'active':
          console.log('🟢 Course is active');
          actions.push({ action: 'close', label: t('close'), class: 'btn-warning' });
          if (course.enrollmentCount === 0) {
            actions.push({ action: 'archive', label: t('archive'), class: 'btn-danger' });
          }
          break;
        case 'closed':
          console.log('🟡 Course is closed');
          actions.push({ action: 'activate', label: t('activate'), class: 'btn-success' });
          if (course.enrollmentCount === 0) {
            actions.push({ action: 'archive', label: t('archive'), class: 'btn-danger' });
          }
          break;
        case 'archived':
          console.log('🔴 Course is archived');
          actions.push({ action: 'activate', label: t('activate'), class: 'btn-success' });
          actions.push({ action: 'close', label: t('close'), class: 'btn-warning' });
          break;
        default:
          console.log('❓ Unknown course status:', course.status);
          break;
      }
    }
    
    console.log('🎯 Available actions for course:', course.title, ':', actions);
    return actions;
  };

  const handleStatusChange = async (course, newStatus) => {
    console.log('🚀 handleStatusChange called:', {
      courseId: course._id,
      courseTitle: course.title,
      currentStatus: course.status,
      newStatus: newStatus,
      hasVideo: !!course.videoUrl,
      hasThumbnail: !!course.thumbnail
    });

    const statusLabels = {
      'activate': 'active',
      'close': 'closed', 
      'archive': 'archived'
    };

    const statusLabel = statusLabels[newStatus];
    console.log('🔄 Status mapping:', { newStatus, statusLabel });

    const confirmMessages = {
      'activate': `Activate "${course.title}" to accept new enrollments?`,
      'close': `Close "${course.title}" to stop new enrollments? Existing students can still access the course.`,
      'archive': `Archive "${course.title}"? This will hide the course completely. Only available if no students are enrolled.`
    };

    const confirmed = window.confirm(confirmMessages[newStatus]);
    console.log('✅ User confirmed action:', confirmed);
    
    if (!confirmed) {
      console.log('❌ User cancelled the action');
      return;
    }

    console.log('🔄 Setting updatingCourse state to:', course._id);
    setUpdatingCourse(course._id);
    
    try {
      console.log('📡 Making API call to updateCourseStatus:', {
        courseId: course._id,
        status: statusLabel
      });
      
      const result = await updateCourseStatus(course._id, statusLabel);
      console.log('📥 API response received:', result);
      
      if (result.success) {
        console.log('✅ Status update successful, refreshing courses...');
        
        // Refresh courses
        console.log('📡 Fetching updated courses...');
        const res = await getMyCourses('instructor');
        console.log('📥 Updated courses received:', res);
        
        if (res.success) {
          console.log('📥 Updated courses array:', res.courses);
          
          if (res.courses && res.courses.length > 0) {
            console.log('🔍 Updated course details:', res.courses.map(course => ({
              id: course._id,
              title: course.title,
              status: course.status,
              isPublished: course.isPublished,
              enrollmentCount: course.enrollmentCount,
              hasVideo: !!course.videoUrl,
              hasThumbnail: !!course.thumbnail
            })));
          }
          
          setCourses(res.courses || []);
          
          // Refresh stats
          console.log('📡 Fetching updated stats...');
          const statsRes = await getInstructorStats();
          console.log('📥 Updated stats received:', statsRes);
          setStats(statsRes.stats || null);
          
          console.log('✅ Course and stats refreshed successfully');
          alert(`Course ${newStatus}d successfully!`);
        } else {
          console.error('❌ Failed to refresh courses after status update:', res.error);
        }
      } else {
        console.error('❌ Status update failed:', result.error);
        alert(`Failed to ${newStatus} course: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Exception in handleStatusChange:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      alert(`Failed to ${newStatus} course. Please try again.`);
    } finally {
      console.log('🔄 Clearing updatingCourse state');
      setUpdatingCourse(null);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-page container">
      <h1>{t('dashboard')}</h1>
      <div className="dashboard-content">
        <div className="dashboard-profile">
          <h2>{t('profile')}</h2>
          <div className="profile-card">
            <div className="profile-image-container">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt={user.name} 
                  className="dashboard-profile-image"
                  onError={() => setProfileImageUrl('')}
                />
              ) : (
                <div className="dashboard-profile-placeholder">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="profile-info">
              <p><b>{t('name')}:</b> {user.name}</p>
              <p><b>{t('email')}:</b> {user.email}</p>
              <p><b>{t('role')}:</b> {t(user.role)}</p>
              {user.bio && <p><b>{t('bio')}:</b> {user.bio}</p>}
              <Link to="/profile" className="btn btn-secondary">{t('editProfile')}</Link>
            </div>
          </div>
        </div>
        <div className="dashboard-main">
          {user.role === 'instructor' ? (
            <>
              <div className="dashboard-header">
                <h2>{t('yourCourses')}</h2>
                <div className="dashboard-actions">
                  <Link to="/create-course" className="btn btn-primary">{t('createNewCourse')}</Link>
                </div>
              </div>
              <div className="dashboard-stats">
                <h3>{t('stats')}</h3>
                {stats ? (
                  <ul>
                    <li>{t('totalCourses')}: {stats.totalCourses}</li>
                    <li>{t('totalEnrollments')}: {stats.totalEnrollments}</li>
                    <li>{t('totalRevenue')}: ${stats.totalRevenue}</li>
                  </ul>
                ) : <p>{t('loading')}</p>}
              </div>
              <div className="dashboard-courses">
                {courses.length === 0 ? (
                  <p>{t('noCoursesUploaded')}</p>
                ) : (
                  <div className="course-grid">
                    {courses.map(course => {
                      console.log('🎨 Rendering course:', {
                        courseId: course._id,
                        title: course.title,
                        status: course.status,
                        isPublished: course.isPublished,
                        enrollmentCount: course.enrollmentCount,
                        hasVideo: !!course.videoUrl,
                        hasThumbnail: !!course.thumbnail
                      });
                      
                      const availableActions = getAvailableActions(course);
                      console.log('🎯 Available actions for', course.title, ':', availableActions);
                      
                      console.log('Course thumbnail check:', {
                        courseId: course._id,
                        title: course.title,
                        thumbnail: course.thumbnail,
                        videoUrl: course.videoUrl,
                        thumbnailExists: !!course.thumbnail,
                        videoExists: !!course.videoUrl,
                        secureThumbnailUrl: thumbnailUrls[course._id]
                      });
                      return (
                        <div key={course._id} className="course-card">
                          <div className="course-thumbnail">
                            {course.thumbnail ? (
                              <img 
                                src={thumbnailUrls[course._id] || course.thumbnail} 
                                alt={course.title} 
                                className={course.videoUrl && user.role === 'instructor' && course.instructorId?.toString() === user._id?.toString() ? 'clickable' : 'non-clickable'}
                                onError={(e) => {
                                  console.error('Thumbnail image failed to load:', course.thumbnail);
                                  console.error('Error event:', e);
                                }}
                                onLoad={() => {
                                  console.log('Thumbnail loaded successfully:', course.thumbnail);
                                }}
                              />
                            ) : (
                              <div className="no-thumbnail" onClick={() => course.videoUrl && handleThumbnailClick(course)}>
                                <span>📹</span>
                              </div>
                            )}
                            {course.videoUrl && (
                              <div className="video-indicator">
                                {user.role === 'instructor' && course.instructorId?.toString() === user._id?.toString() ? (
                                  <span title="Click to play video" onClick={() => handleThumbnailClick(course)}>▶️</span>
                                ) : (
                                  <span title="Video available after enrollment">🔒</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="course-info">
                            <h3>{course.title}</h3>
                            <p className="course-description">{course.description}</p>
                            <div className="course-meta">
                              <span className="course-price">${course.price}</span>
                              <span className="course-level">{course.level}</span>
                              <span className="course-language">{course.language}</span>
                            </div>
                            <div className="course-status">
                              {getStatusDisplay(course).text}
                            </div>
                            <div className="course-actions">
                              <Link to={`/course/${course._id}`} className="btn btn-primary">
                                <span>{t('viewCourse')}</span>
                              </Link>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditCourse(course);
                                }}
                                className={getEditButtonClass(course)}
                                title={getEditButtonTitle(course)}
                                disabled={updatingCourse === course._id}
                              >
                                <span>{getEditButtonText(course)}</span>
                              </button>
                              {availableActions.map((action, index) => (
                                <button 
                                  key={index}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (action.action === 'requirements') {
                                      // Don't do anything for requirements button
                                      return;
                                    }
                                    handleStatusChange(course, action.action);
                                  }}
                                  className={`btn ${action.class} ${updatingCourse === course._id ? 'loading' : ''}`}
                                  disabled={updatingCourse === course._id || action.disabled}
                                  title={action.action === 'requirements' ? 'Add video and thumbnail to activate course' : action.label}
                                >
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2>{t('enrolledCourses')}</h2>
              <div className="dashboard-courses">
                {loading ? <p>{t('loading')}</p> : courses.length === 0 ? (
                  <p>{t('noEnrolledCourses')}</p>
                ) : (
                  <div className="course-grid">
                    {courses.map(course => {
                      console.log('🎨 Rendering course:', {
                        courseId: course._id,
                        title: course.title,
                        status: course.status,
                        isPublished: course.isPublished,
                        enrollmentCount: course.enrollmentCount,
                        hasVideo: !!course.videoUrl,
                        hasThumbnail: !!course.thumbnail
                      });
                      
                      const availableActions = getAvailableActions(course);
                      console.log('🎯 Available actions for', course.title, ':', availableActions);
                      
                      console.log('Course thumbnail check:', {
                        courseId: course._id,
                        title: course.title,
                        thumbnail: course.thumbnail,
                        videoUrl: course.videoUrl,
                        thumbnailExists: !!course.thumbnail,
                        videoExists: !!course.videoUrl,
                        secureThumbnailUrl: thumbnailUrls[course._id]
                      });
                      return (
                        <div key={course._id} className="course-card">
                          <div className="course-thumbnail">
                            {course.thumbnail ? (
                              <img 
                                src={thumbnailUrls[course._id] || course.thumbnail} 
                                alt={course.title} 
                                className={course.videoUrl && user.role === 'instructor' && course.instructorId?.toString() === user._id?.toString() ? 'clickable' : 'non-clickable'}
                                onError={(e) => {
                                  console.error('Student course thumbnail image failed to load:', course.thumbnail);
                                  console.error('Error event:', e);
                                }}
                                onLoad={() => {
                                  console.log('Student course thumbnail loaded successfully:', course.thumbnail);
                                }}
                              />
                            ) : (
                              <div className="no-thumbnail" onClick={() => course.videoUrl && handleThumbnailClick(course)}>
                                <span>📹</span>
                              </div>
                            )}
                            {course.videoUrl && (
                              <div className="video-indicator">
                                {user.role === 'instructor' && course.instructorId?.toString() === user._id?.toString() ? (
                                  <span title="Click to play video"                              onClick={() => handleThumbnailClick(course)}>▶️</span>
                                ) : (
                                  <span title="Video available after enrollment">🔒</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="course-info">
                            <h3>{course.title}</h3>
                            <p className="course-description">{course.description}</p>
                            <div className="course-meta">
                              <span className="course-price">${course.price}</span>
                              <span className="course-level">{course.level}</span>
                              <span className="course-language">{course.language}</span>
                            </div>
                            <div className="course-status">
                              {getStatusDisplay(course).text}
                            </div>
                            <div className="course-actions">
                              <Link to={`/course/${course._id}`} className="btn btn-primary">
                                <span>{t('viewCourse')}</span>
                              </Link>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditCourse(course);
                                }}
                                className={getEditButtonClass(course)}
                                title={getEditButtonTitle(course)}
                              >
                                <span>{getEditButtonText(course)}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {showVideoModal && selectedVideo && (
        <div className="video-modal" onClick={closeVideoModal}>
          <div className="video-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-header">
              <h3>{selectedVideo.title}</h3>
              <button className="close-button" onClick={closeVideoModal}>×</button>
            </div>
            <div className="video-container">
              <CoursePlayer courseId={selectedVideo._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 