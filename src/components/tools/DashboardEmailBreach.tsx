import React, { useEffect, useState } from "react";
import { Modal, Box } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import Email_Button from "./Email_Button";
import Email_Loading from "./Email_Loading";

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

const DashboardEmailBreach: React.FC<{ userEmail: string }> = ({ userEmail }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [breachData, setBreachData] = useState<BreachDetails[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [breachData_risk, setBreachData_risk] = useState<any>(null);

    const fetchBreachDataWithRetry = async (attempts: number) => {
        try {
            const response: any = await invoke("fetch_email_breach_info", { email: userEmail });

            if (response.ExposedBreaches === null) {
                setBreachData(null); // No breaches found
                setError(null); // Clear any previous error
            } else if (response.ExposedBreaches.breaches_details) {
                setBreachData(response.ExposedBreaches.breaches_details); // Set breach details
                setBreachData_risk(response.BreachMetrics.risk);
                setError(null); // Clear any previous error
            } else {
                setBreachData(null); // Default to no breaches if unexpected structure
                setError(null); // Clear any previous error
            }
        } catch (err: any) {
            const errorMessage = err?.message || "Unknown error occurred";

            if (errorMessage.includes("HTTP 404")) {
                if (attempts > 1) {
                    // Retry after a delay
                    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
                    await fetchBreachDataWithRetry(attempts - 1);
                } else {
                    // After 5 attempts, set 404 error
                    setError("404 Data Not Found");
                }
            } else {
                setError("Failed to fetch breach data. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setError(null);
        const timer = setTimeout(() => {
            fetchBreachDataWithRetry(5); // Retry up to 5 times
            setLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, [userEmail]);

    // Close modal on ESC key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsModalOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    if (loading) {
        return (
            <div className="h-full w-full rounded-md flex items-center justify-center">
                <Email_Loading />
            </div>
        );
    }

    if (error === "404 Data Not Found") {
        return <div className="font-bold text-2xl text-red-500">404 Data Not Found</div>;
    }

    if (error) {
        return <div className="font-bold text-2xl text-red-500">{error}</div>;
    }

    if (breachData === null) {
        return <div className="font-bold text-2xl text-theme-text-transparent">No breaches found for your email.</div>;
    }

    const summary = {
        totalBreaches: breachData.length,
        totalRecordsExposed: breachData.reduce((sum, breach) => sum + breach.xposed_records, 0),
        risk: breachData_risk?.[0] || { risk_label: "Unknown", risk_score: 0 }, // Default if risk is missing
    };

    return (
        <div className="h-full w-full rounded-md">
            {/* Summary Section */}
            <div className="h-full w-full flex flex-col items-center justify-evenly rounded-lg">
                <div className="w-full h-auto flex flex-col justify-center bg-theme-secondary-transparent shadow-lg rounded-xl p-6 space-y-4 font-semibold text-gray-800">
                    <div className="text-xl font-extrabold border-b pb-2 text-theme-accent-transparent">
                        Summary
                    </div>

                    <div className="text-lg flex justify-between">
                        <span className="text-theme-text font-medium">Total Breaches:</span>
                        <span className="text-theme-accent">{summary.totalBreaches}</span>
                    </div>

                    <div className="text-lg flex justify-between">
                        <span className="text-theme-text font-medium">Risk Level:</span>
                        <span className="text-theme-accent">{summary.risk.risk_label}</span>
                    </div>

                    <div className="text-lg flex justify-between">
                        <span className="text-theme-text font-medium">Risk Score:</span>
                        <span className="text-theme-accent">{summary.risk.risk_score}</span>
                    </div>
                </div>

                <button
                    className="mt-4 border-2 border-[#4d4d4d] rounded-lg p-3 w-fit flex items-center hover:scale-105 transition-all duration-300"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Email_Button />
                </button>
            </div>


            {/* Modal for Breach Details */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="breach-details-modal"
                aria-describedby="breach-details-description"
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
                    {breachData.map((breach, index) => (
                        <div key={index} className="mb-5 p-4 bg-theme-primary-transparent border border-theme-primary rounded-md shadow-md">
                            <div className="flex items-center gap-4">
                                <img
                                    src={breach.logo}
                                    alt={breach.breach}
                                    className="h-20 w-20 object-contain ml-4"
                                />
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

export default DashboardEmailBreach;