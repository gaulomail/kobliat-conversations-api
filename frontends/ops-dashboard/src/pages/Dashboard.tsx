import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLogs, type ApiLog } from '../services/api';
import { RefreshCw, Search, Eye, X, Activity, Server, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import DashboardLayout from '../layouts/DashboardLayout';
import Paper from '../components/Paper';
import Button from '../components/Button';
import Input from '../components/Input';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// Helper to format JSON safely
const formatJson = (data: unknown) => {
    try {
        if (typeof data === 'string') {
            // Check if it's already a JSON string (could be double encoded)
            const parsed = JSON.parse(data);
            return JSON.stringify(parsed, null, 2);
        }
        return JSON.stringify(data, null, 2);
    } catch {
        // If parsing fails or it's just a regular string, return as is or stringified
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }
};

function Dashboard() {
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
    const [filterMethod, setFilterMethod] = useState('');
    const [filterPath, setFilterPath] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [timeRange, setTimeRange] = useState<'1m' | '1h' | '2h' | '12h' | '1D' | '2D' | '3D'>('3D');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [channelStats, setChannelStats] = useState<any[]>([]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getLogs({
                method: filterMethod || undefined,
                path: filterPath || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                perPage: 2000 // Request plenty of logs for the graph
            });
            setLogs(data.data);

            // Fetch Channel Stats
            const statsRes = await fetch('http://localhost:8000/api/v1/stats/channels', {
                headers: { 'X-API-Key': 'kobliat-secret-key' }
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setChannelStats(statsData);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, [filterMethod, filterPath, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Filter logs based on all criteria
    const filteredLogs = useMemo(() => {
        let filtered = [...logs];

        // Filter by status code
        if (filterStatus) {
            const statusCode = parseInt(filterStatus);
            filtered = filtered.filter(log => log.status_code === statusCode);
        }

        return filtered;
    }, [logs, filterStatus]);

    // Paginate the filtered logs
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredLogs.slice(startIndex, endIndex);
    }, [filteredLogs, currentPage, itemsPerPage]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterMethod, filterPath, filterStatus, startDate, endDate]);

    // Clear all filters
    const clearFilters = () => {
        setFilterMethod('');
        setFilterPath('');
        setFilterStatus('');
        setStartDate('');
        setEndDate('');
    };

    // Prepare chart data
    const chartData = useMemo(() => {
        if (logs.length === 0) {
            return Array.from({ length: 10 }, (_, i) => ({
                time: `Day ${i + 1}`,
                count: 0
            }));
        }

        const cutoff = new Date();
        let intervalMs = 1000 * 60 * 60; // Default 1 hour

        // Configure Logic based on Range
        switch (timeRange) {
            case '1m':
                cutoff.setSeconds(cutoff.getSeconds() - 60);
                intervalMs = 1000 * 5; // 5 second intervals
                break;
            case '1h':
                cutoff.setHours(cutoff.getHours() - 1);
                intervalMs = 1000 * 60; // 1 minute intervals
                break;
            case '2h':
                cutoff.setHours(cutoff.getHours() - 2);
                intervalMs = 1000 * 60 * 5; // 5 minute intervals
                break;
            case '12h':
                cutoff.setHours(cutoff.getHours() - 12);
                intervalMs = 1000 * 60 * 15; // 15 minute intervals
                break;
            case '1D':
                cutoff.setHours(cutoff.getHours() - 24);
                intervalMs = 1000 * 60 * 30; // 30 minute intervals
                break;
            case '2D':
                cutoff.setHours(cutoff.getHours() - 48);
                intervalMs = 1000 * 60 * 60; // Hourly
                break;
            case '3D':
                cutoff.setHours(cutoff.getHours() - 72);
                intervalMs = 1000 * 60 * 60; // Hourly
                break;
        }

        const recentLogs = logs.filter(log => new Date(log.created_at) >= cutoff);

        // Group by rounded timestamp
        const grouped = recentLogs.reduce((acc, log) => {
            const date = new Date(log.created_at);
            // Round down to interval
            const roundedTime = Math.floor(date.getTime() / intervalMs) * intervalMs;

            acc[roundedTime] = (acc[roundedTime] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Sort and Format
        return Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([timestamp, count]) => {
                const date = new Date(Number(timestamp));
                let timeLabel = '';

                if (timeRange === '1m') {
                    // Show HH:MM:SS
                    timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                } else if (['1h', '2h', '12h', '1D'].includes(timeRange)) {
                    // Show HH:MM
                    timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    // Show MM/DD HH:MM
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hour = String(date.getHours()).padStart(2, '0');
                    timeLabel = `${month}/${day} ${hour}:00`;
                }

                return { time: timeLabel, count };
            });
    }, [logs, timeRange]);

    const errorCount = logs.filter(l => l.status_code >= 400).length;
    const avgDuration = logs.length > 0 ? (logs.reduce((sum, l) => sum + l.duration_ms, 0) / logs.length).toFixed(2) : '0';

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'POST': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'PUT': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
            case 'DELETE': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        if (status >= 400 && status < 500) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        if (status >= 500) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    };

    return (
        <DashboardLayout>
            {/* Welcome Banner */}
            <div className="mb-8 bg-indigo-600 dark:bg-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-24 -mb-24"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src="/kobliat-favicon.png"
                            alt="Kobliat Logo"
                            className="w-16 h-16 object-contain drop-shadow-2xl"
                        />
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Welcome to Kobliat Operations</h1>
                            <p className="text-white/90 text-sm">Monitor and manage your microservices platform in real-time</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-white/80 mb-1">System Status</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="font-semibold">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Requests" value={logs.length.toString()} icon={<Activity size={24} />} trend="+12.5%" />
                    <StatCard title="Active Services" value="7" icon={<Server size={24} />} trend="+2" />
                    <StatCard title="Error Rate" value={`${errorCount}`} icon={<AlertTriangle size={24} />} trend="-5.2%" />
                    <StatCard title="Avg Response" value={`${avgDuration}ms`} icon={<Clock size={24} />} trend="-8.1%" />
                </div>

                {/* Chart */}
                <Paper className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Request Activity</h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {timeRange === '1m' ? 'Live (Last Minute)' :
                                    timeRange === '1h' ? 'Last Hour (1min intervals)' :
                                        timeRange === '2h' ? 'Last 2 Hours (5min intervals)' :
                                            timeRange === '12h' ? 'Last 12 Hours (15min intervals)' :
                                                timeRange === '1D' ? 'Last 24 Hours (30min intervals)' :
                                                    timeRange === '2D' ? 'Last 48 Hours (Hourly)' : 'Last 72 Hours (Hourly)'}
                            </span>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                            {['1m', '1h', '2h', '12h', '1D', '2D', '3D'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range as any)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === range
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Paper>

                {/* Channel Stats */}
                <Paper className="p-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Channel Distribution</h2>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={channelStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {
                                        channelStats.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#ec4899', '#f59e0b', '#10b981'][index % 4]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Paper>

                {/* Logs Section */}
                <Paper className="overflow-hidden">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Recent Logs
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-xs text-gray-500 font-medium">{filteredLogs.length}</span>
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outlined"
                                    onClick={clearFilters}
                                    className="!text-sm"
                                >
                                    <X size={14} />
                                    Clear Filters
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={fetchLogs}
                                    startIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
                                >
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <Input
                                placeholder="Filter by Path..."
                                value={filterPath}
                                onChange={(e) => setFilterPath(e.target.value)}
                                startIcon={<Search size={16} />}
                                fullWidth
                            />
                            <select
                                value={filterMethod}
                                onChange={(e) => setFilterMethod(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            >
                                <option value="">All Methods</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            >
                                <option value="">All Status</option>
                                <option value="200">200 OK</option>
                                <option value="201">201 Created</option>
                                <option value="400">400 Bad Request</option>
                                <option value="401">401 Unauthorized</option>
                                <option value="404">404 Not Found</option>
                                <option value="500">500 Server Error</option>
                            </select>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                fullWidth
                                placeholder="Start Date"
                            />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                fullWidth
                                placeholder="End Date"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900/50 border-y border-gray-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Path</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : paginatedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No logs found</td>
                                    </tr>
                                ) : (
                                    paginatedLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(log.method)}`}>
                                                    {log.method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                {log.path}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(log.status_code)}`}>
                                                    {log.status_code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                {log.duration_ms.toFixed(2)}ms
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="5">5 per page</option>
                                    <option value="10">10 per page</option>
                                    <option value="25">25 per page</option>
                                    <option value="50">50 per page</option>
                                </select>
                                <Button
                                    variant="outlined"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="!px-3 !py-1.5"
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outlined"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="!px-3 !py-1.5"
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Paper>

                {/* Log Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Details</h3>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Method</span>
                                        <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.method}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                                        <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.status_code}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</span>
                                        <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</span>
                                        <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.duration_ms}ms</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Request Path</h4>
                                    <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                                        <code className="text-sm text-emerald-400 font-mono">{selectedLog.path}</code>
                                    </div>
                                </div>

                                {!!selectedLog.request_payload && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Request Body</h4>
                                        <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                                            <pre className="text-sm text-gray-300 font-mono">{formatJson(selectedLog.request_payload)}</pre>
                                        </div>
                                    </div>
                                )}

                                {!!selectedLog.response_payload && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Response Body</h4>
                                        <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                                            <pre className="text-sm text-gray-300 font-mono">{formatJson(selectedLog.response_payload)}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default Dashboard;
