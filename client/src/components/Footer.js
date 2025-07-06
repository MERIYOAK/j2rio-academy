import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Edu Platform</h3>
            <p>{t('madeWith')}</p>
          </div>
          
          <div className="footer-section">
            <h4>{t('aboutUs')}</h4>
            <ul>
              <li><Link to="/">{t('home')}</Link></li>
              <li><Link to="/courses">{t('courses')}</Link></li>
              <li><Link to="/">{t('topInstructors')}</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>{t('support')}</h4>
            <ul>
              <li><Link to="/">{t('helpCenter')}</Link></li>
              <li><Link to="/">{t('contactUs')}</Link></li>
              <li><Link to="/">{t('privacyPolicy')}</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>{t('language')}</h4>
            <ul>
              <li><Link to="/">English</Link></li>
              <li><Link to="/">ትግርኛ</Link></li>
              <li><Link to="/">አማርኛ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>{t('footerText')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 