import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PaymentFailed.css';

const PaymentFailed = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get course details from location state
  const courseDetails = location.state?.courseDetails || {};
  const courseId = location.state?.courseId;
  const errorMessage = location.state?.errorMessage || 'Payment processing failed. Please try again.';

  return (
    <div className="payment-failed-page">
      <div className="failed-container">
        <div className="failed-animation">
          <div className="failed-icon">❌</div>
          <div className="failed-x"></div>
        </div>
        
        <h1>Payment Failed</h1>
        <p className="failed-message">
          {errorMessage}
        </p>

        {courseDetails.title && (
          <div className="course-details">
            <h3>Course Details</h3>
            <div className="detail-item">
              <span>Course:</span>
              <span>{courseDetails.title}</span>
            </div>
            {courseDetails.price && (
              <div className="detail-item">
                <span>Amount:</span>
                <span>${courseDetails.price}</span>
              </div>
            )}
            <div className="detail-item">
              <span>Status:</span>
              <span className="status-failed">Payment Failed</span>
            </div>
          </div>
        )}

        <div className="failed-actions">
          {courseId && (
            <button 
              onClick={() => navigate(`/course/${courseId}/payment`)}
              className="btn btn-primary"
            >
              Try Payment Again
            </button>
          )}
          <button 
            onClick={() => navigate('/courses')}
            className="btn btn-secondary"
          >
            Browse Other Courses
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="help-section">
          <h3>Need Help?</h3>
          <div className="help-options">
            <div className="help-item">
              <span className="help-icon">💳</span>
              <div>
                <h4>Payment Issues</h4>
                <p>Check your card details and try again</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">📧</span>
              <div>
                <h4>Contact Support</h4>
                <p>Email us at support@example.com</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">❓</span>
              <div>
                <h4>FAQ</h4>
                <p>Check our frequently asked questions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="common-issues">
          <h3>Common Payment Issues</h3>
          <ul>
            <li>❌ Insufficient funds in your account</li>
            <li>❌ Card has expired or is invalid</li>
            <li>❌ Bank declined the transaction</li>
            <li>❌ Network connectivity issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed; 