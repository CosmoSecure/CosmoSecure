import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LineChart } from '@mui/x-charts/LineChart';
import { InnerLoader } from '../../themes/';

interface ProcessStats {
    cpu: number;
    memory_kb: number;
    memory_percentage: number;
    pid: number;
    uptime_sec: number;
    status: string;
    timestamp?: number;
}

const MAX_DATA_POINTS = 20;
const TEST_MODE = false; // Set to false in production

const ProcessCapture: React.FC = () => {
    const [stats, setStats] = useState<ProcessStats | null>(null);
    const [chartData, setChartData] = useState<ProcessStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            if (TEST_MODE) {
                // Simulate loading delay
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            const data = await invoke<ProcessStats>('get_system_and_process_usage');
            const newData = {
                ...data,
                timestamp: Date.now()
            };
            setStats(newData);
            setChartData(prev => {
                const updated = [...prev, newData].slice(-MAX_DATA_POINTS);
                return updated;
            });
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchStats();

        // Set up interval for updates
        const intervalId = setInterval(fetchStats, 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [fetchStats]);

    const formatChartData = (data: ProcessStats[]) => {
        return {
            xAxis: data.map(item => new Date(item.timestamp!).getTime()),
            cpu: data.map(item => item.cpu),
            memory: data.map(item => item.memory_percentage)
        };
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <InnerLoader />
            </div>
        );
    }
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
    if (!stats) return null;

    return (
        <div className="w-full h-full p-4 pb-4 bg-transparent">
            <h2 className="text-2xl font-bold mb-4 text-theme-accent">Process Stats</h2>

            {/* Charts Section */}
            <div className="mb-6 grid grid-cols-1 gap-4">
                <div className="h-72 bg-theme-secondary-transparent p-4 rounded-lg shadow-sm">
                    <h3 className="text-base font-semibold mb-2 text-theme-text-transparent">CPU & Memory Usage</h3>
                    <LineChart
                        series={[
                            {
                                data: formatChartData(chartData).cpu,
                                label: 'CPU',
                                color: '#8884d8',
                                curve: 'monotoneX',
                            },
                            {
                                data: formatChartData(chartData).memory,
                                label: 'Memory',
                                color: '#82ca9d',
                                curve: 'monotoneX',
                            }
                        ]}
                        xAxis={[{
                            data: formatChartData(chartData).xAxis,
                            scaleType: 'time',
                            valueFormatter: (value) => new Date(value).toLocaleTimeString(),
                        }]}
                        height={250}
                        margin={{ top: 20, right: 30, bottom: 50, left: 40 }}
                        slotProps={{
                            legend: {
                                direction: 'row',
                                position: { vertical: 'top', horizontal: 'right' },
                                padding: 0,
                            }
                        }}
                        grid={{ vertical: false, horizontal: true }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-theme-background p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-theme-text-transparent">CPU Usage</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-theme-text-transparent">{stats.cpu.toFixed(1)}</span>
                            <span className="text-sm font-semibold text-theme-text-transparent">%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-theme-background p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-theme-text-transparent">Memory</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-theme-text-transparent">{(stats.memory_kb / 1024).toFixed(2)}</span>
                            <span className="text-sm font-semibold text-theme-text-transparent">MB</span>
                        </div>
                    </div>
                </div>

                <div className="bg-theme-background p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-theme-text-transparent">Memory Usage</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-theme-text-transparent">{stats.memory_percentage.toFixed(1)}</span>
                            <span className="text-sm font-semibold text-theme-text-transparent">%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-theme-background p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-theme-text-transparent">Process ID</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-theme-text-transparent">{stats.pid}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-theme-background p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-theme-text-transparent">Uptime</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-theme-text-transparent">{Math.floor(stats.uptime_sec / 60)}</span>
                            <span className="text-sm font-semibold text-theme-text-transparent">minutes</span>
                        </div>
                    </div>
                </div>

                <div className="bg-theme-background p-4 rounded-lg shadow-sm hover:shadow-lg transition-all transform hover:scale-105">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-theme-text-transparent">Status</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2lg font-bold text-theme-text-transparent capitalize">
                                {stats.status.toLowerCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessCapture;