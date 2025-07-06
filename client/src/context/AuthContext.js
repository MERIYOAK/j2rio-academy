import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 AuthProvider initialized');

  // Check if user is logged in on app start
  useEffect(() => {
    console.log('🔐 Checking authentication status on app start...');
    
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    console.log('🔐 Local storage check:');
    console.log('   Token exists:', !!token);
    console.log('   Saved user exists:', !!savedUser);
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ Found saved user:', {
          id: parsedUser._id,
          name: parsedUser.name,
          role: parsedUser.role,
          email: parsedUser.email
        });
        
        setUser(parsedUser);
        
        // Verify token with server
        console.log('🔐 Verifying token with server...');
        authAPI.getProfile()
          .then(response => {
            console.log('✅ Token verified successfully');
            console.log('   Server user data:', {
              id: response.data.user._id,
              name: response.data.user.name,
              role: response.data.user.role
            });
            
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          })
          .catch((error) => {
            console.log('❌ Token verification failed:', error.message);
            console.log('   Clearing invalid token and user data');
            
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
            console.log('🔐 Authentication check completed');
          });
      } catch (error) {
        console.log('❌ Error parsing saved user:', error.message);
        console.log('   Clearing corrupted user data');
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      }
    } else {
      console.log('🔐 No saved authentication found');
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    console.log('🔐 Login attempt:');
    console.log('   Email:', credentials.email);
    console.log('   Password provided:', !!credentials.password);
    
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      console.log('✅ Login successful:');
      console.log('   User ID:', user._id);
      console.log('   User name:', user.name);
      console.log('   User role:', user.role);
      console.log('   Token received:', !!token);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Register function
  const register = async (userData, profileImage = null) => {
    console.log('📝 Registration attempt:');
    console.log('   User data:', {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      language: userData.language
    });
    console.log('   Profile image provided:', !!profileImage);
    
    try {
      const formData = new FormData();
      
      // Add user data
      Object.keys(userData).forEach(key => {
        formData.append(key, userData[key]);
      });
      
      // Add profile image if provided
      if (profileImage) {
        formData.append('profileImage', profileImage);
        console.log('   Profile image added to form data');
      }
      
      const response = await authAPI.register(formData);
      const { token, user } = response.data;
      
      console.log('✅ Registration successful:');
      console.log('   User ID:', user._id);
      console.log('   User name:', user.name);
      console.log('   User role:', user.role);
      console.log('   Token received:', !!token);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log('🚪 Logout requested');
    console.log('   Clearing authentication data');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    console.log('✅ Logout completed');
  };

  // Update user profile
  const updateProfile = async (userData, profileImage = null) => {
    console.log('📝 Profile update attempt:');
    console.log('   Update data:', userData);
    console.log('   Profile image provided:', !!profileImage);
    
    try {
      const formData = new FormData();
      
      // Add user data
      Object.keys(userData).forEach(key => {
        formData.append(key, userData[key]);
      });
      
      // Add profile image if provided
      if (profileImage) {
        formData.append('profileImage', profileImage);
        console.log('   Profile image added to form data');
      }
      
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data.user;
      
      console.log('✅ Profile update successful:');
      console.log('   Updated user data:', {
        id: updatedUser._id,
        name: updatedUser.name,
        role: updatedUser.role
      });
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.log('❌ Profile update failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isInstructor: user?.role === 'instructor',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 