import React, { useState } from "react";
import { Typography, TextField, Modal, Box } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import Email_Button from "./Email_Button";

interface BreachDetails {
    breach: string;
    details: string;
    domain: string;
    industry: string;
    logo: string;
    password_risk: string;
    references: string;
    searchable: string;
    verified: string;
    xposed_data: string;
    xposed_date: string;
    xposed_records: number;
}

const EmailBreach: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [breachData, setBreachData] = useState<BreachDetails[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [hasSearched, setHasSearched] = useState<boolean>(false);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
    const [emailError, setEmailError] = useState<string>("");

    const [breachData_risk, setBreachData_risk] = useState<any>(null);

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const validateEmail = (email: string): boolean => {
        return emailRegex.test(email);
    };

    const isValidEmail = email.trim() && validateEmail(email.trim());

    const handleCheckBreach = async () => {
        if (!isValidEmail) {
            setEmailError("Please enter a valid email address");
            return;
        }

        setLoading(true);
        setError(null);
        setEmailError("");
        setBreachData(null);
        setHasSearched(true);

        try {
            const response: any = await invoke("fetch_email_breach_info", { email });

            if (response.ExposedBreaches === null) {
                setBreachData(null);
                setError(null);
            } else if (response.ExposedBreaches.breaches_details) {
                setBreachData(response.ExposedBreaches.breaches_details);

                setBreachData_risk(response.BreachMetrics.risk);
            } else {
                setBreachData(null);
                setError(null);
            }
        } catch (err: any) {
            setError("Failed to fetch breach data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const risk = breachData_risk?.[0] || { risk_label: "Unknown", risk_score: 0 };
    const riskLevel = risk.risk_label;
    const riskScore = risk.risk_score;

    return (
        <div className="w-[95%] h-[95%]">
            <div className="text-center flex flex-col items-center mb-8">
                <Typography variant="h4" gutterBottom className="text-theme-text font-bold text-center">
                    Email Breach Checker
                </Typography>
                <Typography variant="body1" className="text-theme-text-transparent opacity-80 max-w-md mx-auto">
                    Check if your email has been exposed in any known data breaches
                </Typography>
            </div>
            <div className="flex flex-col justify-center items-center max-w-md mx-auto">
                <div className="w-full relative">
                    <TextField
                        fullWidth
                        label="Enter your email address"
                        variant="outlined"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            const value = e.target.value;
                            setEmail(value);

                            // Real-time validation feedback
                            if (value.trim() && !validateEmail(value.trim())) {
                                setEmailError("Invalid email format");
                            } else {
                                setEmailError("");
                            }
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !loading && isValidEmail) {
                                handleCheckBreach();
                            }
                        }}
                        error={!!emailError}
                        helperText={emailError}
                        className="mb-6"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(var(--theme-secondary-rgb), 0.1)',
                                borderRadius: '12px',
                                '& fieldset': {
                                    borderColor: 'rgba(var(--theme-primary-rgb), 0.3)',
                                    borderWidth: '2px'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(var(--theme-primary-rgb), 0.6)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'rgb(var(--theme-primary-rgb))',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(var(--theme-text-rgb), 0.7)',
                                '&.Mui-focused': {
                                    color: 'rgb(var(--theme-primary-rgb))',
                                }
                            },
                            '& .MuiOutlinedInput-input': {
                                color: 'rgb(var(--theme-text-rgb))',
                                fontSize: '1rem',
                                padding: '14px 16px'
                            }
                        }}
                        placeholder="example@domain.com"
                        disabled={loading}
                    />
                </div>

                <div className="mt-6">
                    <button
                        className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${loading || !isValidEmail
                                ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-60"
                                : "bg-gradient-to-r from-theme-primary to-theme-primary-hover text-white hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
                            } flex items-center justify-center gap-2 shadow-md`}
                        onClick={!loading && isValidEmail ? handleCheckBreach : undefined}
                        disabled={loading || !isValidEmail}
                        type="button"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Checking...</span>
                            </>
                        ) : (
                            <span>Check for Breaches</span>
                        )}
                    </button>

                    {!loading && isValidEmail && (
                        <div className="mt-3 text-sm text-theme-text-transparent opacity-70 text-center">
                            Press Enter or click the button to start checking
                        </div>
                    )}

                    {!loading && email.trim() && !isValidEmail && (
                        <div className="mt-3 text-sm text-red-500 text-center">
                            Please enter a valid email address
                        </div>
                    )}
                </div>

                {!loading && error && (
                    <Typography variant="h6" color="error" className="mt-4">
                        {error}
                    </Typography>
                )}

                {!loading && hasSearched && breachData === null && !error && (
                    <Typography variant="h6" color="textSecondary" className="mt-4 flex justify-center items-center">
                        No breaches found for this email.
                    </Typography>
                )}

                {!loading && breachData && (
                    <div className="mt-4 w-full">
                        <div className="h-full w-full flex flex-col items-center justify-evenly rounded-lg">
                            <div className="w-full h-auto flex flex-col justify-center bg-theme-secondary-transparent shadow-lg rounded-xl p-6 space-y-4 font-semibold text-gray-800">
                                <div className="text-xl font-extrabold border-b pb-2 text-theme-text-transparent">
                                    Summary
                                </div>

                                <div className="text-lg flex justify-between">
                                    <span className="text-theme-text font-medium">Total Breaches:</span>
                                    <span className="text-theme-text">{breachData.length}</span>
                                </div>

                                <div className="text-lg flex justify-between">
                                    <span className="text-theme-text font-medium">Risk Level:</span>
                                    <span className="text-theme-text">{riskLevel}</span>
                                </div>

                                <div className="text-lg flex justify-between">
                                    <span className="text-theme-text font-medium">Risk Score:</span>
                                    <span className="text-theme-text">{riskScore}</span>
                                </div>
                            </div>

                            <button
                                className="my-4 border-2 border-[#4d4d4d] rounded-lg p-3 w-fit flex items-center hover:scale-105 transition-all duration-300"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Email_Button />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="breach-details-modal"
                aria-describedby="breach-details-description"
                BackdropProps={{
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(3px)',
                        WebkitBackdropFilter: 'blur(3px)',
                        borderRadius: '8px',
                    }
                }}
            >
                <Box
                    className="bg-theme-accent-transparent p-6 rounded-md shadow-lg max-w-5xl mx-auto mt-10 overflow-y-auto max-h-[90vh]"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold bg-theme-primary p-2 rounded-md">Breach Details</h2>
                        <button
                            className="text-red-500 font-bold bg-theme-primary p-2 rounded-md"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ESC
                        </button>
                    </div>
                    {breachData && breachData.map((breach, index) => (
                        <div key={index} className="mb-5 p-4 bg-theme-primary-transparent border border-theme-primary rounded-md shadow-md">
                            <div className="flex items-center gap-4">
                                {imageErrors.has(index) ? (
                                    <div className="h-16 w-16 ml-4 bg-white rounded-xl flex items-center justify-center">
                                        <span className="text-red-600 text-4xl font-bold pt-2">!</span>
                                    </div>
                                ) : (
                                    <img
                                        src={breach.logo}
                                        alt={breach.breach}
                                        className="h-20 w-20 rounded-md object-contain ml-4 border border-gray-300 bg-white"
                                        onLoad={() => {
                                            console.log(`Image loaded successfully: ${breach.logo}`);
                                        }}
                                        onError={(e) => {
                                            console.error(`Image failed to load: ${breach.logo}`, e);
                                            setImageErrors(prev => new Set(prev).add(index));
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                )}
                                <div className="text-lg font-bold">{breach.breach}</div>
                            </div>
                            <div className="bg-theme-secondary-transparent mt-2 p-4 rounded-md text-sm font-semibold text-theme-text mb-2">{breach.details}</div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Domain */}
                                <div className="bg-theme-secondary-transparent p-4 rounded-md shadow-md">
                                    <div className="text-base font-extrabold text-theme-text">Domain</div>
                                    <div className="text-sm font-semibold text-theme-text">{breach.domain}</div>
                                </div>

                                {/* Industry */}
                                <div className="bg-theme-secondary-transparent p-4 rounded-md shadow-md">
                                    <div className="text-base font-extrabold text-theme-text">Industry</div>
                                    <div className="text-sm font-semibold text-theme-text">{breach.industry}</div>
                                </div>

                                {/* Password Risk */}
                                <div className="bg-theme-secondary-transparent p-4 rounded-md shadow-md">
                                    <div className="text-base font-extrabold text-theme-text">Password Risk</div>
                                    <div className="text-sm font-semibold text-theme-text">{breach.password_risk}</div>
                                </div>

                                {/* Exposed Data */}
                                <div className="bg-theme-secondary-transparent p-4 rounded-md shadow-md">
                                    <div className="text-base font-extrabold text-theme-text">Exposed Data</div>
                                    <div className="text-sm font-semibold text-theme-text">{breach.xposed_data}</div>
                                </div>

                                {/* Exposed Date */}
                                <div className="bg-theme-secondary-transparent p-4 rounded-md shadow-md">
                                    <div className="text-base font-extrabold text-theme-text">Exposed Date</div>
                                    <div className="text-sm font-semibold text-theme-text">{breach.xposed_date}</div>
                                </div>

                                {/* Records Exposed */}
                                <div className="bg-theme-secondary-transparent p-4 rounded-md shadow-md">
                                    <div className="text-base font-extrabold text-theme-text">Records Exposed</div>
                                    <div className="text-sm font-semibold text-theme-text">{breach.xposed_records}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="text-center text-sm font-semibold text-theme-text-transparent mt-4 z-50">
                        [Click ESC to exit]
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default EmailBreach;