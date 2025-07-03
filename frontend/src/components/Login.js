import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Login.css';

function Login({ onLogin }) {
  const {
    loginWithRedirect,
    loginWithPopup,
    isAuthenticated,
    isLoading,
    error,
    user
  } = useAuth0();

  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      onLogin();
    }
  }, [isAuthenticated, user, onLogin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formError) setFormError('');
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (isSignup && !formData.name) {
      setFormError('Please enter your full name');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isSignup) {
        // For signup, redirect to Auth0's signup page
        await loginWithRedirect({
          authorizationParams: {
            screen_hint: 'signup',
            login_hint: formData.email
          }
        });
      } else {
        // For login, use Auth0's login
        await loginWithRedirect({
          authorizationParams: {
            login_hint: formData.email
          }
        });
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2'
        }
      });
    } catch (err) {
      setFormError('Google login failed. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email) {
      setFormError('Please enter your email address first');
      return;
    }
    
    // Redirect to Auth0's password reset
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'forgot-password',
        login_hint: formData.email
      }
    });
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo-container">
          <h1 className="logo">SURAKSHIT STORE</h1>
        </div>

        {/* Welcome Message */}
        <div className="welcome-section">
          <h2 className="welcome-title">Welcome</h2>
          <p className="welcome-subtitle">
            {isSignup ? 'Create your account to get started with Surakshit Store.' : 'Log in to continue to Surakshit Store.'}
          </p>
        </div>

        {/* Error Display */}
        {(error || formError) && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error?.message || formError}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailPasswordSubmit} className="login-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required={isSignup}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {!isSignup && (
            <div className="forgot-password-container">
              <button
                type="button"
                className="forgot-password-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="continue-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span>
                {isSignup ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Toggle Sign In/Sign Up */}
        <div className="toggle-section">
          <p>
            {isSignup ? "Already have an account?" : "Don't have an account?"}{' '}
            <button
              className="toggle-link"
              onClick={() => {
                setIsSignup(!isSignup);
                setFormError('');
                setFormData({ email: '', password: '', name: '' });
              }}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="divider">
          <span>Or</span>
        </div>

        {/* Social Login */}
        <div className="social-login-section">
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>
            By continuing, you agree to Surakshit Store's{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
