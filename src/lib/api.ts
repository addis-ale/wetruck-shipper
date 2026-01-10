// src/lib/api.ts

// Support both NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_BASE_URL for compatibility
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
// If the env var includes /api/v1, use it as-is, otherwise add /api/v1
const baseUrl = envApiUrl || 'http://localhost:8000';
const apiBaseUrl = baseUrl.includes('/api/v1') ? baseUrl.replace('/api/v1', '') : baseUrl;

export const API_BASE_URL = apiBaseUrl;

export const API_ENDPOINTS = {
  CAPTCHA: `${API_BASE_URL}/api/v1/auth/captcha`,
  VERIFY_CAPTCHA: `${API_BASE_URL}/api/v1/auth/verify-captcha`,
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  PASSWORD_RESET: `${API_BASE_URL}/api/v1/auth/request-password-reset`,
};
