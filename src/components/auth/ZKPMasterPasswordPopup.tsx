import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { Lock, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { token_secure } from "./token_secure";
import { useUser } from '../../contexts/UserContext';

interface ZKPMasterPasswordPopupProps {
    onSetupComplete: () => void;
}

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    created_at: string;
    last_login: string;
}

const ZKPMasterPasswordPopup: React.FC<ZKPMasterPasswordPopupProps> = ({
    onSetupComplete
}) => {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if master password needs to be set up
    useEffect(() => {
        if (user && !user.masterPassword?.isSet) {
            setIsOpen(true);
        }
    }, [user]);

    // Don't render if user data is not available yet
    if (!user) {
        return null;
    }

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const currentPin = step === 'create' ? pin : confirmPin;
        const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

        const newPin = [...currentPin];
        newPin[index] = value.slice(-1); // Only take the last digit
        setCurrentPin(newPin);

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`pin-${step}-${index + 1}`);
            nextInput?.focus();
        }

        setError('');
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`pin-${step}-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleNextStep = () => {
        const currentPin = pin.join('');
        if (currentPin.length !== 4) {
            setError('Please enter a 4-digit PIN');
            return;
        }

        setStep('confirm');
        setError('');
    };

    const handleSetupMasterPassword = async () => {
        const masterPin = pin.join('');
        const confirmPinStr = confirmPin.join('');

        if (masterPin !== confirmPinStr) {
            setError('PINs do not match');
            return;
        }

        if (masterPin.length !== 4) {
            setError('Please enter a 4-digit PIN');
            return;
        }

        if (!user?.userId) {
            setError('User data not available');
            return;
        }

        setIsLoading(true);
        try {
            // Generate salt for the master password
            const salt = await invoke<string>('generate_salt_hex');
            console.log('Generated salt:', salt);

            // Hash the PIN with salt (client-side hashing)
            const hashedPin = await hashPin(masterPin, salt);
            console.log('Hashed PIN:', hashedPin);

            // Setup master password via Tauri
            await invoke('setup_master_password', {
                userId: user.userId,
                masterPasswordHash: hashedPin,
                salt: salt
            });

            const response = await invoke<{ token: string; data: User }>('update_user_session', {
                userId: user.userId,
                tokenData: sessionStorage.getItem('token'),
            });

            if (response) {
                token_secure(response);
                await invoke('save_token_command', { token: sessionStorage.getItem('token'), user: sessionStorage.getItem('user') });

                // Dispatch custom event to notify UserContext of data change
                window.dispatchEvent(new CustomEvent('userDataChanged'));
            } else {
                alert("Invalid credentials. Please try again.");
            }

            toast.success('Master PIN created successfully!', {
                description: 'Your passwords are now secured with ZKP encryption'
            });

            setIsOpen(false);
            onSetupComplete();
        } catch (error) {
            console.error('Failed to setup master password:', error);
            toast.error('Failed to create master PIN', {
                description: 'Please try again'
            });
            setError('Failed to create master PIN. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Simple client-side PIN hashing (you can replace with crypto-js or WebCrypto)
    const hashPin = async (pin: string, salt: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const resetForm = () => {
        setPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        setStep('create');
        setError('');
        setShowPin(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-700">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Setup Master PIN
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Create a 4-digit PIN to secure your passwords with Zero-Knowledge Proof encryption
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center mb-8">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step === 'create' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                        {step === 'create' ? '1' : <Check className="w-4 h-4" />}
                    </div>
                    <div className={`w-12 h-0.5 mx-2 ${step === 'confirm' ? 'bg-green-500' : 'bg-slate-600'
                        }`} />
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step === 'confirm' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'
                        }`}>
                        2
                    </div>
                </div>

                {/* PIN Input Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-white font-medium">
                            {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
                        </label>
                        <button
                            onClick={() => setShowPin(!showPin)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex justify-center space-x-3">
                        {(step === 'create' ? pin : confirmPin).map((digit, index) => (
                            <input
                                key={index}
                                id={`pin-${step}-${index}`}
                                type={showPin ? 'text' : 'password'}
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-12 text-center text-xl font-bold bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                placeholder="•"
                            />
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Security Info */}
                <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
                    <div className="flex items-start space-x-2">
                        <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-slate-300">
                            <p className="font-medium mb-1">Zero-Knowledge Security</p>
                            <p>Your PIN never leaves your device. Even we cannot see your passwords without it.</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    {step === 'create' ? (
                        <>
                            <button
                                onClick={resetForm}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleNextStep}
                                disabled={pin.join('').length !== 4}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setStep('create');
                                    setConfirmPin(['', '', '', '']);
                                    setError('');
                                }}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSetupMasterPassword}
                                disabled={isLoading || confirmPin.join('').length !== 4}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Create PIN'
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Warning */}
                <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-amber-400 text-xs text-center">
                        ⚠️ Remember your PIN! It cannot be recovered if forgotten.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ZKPMasterPasswordPopup;