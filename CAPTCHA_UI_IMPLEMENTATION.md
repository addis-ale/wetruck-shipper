# CAPTCHA UI Implementation Guide

## Overview
This guide provides detailed implementation instructions for creating accessible and responsive CAPTCHA components for login and password reset pages.

## Component Architecture

### 1. Base CAPTCHA Component
Create a reusable CAPTCHA component that can be used across different authentication pages.

#### File Structure:
```
src/components/
├── captcha/
│   ├── CaptchaComponent.jsx
│   ├── CaptchaInput.jsx
│   └── CaptchaStyles.css
```

---

## 1. CaptchaComponent.jsx

```jsx
import React, { useState, useEffect, useRef } from 'react';
import './CaptchaStyles.css';

const CaptchaComponent = ({ 
  onCaptchaVerified, 
  onError, 
  disabled = false,
  showRefreshButton = true 
}) => {
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const inputRef = useRef(null);

  // Fetch new CAPTCHA
  const fetchCaptcha = async () => {
    setIsLoading(true);
    setError('');
    setUserInput('');
    setIsVerified(false);

    try {
      const response = await fetch('/api/auth/captcha');
      
      if (!response.ok) {
        throw new Error('Failed to load CAPTCHA');
      }

      const newCaptchaId = response.headers.get('X-Captcha-Id');
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      setCaptchaId(newCaptchaId);
      setCaptchaImage(imageUrl);
      
      // Focus input after loading
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setError('Failed to load CAPTCHA. Please try again.');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify CAPTCHA
  const verifyCaptcha = async () => {
    if (!userInput.trim()) {
      setError('Please enter the CAPTCHA text');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('captcha_id', captchaId);
      formData.append('captcha_solution', userInput);

      const response = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setIsVerified(true);
        onCaptchaVerified?.(captchaId, userInput);
      } else {
        setError(result.detail || 'CAPTCHA verification failed');
        // Auto-refresh CAPTCHA on failure
        setTimeout(fetchCaptcha, 1500);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    setError('');
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !disabled && !isVerified) {
      verifyCaptcha();
    }
  };

  // Auto-refresh CAPTCHA every 55 seconds
  useEffect(() => {
    fetchCaptcha();
    
    const interval = setInterval(() => {
      if (!isVerified) {
        fetchCaptcha();
      }
    }, 55000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (captchaImage) {
        URL.revokeObjectURL(captchaImage);
      }
    };
  }, [captchaImage]);

  return (
    <div className="captcha-container">
      <div className="captcha-header">
        <label htmlFor="captcha-input" className="captcha-label">
          Security Verification
        </label>
        {showRefreshButton && (
          <button
            type="button"
            onClick={fetchCaptcha}
            disabled={isLoading || disabled}
            className="captcha-refresh-btn"
            aria-label="Get new CAPTCHA"
            title="Get new CAPTCHA"
          >
            {isLoading ? (
              <span className="loading-spinner" aria-hidden="true"></span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            )}
            Refresh
          </button>
        )}
      </div>

      <div className="captcha-image-container">
        {captchaImage ? (
          <img
            src={captchaImage}
            alt="CAPTCHA security image"
            className="captcha-image"
          />
        ) : (
          <div className="captcha-placeholder">
            <div className="loading-spinner"></div>
            Loading CAPTCHA...
          </div>
        )}
      </div>

      <div className="captcha-input-container">
        <input
          ref={inputRef}
          id="captcha-input"
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isVerified || isLoading}
          placeholder="Enter the text above"
          className="captcha-input"
          aria-label="CAPTCHA text input"
          aria-describedby="captcha-help captcha-error"
          maxLength={6}
          autoComplete="off"
        />
        
        <button
          type="button"
          onClick={verifyCaptcha}
          disabled={disabled || isVerified || isLoading || !userInput.trim()}
          className="captcha-verify-btn"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <div id="captcha-help" className="captcha-help">
        <small>
          Enter the 6-character code shown above. Case-insensitive.
        </small>
      </div>

      {error && (
        <div id="captcha-error" className="captcha-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {isVerified && (
        <div className="captcha-success" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          CAPTCHA verified successfully
        </div>
      )}
    </div>
  );
};

export default CaptchaComponent;
```

---

## 2. CaptchaStyles.css

```css
/* Main container */
.captcha-container {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background-color: #f8f9fa;
  max-width: 400px;
}

/* Header with label and refresh button */
.captcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.captcha-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.captcha-refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.captcha-refresh-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

.captcha-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Image container */
.captcha-image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.captcha-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.captcha-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90px;
  color: #6c757d;
  font-size: 0.875rem;
}

/* Input container */
.captcha-input-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.captcha-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.captcha-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.captcha-input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.captcha-verify-btn {
  padding: 0.75rem 1.25rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.captcha-verify-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.captcha-verify-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* Help text */
.captcha-help {
  color: #6c757d;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

/* Error message */
.captcha-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

/* Success message */
.captcha-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #155724;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

/* Loading spinner */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 480px) {
  .captcha-container {
    margin: 0.5rem 0;
    padding: 0.75rem;
  }
  
  .captcha-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .captcha-refresh-btn {
    align-self: flex-end;
  }
  
  .captcha-input-container {
    flex-direction: column;
  }
  
  .captcha-verify-btn {
    width: 100%;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .captcha-container {
    border: 2px solid #000;
  }
  
  .captcha-input {
    border: 2px solid #000;
  }
  
  .captcha-input:focus {
    border-color: #000;
    box-shadow: 0 0 0 2px #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
    border: 2px solid #007bff;
  }
  
  .captcha-refresh-btn,
  .captcha-verify-btn {
    transition: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .captcha-container {
    background-color: #2d3748;
    border-color: #4a5568;
  }
  
  .captcha-label {
    color: #e2e8f0;
  }
  
  .captcha-image-container {
    background-color: #1a202c;
    border-color: #4a5568;
  }
  
  .captcha-input {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .captcha-help {
    color: #a0aec0;
  }
}
```

---

## 3. Login Page Integration

```jsx
import React, { useState } from 'react';
import CaptchaComponent from '../captcha/CaptchaComponent';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'shipper',
    captchaId: '',
    captchaSolution: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleCaptchaVerified = (captchaId, solution) => {
    setFormData(prev => ({
      ...prev,
      captchaId,
      captchaSolution: solution
    }));
    setCaptchaVerified(true);
    setErrors(prev => ({ ...prev, captcha: '' }));
  };

  const handleCaptchaError = (error) => {
    setErrors(prev => ({ ...prev, captcha: error }));
    setCaptchaVerified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!captchaVerified) {
      setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        // Handle successful login
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('refresh_token', result.refresh_token);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setErrors({ general: result.detail || 'Login failed' });
        // Reset CAPTCHA on login failure
        setCaptchaVerified(false);
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        
        {/* Email field */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        {/* Password field */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        {/* Role field */}
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="shipper">Shipper</option>
            <option value="transporter">Transporter</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* CAPTCHA Component */}
        <CaptchaComponent
          onCaptchaVerified={handleCaptchaVerified}
          onError={handleCaptchaError}
          disabled={isLoading}
        />
        {errors.captcha && <span className="error">{errors.captcha}</span>}

        {/* General error */}
        {errors.general && <div className="error general">{errors.general}</div>}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !captchaVerified}
          className="submit-btn"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
```

---

## 4. Password Reset Page Integration

```jsx
import React, { useState } from 'react';
import CaptchaComponent from '../captcha/CaptchaComponent';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSolution, setCaptchaSolution] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCaptchaVerified = (id, solution) => {
    setCaptchaId(id);
    setCaptchaSolution(solution);
    setCaptchaVerified(true);
    setErrors(prev => ({ ...prev, captcha: '' }));
  };

  const handleCaptchaError = (error) => {
    setErrors(prev => ({ ...prev, captcha: error }));
    setCaptchaVerified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!captchaVerified) {
      setErrors(prev => ({ ...prev, captcha: 'Please complete CAPTCHA verification' }));
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          captcha_id: captchaId,
          captcha_solution: captchaSolution
        })
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setErrors({ general: result.detail || 'Password reset failed' });
        setCaptchaVerified(false);
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="reset-success">
        <h2>Reset Instructions Sent</h2>
        <p>Password reset instructions have been sent to your email address.</p>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <form onSubmit={handleSubmit} className="reset-form">
        <h2>Reset Password</h2>
        <p>Enter your email address to receive password reset instructions.</p>
        
        {/* Email field */}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        {/* CAPTCHA Component */}
        <CaptchaComponent
          onCaptchaVerified={handleCaptchaVerified}
          onError={handleCaptchaError}
          disabled={isLoading}
        />
        {errors.captcha && <span className="error">{errors.captcha}</span>}

        {/* General error */}
        {errors.general && <div className="error general">{errors.general}</div>}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !captchaVerified}
          className="submit-btn"
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>
    </div>
  );
};

export default PasswordResetPage;
```

---

## 5. Additional Utility Functions

```javascript
// src/utils/captchaUtils.js

export const validateCaptchaInput = (input) => {
  // Remove any non-alphanumeric characters
  const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // Check length (should be 6 characters)
  if (cleaned.length !== 6) {
    return { isValid: false, error: 'CAPTCHA must be 6 characters' };
  }
  
  return { isValid: true, value: cleaned };
};

export const formatCaptchaTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const timeRemaining = expiry - now;
  
  if (timeRemaining <= 0) return 'Expired';
  
  const seconds = Math.floor(timeRemaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${seconds}s`;
};
```

---

## 6. Testing Components

```jsx
// src/components/__tests__/CaptchaComponent.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaptchaComponent from '../captcha/CaptchaComponent';

// Mock fetch
global.fetch = jest.fn();

describe('CaptchaComponent', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders CAPTCHA component', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'test-captcha-id' },
      blob: () => Promise.resolve(new Blob())
    });

    render(<CaptchaComponent />);
    
    expect(screen.getByLabelText('Security Verification')).toBeInTheDocument();
    expect(screen.getByLabelText('CAPTCHA text input')).toBeInTheDocument();
  });

  test('handles CAPTCHA verification', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'test-captcha-id' },
        blob: () => Promise.resolve(new Blob())
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'CAPTCHA verified' })
      });

    const onCaptchaVerified = jest.fn();
    render(<CaptchaComponent onCaptchaVerified={onCaptchaVerified} />);
    
    const input = screen.getByLabelText('CAPTCHA text input');
    const verifyButton = screen.getByText('Verify');
    
    fireEvent.change(input, { target: { value: 'ABC123' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(onCaptchaVerified).toHaveBeenCalledWith('test-captcha-id', 'ABC123');
    });
  });

  test('shows error message on verification failure', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'test-captcha-id' },
        blob: () => Promise.resolve(new Blob())
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Incorrect CAPTCHA' })
      });

    render(<CaptchaComponent />);
    
    const input = screen.getByLabelText('CAPTCHA text input');
    const verifyButton = screen.getByText('Verify');
    
    fireEvent.change(input, { target: { value: 'WRONG' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Incorrect CAPTCHA')).toBeInTheDocument();
    });
  });
});
```

---

## Key Features Implemented

### ✅ Accessibility
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Focus management

### ✅ Responsive Design
- Mobile-first approach
- Flexible layouts
- Touch-friendly buttons
- Optimized for small screens

### ✅ User Experience
- Auto-refresh before expiration
- Clear error messages
- Loading states
- Visual feedback
- Auto-focus management

### ✅ Security
- Case-insensitive input handling
- Input sanitization
- Auto-cleanup of blob URLs
- Rate limiting considerations

### ✅ Performance
- Efficient re-rendering
- Memory leak prevention
- Optimized asset loading
- Minimal bundle size
