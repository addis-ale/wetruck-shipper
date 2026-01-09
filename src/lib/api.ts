// src/lib/api.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const API_ENDPOINTS = {
  CAPTCHA: `${API_BASE_URL}/auth/captcha`,
  VERIFY_CAPTCHA: `${API_BASE_URL}/auth/verify-captcha`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  PASSWORD_RESET: `${API_BASE_URL}/auth/request-password-reset`,
};
