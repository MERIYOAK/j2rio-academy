import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Get course details from location state or URL params
  const courseDetails = location.state?.courseDetails || {};
  const courseId = location.state?.courseId;

  useEffect(() => {
    // Auto-redirect to course after countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (courseId) {
            navigate(`/course/${courseId}`);
          } else {
            navigate('/dashboard');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, courseId]);

  return (
    <div className="payment-success-page">
      <div className="success-container">
        <div className="success-animation">
          <div className="success-icon">✅</div>
          <div className="success-checkmark"></div>
        </div>
        
        <h1>Payment Successful!</h1>
        <p className="success-message">
          Thank you for your purchase. You have been successfully enrolled in the course.
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
                <span>Amount Paid:</span>
                <span>${courseDetails.price}</span>
              </div>
            )}
            <div className="detail-item">
              <span>Status:</span>
              <span className="status-enrolled">Enrolled</span>
            </div>
          </div>
        )}

        <div className="success-actions">
          {courseId && (
            <button 
              onClick={() => navigate(`/course/${courseId}`)}
              className="btn btn-primary"
            >
              Start Learning Now
            </button>
          )}
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="redirect-info">
          <p>Redirecting to {courseId ? 'course' : 'dashboard'} in {countdown} seconds...</p>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>✅ Access your course video and materials</li>
            <li>✅ Complete the course at your own pace</li>
            <li>✅ Leave a review when you're done</li>
            <li>✅ Earn your certificate upon completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 