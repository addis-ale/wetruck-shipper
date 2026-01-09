import axios from 'axios';
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
    // Get CAPTCHA image
    async getCaptcha(): Promise<CaptchaData> {
        try {
            console.log('Fetching CAPTCHA from:', API_ENDPOINTS.CAPTCHA);
            const response = await axios.get(API_ENDPOINTS.CAPTCHA, {
                responseType: 'blob', // Important: responseType must be 'blob'
                headers: {
                    'Accept': 'image/png',
                },
            });

            // Debug: Log headers (Axios headers are an object)
            console.log('--- CAPTCHA RESPONSE HEADERS ---', response.headers);

            // Axios headers are lowercase
            const captchaId = response.headers['x-captcha-id'];

            console.log('Extracted CAPTCHA ID:', captchaId);

            if (!captchaId) {
                console.error('Missing x-captcha-id header. Available headers:', Object.keys(response.headers));
                throw new Error('CAPTCHA ID missing in response headers. Check Access-Control-Expose-Headers.');
            }

            const imageBlob = response.data;
            const imageUrl = URL.createObjectURL(imageBlob);

            return {
                captchaId,
                imageUrl,
            };
        } catch (error: any) {
            console.error('CAPTCHA Fetch Error:', error);
            throw new Error(`Failed to fetch CAPTCHA: ${error.message || 'Unknown error'}`);
        }
    },

    // Verify CAPTCHA solution
    async verifyCaptcha(captchaId: string, solution: string): Promise<VerifyCaptchaResponse> {
        try {
            const formData = new FormData();
            formData.append('captcha_id', captchaId);
            formData.append('captcha_solution', solution);

            const response = await axios.post(API_ENDPOINTS.VERIFY_CAPTCHA, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            return response.data;
        } catch (error: any) {
            // Axios error handling
            const errorMessage = error.response?.data?.detail || error.message || 'Network error during CAPTCHA verification';
            throw new Error(errorMessage);
        }
    },
};
