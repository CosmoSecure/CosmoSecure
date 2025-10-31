import React, { useState } from 'react';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BuildIcon from '@mui/icons-material/Build';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StarBorder from '@mui/icons-material/StarBorder';
import MonitorIcon from '@mui/icons-material/Monitor';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { PasswordGenerator, ProcessCapture, ToolsEmailBreach } from './tools';

const Tools: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [open, setOpen] = useState(true); // State for collapsible section

    const handleClick = () => {
        setOpen(!open);
    };

    const renderContent = () => {
        switch (selectedTool) {
            case 'Password Generator':
                return <PasswordGenerator />;
            case 'Process Monitor':  // Add this case
                return <ProcessCapture />;
            case 'Email Breach':
                return <ToolsEmailBreach />;
            default:
                return (
                    <div className="flex flex-col justify-center items-center h-full w-full p-4 text-theme-text">
                        <div className="text-center mb-12">
                            <div className="">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-theme-secondary-transparent rounded-full mb-6 shadow-lg border-2 border-theme-text-transparent">
                                    <BuildIcon sx={{ fontSize: '2.5rem' }} />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold mb-4 tracking-tight">
                                Security Toolkit
                            </h1>
                            <p className="text-xl-transparent opacity-80 max-w-2xl mx-auto leading-relaxed">
                                Comprehensive security tools to protect and analyze your digital assets
                            </p>
                        </div>

                        {/* Tools Grid Preview */}
                        <div className='flex flex-col justify-center items-center w-full'>
                            <div className="text-xl font-semibold mb-4">Available Tools</div>
                            <div className="grid grid-cols-3 gap-6 mb-12 max-w-4xl">
                                <div className="bg-theme-secondary-transparent border-2 border-theme-secondary hover:shadow-sm hover:shadow-theme-text rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                                    <VpnKeyIcon sx={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '1rem' }} />
                                    <h3 className="text-lg font-semibold mb-2">Password Security</h3>
                                    <p className="text-sm opacity-70">Generate strong, secure passwords</p>
                                </div>
                                <div className="bg-theme-secondary-transparent border-2 border-theme-secondary hover:shadow-sm hover:shadow-theme-text rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                                    <MonitorIcon sx={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '1rem' }} />
                                    <h3 className="text-lg font-semibold mb-2">System Monitor</h3>
                                    <p className="text-sm opacity-70">Track system processes</p>
                                </div>
                                <div className="bg-theme-secondary-transparent border-2 border-theme-secondary hover:shadow-sm hover:shadow-theme-text rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                                    <MarkEmailUnreadIcon sx={{ fontSize: '2.5rem', color: 'var(--accent-color)', marginBottom: '1rem' }} />
                                    <h3 className="text-lg font-semibold mb-2">Breach Detection</h3>
                                    <p className="text-sm opacity-70">Check email security status</p>
                                </div>
                            </div>
                        </div>

                        {/* Quote Section */}
                        <div className="mt-2 text-center">
                            <blockquote className="text-lg italic text-theme-text opacity-60 max-w-2xl mx-auto">
                                "Security is not a product, but a process."
                            </blockquote>
                            <cite className="text-sm text-theme-text opacity-50 mt-2 block">— Bruce Schneier</cite>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="bg-theme-background h-full p-8 grid grid-cols-4 gap-4 text-theme-accent">
            {/* Sidebar using Material-UI List */}
            <div className="col-span-1 bg-theme-primary-transparent p-4 rounded-md overflow-y-scroll">
                <List
                    sx={{ width: '100%' }}
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader
                            component="h3"
                            id="nested-list-subheader"
                            sx={{ bgcolor: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}
                        >
                            Tools
                        </ListSubheader>
                    }
                >
                    {/* Password Generator */}
                    <ListItemButton
                        onClick={() => setSelectedTool('Password Generator')}
                        sx={{
                            borderRadius: '8px',
                            margin: '0.4rem',
                            padding: '8px',
                            transition: 'all 0.3s ease-in-out',
                            bgcolor: selectedTool === 'Password Generator' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                            transform: selectedTool === 'Password Generator' ? 'scale(1.05)' : 'none',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                transform: 'scale(1.05)',
                            },
                        }}
                        className={`${selectedTool === 'Password Generator' ? 'text-theme-text' : 'hover:text-theme-text'
                            }`}
                    >
                        <ListItemIcon>
                            <VpnKeyIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={<span style={{ fontWeight: 'bold' }}>Password Generator</span>}
                        />
                    </ListItemButton>

                    <ListItemButton
                        sx={{
                            borderRadius: '8px',
                            margin: '0.4rem',
                            padding: '8px',
                            transition: 'all 0.3s ease-in-out',
                            bgcolor: selectedTool === 'Process Monitor' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                            transform: selectedTool === 'Process Monitor' ? 'scale(1.05)' : 'none',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                transform: 'scale(1.05)',
                            },
                        }}
                        className={`${selectedTool === 'Process Monitor' ? 'text-theme-text' : 'hover:text-theme-text'}`}
                        onClick={() => setSelectedTool('Process Monitor')}
                    >
                        <ListItemIcon>
                            <MonitorIcon /> {/* Import MonitorIcon from @mui/icons-material */}
                        </ListItemIcon>
                        <ListItemText
                            primary={<span style={{ fontWeight: 'bold' }}>Process Monitor</span>}
                        />
                    </ListItemButton>

                    <ListItemButton
                        sx={{
                            borderRadius: '8px',
                            margin: '0.4rem',
                            padding: '8px',
                            transition: 'all 0.3s ease-in-out',
                            bgcolor: selectedTool === 'Process Monitor' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                            transform: selectedTool === 'Process Monitor' ? 'scale(1.05)' : 'none',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                transform: 'scale(1.05)',
                            },
                        }}
                        className={`${selectedTool === 'Email Breach' ? 'text-theme-text' : 'hover:text-theme-text'}`}
                        onClick={() => setSelectedTool('Email Breach')}
                    >
                        <ListItemIcon>
                            <MarkEmailUnreadIcon /> {/* Import MarkEmailUnreadIcon from @mui/icons-material */}
                        </ListItemIcon>
                        <ListItemText
                            primary={<span style={{ fontWeight: 'bold' }}>Email Breach</span>}
                        />
                    </ListItemButton>

                    {/* Collapsible More Tools Section */}
                    <ListItemButton
                        onClick={handleClick}
                        sx={{
                            borderRadius: '8px',
                            margin: '0.4rem',
                            padding: '8px',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                transform: 'scale(1.05)',
                            },
                        }}
                        className="hover:text-theme-text" // Use theme-text class for hover
                    >
                        <ListItemIcon>
                            <BuildIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={<span style={{ fontWeight: 'bold' }}>More Tools</span>}
                        />
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    {/* Nested Tools inside Collapsible List */}
                    <Collapse in={open} timeout="auto">
                        <List component="div" disablePadding>
                            <ListItemButton
                                sx={{
                                    pl: 4,
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease-in-out',
                                    bgcolor: selectedTool === 'Another Tool' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                                    transform: selectedTool === 'Another Tool' ? 'scale(1.05)' : 'none',
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                                        transform: 'scale(1.05)',
                                    },
                                }}
                                className={`${selectedTool === 'Another Tool' ? 'text-theme-text' : 'hover:text-theme-text'
                                    }`}
                                onClick={() => setSelectedTool('Another Tool')}
                            >
                                <ListItemIcon>
                                    <StarBorder />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<span style={{ fontWeight: 'bold' }}>Another Tool</span>}
                                />
                            </ListItemButton>

                            <ListItemButton
                                sx={{
                                    pl: 4,
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease-in-out',
                                    bgcolor: selectedTool === 'Another Tool 2' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                                    transform: selectedTool === 'Another Tool 2' ? 'scale(1.05)' : 'none',
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                                        transform: 'scale(1.05)',
                                    },
                                }}
                                className={`${selectedTool === 'Another Tool 2' ? 'text-theme-text' : 'hover:text-theme-text'
                                    }`}
                                onClick={() => setSelectedTool('Another Tool 2')}
                            >
                                <ListItemIcon>
                                    <StarBorder />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<span style={{ fontWeight: 'bold' }}>Another Tool 2</span>}
                                />
                            </ListItemButton>
                        </List>
                    </Collapse>
                </List>
            </div>

            {/* Main Content */}
            <div className="col-span-3 flex justify-center items-center bg-theme-primary-transparent p-4 rounded-md overflow-y-scroll">
                {renderContent()}
            </div>
        </div>
    );
};

export default Tools;
