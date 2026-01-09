import { API_ENDPOINTS } from '@/lib/api';

export interface CaptchaData {
    captchaId: string;
    imageUrl: string;
}

export interface VerifyCaptchaResponse {
    success: boolean;
    message: string;
    detail?: string;
}

export const captchaService = {
    // Get CAPTCHA image - using fetch for better header access
    async getCaptcha(): Promise<CaptchaData> {
        try {
            console.log('Fetching CAPTCHA from:', API_ENDPOINTS.CAPTCHA);
            
            const response = await fetch(API_ENDPOINTS.CAPTCHA, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Try all header name variations
            const captchaId = response.headers.get('X-Captcha-Id') ||
                             response.headers.get('x-captcha-id') ||
                             response.headers.get('X-CAPTCHA-ID') ||
                             response.headers.get('Captcha-Id') ||
                             response.headers.get('captcha-id');

            console.log('Extracted CAPTCHA ID:', captchaId);

            if (!captchaId) {
                // Log all available headers for debugging
                console.error('Missing x-captcha-id header.');
                console.error('Response status:', response.status);
                console.error('Response statusText:', response.statusText);
                
                // Log all headers
                const allHeaders: Record<string, string> = {};
                response.headers.forEach((value, key) => {
                    allHeaders[key] = value;
                    console.log(`Header: ${key} = ${value}`);
                });
                console.error('All response headers:', allHeaders);
                
                // Check if CORS is blocking the header
                const exposedHeaders = response.headers.get('Access-Control-Expose-Headers');
                console.warn('CORS Exposed Headers:', exposedHeaders);
                
                if (!exposedHeaders?.includes('X-Captcha-Id') && !exposedHeaders?.includes('x-captcha-id')) {
                    throw new Error(
                        'Unable to load security code. Please refresh the page or contact support if the problem persists.'
                    );
                }
                
                throw new Error('Unable to load security code. Please try again.');
            }

            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            return {
                captchaId,
                imageUrl,
            };
        } catch (error: any) {
            console.error('CAPTCHA Fetch Error:', error);
            const errorMsg = error.message || 'Unknown error';
            
            // Make error messages user-friendly
            if (errorMsg.toLowerCase().includes('cors') || errorMsg.toLowerCase().includes('header')) {
                throw new Error('Unable to load security code. Please refresh the page and try again.');
            }
            
            throw new Error('Unable to load security code. Please try again.');
        }
    },

    // Verify CAPTCHA solution
    async verifyCaptcha(captchaId: string, solution: string): Promise<VerifyCaptchaResponse> {
        try {
            const formData = new URLSearchParams();
            formData.append('captcha_id', captchaId);
            formData.append('captcha_solution', solution);

            const response = await fetch(API_ENDPOINTS.VERIFY_CAPTCHA, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            const errorMessage = error.message || 'Network error during CAPTCHA verification';
            const lowerMsg = errorMessage.toLowerCase();
            
            // Make error messages user-friendly
            if (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect') || lowerMsg.includes('wrong')) {
                throw new Error('The security code you entered is incorrect. Please try again.');
            }
            
            if (lowerMsg.includes('expired') || lowerMsg.includes('timeout')) {
                throw new Error('The security code has expired. Please get a new code and try again.');
            }
            
            throw new Error('Unable to verify security code. Please try again.');
        }
    },
};
