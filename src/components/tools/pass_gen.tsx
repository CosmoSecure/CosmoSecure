import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { TextField, Tooltip } from '@mui/material';
import Zoom from '@mui/material/Zoom';
import InfoIcon from '@mui/icons-material/Info';

const PasswordGenerator: React.FC = () => {
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passLen, setPassLen] = useState(12);

    const handleGeneratePassword = async () => {
        try {
            const result = await invoke<{ password: string }>('generate_password', { length: passLen });
            setGeneratedPassword(result.password);
        } catch (error) {
            console.error('Failed to generate password:', error);
            toast.error(`Failed to generate password. Try again! :: ${error}`);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPassword).then(() => {
            toast.success('Password copied to clipboard!');
        });
    };

    return (
        <div className="w-full max-w-md h-min p-6 bg-theme-accent shadow-xl rounded-lg flex flex-col items-center">
            {/* Header with Info Tooltip */}
            <div className="flex items-center text-theme-text text-2xl font-bold text-center mb-6">
                🔐 Password Generator
                <Tooltip
                    title={
                        <div className="text-sm">
                            ⚡ Your password will contain at least:
                            <ul className="list-disc ml-4 mt-1">
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
                    <InfoIcon className="ml-4 mb-2 text-theme-primary" fontSize="medium" />
                </Tooltip>
            </div>

            {/* Password Length Input */}
            <div className="w-full mb-5">
                <TextField
                    label="Password Length"
                    type="number"
                    value={passLen}
                    onChange={(e) => setPassLen(Math.min(64, Math.max(8, parseInt(e.target.value))))}
                    variant="outlined"
                    fullWidth
                    inputProps={{ min: 8, max: 64 }}
                    className="text-theme-text"
                />
            </div>

            {/* Generate Password Button */}
            <button
                onClick={handleGeneratePassword}
                className="w-full px-4 py-2 bg-theme-primary shadow-md text-theme-text font-semibold rounded hover:bg-theme-primary-hover transition mb-6"
            >
                Generate Password
            </button>

            {/* Generated Password Display */}
            {generatedPassword && (
                <div className="w-full flex flex-col items-center">
                    <div className="relative w-full rounded-lg shadow-md">
                        <TextField
                            value={generatedPassword}
                            variant="outlined"
                            fullWidth
                            inputProps={{ readOnly: true }}
                            className="text-theme-text bg-theme-secondary-transparent rounded-lg"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm bg-theme-primary px-3 py-1 rounded-lg hover:bg-theme-primary-transparent transition"
                        >
                            📋 Copy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordGenerator;
