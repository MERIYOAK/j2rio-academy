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
                    className={`user-profile ${showDropdown ? 'active' : 'inactive'}`}
                    onClick={toggleDropdown}
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
                          console.warn('Profile image failed to load, using placeholder:', profileImageUrl);
                          setProfileImageUrl('');
                          // Force re-render to show placeholder
                          setTimeout(() => {
                            setImageLoading(false);
                          }, 100);
                        }}
                        onLoad={() => {
                          console.log('Profile image loaded successfully');
                          setImageLoading(false);
                        }}
                      />
                    ) : (
                      <div className="profile-placeholder">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="user-name">{user?.name}</span>
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
        <div className="modal-dropdown">

          
          <Link 
            to="/dashboard" 
            onClick={closeDropdown}
            className="modal-dropdown-item"
          >
            📊 {t('dashboard')}
          </Link>
          
          <Link 
            to="/profile" 
            onClick={closeDropdown}
            className="modal-dropdown-item"
          >
            👤 {t('profile')}
          </Link>
          
          <button 
            onClick={handleLogout}
            className="modal-dropdown-item logout"
          >
            🚪 {t('logout')}
          </button>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div 
          className="modal-dropdown-backdrop"
          onClick={closeDropdown}
        ></div>
      )}
    </header>
  );
};

export default Header; 