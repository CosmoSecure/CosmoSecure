import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, CardMedia, Button, TextField, Skeleton } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";

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

const ToolsEmailBreach: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [breachData, setBreachData] = useState<BreachDetails[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previousSearches, setPreviousSearches] = useState<string[]>([]);

    useEffect(() => {
        const savedSearches = sessionStorage.getItem("previousSearches");
        if (savedSearches) {
            setPreviousSearches(JSON.parse(savedSearches));
        }
    }, []);

    const handleCheckBreach = async () => {
        setLoading(true);
        setError(null);
        setBreachData(null);

        try {
            const response: any = await invoke("fetch_email_breach_info", { email });
            if (response.ExposedBreaches === null) {
                setBreachData(null);
            } else {
                setBreachData(response.ExposedBreaches.breaches_details);
            }

            // Update previous searches
            const updatedSearches = [email, ...previousSearches.filter((e) => e !== email)].slice(0, 5);
            setPreviousSearches(updatedSearches);
            sessionStorage.setItem("previousSearches", JSON.stringify(updatedSearches));
        } catch (err) {
            setError("Failed to fetch breach data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, margin: "auto", padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                Email Breach Checker
            </Typography>
            <TextField
                fullWidth
                label="Enter Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ marginBottom: 2 }}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleCheckBreach}
                disabled={loading || !email}
                fullWidth
            >
                Check Breach
            </Button>

            {loading && (
                <Box sx={{ marginTop: 2 }}>
                    <Skeleton variant="text" width="100%" height={40} />
                    <Skeleton variant="rectangular" width="100%" height={200} sx={{ marginTop: 2 }} />
                </Box>
            )}

            {!loading && breachData === null && !error && (
                <Typography variant="h6" color="textSecondary" sx={{ marginTop: 2 }}>
                    No breaches found for this email.
                </Typography>
            )}

            {!loading && breachData && (
                <Box sx={{ marginTop: 2 }}>
                    {breachData.map((breach, index) => (
                        <Card key={index} sx={{ marginBottom: 2 }}>
                            <CardMedia
                                component="img"
                                height="140"
                                image={breach.logo}
                                alt={breach.breach}
                            />
                            <CardContent>
                                <Typography variant="h6">{breach.breach}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {breach.details}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {!loading && error && (
                <Typography variant="h6" color="error" sx={{ marginTop: 2 }}>
                    {error}
                </Typography>
            )}

            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h6">Previous Searches</Typography>
                {previousSearches.map((search, index) => (
                    <Typography key={index} variant="body2" color="textSecondary">
                        {search}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

export default ToolsEmailBreach;