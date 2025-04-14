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
import { PasswordGenerator, ProcessCapture } from './tools';

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
            default:
                return (
                    <div className="flex flex-col justify-center items-center font-extrabold text-theme-text-transparent text-black">
                        <h1 className="text-2xl font-bold mb-4">Welcome to Tools</h1>
                        <p className="text-xl">Select a tool from the sidebar to get started.</p>
                        <p className="text-xl mt-4 italic">"Security is not a product, but a process." - Bruce Schneier</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-theme-background h-full p-8 grid grid-cols-4 gap-4 text-theme-accent">
            {/* Sidebar using Material-UI List */}
            <div className="col-span-1 bg-theme-primary-transparent p-4 rounded-md">
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

                    {/* Collapsible More Tools Section */}
                    <ListItemButton
                        onClick={handleClick}
                        sx={{
                            borderRadius: '8px',
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
                    <Collapse in={open} timeout="auto" unmountOnExit>
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
            <div className="col-span-3 flex justify-center items-center bg-theme-primary-transparent p-4 rounded-md">
                {renderContent()}
            </div>
        </div>
    );
};

export default Tools;
