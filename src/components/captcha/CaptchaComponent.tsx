'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCaptcha } from '@/hooks/useCaptcha';
import './CaptchaStyles.css';

interface CaptchaComponentProps {
    onCaptchaVerified?: (captchaId: string, solution: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    showRefreshButton?: boolean;
    deferVerification?: boolean;
}

const CaptchaComponent: React.FC<CaptchaComponentProps> = ({
    onCaptchaVerified,
    onError,
    disabled = false,
    showRefreshButton = true,
    deferVerification = false
}) => {
    const [userInput, setUserInput] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        captchaData,
        isLoading,
        error: hookError,
        isVerified,
        fetchCaptcha,
        verifyCaptcha,
        cleanup
    } = useCaptcha();

    // Initial fetch
    useEffect(() => {
        fetchCaptcha();

        // Auto-refresh every 55 seconds if not verified
        const interval = setInterval(() => {
            if (!isVerified) {
                fetchCaptcha();
            }
        }, 55000);

        return () => clearInterval(interval);
    }, [fetchCaptcha, isVerified]);

    // Handle errors
    useEffect(() => {
        if (hookError && onError) {
            onError(hookError);
        }
    }, [hookError, onError]);

    // Focus input after loading new captcha
    useEffect(() => {
        if (captchaData?.imageUrl && !isLoading && !isVerified) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [captchaData, isLoading, isVerified]);

    // Handle verification success
    useEffect(() => {
        if (isVerified && captchaData && onCaptchaVerified) {
            onCaptchaVerified(captchaData.captchaId, userInput);
        }
    }, [isVerified, captchaData, userInput, onCaptchaVerified]);

    const handleVerify = async () => {
        if (!userInput.trim()) {
            return;
        }

        if (deferVerification && captchaData && onCaptchaVerified) {
            onCaptchaVerified(captchaData.captchaId, userInput);
            return;
        }

        await verifyCaptcha(userInput);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setUserInput(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !disabled && !isVerified) {
            handleVerify();
        }
    };

    return (
        <div className="captcha-container">
            <div className="captcha-header">
                <label htmlFor="captcha-input" className="captcha-label">
                    Security Verification
                </label>
                {showRefreshButton && (
                    <button
                        type="button"
                        onClick={() => fetchCaptcha()}
                        disabled={isLoading || disabled}
                        className="captcha-refresh-btn"
                        aria-label="Get new CAPTCHA"
                        title="Get new CAPTCHA"
                    >
                        {isLoading ? (
                            <span className="loading-spinner" aria-hidden="true"></span>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                            </svg>
                        )}
                        Refresh
                    </button>
                )}
            </div>

            <div className="captcha-image-container">
                {captchaData?.imageUrl ? (
                    <img
                        src={captchaData.imageUrl}
                        alt="CAPTCHA security image"
                        className="captcha-image"
                    />
                ) : (
                    <div className="captcha-placeholder">
                        {isLoading ? (
                            <>
                                <div className="loading-spinner"></div>
                                <div style={{ marginTop: '8px' }}>Loading CAPTCHA...</div>
                            </>
                        ) : (
                            <div>Loading CAPTCHA...</div>
                        )}
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
                    onClick={handleVerify}
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

            {hookError && (
                <div id="captcha-error" className="captcha-error" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {hookError}
                </div>
            )}

            {isVerified && (
                <div className="captcha-success" role="status">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    CAPTCHA verified successfully
                </div>
            )}
        </div>
    );
};

export default CaptchaComponent;
