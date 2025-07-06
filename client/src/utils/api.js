import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('📡 API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      params: config.params
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Added Authorization header');
    } else {
      console.log('👤 No token - making unauthenticated request');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this is a public route that doesn't require authentication
    const url = error.config?.url || '';
    const isPublicRoute = (url.includes('/courses') && 
                          !url.includes('/instructor') && 
                          !url.includes('/student') &&
                          !url.includes('/enroll')) ||
                         (url.includes('/video/thumbnail/public/')) ||
                         (url.includes('/auth/register') || url.includes('/auth/login'));
    
    if (error.response?.status === 401 && !isPublicRoute) {
      console.log('🔒 401 Unauthorized for protected route, redirecting to login');
      console.log('🔒 URL that caused redirect:', url);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 401 && isPublicRoute) {
      console.log('🔓 401 Unauthorized for public route - this is expected for unauthenticated users');
      console.log('🔓 Public URL that did NOT redirect:', url);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => {
    // Check if userData is FormData (for file uploads)
    if (userData instanceof FormData) {
      return api.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Regular JSON data
    return api.post('/auth/register', userData);
  },
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => {
    // Check if userData is FormData (for file uploads)
    if (userData instanceof FormData) {
      return api.put('/auth/me', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Regular JSON data
    return api.put('/auth/me', userData);
  },
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  createWithVideo: (courseData, videoFile, thumbnailFile, onProgress) => {
    const formData = new FormData();
    
    // Add course data
    Object.keys(courseData).forEach(key => {
      formData.append(key, courseData[key]);
    });
    
    // Add video file
    if (videoFile) {
      formData.append('video', videoFile);
    }
    
    // Add thumbnail file
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    
    return api.post('/courses/create-with-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
  uploadVideo: (id, videoFile) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    return api.post(`/courses/${id}/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getMyCourses: (role) => {
    if (role === 'instructor') {
      return api.get('/courses/instructor/my-courses');
    } else {
      // For both students and instructors, use the same endpoint for enrolled courses
      return api.get('/courses/student/enrolled');
    }
  },
  getEnrollmentStatus: (id) => api.get(`/courses/${id}/enrollment-status`),
  getFilterOptions: () => api.get('/courses/filters/options'),
  postReview: (id, reviewData) => api.post(`/courses/${id}/reviews`, reviewData),
  enrollInCourse: (id) => api.post(`/courses/${id}/enroll`),
  publishCourse: (id) => api.patch(`/courses/${id}/publish`),
  unpublishCourse: (id) => api.patch(`/courses/${id}/unpublish`),
  updateCourseStatus: (id, status) => api.patch(`/courses/${id}/status`, { status }),
  uploadThumbnail: (id, thumbnailFile) => {
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);
    return api.post(`/courses/${id}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Instructor API
export const instructorAPI = {
  getStats: () => api.get('/instructor/stats'),
  getRevenue: () => api.get('/instructor/revenue'),
  getEnrollments: () => api.get('/instructor/enrollments'),
};

// Payment API
export const paymentAPI = {
  createCheckoutSession: (courseId) => api.post('/payment/create-checkout-session', { courseId }),
  getPaymentStatus: (sessionId) => api.get(`/payment/status/${sessionId}`),
  getPaymentHistory: () => api.get('/payment/history'),
};

// Video API
export const videoAPI = {
  getSecureVideoUrl: (courseId) => api.get(`/video/${courseId}`),
  getPublicThumbnailUrl: (courseId) => api.get(`/video/thumbnail/public/${courseId}`),
  getSecureProfileImageUrl: (userId) => api.get(`/video/profile/${userId}`),
};

// Helper functions for API responses
export const getCourses = async (params = {}) => {
  console.log('🔍 getCourses called with params:', params);
  console.log('🔍 Current user token:', localStorage.getItem('token') ? 'Present' : 'Not present');
  console.log('🔍 API Base URL:', API_BASE_URL);
  
  try {
    console.log('📡 Making API call to /courses with params:', params);
    const response = await coursesAPI.getAll(params);
    
    console.log('✅ API call successful');
    console.log('📊 Response status:', response.status);
    console.log('📊 Number of courses returned:', response.data.courses?.length || 0);
    console.log('📊 Total courses count:', response.data.total || 0);
    
    // Return the expected structure with success property
    return { 
      success: true, 
      courses: response.data.courses || [],
      total: response.data.total || 0
    };
  } catch (error) {
    console.log('❌ getCourses API call failed:');
    console.log('   Error status:', error.response?.status);
    console.log('   Error message:', error.response?.data?.message || error.message);
    console.log('   Error details:', error.response?.data);
    
    // Return error structure
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch courses',
      status: error.response?.status,
      details: error.message
    };
  }
};

export const getCourseDetail = async (id) => {
  console.log('🔍 getCourseDetail called for course ID:', id);
  
  try {
    console.log('📡 Making API call to /courses/' + id);
    const response = await coursesAPI.getById(id);
    
    console.log('✅ Course detail API call successful');
    console.log('📊 Course title:', response.data.course?.title);
    console.log('📊 Course instructor:', response.data.course?.instructor?.name);
    console.log('📊 User enrolled:', response.data.enrolled);
    
    return { 
      success: true, 
      course: response.data.course,
      enrolled: response.data.enrolled
    };
  } catch (error) {
    console.log('❌ getCourseDetail API call failed:');
    console.log('   Course ID:', id);
    console.log('   Error status:', error.response?.status);
    console.log('   Error message:', error.response?.data?.message || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch course details',
      status: error.response?.status,
      details: error.message
    };
  }
};

export const getMyCourses = async (role) => {
  console.log('🔍 getMyCourses called for role:', role);
  
  try {
    console.log('📡 Making API call to get courses for role:', role);
    const response = await coursesAPI.getMyCourses(role);
    
    console.log('✅ getMyCourses API call successful');
    console.log('📊 Number of courses returned:', response.data.courses?.length || 0);
    
    return { 
      success: true, 
      courses: response.data.courses || []
    };
  } catch (error) {
    console.log('❌ getMyCourses API call failed:');
    console.log('   Role:', role);
    console.log('   Error status:', error.response?.status);
    console.log('   Error message:', error.response?.data?.message || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch courses',
      status: error.response?.status,
      details: error.message
    };
  }
};

export const getInstructorStats = async () => {
  try {
    const response = await instructorAPI.getStats();
    return { success: true, stats: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to fetch stats' };
  }
};

export const enrollInCourse = async (courseId) => {
  console.log('🔍 enrollInCourse called for course ID:', courseId);
  
  try {
    console.log('📡 Making API call to enroll in course');
    const response = await coursesAPI.enrollInCourse(courseId);
    
    console.log('✅ Enrollment API call successful');
    console.log('📊 Enrollment result:', response.data);
    
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.log('❌ enrollInCourse API call failed:');
    console.log('   Course ID:', courseId);
    console.log('   Error status:', error.response?.status);
    console.log('   Error message:', error.response?.data?.message || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to enroll in course',
      status: error.response?.status,
      details: error.message
    };
  }
};

export const postReview = async (courseId, reviewData) => {
  console.log('🔍 postReview called for course ID:', courseId);
  console.log('📝 Review data:', reviewData);
  
  try {
    console.log('📡 Making API call to post review');
    const response = await coursesAPI.postReview(courseId, reviewData);
    
    console.log('✅ Review posting API call successful');
    console.log('📊 Review result:', response.data);
    
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.log('❌ postReview API call failed:');
    console.log('   Course ID:', courseId);
    console.log('   Error status:', error.response?.status);
    console.log('   Error message:', error.response?.data?.message || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to post review',
      status: error.response?.status,
      details: error.message
    };
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await authAPI.updateProfile(userData);
    return { success: true, user: response.data.user };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to update profile' };
  }
};

export const uploadCourse = async (courseData) => {
  try {
    const response = await coursesAPI.create(courseData);
    return { success: true, course: response.data.course };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to upload course' };
  }
};

export const uploadCourseWithVideo = async (courseData, videoFile, thumbnailFile, onProgress) => {
  try {
    const response = await coursesAPI.createWithVideo(courseData, videoFile, thumbnailFile, onProgress);
    return { success: true, course: response.data.course };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to upload course with video' };
  }
};

// Helper function for secure video access
export const getSecureVideoUrl = async (courseId) => {
  try {
    const response = await videoAPI.getSecureVideoUrl(courseId);
    return { success: true, url: response.data.url, type: response.data.type };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to get secure video URL' 
    };
  }
};

// Helper function for thumbnail access (no authentication required)
export const getPublicThumbnailUrl = async (courseId) => {
  console.log('🖼️  getPublicThumbnailUrl called for courseId:', courseId);
  console.log('🔍 Current user token:', localStorage.getItem('token') ? 'Present' : 'Not present');
  
  try {
    console.log('📡 Making API call to /video/thumbnail/public/' + courseId);
    const response = await videoAPI.getPublicThumbnailUrl(courseId);
    
    console.log('✅ Public thumbnail URL API call successful');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', response.data);
    
    return { success: true, url: response.data.url, type: response.data.type };
  } catch (error) {
    console.error('❌ getPublicThumbnailUrl API call failed');
    console.error('❌ Error details:', {
      courseId,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to get public thumbnail URL',
      status: error.response?.status,
      details: error.message
    };
  }
};

// Helper function for secure profile image access
export const getSecureProfileImageUrl = async (userId) => {
  try {
    const response = await videoAPI.getSecureProfileImageUrl(userId);
    return { success: true, url: response.data.url, type: response.data.type };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to get secure profile image URL' 
    };
  }
};

export const publishCourse = async (courseId) => {
  try {
    const response = await coursesAPI.publishCourse(courseId);
    return { success: true, course: response.data.course };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to publish course' };
  }
};

export const unpublishCourse = async (courseId) => {
  try {
    const response = await coursesAPI.unpublishCourse(courseId);
    return { success: true, course: response.data.course };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to unpublish course' };
  }
};

export const updateCourseStatus = async (courseId, status) => {
  console.log('🔄 updateCourseStatus called:', { courseId, status });
  console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Not present');
  
  try {
    console.log('📡 Making API call to updateCourseStatus...');
    const response = await coursesAPI.updateCourseStatus(courseId, status);
    console.log('✅ updateCourseStatus API call successful');
    console.log('📥 Response data:', response.data);
    
    return { success: true, course: response.data.course };
  } catch (error) {
    console.error('❌ updateCourseStatus API call failed');
    console.error('❌ Error details:', {
      courseId,
      status,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    return { success: false, error: error.response?.data?.message || 'Failed to update course status' };
  }
};

export const updateCourse = async (courseId, courseData) => {
  console.log('🔄 updateCourse called:', { courseId, courseData });
  console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Not present');
  
  try {
    console.log('📡 Making API call to update course...');
    const response = await coursesAPI.update(courseId, courseData);
    console.log('✅ updateCourse API call successful');
    console.log('📥 Response data:', response.data);
    
    return { success: true, course: response.data.course };
  } catch (error) {
    console.error('❌ updateCourse API call failed');
    console.error('❌ Error details:', {
      courseId,
      courseData,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    return { success: false, error: error.response?.data?.message || 'Failed to update course' };
  }
};

export const uploadVideo = async (courseId, videoFile) => {
  console.log('🔄 uploadVideo called:', { courseId, fileName: videoFile.name });
  console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Not present');
  
  try {
    console.log('📡 Making API call to upload video...');
    const response = await coursesAPI.uploadVideo(courseId, videoFile);
    console.log('✅ uploadVideo API call successful');
    console.log('📥 Response data:', response.data);
    
    return { success: true, videoUrl: response.data.videoUrl };
  } catch (error) {
    console.error('❌ uploadVideo API call failed');
    console.error('❌ Error details:', {
      courseId,
      fileName: videoFile.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    return { success: false, error: error.response?.data?.message || 'Failed to upload video' };
  }
};

export const uploadThumbnail = async (courseId, thumbnailFile) => {
  console.log('🔄 uploadThumbnail called:', { courseId, fileName: thumbnailFile.name });
  console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Not present');
  
  try {
    console.log('📡 Making API call to upload thumbnail...');
    const response = await coursesAPI.uploadThumbnail(courseId, thumbnailFile);
    console.log('✅ uploadThumbnail API call successful');
    console.log('📥 Response data:', response.data);
    
    return { success: true, thumbnailUrl: response.data.thumbnailUrl };
  } catch (error) {
    console.error('❌ uploadThumbnail API call failed');
    console.error('❌ Error details:', {
      courseId,
      fileName: thumbnailFile.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    return { success: false, error: error.response?.data?.message || 'Failed to upload thumbnail' };
  }
};

export default api; 