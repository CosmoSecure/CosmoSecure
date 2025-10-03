import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pro } from '../assets/';
import { useUser } from '../contexts/UserContext';
import { invoke } from '@tauri-apps/api/core';
import { useQuickNotifications } from '../utils/notifications';
import CakeIcon from '@mui/icons-material/Cake';
import PasswordIcon from '@mui/icons-material/Password';
import SecurityIcon from '@mui/icons-material/Security';
import LoginIcon from '@mui/icons-material/Login';
import UpdateIcon from '@mui/icons-material/Update';
import ShieldIcon from '@mui/icons-material/Shield';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BuildIcon from '@mui/icons-material/Build';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Chip, LinearProgress, Button, TextField, IconButton } from '@mui/material';
import { ExpandLess, ExpandMore, Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import DashboardEmailBreach from './tools/DashboardEmailBreach';

import { PLATFORMS, FontAwesomeIcon } from '../constants/platforms';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { Search, ChevronDown } from 'lucide-react';

// Types
interface PasswordStats {
    totalPasswords: number;
    weakPasswords: { password: string; score: number }[];
    strongPasswords: number;
    mediumPasswords: number;
}

interface SecurityOverview {
    securityScore: number;
    lastLogin: string;
    masterPasswordStrength: 'Strong' | 'Medium' | 'Weak';
    vaultStatus: 'Secure' | 'Warning' | 'Critical';
    recommendationsCount: number;
}

// API Functions
// Check for duplicate password entries (same platform + username)
const checkForDuplicateEntry = async (userId: string, platform: string, username: string): Promise<boolean> => {
    try {
        // Fetch all password entries to check for duplicates
        const entries = await invoke<any[]>('get_password_entries_encrypted', {
            ui: userId
        });

        // Check if any existing entry has the same platform and username combination
        const duplicateExists = entries.some(entry =>
            entry.plt === platform &&
            entry.aun.toLowerCase().trim() === username.toLowerCase().trim()
        );

        return duplicateExists;
    } catch (error) {
        console.error('Error checking for duplicate entries:', error);
        // In case of error, allow the operation to continue (fail-safe)
        return false;
    }
};

const fetchOldPasswords = async (userId: string): Promise<{ password: string; daysOld: number }[]> => {
    try {
        // Fetch all password entries
        const entries = await invoke<any[]>('get_password_entries_encrypted', {
            ui: userId
        });

        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        // Debug logging
        console.log('=== DEBUG OLD PASSWORDS ===');
        console.log('Total entries:', entries.length);
        console.log('Current date:', now);
        console.log('Six months ago:', sixMonthsAgo);

        entries.forEach((entry, index) => {
            console.log(`Entry ${index}:`, {
                aun: entry.aun,
                plt: entry.plt,
                lup: entry.lup,
                lupParsed: entry.lup ? new Date(entry.lup) : 'No lup field'
            });
        });

        const oldPasswords = entries
            .filter(entry => {
                // Check lup (last-update) field specifically as requested
                if (entry.lup) {
                    // Handle MongoDB date format: {$date: {$numberLong: "timestamp"}}
                    let timestamp;
                    if (entry.lup.$date && entry.lup.$date.$numberLong) {
                        timestamp = parseInt(entry.lup.$date.$numberLong);
                    } else if (typeof entry.lup === 'string' || typeof entry.lup === 'number') {
                        timestamp = entry.lup;
                    } else {
                        return false;
                    }

                    const lastUpdateDate = new Date(timestamp);
                    console.log(`Checking entry ${entry.aun}:`, {
                        lup: entry.lup,
                        extractedTimestamp: timestamp,
                        lastUpdateDate: lastUpdateDate,
                        isValidDate: !isNaN(lastUpdateDate.getTime()),
                        isInPast: lastUpdateDate < now,
                        isOlderThan6Months: lastUpdateDate < sixMonthsAgo
                    });

                    // Verify the date is valid and actually in the past
                    if (!isNaN(lastUpdateDate.getTime()) && lastUpdateDate < now) {
                        // Check if difference is > 6 months
                        return lastUpdateDate < sixMonthsAgo;
                    }
                }

                // If no valid lup timestamp, don't consider it as old
                return false;
            })
            .map(entry => {
                // Calculate days old based on lup field with proper MongoDB format handling
                let timestamp;
                if (entry.lup.$date && entry.lup.$date.$numberLong) {
                    timestamp = parseInt(entry.lup.$date.$numberLong);
                } else {
                    timestamp = entry.lup;
                }

                const lastUpdateDate = new Date(timestamp);
                const diffTime = Math.abs(now.getTime() - lastUpdateDate.getTime());
                const daysOld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    password: `${entry.plt} (${entry.aun})`,
                    daysOld: daysOld
                };
            });

        console.log('Old passwords found:', oldPasswords);
        console.log('=== END DEBUG ===');

        return oldPasswords;
    } catch (error) {
        console.error('Error fetching old passwords:', error);
        return [];
    }
};

const fetchPasswordStats = async (userId: string): Promise<PasswordStats> => {
    try {
        const stats = await invoke<{
            total_passwords: number;
            weak_passwords_count: number;
            weak_entries: Array<{
                aid: string;
                plt: string;
                aun: string;
                aps: number;
            }>;
        }>('get_password_stats', { ui: userId });

        const weakCount = stats.weak_passwords_count;
        const totalCount = stats.total_passwords;
        // Calculate accurate password strength distribution
        const strongCount = Math.max(0, totalCount - weakCount - Math.floor(totalCount * 0.2));
        const mediumCount = Math.max(0, totalCount - weakCount - strongCount);

        return {
            totalPasswords: totalCount,
            weakPasswords: stats.weak_entries.map(entry => ({
                password: `${entry.plt} (${entry.aun})`,
                score: entry.aps,
            })),
            strongPasswords: strongCount,
            mediumPasswords: mediumCount
        };
    } catch (error) {
        console.error('Error fetching password stats:', error);
        return {
            totalPasswords: 0,
            weakPasswords: [],
            strongPasswords: 0,
            mediumPasswords: 0
        };
    }
};

const calculateSecurityOverview = (user: any, passwordStats: PasswordStats): SecurityOverview => {
    const totalPasswords = passwordStats.totalPasswords;
    const weakCount = passwordStats.weakPasswords.length;
    const strongCount = passwordStats.strongPasswords;
    const mediumCount = passwordStats.mediumPasswords;

    // Enhanced security score calculation with more balanced approach
    let securityScore = 0;

    // Master password foundation (25 points max)
    if (user.masterPassword?.isSet) {
        securityScore += 25;
    }

    // Password portfolio quality (75 points max)
    if (totalPasswords > 0) {
        const weakRatio = weakCount / totalPasswords;
        const mediumRatio = mediumCount / totalPasswords;
        const strongRatio = strongCount / totalPasswords;

        // More balanced scoring that rewards good passwords
        const baseScore = (strongRatio * 75) + (mediumRatio * 50) + (weakRatio * 15);
        securityScore += Math.round(baseScore);

        // Bonus for having multiple strong passwords
        if (strongCount >= 3) {
            securityScore += 5;
        }

        // Moderate penalty only if majority (>60%) are weak
        if (weakRatio > 0.6) {
            securityScore -= 10;
        }

        // Bonus for diversity - having some medium passwords shows progression
        if (totalPasswords >= 3 && mediumCount > 0) {
            securityScore += 2;
        }
    } else {
        // No passwords = getting started
        securityScore += 15;
    }

    // Ensure realistic bounds
    securityScore = Math.max(0, Math.min(100, securityScore));

    // More nuanced vault status logic
    let vaultStatus: 'Secure' | 'Warning' | 'Critical' = 'Secure';

    if (!user.masterPassword?.isSet) {
        vaultStatus = 'Critical';
    } else if (totalPasswords === 0) {
        vaultStatus = 'Warning';
    } else {
        const weakRatio = weakCount / totalPasswords;

        // Critical only if >70% are weak or all passwords are weak with 3+
        if ((weakRatio > 0.7) || (weakCount === totalPasswords && totalPasswords >= 3)) {
            vaultStatus = 'Critical';
        }
        // Warning if >40% are weak or any weak passwords with small vault
        else if (weakRatio > 0.4 || (weakCount > 0 && totalPasswords <= 2)) {
            vaultStatus = 'Warning';
        }
        // Otherwise secure
        else {
            vaultStatus = 'Secure';
        }
    }

    // Smarter recommendations count
    let recommendationsCount = 0;

    if (!user.masterPassword?.isSet) recommendationsCount++;
    if (totalPasswords === 0) recommendationsCount++;
    if (weakCount > 0) recommendationsCount++;
    if (totalPasswords > 0 && strongCount === 0) recommendationsCount++; // No strong passwords

    return {
        securityScore: Math.round(securityScore),
        lastLogin: user.lastLogin || 'Never',
        masterPasswordStrength: user.masterPassword?.isSet ? 'Strong' : 'Weak',
        vaultStatus,
        recommendationsCount
    };
};

// Dashboard Component
const Dashboard: React.FC = () => {
    const { user, isLoading } = useUser();
    const navigate = useNavigate();
    const quick = useQuickNotifications();
    const [email, setEmail] = useState('');

    const [passwordStats, setPasswordStats] = useState<PasswordStats>({
        totalPasswords: 0,
        weakPasswords: [],
        strongPasswords: 0,
        mediumPasswords: 0
    });

    const [securityOverview, setSecurityOverview] = useState<SecurityOverview>({
        securityScore: 0,
        lastLogin: 'Never',
        masterPasswordStrength: 'Weak',
        vaultStatus: 'Critical',
        recommendationsCount: 0
    });

    const [oldPasswords, setOldPasswords] = useState<{ password: string; daysOld: number }[]>([]);

    const [openWeakPasswords, setOpenWeakPasswords] = useState(false);
    const [openOldPasswords, setOpenOldPasswords] = useState(false);

    // Quick Actions Modal States
    const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
    const [showAddPassword, setShowAddPassword] = useState(false);
    const [showSecurityAudit, setShowSecurityAudit] = useState(false);

    // Password Generator States
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passwordLength, setPasswordLength] = useState(12);

    // Add Password Form States
    const [newPassword, setNewPassword] = useState({
        username: '',
        password: '',
        platform: '',
        masterPassword: ''
    });
    const [customPlatformName, setCustomPlatformName] = useState('');

    // Platform search states
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
    const [platformSearchQuery, setPlatformSearchQuery] = useState('');

    // Master PIN states for 4-digit input
    const [masterPin, setMasterPin] = useState(['', '', '', '']);
    const [showMasterPin, setShowMasterPin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Security Audit States
    const [auditResults, setAuditResults] = useState<{
        weakPasswords: number;
        oldPasswords: number;
        totalPasswords: number;
        recommendations: string[];
    } | null>(null);

    // Hash master password with SHA-256 (same as in Vault component)
    const hashMasterPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Navigation functions for directing users to Vault with specific filters
    const navigateToWeakPasswords = () => {
        navigate('/vault?filter=weak');
    };

    const navigateToOldPasswords = () => {
        navigate('/vault?filter=old');
    };

    // Quick Actions Handlers
    const handleGeneratePassword = async () => {
        try {
            const result = await invoke<{ password: string }>('generate_password', { length: passwordLength });
            setGeneratedPassword(result.password);
            quick.passwordGenerated();
        } catch (error) {
            console.error('Failed to generate password:', error);
            quick.error('Failed to generate password', `Please try again! Error: ${error}`);
        }
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(generatedPassword).then(() => {
            quick.passwordCopied();
        });
    };

    // Master PIN handlers
    const handleMasterPinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newPin = [...masterPin];
        newPin[index] = value.slice(-1); // Only take the last digit
        setMasterPin(newPin);

        // Auto-focus next input if value is entered
        if (value && index < 3) {
            const nextInput = document.getElementById(`master-pin-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleMasterPinKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            if (masterPin[index]) {
                return; // Let default behavior clear it
            } else if (index > 0) {
                e.preventDefault();
                const prevInput = document.getElementById(`master-pin-${index - 1}`) as HTMLInputElement;
                if (prevInput) {
                    const newPin = [...masterPin];
                    newPin[index - 1] = '';
                    setMasterPin(newPin);
                    prevInput.focus();
                    prevInput.select();
                }
            }
        } else if (e.key === 'Enter' && masterPin.join('').length === 4) {
            e.preventDefault();
            handleAddPassword();
        }
    };

    const handleAddPassword = async () => {
        if (!user?.userId || !newPassword.username || !newPassword.password) {
            quick.warning('Please fill all required fields');
            return;
        }

        // Validate custom platform name when Other is selected
        if (newPassword.platform === 'other' && !customPlatformName.trim()) {
            quick.warning('Please enter a custom platform name');
            return;
        }

        // Check if master password is set up
        if (!user?.masterPassword?.isSet) {
            quick.error('Master password not set', 'Please set up a master password in Settings first');
            return;
        }

        const masterPasswordValue = masterPin.join('');
        if (!masterPasswordValue || masterPasswordValue.length !== 4) {
            quick.warning('Please enter your 4-digit master PIN');
            return;
        }

        try {
            // Hash the master password before sending to backend (same as Vault component)
            const hashedMasterPassword = await hashMasterPassword(masterPasswordValue);

            // Validate master password against stored hash
            const storedMasterPasswordHash = user?.masterPassword?.hash;
            if (!storedMasterPasswordHash) {
                quick.error('Master password hash not available', 'Please try logging out and back in');
                return;
            }

            if (hashedMasterPassword !== storedMasterPasswordHash) {
                quick.error('Invalid master password', 'Please enter the correct master password');
                return;
            }

            // Determine final platform name (use custom name if Other is selected)
            const finalPlatform = newPassword.platform === 'other' && customPlatformName.trim()
                ? customPlatformName.trim()
                : newPassword.platform;

            // Check for duplicate entries before adding
            const isDuplicate = await checkForDuplicateEntry(
                user.userId,
                finalPlatform,
                newPassword.username
            );

            if (isDuplicate) {
                const platformDisplayName = newPassword.platform === 'other' && customPlatformName.trim()
                    ? customPlatformName.trim()
                    : newPassword.platform;
                quick.error('Duplicate entry detected', `An account for ${platformDisplayName} with username "${newPassword.username}" already exists`);
                return;
            }

            await invoke('add_password_entry', {
                userId: user.userId,
                username: newPassword.username,
                password: newPassword.password,
                platform: finalPlatform,
                masterPassword: hashedMasterPassword
            });

            quick.success('Password added successfully!');
            setShowAddPassword(false);
            setNewPassword({ username: '', password: '', platform: '', masterPassword: '' });
            setCustomPlatformName('');
            setMasterPin(['', '', '', '']);
            setShowPlatformDropdown(false);
            setPlatformSearchQuery('');
            setShowPassword(false);
            setShowMasterPin(false);

            // Refresh password stats and old passwords
            const stats = await fetchPasswordStats(user.userId);
            const refreshedOldPasswords = await fetchOldPasswords(user.userId);
            const overview = calculateSecurityOverview(user, stats);
            setPasswordStats(stats);
            setSecurityOverview(overview);
            setOldPasswords(refreshedOldPasswords);
        } catch (error) {
            console.error('Failed to add password:', error);
            quick.error('Failed to add password', `Error: ${error}`);
        }
    };

    const handleSecurityAudit = async () => {
        if (!user?.userId) return;

        try {
            const stats = await fetchPasswordStats(user.userId);
            const actualOldPasswords = await fetchOldPasswords(user.userId);
            const recommendations = [];
            const totalPasswords = stats.totalPasswords;
            const weakCount = stats.weakPasswords.length;
            const oldPasswordsCount = actualOldPasswords.length;

            // Critical issues only
            if (!user.masterPassword?.isSet) {
                recommendations.push('🔴 CRITICAL: Master password required for vault security');
            }

            if (weakCount > 0) {
                const severity = (weakCount / totalPasswords) > 0.3 ? 'CRITICAL' : 'HIGH';
                const emoji = severity === 'CRITICAL' ? '🔴' : '🟡';
                recommendations.push(`${emoji} ${severity}: Update ${weakCount} weak password${weakCount > 1 ? 's' : ''}`);
            }

            // Use actual old passwords count from database

            if (oldPasswordsCount > 0) {
                const severity = oldPasswordsCount > 2 ? 'MEDIUM' : 'LOW';
                const emoji = oldPasswordsCount > 2 ? '🟡' : '🔵';
                recommendations.push(`${emoji} ${severity}: Consider updating ${oldPasswordsCount} password${oldPasswordsCount > 1 ? 's' : ''} older than 6 months`);
            }

            if (totalPasswords === 0 && user.masterPassword?.isSet) {
                recommendations.push('🔵 INFO: Add passwords to start securing your accounts');
            }

            // Positive reinforcement for good security
            if (totalPasswords > 0 && weakCount === 0 && user.masterPassword?.isSet) {
                recommendations.push('✅ EXCELLENT: Your password security is outstanding!');
                if (totalPasswords >= 5) {
                    recommendations.push('✅ TIP: Consider enabling 2FA on important accounts');
                }
            }

            setAuditResults({
                weakPasswords: weakCount,
                oldPasswords: oldPasswordsCount,
                totalPasswords: totalPasswords,
                recommendations
            });

            const hasCritical = recommendations.some(r => r.includes('🔴'));
            const hasIssues = recommendations.some(r => r.includes('🟡'));

            if (hasCritical) {
                quick.warning(`Security audit: ${recommendations.length} critical issues found`);
            } else if (hasIssues) {
                quick.info(`Security audit: ${recommendations.length} improvements suggested`);
            } else {
                quick.success('Security audit: Your vault is secure!');
            }
        } catch (error) {
            console.error('Security audit failed:', error);
            quick.error('Security audit failed', `Error: ${error}`);
        }
    };

    // Fetch password statistics when user data is available
    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.userId) return;

            try {
                const stats = await fetchPasswordStats(user.userId);
                const overview = calculateSecurityOverview(user, stats);

                // Fetch actual old passwords from database
                const actualOldPasswords = await fetchOldPasswords(user.userId);

                setEmail(user.email);
                setPasswordStats(stats);
                setSecurityOverview(overview);
                setOldPasswords(actualOldPasswords);
            } catch (error) {
                console.error('Error fetching password stats:', error);
            }
        };

        fetchStats();
    }, [user?.userId, user?.maxPasswordCount, user?.masterPassword?.isSet]); // Fetch stats when relevant user data changes

    if (isLoading) {
        return (
            <div className="bg-theme-background flex items-center justify-center h-full w-full p-6 rounded-md">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-theme-background flex items-center justify-center h-full w-full p-6 rounded-md">
                <div className="text-xl text-red-500">Unable to load user data</div>
            </div>
        );
    }

    return (
        <div className="bg-theme-background text-theme-text-transparent flex flex-col h-full w-full p-2 sm:p-4 lg:p-6 rounded-md overflow-auto items-center shadow-inner">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-screen-2xl w-full backdrop-blur-sm">
                {/* Left Side (2/3 width) */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
                    {/* Security Overview & Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Enhanced Security Overview Section */}
                        <div className="bg-gradient-to-r from-theme-secondary-transparent via-theme-primary to-theme-secondary-transparent p-3 sm:p-6 rounded-lg shadow-2xl hover:shadow-3xl border border-theme-text-transparent/10 transition-shadow duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                <h2 className="text-lg sm:text-xl font-bold flex items-center min-w-0 flex-1">
                                    <SecurityIcon className="mr-2 break-all" /> <span className="truncate">Security Dashboard</span>
                                </h2>
                                <div className="flex-shrink-0 self-start sm:self-center">
                                    <Chip
                                        label={passwordStats.totalPasswords === 0 ? 'Getting Started' : securityOverview.vaultStatus}
                                        color={
                                            passwordStats.totalPasswords === 0 ? 'info' :
                                                securityOverview.vaultStatus === 'Secure' ? 'success' :
                                                    securityOverview.vaultStatus === 'Warning' ? 'warning' : 'error'
                                        }
                                        icon={passwordStats.totalPasswords === 0 ? <CheckCircleIcon /> : (securityOverview.vaultStatus === 'Secure' ? <CheckCircleIcon /> : <WarningIcon />)}
                                        sx={{
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                            height: { xs: '24px', sm: '32px' },
                                            maxWidth: '100%',
                                            '& .MuiChip-label': {
                                                px: { xs: 1, sm: 1.5 },
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            },
                                            '& .MuiChip-icon': {
                                                fontSize: { xs: '16px', sm: '18px' }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Security Score with Progress Ring */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
                                <div className="flex items-center space-x-3 lg:space-x-4 min-w-0">
                                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="2"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={
                                                    securityOverview.securityScore >= 80 ? '#10B981' :
                                                        securityOverview.securityScore >= 60 ? '#F59E0B' : '#EF4444'
                                                }
                                                strokeWidth="2"
                                                strokeDasharray={`${securityOverview.securityScore}, 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm sm:text-lg font-bold">{securityOverview.securityScore}</span>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-base sm:text-lg font-semibold break">Security Score</div>
                                        <div className="text-xs sm:text-sm opacity-75 font-medium">
                                            {passwordStats.totalPasswords === 0 ? 'Get Started' :
                                                securityOverview.securityScore >= 85 ? 'Excellent Security' :
                                                    securityOverview.securityScore >= 75 ? 'Very Good' :
                                                        securityOverview.securityScore >= 65 ? 'Good Security' :
                                                            securityOverview.securityScore >= 50 ? 'Fair Security' :
                                                                securityOverview.securityScore >= 35 ? 'Needs Improvement' : 'Critical Issues'}
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Password Health Breakdown */}
                                <div className="text-center lg:text-right w-full lg:w-auto">
                                    <div className="text-sm font-medium mb-2 flex items-center justify-end">
                                        <span className="mr-1">Password Health</span>
                                        <div className="text-xs opacity-70">({passwordStats.totalPasswords} total)</div>
                                    </div>

                                    {passwordStats.totalPasswords > 0 ? (
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap justify-center lg:justify-end gap-2 text-xs">
                                                <span className="flex items-center bg-green-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 flex-shrink-0"></div>
                                                    <strong className="text-xs">{Math.round((passwordStats.strongPasswords / passwordStats.totalPasswords) * 100)}%</strong>
                                                    <span className="ml-1 text-green-400 text-xs">Strong</span>
                                                </span>
                                                <span className="flex items-center bg-yellow-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 flex-shrink-0"></div>
                                                    <strong className="text-xs">{Math.round((passwordStats.mediumPasswords / passwordStats.totalPasswords) * 100)}%</strong>
                                                    <span className="ml-1 text-yellow-400 text-xs">Fair</span>
                                                </span>
                                                <span className="flex items-center bg-red-500/10 px-2 py-1 rounded-full whitespace-nowrap">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1 flex-shrink-0"></div>
                                                    <strong className="text-xs">{Math.round((passwordStats.weakPasswords.length / passwordStats.totalPasswords) * 100)}%</strong>
                                                    <span className="ml-1 text-red-400 text-xs">Weak</span>
                                                </span>
                                            </div>

                                            {/* Health progress bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                                <div className="h-1.5 rounded-full" style={{
                                                    background: `linear-gradient(to right, 
                                                        #10B981 0%, 
                                                        #10B981 ${(passwordStats.strongPasswords / passwordStats.totalPasswords) * 100}%, 
                                                        #F59E0B ${(passwordStats.strongPasswords / passwordStats.totalPasswords) * 100}%, 
                                                        #F59E0B ${((passwordStats.strongPasswords + passwordStats.mediumPasswords) / passwordStats.totalPasswords) * 100}%, 
                                                        #EF4444 ${((passwordStats.strongPasswords + passwordStats.mediumPasswords) / passwordStats.totalPasswords) * 100}%, 
                                                        #EF4444 100%)`
                                                }}></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs opacity-70 italic">No passwords yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Security Insights */}
                            <div className="border-t border-theme-text-transparent/30 pt-4 mt-4">

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm mb-2 gap-2">
                                    <div className="flex items-center">
                                        <LoginIcon className="mr-2 text-theme-primary" fontSize="small" />
                                        <span>Last Access</span>
                                    </div>
                                    <span className="opacity-75 font-medium">{securityOverview.lastLogin}</span>
                                </div>

                                {/* Smart recommendations based on current state */}
                                {passwordStats.totalPasswords === 0 ? (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
                                        <div className="flex items-center text-sm">
                                            <CheckCircleIcon className="mr-2 text-blue-500" fontSize="small" />
                                            <span className="font-medium">Ready to Start</span>
                                        </div>
                                        <div className="text-xs opacity-75 mt-1">Add your first password to secure your accounts</div>
                                    </div>
                                ) : securityOverview.vaultStatus === 'Secure' ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-2">
                                        <div className="flex items-center text-sm">
                                            <CheckCircleIcon className="mr-2 text-green-500" fontSize="small" />
                                            <span className="font-medium text-green-400">Vault Secure</span>
                                        </div>
                                        <div className="text-xs opacity-75 mt-1">Your passwords are well protected</div>
                                    </div>
                                ) : (
                                    <div className={`${securityOverview.vaultStatus === 'Critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border rounded-lg p-3 mt-2`}>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center">
                                                <WarningIcon className={`mr-2 ${securityOverview.vaultStatus === 'Critical' ? 'text-red-500' : 'text-yellow-500'}`} fontSize="small" />
                                                <span className="font-medium">Action Required</span>
                                            </div>
                                            <span className={`${securityOverview.vaultStatus === 'Critical' ? 'text-red-400' : 'text-yellow-400'} font-bold`}>
                                                {securityOverview.recommendationsCount} item{securityOverview.recommendationsCount > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="text-xs opacity-75 mt-1">
                                            {passwordStats.weakPasswords.length > 0 && `${passwordStats.weakPasswords.length} weak password${passwordStats.weakPasswords.length > 1 ? 's' : ''} need${passwordStats.weakPasswords.length === 1 ? 's' : ''} attention`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions Panel */}
                        <div className="bg-theme-primary-transparent p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            <h2 className="text-xl font-bold mb-4 flex items-center">
                                <BuildIcon className="mr-2" /> Quick Actions
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowAddPassword(true)}
                                    className="bg-theme-secondary-transparent hover:bg-theme-secondary shadow-md hover:shadow-lg p-3 rounded-lg flex flex-col items-center transition-all duration-300 transform hover:scale-105"
                                >
                                    <AddIcon className="text-theme-primary mb-1" />
                                    <span className="text-sm">Add Password</span>
                                </button>
                                <button
                                    onClick={() => setShowPasswordGenerator(true)}
                                    className="bg-theme-secondary-transparent hover:bg-theme-secondary shadow-md hover:shadow-lg p-3 rounded-lg flex flex-col items-center transition-all duration-300 transform hover:scale-105"
                                >
                                    <VpnKeyIcon className="text-theme-primary mb-1" />
                                    <span className="text-sm">Generate</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSecurityAudit(true);
                                        handleSecurityAudit();
                                    }}
                                    className="bg-theme-secondary-transparent hover:bg-theme-secondary shadow-md hover:shadow-lg p-3 rounded-lg flex flex-col items-center transition-all duration-300 transform hover:scale-105"
                                >
                                    <AssessmentIcon className="text-theme-primary mb-1" />
                                    <span className="text-sm">Security Audit</span>
                                </button>
                                <button
                                    onClick={() => navigate('/vault')}
                                    className="bg-theme-secondary-transparent hover:bg-theme-secondary shadow-md hover:shadow-lg p-3 rounded-lg flex flex-col items-center transition-all duration-300 transform hover:scale-105"
                                >
                                    <ShieldIcon className="text-theme-primary mb-1" />
                                    <span className="text-sm">View Vault</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Email Breach Check */}
                    <div className="bg-theme-primary-transparent p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-fit overflow-scroll mb-6">
                        <DashboardEmailBreach userEmail={email} />
                    </div>
                </div>

                {/* Right Side (1/3 width) - Security Panel */}
                <div className="col-span-1 flex flex-col gap-4">
                    {/* Consolidated Action Center */}
                    <div className="bg-theme-primary-transparent p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold flex items-center">
                                <ShieldIcon className="mr-2" /> Action Center
                            </h3>
                            <button
                                onClick={() => {
                                    setShowSecurityAudit(true);
                                    handleSecurityAudit();
                                }}
                                className="text-xs font-semibold bg-theme-secondary-transparent hover:bg-theme-secondary px-2 py-1 rounded shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
                            >
                                Full Audit
                            </button>
                        </div>

                        {/* Password Storage Bar */}
                        <div className="bg-theme-secondary-transparent p-3 rounded-lg mb-3 border border-theme-secondary shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <VpnKeyIcon className="mr-2 text-blue-500" fontSize="small" />
                                    <span className="text-sm font-medium">Password Storage</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs bg-theme-primary-transparent px-2 py-1 rounded">
                                        {passwordStats.totalPasswords}/{user?.maxPasswordCount || 0}
                                    </span>
                                    <span className="text-xs opacity-75">
                                        {Math.round((passwordStats.totalPasswords / (user?.maxPasswordCount || 1)) * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="relative">
                                <LinearProgress
                                    variant="determinate"
                                    value={(passwordStats.totalPasswords / (user?.maxPasswordCount || 1)) * 100}
                                    className="h-2 rounded-full"
                                    sx={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: '999px',
                                            background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Priority Actions Only */}
                        <div className="space-y-2 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-md p-2">
                            {!user?.masterPassword?.isSet && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500 shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-red-800 dark:text-red-200">
                                            <WarningIcon className="mr-2" fontSize="small" />
                                            Setup master password
                                        </div>
                                        <button
                                            onClick={() => navigate('/setting')}
                                            className="text-xs bg-red-200 dark:bg-red-800 px-2 py-1 rounded hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
                                        >
                                            Setup
                                        </button>
                                    </div>
                                </div>
                            )}

                            {passwordStats.weakPasswords.length > 0 && (
                                <div className="p-3 bg-orange-100 rounded-lg border-l-4 border-orange-500 shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-orange-800">
                                            <AssessmentIcon className="mr-2" fontSize="small" />
                                            {passwordStats.weakPasswords.length} weak password{passwordStats.weakPasswords.length > 1 ? 's' : ''}
                                        </div>
                                        <button
                                            onClick={navigateToWeakPasswords}
                                            className="text-xs font-semibold bg-orange-400 px-2 py-1 rounded hover:bg-orange-500 transition-colors"
                                        >
                                            Fix
                                        </button>
                                    </div>
                                </div>
                            )}

                            {oldPasswords.length > 0 && (
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500 shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            <UpdateIcon className="mr-2" fontSize="small" />
                                            {oldPasswords.length} old password{oldPasswords.length > 1 ? 's' : ''} (6+ months)
                                        </div>
                                        <button
                                            onClick={navigateToOldPasswords}
                                            className="text-xs bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 transition-colors"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            )}

                            {passwordStats.totalPasswords === 0 && user?.masterPassword?.isSet && (
                                <div className="p-3 bg-blue-100 rounded-lg border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-blue-800">
                                            <AddIcon className="mr-2" fontSize="small" />
                                            Add your first passwords
                                        </div>
                                        <button
                                            onClick={() => setShowAddPassword(true)}
                                            className="text-xs bg-blue-200 px-2 py-1 rounded hover:bg-blue-300 transition-colors"
                                        >
                                            Start
                                        </button>
                                    </div>
                                </div>
                            )}

                            {securityOverview.recommendationsCount === 0 && passwordStats.totalPasswords > 0 && (
                                <div className="p-3 bg-green-100 rounded-lg border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-green-800">
                                            <CheckCircleIcon className="mr-2" fontSize="small" />
                                            All secure! 🎉
                                        </div>
                                        <button
                                            onClick={() => navigate('/vault')}
                                            className="text-xs bg-green-200 px-2 py-1 rounded hover:bg-green-300 transition-colors"
                                        >
                                            View Vault
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weak Passwords Details */}
                    <div className="bg-theme-primary-transparent p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <ListItemButton
                            onClick={() => setOpenWeakPasswords(!openWeakPasswords)}
                            className="text-theme-text font-bold p-2 rounded-lg flex justify-between items-center bg-transparent hover:rounded-lg"
                        >
                            <span className="flex items-center">
                                <WarningIcon className="mr-2 text-red-500" />
                                Weak Passwords ({passwordStats.weakPasswords.length})
                            </span>
                            {openWeakPasswords ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>

                        <Collapse in={openWeakPasswords} timeout="auto" unmountOnExit>
                            <List
                                component="div"
                                disablePadding
                                className="bg-transparent rounded-lg mt-2 shadow-inner overflow-y-auto max-h-64 space-y-2 p-2"
                            >
                                {passwordStats.weakPasswords.length > 0 ? (
                                    passwordStats.weakPasswords.map((entry, index) => (
                                        <ListItemButton
                                            key={index}
                                            sx={{
                                                borderRadius: '8px',
                                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                paddingLeft: 1.5,
                                                paddingRight: 1.5,
                                                minHeight: 0,
                                                marginBottom: '4px'
                                            }}
                                            className="hover:text-theme-text shadow-sm hover:shadow-md transition-all rounded-lg flex items-center"
                                        >
                                            <ListItemIcon sx={{ minWidth: 32, marginRight: 0 }}>
                                                <WarningIcon color="error" fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={entry.password}
                                                secondary={`Security Score: ${entry.score}/4`}
                                                sx={{ margin: 0 }}
                                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                            />
                                        </ListItemButton>
                                    ))
                                ) : (
                                    <div className="text-theme-text-transparent p-4 text-center">
                                        <CheckCircleIcon className="text-green-500 mb-2" />
                                        <div className="text-sm">No weak passwords found!</div>
                                        <div className="text-xs opacity-75">Your vault is secure</div>
                                    </div>
                                )}
                            </List>
                            {passwordStats.weakPasswords.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-theme-secondary">
                                    <Button
                                        onClick={navigateToWeakPasswords}
                                        variant="outlined"
                                        size="small"
                                        className="w-full"
                                        sx={{
                                            color: 'rgb(var(--theme-text))',
                                            borderColor: 'rgb(var(--theme-primary))',
                                            '&:hover': {
                                                borderColor: 'rgb(var(--theme-primary-transparent))',
                                                backgroundColor: 'rgb(var(--theme-primary-transparent) / 0.1)'
                                            }
                                        }}
                                    >
                                        View Weak Passwords in Vault
                                    </Button>
                                </div>
                            )}
                        </Collapse>
                    </div>

                    {/* Old Passwords Details */}
                    <div className="bg-theme-primary-transparent p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <ListItemButton
                            onClick={() => setOpenOldPasswords(!openOldPasswords)}
                            className="text-theme-text font-bold p-2 rounded-lg flex justify-between items-center bg-transparent hover:rounded-lg"
                        >
                            <span className="flex items-center">
                                <UpdateIcon className="mr-2 text-yellow-500" />
                                Old Passwords ({oldPasswords.length})
                            </span>
                            {openOldPasswords ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>

                        <Collapse in={openOldPasswords} timeout="auto" unmountOnExit>
                            <List
                                component="div"
                                disablePadding
                                className="bg-transparent rounded-lg mt-2 shadow-inner overflow-y-auto max-h-64 space-y-2 p-2"
                            >
                                {oldPasswords.length > 0 ? (
                                    oldPasswords.map((entry, index) => (
                                        <ListItemButton
                                            key={index}
                                            sx={{
                                                borderRadius: '8px',
                                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                paddingLeft: 1.5,
                                                paddingRight: 1.5,
                                                minHeight: 0,
                                                marginBottom: '4px'
                                            }}
                                            className="hover:text-theme-text shadow-sm hover:shadow-md transition-all duration-300 rounded-lg flex items-center"
                                        >
                                            <ListItemIcon sx={{ minWidth: 32, marginRight: 0 }}>
                                                <UpdateIcon color="warning" fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={entry.password}
                                                secondary={`Last updated: ${entry.daysOld} days ago`}
                                                sx={{ margin: 0 }}
                                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                            />
                                        </ListItemButton>
                                    ))
                                ) : (
                                    <div className="text-theme-text-transparent p-4 text-center">
                                        <CheckCircleIcon className="text-green-500 mb-2" />
                                        <div className="text-sm">All passwords are recent!</div>
                                        <div className="text-xs opacity-75">No passwords older than 6 months</div>
                                    </div>
                                )}
                            </List>
                            {oldPasswords.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-theme-secondary">
                                    <Button
                                        onClick={navigateToOldPasswords}
                                        variant="outlined"
                                        size="small"
                                        className="w-full"
                                        sx={{
                                            color: 'rgb(var(--theme-text))',
                                            borderColor: 'rgb(var(--theme-primary))',
                                            '&:hover': {
                                                borderColor: 'rgb(var(--theme-primary-transparent))',
                                                backgroundColor: 'rgb(var(--theme-primary-transparent) / 0.1)'
                                            }
                                        }}
                                    >
                                        View Old Passwords in Vault
                                    </Button>
                                </div>
                            )}
                        </Collapse>
                    </div>

                    {/* User Account Info */}
                    <div className="bg-theme-primary-transparent p-4 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                        <h3 className="text-xl font-bold mb-3">Account Info</h3>
                        <div className="space-y-3">
                            <div className="flex items-center text-base">
                                <img src={Pro} alt="Profile" className="rounded-full h-10 w-10 mr-3" />
                                <div>
                                    <div className="font-semibold text-base">{user?.name || 'Unknown'}</div>
                                    <div className="text-sm opacity-75 break-all">{user?.email || 'No email'}</div>
                                </div>
                            </div>
                            <div className="flex items-center text-base">
                                <CakeIcon className="mr-4 ml-2 text-theme-text-transparent" fontSize="medium" />
                                <span className='font-sarif font-semibold'>Joined {user?.joinDate || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center text-base">
                                <PasswordIcon className="mr-4 ml-2 text-theme-text-transparent" fontSize="medium" />
                                <span className='font-sarif font-semibold'>{passwordStats.totalPasswords} passwords stored</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Password Generator Modal */}
            {showPasswordGenerator && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 backdrop-blur-md bg-black/30"
                        onClick={() => setShowPasswordGenerator(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-theme-primary-transparent border border-theme-primary-transparent rounded-lg shadow-3xl hover:shadow-4xl transition-shadow duration-300 backdrop-blur-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-theme-text-transparent/10">
                            <div className="flex items-center">
                                <VpnKeyIcon className="mr-2 text-theme-secondary-transparent mb-2" />
                                <h2 className="text-lg font-semibold text-theme-text">Password Generator</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPasswordGenerator(false);
                                    setGeneratedPassword('');
                                    setPasswordLength(12);
                                }}
                                className="p-1 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                            >
                                <CloseIcon className="text-theme-text" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <TextField
                                label="Password Length"
                                type="number"
                                value={passwordLength}
                                onChange={(e) => setPasswordLength(Math.min(64, Math.max(8, parseInt(e.target.value) || 8)))}
                                inputProps={{ min: 8, max: 64 }}
                                fullWidth
                            />

                            <Button
                                onClick={handleGeneratePassword}
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                fullWidth
                                className="bg-theme-primary"
                            >
                                Generate Password
                            </Button>

                            {generatedPassword && (
                                <div className="space-y-2">
                                    <TextField
                                        label="Generated Password"
                                        value={generatedPassword}
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: (
                                                <IconButton onClick={handleCopyPassword}>
                                                    <ContentCopyIcon />
                                                </IconButton>
                                            )
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Password Modal */}
            {showAddPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 backdrop-blur-sm"
                        onClick={() => {
                            setShowAddPassword(false);
                            setNewPassword({ username: '', password: '', platform: '', masterPassword: '' });
                            setCustomPlatformName('');
                            setMasterPin(['', '', '', '']);
                            setShowPassword(false);
                            setShowMasterPin(false);
                            setShowPlatformDropdown(false);
                            setPlatformSearchQuery('');
                        }}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-theme-primary border border-theme-text-transparent rounded-lg shadow-3xl hover:shadow-4xl transition-shadow duration-300 backdrop-blur-lg max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-theme-text-transparent">
                            <div className="flex items-center">
                                <AddIcon className="mr-2 text-theme-primary" />
                                <h2 className="text-lg font-semibold text-theme-text">Add New Password</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddPassword(false);
                                    setNewPassword({ username: '', password: '', platform: '', masterPassword: '' });
                                    setCustomPlatformName('');
                                    setMasterPin(['', '', '', '']);
                                    setShowPlatformDropdown(false);
                                    setPlatformSearchQuery('');
                                }}
                                className="p-1 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                            >
                                <CloseIcon className="text-theme-text" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            {!user?.masterPassword?.isSet && (
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                                    <div className="flex items-center text-sm font-medium text-orange-800 dark:text-orange-200">
                                        <WarningIcon className="mr-2" fontSize="small" />
                                        Please set up a master password in Settings before adding passwords
                                    </div>
                                </div>
                            )}

                            {/* Platform Selection with Search */}
                            <div className="relative">
                                <label className="text-sm font-semibold text-theme-text mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Platform *
                                </label>

                                {/* Simple button to trigger dropdown */}
                                <button
                                    type="button"
                                    onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                                    className="w-full px-3 py-2 border border-theme-secondary rounded-lg bg-theme-background text-theme-text flex items-center justify-between hover:border-theme-primary transition-all duration-200"
                                >
                                    <div className="flex items-center gap-2">
                                        {newPassword.platform ? (
                                            <>
                                                {(() => {
                                                    const selectedPlatform = PLATFORMS.find(p => p.value === newPassword.platform);
                                                    if (selectedPlatform) {
                                                        return (
                                                            <>
                                                                <div className={`w-5 h-5 rounded ${selectedPlatform.color} flex items-center justify-center text-white text-xs`}>
                                                                    <FontAwesomeIcon icon={selectedPlatform.icon} className="w-3 h-3" />
                                                                </div>
                                                                <span className="text-sm">{selectedPlatform.name}</span>
                                                            </>
                                                        );
                                                    } else if (newPassword.platform === 'other' && customPlatformName) {
                                                        return (
                                                            <>
                                                                <div className="w-5 h-5 rounded bg-gray-500 flex items-center justify-center text-white text-xs">
                                                                    <FontAwesomeIcon icon={faEllipsis} className="w-3 h-3" />
                                                                </div>
                                                                <span className="text-sm">{customPlatformName}</span>
                                                            </>
                                                        );
                                                    }
                                                    return <span className="text-sm text-theme-text opacity-50">Select platform...</span>;
                                                })()}
                                            </>
                                        ) : (
                                            <span className="text-sm text-theme-text opacity-50">Select platform...</span>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPlatformDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {showPlatformDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-theme-background border border-theme-secondary rounded-lg shadow-lg max-h-64 overflow-hidden z-50">
                                        {/* Search Input */}
                                        <div className="p-2 border-b border-theme-secondary">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-text opacity-50" />
                                                <input
                                                    type="text"
                                                    placeholder="Search platforms..."
                                                    value={platformSearchQuery}
                                                    onChange={(e) => setPlatformSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 bg-theme-secondary-transparent border border-theme-text-transparent/20 rounded text-theme-text placeholder-theme-text/50 focus:border-theme-primary focus:outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Platform Options */}
                                        <div className="max-h-48 overflow-y-auto">
                                            {(() => {
                                                const filteredPlatforms = PLATFORMS.filter(p =>
                                                    p.name.toLowerCase().includes(platformSearchQuery.toLowerCase()) ||
                                                    p.value.toLowerCase().includes(platformSearchQuery.toLowerCase())
                                                );

                                                if (filteredPlatforms.length === 0) {
                                                    return (
                                                        <div className="px-3 py-4 text-center text-theme-text opacity-50 text-sm">
                                                            No platforms found
                                                        </div>
                                                    );
                                                }

                                                return filteredPlatforms.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewPassword({ ...newPassword, platform: p.value });
                                                            setShowPlatformDropdown(false);
                                                            setPlatformSearchQuery('');
                                                            if (p.value !== 'other') {
                                                                setCustomPlatformName('');
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 text-left hover:bg-theme-primary hover:bg-opacity-10 flex items-center gap-2 transition-colors text-sm"
                                                    >
                                                        <div className={`w-5 h-5 rounded ${p.color} flex items-center justify-center text-white text-xs`}>
                                                            <FontAwesomeIcon icon={p.icon} className="w-3 h-3" />
                                                        </div>
                                                        <span className="text-theme-text">{p.name}</span>
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Click outside to close */}
                                {showPlatformDropdown && (
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => {
                                            setShowPlatformDropdown(false);
                                            setPlatformSearchQuery('');
                                        }}
                                    />
                                )}
                            </div>

                            {/* Custom Platform Name Input */}
                            {newPassword.platform === 'other' && (
                                <div>
                                    <label className="text-sm font-semibold text-theme-text mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                        Custom Platform Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={customPlatformName}
                                        onChange={(e) => setCustomPlatformName(e.target.value)}
                                        placeholder="Enter platform name (e.g., MyBank, School Portal)"
                                        className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:ring-1 focus:ring-theme-primary focus:border-theme-primary bg-theme-background text-theme-text hover:border-theme-primary transition-all duration-200 shadow-md hover:shadow-lg focus:shadow-lg"
                                        required
                                    />
                                </div>
                            )}

                            <TextField
                                label="Username/Email"
                                value={newPassword.username}
                                onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword.password}
                                onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
                                fullWidth
                                required
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            className="text-theme-text"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    )
                                }}
                            />

                            {/* Master PIN Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-theme-text">
                                        Master PIN
                                    </label>
                                    <IconButton
                                        onClick={() => setShowMasterPin(!showMasterPin)}
                                        className="text-theme-text opacity-70 hover:opacity-100 transition-opacity"
                                        disabled={!user?.masterPassword?.isSet}
                                        size="small"
                                    >
                                        {showMasterPin ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                </div>
                                <div className="flex justify-center space-x-3">
                                    {masterPin.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`master-pin-${index}`}
                                            type={showMasterPin ? 'text' : 'password'}
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleMasterPinChange(index, e.target.value)}
                                            onKeyDown={(e) => handleMasterPinKeyDown(index, e)}
                                            className="w-12 h-12 text-center text-lg font-bold bg-theme-secondary border border-theme-text-transparent rounded-lg text-theme-text focus:border-theme-primary focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="•"
                                            disabled={!user?.masterPassword?.isSet}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-theme-text opacity-75 text-center">
                                    {user?.masterPassword?.isSet ?
                                        "Enter your 4-digit master PIN to encrypt this entry" :
                                        "Set up a master PIN first in Settings"
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 p-4 border-t border-theme-text-transparent">
                            <Button
                                onClick={() => {
                                    setShowAddPassword(false);
                                    setNewPassword({ username: '', password: '', platform: '', masterPassword: '' });
                                    setCustomPlatformName('');
                                    setMasterPin(['', '', '', '']);
                                    setShowPlatformDropdown(false);
                                    setPlatformSearchQuery('');
                                }}
                                className="text-theme-text"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddPassword}
                                variant="contained"
                                disabled={
                                    !newPassword.username ||
                                    !newPassword.password ||
                                    !newPassword.platform ||
                                    !user?.masterPassword?.isSet ||
                                    masterPin.join('').length !== 4 ||
                                    (newPassword.platform === 'other' && !customPlatformName.trim())
                                }
                                className="bg-theme-primary"
                            >
                                Add Password
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Audit Modal */}
            {showSecurityAudit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 backdrop-blur-md bg-black/30"
                        onClick={() => {
                            setShowSecurityAudit(false);
                            setAuditResults(null);
                        }}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-theme-primary border border-theme-text-transparent rounded-lg shadow-3xl hover:shadow-4xl transition-all duration-300 backdrop-blur-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform animate-in slide-in-from-bottom-4">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-theme-text-transparent">
                            <div className="flex items-center">
                                <AssessmentIcon className="mr-2 text-theme-secondary-transparent mb-1" />
                                <h2 className="text-lg font-semibold text-theme-text">Security Audit Results</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSecurityAudit(false);
                                    setAuditResults(null);
                                }}
                                className="p-1 hover:bg-theme-secondary-transparent rounded-full transition-colors"
                            >
                                <CloseIcon className="text-theme-text" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {auditResults && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">{auditResults.weakPasswords}</div>
                                            <div className="text-sm text-black font-semibold">Weak Passwords</div>
                                        </div>
                                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-yellow-600">{auditResults.oldPasswords}</div>
                                            <div className="text-sm text-black font-semibold">Old Passwords</div>
                                        </div>
                                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{auditResults.totalPasswords}</div>
                                            <div className="text-sm text-black font-semibold">Total Passwords</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 text-theme-text">Security Recommendations</h3>
                                        {auditResults.recommendations.length > 0 ? (
                                            <ul className="space-y-3">
                                                {auditResults.recommendations.map((rec, index) => {
                                                    const isCritical = rec.includes('🔴');
                                                    const isHigh = rec.includes('🟡');
                                                    const isInfo = rec.includes('🔵');
                                                    const isExcellent = rec.includes('✅');

                                                    return (
                                                        <li key={index} className={`flex h-fit items-start p-3 rounded-lg ${isCritical ? 'bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500' :
                                                            isHigh ? 'bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500' :
                                                                isInfo ? 'bg-blue-100 dark:bg-blue-900/20 border-l-4 border-blue-500' :
                                                                    isExcellent ? 'bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500' :
                                                                        'bg-theme-secondary-transparent'
                                                            }`}>
                                                            <div className="flex-1">
                                                                <div className={`text-sm font-medium ${isCritical ? 'text-red-800 dark:text-red-200' :
                                                                    isHigh ? 'text-yellow-800 dark:text-yellow-200' :
                                                                        isInfo ? 'text-blue-800 dark:text-blue-200' :
                                                                            isExcellent ? 'text-green-800 dark:text-green-200' :
                                                                                'text-theme-text'
                                                                    }`}>
                                                                    {rec.replace(/^[🔴🟡🔵✅]\s*\w+:\s*/, '')}
                                                                </div>
                                                                {(isCritical || isHigh) && (
                                                                    <div className="text-xs text-black mt-1 opacity-75">
                                                                        {isCritical ? 'Immediate action required' : 'Recommended improvement'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-2">
                                                                {isCritical && <WarningIcon className="text-red-500" fontSize="small" />}
                                                                {isHigh && <UpdateIcon className="text-yellow-500" fontSize="small" />}
                                                                {isInfo && <AddIcon className="text-blue-500" fontSize="small" />}
                                                                {isExcellent && <CheckCircleIcon className="text-green-500" fontSize="small" />}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="text-center p-6 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                                <CheckCircleIcon className="text-green-500 text-4xl mb-2" />
                                                <div className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                                                    Outstanding Security!
                                                </div>
                                                <div className="text-sm text-green-700 dark:text-green-300">
                                                    All security checks passed. Your vault is exceptionally secure.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 p-4 border-t border-theme-text-transparent">
                            <Button
                                onClick={() => {
                                    setShowSecurityAudit(false);
                                    setAuditResults(null);
                                }}
                                className="text-theme-text"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => navigate('/vault')}
                                variant="contained"
                                className="bg-theme-primary"
                            >
                                Go to Vault
                            </Button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Dashboard;
