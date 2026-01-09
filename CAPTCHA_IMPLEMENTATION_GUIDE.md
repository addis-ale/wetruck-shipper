# CAPTCHA Implementation Guide

## Overview
This comprehensive guide walks you through implementing a complete CAPTCHA system for your authentication flows, from setup to deployment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Component Creation](#component-creation)
4. [Integration Steps](#integration-steps)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Dependencies
```bash
# For React applications
npm install axios

# For development and testing
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Backend Requirements
- Ensure the CAPTCHA endpoints are available at `/api/auth/captcha` and `/api/auth/verify-captcha`
- CORS should be configured to allow requests from your frontend domain
- Authentication endpoints should include CAPTCHA validation

---

## 2. Project Setup

### Step 1: Create Component Directory Structure
```bash
mkdir -p src/components/captcha
mkdir -p src/components/__tests__
mkdir -p src/utils
```

### Step 2: Create Base Configuration
Create `src/config/api.js`:
```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  CAPTCHA: `${API_BASE_URL}/api/auth/captcha`,
  VERIFY_CAPTCHA: `${API_BASE_URL}/api/auth/verify-captcha`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  PASSWORD_RESET: `${API_BASE_URL}/api/auth/request-password-reset`,
};
```

### Step 3: Create API Service
Create `src/services/apiService.js`:
```javascript
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const captchaService = {
  // Get CAPTCHA image
  async getCaptcha() {
    try {
      const response = await fetch(API_ENDPOINTS.CAPTCHA, {
        method: 'GET',
        headers: {
          'Accept': 'image/png',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const captchaId = response.headers.get('X-Captcha-Id');
      const imageBlob = await response.blob();

      return {
        captchaId,
        imageUrl: URL.createObjectURL(imageBlob),
      };
    } catch (error) {
      throw new Error(`Failed to fetch CAPTCHA: ${error.message}`);
    }
  },

  // Verify CAPTCHA solution
  async verifyCaptcha(captchaId, solution) {
    try {
      const formData = new FormData();
      formData.append('captcha_id', captchaId);
      formData.append('captcha_solution', solution);

      const response = await apiClient.post(API_ENDPOINTS.VERIFY_CAPTCHA, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.detail || 'CAPTCHA verification failed');
      }
      throw new Error(`Network error: ${error.message}`);
    }
  },

  // Login with CAPTCHA
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.detail || 'Login failed');
      }
      throw new Error(`Network error: ${error.message}`);
    }
  },

  // Request password reset with CAPTCHA
  async requestPasswordReset(email, captchaId, solution) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PASSWORD_RESET, {
        email,
        captcha_id: captchaId,
        captcha_solution: solution,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.detail || 'Password reset failed');
      }
      throw new Error(`Network error: ${error.message}`);
    }
  },
};

export default captchaService;
```

---

## 3. Component Creation

### Step 1: Create the CAPTCHA Component
Copy the `CaptchaComponent.jsx` code from the UI Implementation Guide into:
`src/components/captcha/CaptchaComponent.jsx`

### Step 2: Create Styles
Copy the CSS from the UI Implementation Guide into:
`src/components/captcha/CaptchaStyles.css`

### Step 3: Create Utility Functions
Copy the utility functions from the UI Implementation Guide into:
`src/utils/captchaUtils.js`

### Step 4: Create Custom Hook
Create `src/hooks/useCaptcha.js`:
```javascript
import { useState, useCallback, useRef } from 'react';
import { captchaService } from '../services/apiService';

export const useCaptcha = () => {
  const [captchaData, setCaptchaData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const abortControllerRef = useRef(null);

  const fetchCaptcha = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError('');

    try {
      const data = await captchaService.getCaptcha();
      setCaptchaData(data);
      setIsVerified(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyCaptcha = useCallback(async (solution) => {
    if (!captchaData?.captchaId) {
      setError('No CAPTCHA available');
      return false;
    }

    setIsLoading(true);
    setError('');

    try {
      await captchaService.verifyCaptcha(captchaData.captchaId, solution);
      setIsVerified(true);
      return true;
    } catch (err) {
      setError(err.message);
      // Auto-refresh CAPTCHA on failure
      setTimeout(fetchCaptcha, 1500);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [captchaData, fetchCaptcha]);

  const resetCaptcha = useCallback(() => {
    setCaptchaData(null);
    setIsVerified(false);
    setError('');
    fetchCaptcha();
  }, [fetchCaptcha]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (captchaData?.imageUrl) {
      URL.revokeObjectURL(captchaData.imageUrl);
    }
  }, [captchaData]);

  return {
    captchaData,
    isLoading,
    error,
    isVerified,
    fetchCaptcha,
    verifyCaptcha,
    resetCaptcha,
    cleanup,
  };
};
```

---

## 4. Integration Steps

### Step 1: Update Login Page
1. **Import the component**:
```javascript
import CaptchaComponent from '../components/captcha/CaptchaComponent';
import { captchaService } from '../services/apiService';
```

2. **Add state management**:
```javascript
const [captchaVerified, setCaptchaVerified] = useState(false);
const [captchaData, setCaptchaData] = useState(null);
```

3. **Integrate CAPTCHA handlers**:
```javascript
const handleCaptchaVerified = (captchaId, solution) => {
  setCaptchaData({ captchaId, solution });
  setCaptchaVerified(true);
};
```

4. **Update form submission**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!captchaVerified) {
    setError('Please complete CAPTCHA verification');
    return;
  }

  try {
    const result = await captchaService.login({
      ...formData,
      captcha_id: captchaData.captchaId,
      captcha_solution: captchaData.solution,
    });
    
    // Handle successful login
  } catch (error) {
    setError(error.message);
    // Reset CAPTCHA on failure
    setCaptchaVerified(false);
  }
};
```

### Step 2: Update Password Reset Page
Follow similar steps as the login page, but use `captchaService.requestPasswordReset()` instead of the login method.

### Step 3: Update Routing
Ensure your routes include the updated authentication pages:
```javascript
// src/App.js or router configuration
import LoginPage from './pages/LoginPage';
import PasswordResetPage from './pages/PasswordResetPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}
```

### Step 4: Add Environment Variables
Create `.env` file in your project root:
```bash
REACT_APP_API_URL=http://localhost:8000
```

For production:
```bash
REACT_APP_API_URL=https://your-api-domain.com
```

---

## 5. Testing

### Step 1: Unit Tests
Copy the test code from the UI Implementation Guide into:
`src/components/__tests__/CaptchaComponent.test.jsx`

### Step 2: Integration Tests
Create `src/__tests__/auth.integration.test.jsx`:
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import * as captchaService from '../services/apiService';

// Mock the captcha service
jest.mock('../services/apiService');

const MockedLoginPage = () => (
  <BrowserRouter>
    <LoginPage />
  </BrowserRouter>
);

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('complete login flow with CAPTCHA', async () => {
    // Mock CAPTCHA service
    captchaService.captchaService.getCaptcha.mockResolvedValue({
      captchaId: 'test-id',
      imageUrl: 'data:image/png;base64,test',
    });

    captchaService.captchaService.verifyCaptcha.mockResolvedValue({
      success: true,
      message: 'CAPTCHA verified',
    });

    captchaService.captchaService.login.mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
    });

    render(<MockedLoginPage />);

    // Wait for CAPTCHA to load
    await waitFor(() => {
      expect(screen.getByLabelText('CAPTCHA text input')).toBeInTheDocument();
    });

    // Fill login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });

    // Solve CAPTCHA
    const captchaInput = screen.getByLabelText('CAPTCHA text input');
    fireEvent.change(captchaInput, { target: { value: 'ABC123' } });

    // Submit form
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(screen.getByText('CAPTCHA verified successfully')).toBeInTheDocument();
    });

    // Submit login
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(captchaService.captchaService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        role: 'shipper',
        captcha_id: 'test-id',
        captcha_solution: 'ABC123',
      });
    });
  });
});
```

### Step 3: E2E Tests (Optional)
For end-to-end testing, you can use Cypress or Playwright:

```javascript
// cypress/integration/auth.spec.js
describe('Authentication Flow', () => {
  it('should login with CAPTCHA', () => {
    cy.visit('/login');
    
    // Wait for CAPTCHA to load
    cy.get('[alt="CAPTCHA security image"]').should('be.visible');
    
    // Fill form
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    
    // Mock CAPTCHA solution (in real tests, you'd need to solve it)
    cy.get('#captcha-input').type('TEST123');
    
    // Submit
    cy.get('.captcha-verify-btn').click();
    cy.get('.submit-btn').click();
    
    // Verify successful login
    cy.url().should('include', '/dashboard');
  });
});
```

---

## 6. Deployment

### Step 1: Build for Production
```bash
# For React applications
npm run build

# For other frameworks, use appropriate build command
```

### Step 2: Environment Configuration
Ensure production environment variables are set:
```bash
# Production .env file
REACT_APP_API_URL=https://your-production-api.com
```

### Step 3: Security Headers
Configure your web server to include appropriate security headers:
```nginx
# Nginx configuration example
location / {
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Enable CORS for API requests
    add_header Access-Control-Allow-Origin "https://your-frontend-domain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    try_files $uri $uri/ /index.html;
}
```

### Step 4: CDN Configuration (Optional)
For better performance, consider using a CDN:
```javascript
// src/config/cdn.js
export const CDN_CONFIG = {
  enabled: process.env.REACT_APP_CDN_ENABLED === 'true',
  baseUrl: process.env.REACT_APP_CDN_URL || '',
};

export const getCdnUrl = (path) => {
  if (CDN_CONFIG.enabled) {
    return `${CDN_CONFIG.baseUrl}${path}`;
  }
  return path;
};
```

---

## 7. Troubleshooting

### Common Issues and Solutions

#### Issue 1: CAPTCHA Image Not Loading
**Symptoms**: Blank space where CAPTCHA should be
**Solutions**:
1. Check network tab for failed requests
2. Verify API endpoint is accessible
3. Ensure CORS is configured correctly
4. Check browser console for JavaScript errors

#### Issue 2: CAPTCHA Verification Always Fails
**Symptoms**: "Incorrect CAPTCHA" error even with correct input
**Solutions**:
1. Check if CAPTCHA ID is being passed correctly
2. Verify case sensitivity handling
3. Ensure CAPTCHA hasn't expired (60-second timeout)
4. Check server logs for verification errors

#### Issue 3: Form Submission Blocked
**Symptoms**: Login form doesn't submit even with valid CAPTCHA
**Solutions**:
1. Verify `captchaVerified` state is properly set
2. Check if form validation is blocking submission
3. Ensure all required fields are filled
4. Check for JavaScript errors in console

#### Issue 4: Mobile Responsiveness Issues
**Symptoms**: CAPTCHA doesn't display properly on mobile devices
**Solutions**:
1. Check CSS media queries
2. Verify touch targets are appropriately sized
3. Test on actual mobile devices, not just browser emulation
4. Ensure viewport meta tag is set correctly

#### Issue 5: Performance Issues
**Symptoms**: Slow loading or laggy interactions
**Solutions**:
1. Implement proper loading states
2. Optimize image loading
3. Use React.memo for component optimization
4. Implement proper cleanup for blob URLs

### Debugging Tools

#### Browser Console
```javascript
// Debug CAPTCHA state
console.log('CAPTCHA State:', {
  captchaId: window.captchaId,
  isVerified: window.captchaVerified,
  error: window.captchaError,
});

// Test API directly
fetch('/api/auth/captcha')
  .then(response => {
    console.log('CAPTCHA Response:', response.headers.get('X-Captcha-Id'));
    return response.blob();
  })
  .then(blob => console.log('CAPTCHA Blob:', blob));
```

#### Network Monitoring
1. Open browser DevTools → Network tab
2. Filter by XHR/Fetch requests
3. Check CAPTCHA and verification requests
4. Verify request/response payloads

#### Server-Side Logging
Ensure your backend logs CAPTCHA-related events:
```javascript
// Example backend logging
console.log('CAPTCHA Generated:', {
  captchaId,
  timestamp: new Date().toISOString(),
  userAgent: req.headers['user-agent'],
});

console.log('CAPTCHA Verification Attempt:', {
  captchaId,
  solution: userInput,
  success: isValid,
  timestamp: new Date().toISOString(),
});
```

### Performance Optimization

#### Lazy Loading
```javascript
// Lazy load CAPTCHA component
const CaptchaComponent = React.lazy(() => import('../components/captcha/CaptchaComponent'));

// Usage with Suspense
<Suspense fallback={<div>Loading CAPTCHA...</div>}>
  <CaptchaComponent onCaptchaVerified={handleCaptchaVerified} />
</Suspense>
```

#### Caching Strategy
```javascript
// Implement client-side caching for CAPTCHA images
const captchaCache = new Map();

const getCachedCaptcha = async (captchaId) => {
  if (captchaCache.has(captchaId)) {
    return captchaCache.get(captchaId);
  }
  
  const captchaData = await captchaService.getCaptcha();
  captchaCache.set(captchaData.captchaId, captchaData);
  
  // Clear cache after 5 minutes
  setTimeout(() => {
    captchaCache.delete(captchaData.captchaId);
  }, 5 * 60 * 1000);
  
  return captchaData;
};
```

---

## 8. Best Practices

### Security
1. **Always validate CAPTCHA on the server side**
2. **Implement rate limiting for CAPTCHA requests**
3. **Use secure, random CAPTCHA generation**
4. **Log CAPTCHA verification attempts for monitoring**

### User Experience
1. **Provide clear error messages**
2. **Show loading states during verification**
3. **Auto-refresh CAPTCHA before expiration**
4. **Offer alternative verification methods if needed**

### Accessibility
1. **Ensure keyboard navigation works**
2. **Provide appropriate ARIA labels**
3. **Test with screen readers**
4. **Support high contrast mode**

### Performance
1. **Optimize image loading**
2. **Implement proper cleanup**
3. **Use React.memo for expensive components**
4. **Minimize re-renders**

---

## 9. Maintenance

### Regular Tasks
1. **Monitor CAPTCHA success/failure rates**
2. **Update dependencies regularly**
3. **Test on new browser versions**
4. **Review accessibility compliance**

### Monitoring
```javascript
// Add analytics tracking
const trackCaptchaEvent = (event, data) => {
  if (window.gtag) {
    window.gtag('event', event, {
      event_category: 'CAPTCHA',
      ...data,
    });
  }
};

// Usage in component
trackCaptchaEvent('captcha_generated', { captcha_id: captchaId });
trackCaptchaEvent('captcha_verified', { success: true });
trackCaptchaEvent('captcha_failed', { error: 'incorrect_solution' });
```

This comprehensive guide should help you implement a robust, secure, and user-friendly CAPTCHA system for your authentication flows.
