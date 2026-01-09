// src/lib/captchaUtils.ts

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    value?: string;
}

export const validateCaptchaInput = (input: string): ValidationResult => {
    // Remove any non-alphanumeric characters
    const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Check length (should be 6 characters)
    if (cleaned.length !== 6) {
        return { isValid: false, error: 'CAPTCHA must be 6 characters' };
    }

    return { isValid: true, value: cleaned };
};

export const formatCaptchaTimeRemaining = (expiresAt: Date | string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeRemaining = expiry.getTime() - now.getTime();

    if (timeRemaining <= 0) return 'Expired';

    const seconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${seconds}s`;
};
