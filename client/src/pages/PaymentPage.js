import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getCourseDetail, enrollInCourse } from '../utils/api';
import './PaymentPage.css';

const PaymentPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('temp'); // Changed default to temp
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('details'); // 'details', 'processing', 'success', 'failed'
  const [tempCode, setTempCode] = useState(''); // For temporary enrollment
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});

  // Check authentication first
  useEffect(() => {
    console.log('🔐 PaymentPage: Authentication check started');
    console.log('🔐 PaymentPage: Current user:', user ? { id: user._id, role: user.role, name: user.name } : 'No user');
    console.log('🔐 PaymentPage: Course ID:', courseId);
    
    if (!user) {
      console.log('🔐 PaymentPage: No user, redirecting to register');
      console.log('🔐 PaymentPage: Redirect URL will be:', `/course/${courseId}/payment`);
      navigate('/register', { 
        state: { 
          message: 'Please register to enroll in this course',
          redirectTo: `/course/${courseId}/payment`
        }
      });
      return;
    }

    // Allow both students and instructors to enroll
    if (user.role !== 'student' && user.role !== 'instructor') {
      console.log('❌ PaymentPage: User has invalid role for enrollment:', user.role);
      alert('Only students and instructors can enroll in courses.');
      navigate('/dashboard');
      return;
    }
    
    console.log('✅ PaymentPage: Authentication check passed');
  }, [user, navigate, courseId]);

  // Load course details
  useEffect(() => {
    const loadCourse = async () => {
      if (!user || (user.role !== 'student' && user.role !== 'instructor')) return; // Allow both students and instructors
      
      try {
        setLoading(true);
        const result = await getCourseDetail(courseId);
        
        if (result.success) {
          setCourse(result.course);
          
          // Check if user is already enrolled
          if (result.enrolled) {
            alert('You are already enrolled in this course!');
            navigate(`/course/${courseId}`);
            return;
          }

          // Check if instructor is trying to enroll in their own course
          if (user.role === 'instructor' && result.course.instructorId?.toString() === user._id?.toString()) {
            alert('You cannot enroll in your own course!');
            navigate(`/course/${courseId}`);
            return;
          }
        } else {
          alert('Failed to load course details. Please try again.');
          navigate('/courses');
        }
      } catch (error) {
        console.error('Error loading course:', error);
        alert('Error loading course details. Please try again.');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && user && (user.role === 'student' || user.role === 'instructor')) {
      loadCourse();
    }
  }, [courseId, navigate, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentMethod === 'temp') {
      if (!tempCode.trim()) {
        newErrors.tempCode = 'Temporary code is required';
      } else if (tempCode !== 'TEST123') {
        newErrors.tempCode = 'Invalid temporary code. Use TEST123 for testing.';
      }
    } else if (paymentMethod === 'card') {
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      
      if (!formData.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }
      
      if (!formData.cvv.trim()) {
        newErrors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(formData.cvv)) {
        newErrors.cvv = 'Please enter a valid CVV';
      }
      
      if (!formData.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      cardNumber: formatted
    }));
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setFormData(prev => ({
      ...prev,
      expiryDate: formatted
    }));
  };

  const simulatePayment = async () => {
    return new Promise((resolve, reject) => {
      // Simulate payment processing time
      setTimeout(() => {
        // Simulate different payment outcomes for testing
        const random = Math.random();
        
        if (random > 0.1) { // 90% success rate
          resolve({
            success: true,
            transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            amount: course.price,
            currency: 'USD'
          });
        } else {
          reject(new Error('Payment failed. Please try again or use a different payment method.'));
        }
      }, 2000 + Math.random() * 1000); // 2-3 seconds
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setPaymentProcessing(true);
    setPaymentStep('processing');
    
    try {
      let paymentResult;
      
      if (paymentMethod === 'temp') {
        // For temporary code, skip payment simulation
        paymentResult = {
          success: true,
          transactionId: 'TEMP_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          amount: course.price,
          currency: 'USD'
        };
      } else {
        // Simulate payment processing for other methods
        paymentResult = await simulatePayment();
      }
      
      if (paymentResult.success) {
        // Enroll user in the course
        const enrollmentResult = await enrollInCourse(courseId);
        
        if (enrollmentResult.success) {
          setPaymentStep('success');
          
          // Redirect to course after 3 seconds
          setTimeout(() => {
            navigate(`/course/${courseId}`);
          }, 3000);
        } else {
          throw new Error(enrollmentResult.error || 'Failed to enroll in course');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'temp':
        return '🔑';
      case 'card':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'bank':
        return '🏦';
      default:
        return '💳';
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'temp':
        return 'Temporary Code (Testing)';
      case 'card':
        return 'Credit/Debit Card';
      case 'paypal':
        return 'PayPal';
      case 'bank':
        return 'Bank Transfer';
      default:
        return 'Credit/Debit Card';
    }
  };

  if (!user) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Redirecting to registration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'student' && user.role !== 'instructor') {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">
            <p>Only students and instructors can enroll in courses.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">
            <p>Course not found.</p>
            <button onClick={() => navigate('/courses')} className="btn btn-primary">
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Complete Your Enrollment</h1>
          <p>Secure payment powered by our payment partners</p>
          {user.role === 'instructor' && (
            <div className="instructor-notice">
              <p>👨‍🏫 <strong>Instructor Mode:</strong> You can enroll in other instructors' courses for professional development.</p>
            </div>
          )}
        </div>

        <div className="payment-content">
          <div className="course-summary">
            <div className="course-info">
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span className="course-level">{course.level}</span>
                <span className="course-language">{course.language}</span>
                <span className="course-category">{course.category}</span>
              </div>
            </div>
            <div className="course-price">
              <span className="price-amount">${course.price}</span>
              <span className="price-label">One-time payment</span>
            </div>
          </div>

          {paymentStep === 'details' && (
            <div className="payment-form">
              <div className="payment-methods">
                <h3>Choose Payment Method</h3>
                <div className="method-options">
                  {['temp', 'card', 'paypal', 'bank'].map(method => (
                    <button
                      key={method}
                      type="button"
                      className={`method-option ${paymentMethod === method ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <span className="method-icon">{getPaymentMethodIcon(method)}</span>
                      <span className="method-name">{getPaymentMethodName(method)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'temp' && (
                <div className="temp-code-section">
                  <div className="temp-code-info">
                    <h3>🔑 Temporary Enrollment Code</h3>
                    <p>For testing purposes, use the temporary code to enroll without payment.</p>
                    <div className="temp-code-note">
                      <strong>Test Code:</strong> TEST123
                    </div>
                  </div>
                  <form onSubmit={handlePayment} className="temp-code-form">
                    <div className="form-group">
                      <label htmlFor="tempCode">Temporary Code</label>
                      <input
                        type="text"
                        id="tempCode"
                        name="tempCode"
                        value={tempCode}
                        onChange={(e) => setTempCode(e.target.value)}
                        placeholder="Enter TEST123"
                        className={errors.tempCode ? 'error' : ''}
                      />
                      {errors.tempCode && <span className="error-message">{errors.tempCode}</span>}
                    </div>

                    <div className="payment-summary">
                      <div className="summary-row">
                        <span>Course Price:</span>
                        <span>${course.price}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total:</span>
                        <span>${course.price}</span>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/course/${courseId}`)}
                        className="btn btn-secondary"
                        disabled={paymentProcessing}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={paymentProcessing}
                      >
                        Enroll with Code
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {paymentMethod === 'card' && (
                <form onSubmit={handlePayment} className="card-form">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className={errors.cardNumber ? 'error' : ''}
                    />
                    {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleExpiryDateChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        className={errors.expiryDate ? 'error' : ''}
                      />
                      {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="4"
                        className={errors.cvv ? 'error' : ''}
                      />
                      {errors.cvv && <span className="error-message">{errors.cvv}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardholderName">Cardholder Name</label>
                    <input
                      type="text"
                      id="cardholderName"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className={errors.cardholderName ? 'error' : ''}
                    />
                    {errors.cardholderName && <span className="error-message">{errors.cardholderName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="payment-summary">
                    <div className="summary-row">
                      <span>Course Price:</span>
                      <span>${course.price}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>${course.price}</span>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/course/${courseId}`)}
                      className="btn btn-secondary"
                      disabled={paymentProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={paymentProcessing}
                    >
                      Pay ${course.price}
                    </button>
                  </div>
                </form>
              )}

              {paymentMethod === 'paypal' && (
                <div className="paypal-section">
                  <div className="paypal-info">
                    <p>You will be redirected to PayPal to complete your payment.</p>
                    <div className="paypal-button">
                      <button
                        onClick={handlePayment}
                        className="btn btn-paypal"
                        disabled={paymentProcessing}
                      >
                        Continue with PayPal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="bank-section">
                  <div className="bank-info">
                    <p>Bank transfer details will be provided after order confirmation.</p>
                    <div className="bank-button">
                      <button
                        onClick={handlePayment}
                        className="btn btn-bank"
                        disabled={paymentProcessing}
                      >
                        Proceed with Bank Transfer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="payment-processing">
              <div className="processing-animation">
                <div className="spinner"></div>
              </div>
              <h3>Processing {paymentMethod === 'temp' ? 'Enrollment' : 'Payment'}...</h3>
              <p>Please wait while we {paymentMethod === 'temp' ? 'enroll you in the course' : 'process your payment securely'}.</p>
              <div className="processing-steps">
                <div className="step active">
                  <span className="step-icon">🔒</span>
                  <span>{paymentMethod === 'temp' ? 'Validating code' : 'Securing payment'}</span>
                </div>
                <div className="step">
                  <span className="step-icon">{paymentMethod === 'temp' ? '✅' : '💳'}</span>
                  <span>{paymentMethod === 'temp' ? 'Processing enrollment' : 'Processing card'}</span>
                </div>
                <div className="step">
                  <span className="step-icon">✅</span>
                  <span>Confirming enrollment</span>
                </div>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="payment-success">
              <div className="success-animation">
                <div className="success-icon">✅</div>
              </div>
              <h3>{paymentMethod === 'temp' ? 'Enrollment Successful!' : 'Payment Successful!'}</h3>
              <p>You have been successfully enrolled in the course.</p>
              <div className="success-details">
                <div className="detail-row">
                  <span>Course:</span>
                  <span>{course.title}</span>
                </div>
                <div className="detail-row">
                  <span>Amount:</span>
                  <span>${course.price}</span>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span className="status-success">Enrolled</span>
                </div>
              </div>
              <div className="success-actions">
                <button
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="btn btn-primary"
                >
                  Start Learning
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="payment-failed">
              <div className="failed-animation">
                <div className="failed-icon">❌</div>
              </div>
              <h3>{paymentMethod === 'temp' ? 'Enrollment Failed' : 'Payment Failed'}</h3>
              <p>We couldn't {paymentMethod === 'temp' ? 'enroll you in the course' : 'process your payment'}. Please try again.</p>
              <div className="failed-actions">
                <button
                  onClick={() => setPaymentStep('details')}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="btn btn-secondary"
                >
                  Back to Course
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="payment-footer">
          <div className="security-info">
            <div className="security-item">
              <span className="security-icon">🔒</span>
              <span>256-bit SSL encryption</span>
            </div>
            <div className="security-item">
              <span className="security-icon">🛡️</span>
              <span>PCI DSS compliant</span>
            </div>
            <div className="security-item">
              <span className="security-icon">✅</span>
              <span>Secure payment processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 