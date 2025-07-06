import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getSecureProfileImageUrl } from '../utils/api';
import './Header.css';

const Header = ({ currentLanguage, onLanguageChange }) => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load profile image when user changes
  useEffect(() => {
    if (user && user.profilePicture) {
      loadProfileImage();
    } else {
      setProfileImageUrl('');
    }
  }, [user]);

  const loadProfileImage = async () => {
    if (!user || !user.profilePicture) return;
    
    try {
      setImageLoading(true);
      console.log('Loading profile image for user:', user._id);
      console.log('Original profile picture URL:', user.profilePicture);
      
      const result = await getSecureProfileImageUrl(user._id);
      console.log('Profile image result:', result);
      
      if (result.success) {
        // Decode the URL to handle encoded characters
        const decodedUrl = decodeURIComponent(result.url);
        console.log('Decoded profile image URL:', decodedUrl);
        setProfileImageUrl(decodedUrl);
      } else {
        console.error('Failed to load profile image:', result.error);
        setProfileImageUrl('');
      }
    } catch (error) {
      console.error('Failed to load profile image:', error);
      setProfileImageUrl('');
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setShowDropdown(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== DROPDOWN TOGGLE DEBUG ===');
    console.log('Dropdown toggle clicked, current state:', showDropdown);
    console.log('Event target:', e.target);
    console.log('Event currentTarget:', e.currentTarget);
    
    const newState = !showDropdown;
    setShowDropdown(newState);
    console.log('Dropdown state changed to:', newState);
    console.log('Dropdown should be visible:', newState);
    
    // Force a re-render and check state
    setTimeout(() => {
      console.log('Current dropdown state after timeout:', showDropdown);
      console.log('=== END DROPDOWN DEBUG ===');
    }, 100);
  };

  const closeDropdown = () => {
    console.log('Closing dropdown');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-menu')) {
        console.log('Click outside detected, closing dropdown');
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <h1>Edu Platform</h1>
          </Link>

          {/* Navigation Menu */}
          <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              {t('home')}
            </Link>
            <Link to="/courses" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              {t('courses')}
            </Link>
            
            {isAuthenticated && (
              <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                {t('dashboard')}
              </Link>
            )}
          </nav>

          {/* Right side - Language, Auth */}
          <div className="header-right">
            {/* Language Switcher */}
            <div className="language-switcher">
              <select 
                value={currentLanguage} 
                onChange={(e) => onLanguageChange(e.target.value)}
                className="language-select"
              >
                <option value="en">{t('english')}</option>
                <option value="ti">{t('tigrigna')}</option>
                <option value="am">{t('amharic')}</option>
              </select>
            </div>

            {/* Authentication */}
            {isAuthenticated ? (
              <div className="auth-section">
                <div className="user-menu">
                  <div 
                    className="user-profile" 
                    onClick={toggleDropdown}
                    style={{
                      borderColor: showDropdown ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)',
                      backgroundColor: showDropdown ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      border: showDropdown ? '3px solid red' : '2px solid rgba(255, 255, 255, 0.2)',
                      transform: showDropdown ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {imageLoading ? (
                      <div className="profile-placeholder loading">
                        <span>...</span>
                      </div>
                    ) : profileImageUrl ? (
                      <img 
                        src={profileImageUrl} 
                        alt={user?.name} 
                        className="profile-image"
                        onError={(e) => {
                          console.error('Profile image failed to load:', profileImageUrl);
                          console.error('Image error details:', e);
                          setProfileImageUrl('');
                          // Force re-render to show placeholder
                          setTimeout(() => {
                            setImageLoading(false);
                          }, 100);
                        }}
                        onLoad={() => {
                          console.log('Profile image loaded successfully:', profileImageUrl);
                        }}
                      />
                    ) : (
                      <div className="profile-placeholder">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="user-name">{user?.name}</span>
                    {/* Debug indicator 
                    <span style={{ 
                      fontSize: '10px', 
                      color: 'yellow', 
                      marginLeft: '4px',
                      display: showDropdown ? 'inline' : 'none'
                    }}>
                      [ACTIVE]
                    </span>
                    */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  {t('login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" onClick={toggleMenu}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal-style Dropdown - Fixed Position */}
      {showDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: 'white',
            border: '2px solid #007bff',
            borderRadius: '8px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            minWidth: '200px',
            zIndex: 10000,
            padding: '12px 0',
            display: 'block',
            animation: 'slideIn 0.3s ease'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '20px',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid #007bff'
          }}></div>
          
          <Link 
            to="/dashboard" 
            onClick={closeDropdown}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 20px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#333',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'none',
              borderBottom: '1px solid #f0f0f0',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            📊 {t('dashboard')}
          </Link>
          
          <Link 
            to="/profile" 
            onClick={closeDropdown}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 20px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#333',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'none',
              borderBottom: '1px solid #f0f0f0',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            👤 {t('profile')}
          </Link>
          
          <button 
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 20px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#dc3545',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            🚪 {t('logout')}
          </button>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div 
          onClick={closeDropdown}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            zIndex: 9999
          }}
        ></div>
      )}
    </header>
  );
};

export default Header; 