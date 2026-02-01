import { useState, useCallback, useRef, useEffect } from 'react';
import { captchaService, CaptchaData } from '@/services/captchaService';

interface UseCaptchaReturn {
    captchaData: CaptchaData | null;
    isLoading: boolean;
    error: string;
    isVerified: boolean;
    fetchCaptcha: () => Promise<void>;
    verifyCaptcha: (solution: string) => Promise<boolean>;
    resetCaptcha: () => void;
    cleanup: () => void;
}

export const useCaptcha = (): UseCaptchaReturn => {
    const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchCaptcha = useCallback(async () => {
        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        setError('');

        try {
            console.log('🔄 useCaptcha: Fetching CAPTCHA...');
            const data = await captchaService.getCaptcha();
            console.log('✅ useCaptcha: CAPTCHA fetched successfully:', {
                captchaId: data.captchaId,
                imageUrl: data.imageUrl ? 'URL created' : 'No URL',
            });
            setCaptchaData(data);
            setIsVerified(false);
        } catch (err: unknown) {
            const error = err as Error;
            console.error('❌ useCaptcha: Error fetching CAPTCHA:', error);
            console.error('❌ useCaptcha: Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
            if (error.name !== 'AbortError') {
                setError(error.message || 'Failed to load CAPTCHA');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyCaptcha = useCallback(async (solution: string) => {
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
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
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

    // Auto clean up blob URL when captchaData changes
    useEffect(() => {
        return () => {
            if (captchaData?.imageUrl) {
                URL.revokeObjectURL(captchaData.imageUrl);
            }
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
