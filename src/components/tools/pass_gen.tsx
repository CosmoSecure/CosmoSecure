import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useQuickNotifications } from '../../utils/notifications';
import { TextField, Tooltip, CircularProgress } from '@mui/material';
import Zoom from '@mui/material/Zoom';
import { Key, Copy, RefreshCw, Info, Shield, CheckCircle, Minus, Plus } from 'lucide-react';

const PasswordGenerator: React.FC = () => {
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passLen, setPassLen] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const quick = useQuickNotifications();

    const handleGeneratePassword = async () => {
        setIsGenerating(true);
        try {
            const result = await invoke<{ password: string }>('generate_password', { length: passLen });
            setGeneratedPassword(result.password);
            setCopied(false);
            quick.passwordGenerated();
        } catch (error) {
            console.error('Failed to generate password:', error);
            quick.error('Failed to generate password', `Please try again! Error: ${error}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPassword).then(() => {
            setCopied(true);
            quick.passwordCopied();
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="w-full max-w-sm h-min p-6 bg-theme-accent shadow-xl rounded-lg flex flex-col items-center">
            {/* Header with Info Tooltip */}
            <div className="flex items-center justify-center text-theme-text text-2xl font-bold text-center mb-8">
                <Key className="mr-3 text-theme-primary" size={28} />
                <span className="text-theme-text-transparent">
                    Password Generator
                </span>
                <Tooltip
                    title={
                        <div className="text-sm p-2">
                            <div className="flex items-center mb-2">
                                <Shield className="mr-2" size={16} />
                                <span className="font-semibold">Your password will contain:</span>
                            </div>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>1 Uppercase Letter (A-Z)</li>
                                <li>1 Lowercase Letter (a-z)</li>
                                <li>1 Number (0-9)</li>
                                <li>1 Special Character (!@#$%^&*)</li>
                            </ul>
                        </div>
                    }
                    arrow
                    placement="right"
                    slotProps={{
                        transition: { timeout: 300 },
                    }}
                    slots={{
                        transition: Zoom,
                    }}
                >
                    <Info className="ml-3 text-theme-primary cursor-help hover:text-theme-primary-hover transition-colors" size={20} />
                </Tooltip>
            </div>

            {/* Password Length Control */}
            <div className="w-full mb-8 space-y-4">
                <div className="text-center">
                    <span className="text-theme-text font-semibold text-lg">Password Length</span>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setPassLen(Math.max(8, passLen - 1))}
                        className="p-2 bg-theme-secondary hover:bg-theme-primary text-theme-text rounded-lg transition-colors duration-200"
                        disabled={passLen <= 8}
                    >
                        <Minus size={16} />
                    </button>

                    <div className="flex-1">
                        <TextField
                            value={passLen}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 8;
                                setPassLen(Math.min(64, Math.max(8, value)));
                            }}
                            type="number"
                            inputProps={{ min: 8, max: 64 }}
                            variant="outlined"
                            fullWidth
                            className="text-theme-text"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    textAlign: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    height: '48px',
                                    '& fieldset': {
                                        borderColor: 'var(--theme-primary)',
                                        borderWidth: '2px',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'var(--theme-primary-hover)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'var(--theme-primary)',
                                    },
                                },
                                '& .MuiInputBase-input': {
                                    textAlign: 'center',
                                    color: 'var(--theme-primary)',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    padding: '12px',
                                },
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setPassLen(Math.min(64, passLen + 1))}
                        className="p-2 bg-theme-secondary hover:bg-theme-primary text-theme-text rounded-lg transition-colors duration-200"
                        disabled={passLen >= 64}
                    >
                        <Plus size={16} />
                    </button>
                </div>


                <div className="flex justify-between text-xs text-theme-text-secondary">
                    <span>Min: 8</span>
                    <span>Current: {passLen}</span>
                    <span>Max: 64</span>
                </div>
            </div>

            {/* Generate Password Button */}
            <button
                onClick={handleGeneratePassword}
                disabled={isGenerating}
                className="w-full px-6 py-3 bg-theme-primary hover:bg-theme-primary-hover shadow-lg text-white font-semibold rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200 mb-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
                {isGenerating ? (
                    <>
                        <CircularProgress size={20} className="text-white" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <RefreshCw size={20} />
                        <span>Generate Password</span>
                    </>
                )}
            </button>

            {/* Generated Password Display */}
            {generatedPassword && (
                <div className="w-full space-y-4">
                    <div className="text-center">
                        <span className="text-theme-text font-semibold text-sm">Generated Password</span>
                    </div>
                    <div className="relative">
                        <div className="bg-theme-secondary rounded-lg p-4 border-2 border-theme-primary border-opacity-20 shadow-inner">
                            <div className="font-mono text-theme-text text-center text-lg break-all leading-relaxed">
                                {generatedPassword}
                            </div>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className={`absolute -top-3 -right-3 p-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${copied
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-theme-primary hover:bg-theme-primary-hover text-white hover:scale-110'
                                }`}
                            title={copied ? 'Copied!' : 'Copy to clipboard'}
                        >
                            {copied ? (
                                <CheckCircle size={18} />
                            ) : (
                                <Copy size={18} />
                            )}
                        </button>
                    </div>
                    <div className="text-center text-xs text-theme-text-secondary mt-2">
                        Click the button to copy to clipboard
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordGenerator;
