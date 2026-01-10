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
            console.log('🔍 Fetching CAPTCHA from:', API_ENDPOINTS.CAPTCHA);
            console.log('🔍 API_BASE_URL:', API_ENDPOINTS.CAPTCHA.replace('/api/v1/auth/captcha', ''));
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('⏱️ Fetch timeout after 10 seconds');
                controller.abort();
            }, 10000);
            
            const response = await fetch(API_ENDPOINTS.CAPTCHA, {
                method: 'GET',
                credentials: 'include',
                signal: controller.signal,
            }).catch((fetchError) => {
                clearTimeout(timeoutId);
                console.error('❌ Fetch failed completely:', fetchError);
                console.error('❌ Fetch error details:', {
                    name: fetchError.name,
                    message: fetchError.message,
                    stack: fetchError.stack,
                });
                
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out. Please check your network connection.');
                }
                
                if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    throw new Error('Cannot connect to server. Please check if the backend is running.');
                }
                
                throw new Error(`Network error: ${fetchError.message}`);
            });
            
            clearTimeout(timeoutId);

            console.log('📡 Response received. Status:', response.status, response.statusText);
            console.log('📡 Response Content-Type:', response.headers.get('Content-Type'));

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('❌ HTTP error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Log all available headers for debugging
            const allHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                allHeaders[key] = value;
            });
            console.log('📋 All response headers:', allHeaders);

            // Try all header name variations
            const captchaId = response.headers.get('X-Captcha-Id') ||
                             response.headers.get('x-captcha-id') ||
                             response.headers.get('X-CAPTCHA-ID') ||
                             response.headers.get('Captcha-Id') ||
                             response.headers.get('captcha-id');

            console.log('🆔 Extracted CAPTCHA ID:', captchaId);

            // Check if CORS is blocking the header
            const exposedHeaders = response.headers.get('Access-Control-Expose-Headers');
            console.log('🔓 CORS Exposed Headers:', exposedHeaders);

            // Get the image blob first (this might work even if header is missing)
            let imageBlob: Blob;
            try {
                imageBlob = await response.blob();
                console.log('✅ Image blob created. Size:', imageBlob.size, 'bytes. Type:', imageBlob.type);
                
                if (imageBlob.size === 0) {
                    throw new Error('Received empty image from server.');
                }
            } catch (blobError: any) {
                console.error('❌ Failed to create blob:', blobError);
                throw new Error('Failed to load image. Please try again.');
            }

            if (!captchaId) {
                console.error('❌ Missing x-captcha-id header.');
                console.error('📋 Available header keys:', Object.keys(allHeaders));
                
                // Check if the header exists but is not exposed
                if (exposedHeaders && !exposedHeaders.includes('X-Captcha-Id') && !exposedHeaders.includes('x-captcha-id')) {
                    console.error('⚠️ X-Captcha-Id header exists but is not exposed in CORS!');
                    console.error('💡 Backend needs to add: expose_headers=["X-Captcha-Id"]');
                    
                    // TEMPORARY: Generate a fallback ID so the image can display
                    // This is a workaround until CORS is fixed
                    const fallbackId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    console.warn('⚠️ Using fallback CAPTCHA ID:', fallbackId);
                    console.warn('⚠️ This is a temporary workaround. Backend must fix CORS!');
                    
                    const imageUrl = URL.createObjectURL(imageBlob);
                    return {
                        captchaId: fallbackId,
                        imageUrl,
                    };
                }
                
                throw new Error('Unable to load security code. CAPTCHA ID missing in response.');
            }

            const imageUrl = URL.createObjectURL(imageBlob);
            console.log('✅ Object URL created successfully');

            return {
                captchaId,
                imageUrl,
            };
        } catch (error: any) {
            console.error('❌ CAPTCHA Fetch Error:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
            
            const errorMsg = error.message || 'Unknown error';
            
            // Make error messages user-friendly
            if (errorMsg.toLowerCase().includes('cors') || errorMsg.toLowerCase().includes('header')) {
                throw new Error('Unable to load security code. Please refresh the page and try again.');
            }
            
            if (errorMsg.toLowerCase().includes('network')) {
                throw new Error('Network error. Please check your connection and try again.');
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
