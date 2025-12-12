
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLogs, type ApiLog } from '../services/api';
import {
    RefreshCw, Search, Eye, X, Filter, ChevronLeft, ChevronRight,
    Calendar, Clock, CheckCircle, AlertTriangle, AlertCircle, AlertOctagon,
    Code, Copy
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import Paper from '../components/Paper';
import Button from '../components/Button';

const JsonDisplay = ({ data, title }: { data: unknown; title: string }) => {
    const parsedData = useMemo(() => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }
        return data;
    }, [data]);

    const isEmp = !parsedData || (typeof parsedData === 'object' && Object.keys(parsedData as object).length === 0);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isEmp) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy JSON'}
                </button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-inner">
                <div className="max-h-60 overflow-y-auto p-4 custom-scrollbar">
                    <pre className="text-xs font-mono text-emerald-400 break-all whitespace-pre-wrap">
                        {JSON.stringify(parsedData, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

// Quick Date Filters
const DATE_PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Last 24h', hours: 24 },
    { label: 'Last 7 Days', days: 7 },
];

function Logs() {
    // State
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState(''); // Unified search (path/method/status)
    const [filterMethod, setFilterMethod] = useState('');
    const [filterStatusType, setFilterStatusType] = useState<'all' | 'success' | 'error'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Modal Tabs
    const [modalTab, setModalTab] = useState<'overview' | 'payloads' | 'headers'>('overview');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getLogs({
                method: filterMethod || undefined,
                path: searchQuery || undefined, // Using search query as path filter for now
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setLogs(data.data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    }, [filterMethod, searchQuery, startDate, endDate]);

    // Initial Load & Auto Refresh
    useEffect(() => {
        fetchLogs();
        if (autoRefresh) {
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [fetchLogs, autoRefresh]);

    // Client-side Filtering (for status type mostly, since API supports exact status)
    const filteredLogs = useMemo(() => {
        let filtered = [...logs];

        if (filterStatusType === 'success') {
            filtered = filtered.filter(l => l.status_code >= 200 && l.status_code < 300);
        } else if (filterStatusType === 'error') {
            filtered = filtered.filter(l => l.status_code >= 400);
        }

        return filtered;
    }, [logs, filterStatusType]);

    // Pagination Logic
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    // Filter Handlers
    const applyDatePreset = (preset: typeof DATE_PRESETS[0]) => {
        const end = new Date();
        const start = new Date();

        if (preset.hours) {
            start.setHours(end.getHours() - preset.hours);
        } else {
            start.setDate(end.getDate() - (preset as any).days);
            start.setHours(0, 0, 0, 0); // Start of day
        }

        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterMethod('');
        setFilterStatusType('all');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    // Styling Helpers
    const getMethodBadge = (method: string) => {
        const styles: Record<string, string> = {
            GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            POST: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
            PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        };
        const defaultStyle = 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';

        return (
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${styles[method] || defaultStyle} `}>
                {method}
            </span>
        );
    };

    const getStatusBadge = (status: number) => {
        let color = 'text-gray-600 bg-gray-100 dark:bg-gray-800';
        let icon = null;

        if (status >= 200 && status < 300) {
            color = 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30';
            icon = <CheckCircle size={12} />;
        } else if (status >= 400 && status < 500) {
            color = 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
            icon = <AlertTriangle size={12} />;
        } else if (status >= 500) {
            color = 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
            icon = <AlertOctagon size={12} />;
        }

        return (
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color} `}>
                {icon}
                {status}
            </span>
        );
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-inner border border-white/10">
                            <Code size={32} className="text-purple-200" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">API Logs</h1>
                            <p className="text-purple-200 flex items-center gap-2">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Syncing...' : 'Live Monitoring'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`${autoRefresh ? 'bg-green-500 hover:bg-green-600 text-white border-transparent' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'} border shadow-lg backdrop-blur-sm transition-all`}
                            startIcon={<RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />}
                        >
                            {autoRefresh ? 'Auto-Refresh ON' : 'Refresh Now'}
                        </Button>
                    </div>
                </div>
            </div>

            <Paper className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm">

                {/* Advanced Filter Bar */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/30">
                    <div className="flex flex-col xl:flex-row gap-4 justify-between">

                        {/* Search & Method */}
                        <div className="flex flex-1 gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by endpoint path..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-1">
                                {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setFilterMethod(filterMethod === m ? '' : m)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMethod === m
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                                            } `}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status & Date */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-1">
                                {[
                                    { id: 'all', label: 'All', icon: null },
                                    { id: 'success', label: 'Success', icon: <CheckCircle size={12} /> },
                                    { id: 'error', label: 'Errors', icon: <AlertTriangle size={12} /> }
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setFilterStatusType(s.id as any)} // eslint-disable-line
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatusType === s.id
                                            ? 'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                                            } `}
                                    >
                                        {s.icon}
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden xl:block"></div>

                            <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-1 mr-2 hidden 2xl:flex">
                                {DATE_PRESETS.map((preset, i) => (
                                    <button
                                        key={i}
                                        onClick={() => applyDatePreset(preset)}
                                        className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 border-r last:border-0 border-gray-100 dark:border-slate-800"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-slate-950/30 border-b border-gray-100 dark:border-slate-800">
                            <tr>
                                {['Method', 'Status', 'Endpoints', 'Client IP', 'Duration', 'Timestamp', 'Context'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <RefreshCw className="animate-spin text-purple-500 mb-4" size={32} />
                                            <p className="text-gray-500 font-medium">Loading logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Filter size={48} className="mb-4 opacity-50" />
                                            <p className="text-lg font-medium text-gray-500">No logs found</p>
                                            <p className="text-sm">Try adjusting your filters or date range</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="group hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getMethodBadge(log.method)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(log.status_code)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs" title={log.path}>
                                                {log.path}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.ip_address || <span className="text-gray-400 italic">Unknown</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-mono font-medium ${log.duration_ms > 1000 ? 'text-amber-500' : 'text-gray-500'} `}>
                                                {log.duration_ms}ms
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="text-xs bg-transparent border-none text-gray-500 focus:ring-0 cursor-pointer"
                        >
                            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outlined"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outlined"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </Paper>

            {/* Enhanced Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div
                        className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-950/50">
                            <div className="flex items-center gap-4">
                                {getStatusBadge(selectedLog.status_code)}
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono truncate max-w-md">
                                    {selectedLog.method} {selectedLog.path}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-slate-800 px-6">
                            {['overview', 'payloads', 'headers'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setModalTab(tab as any)} // eslint-disable-line
                                    className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${modalTab === tab
                                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        } `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                            {modalTab === 'overview' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Details</h4>
                                            <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl space-y-3 border border-gray-100 dark:border-slate-800">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Method</span>
                                                    <span className="text-sm font-medium dark:text-gray-200">{selectedLog.method}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Duration</span>
                                                    <span className="text-sm font-medium dark:text-gray-200">{selectedLog.duration_ms}ms</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">IP Address</span>
                                                    <span className="text-sm font-medium dark:text-gray-200">{selectedLog.ip_address}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-500">Log ID</span>
                                                    <span className="text-xs font-mono text-gray-400">{selectedLog.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Timing</h4>
                                        <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <Calendar size={16} className="text-purple-400" />
                                                {new Date(selectedLog.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <Clock size={16} className="text-blue-400" />
                                                {new Date(selectedLog.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalTab === 'payloads' && (
                                <div className="space-y-6">
                                    <JsonDisplay title="Request Body" data={selectedLog.request_payload} />
                                    <JsonDisplay title="Response Body" data={selectedLog.response_payload} />
                                    {(!selectedLog.request_payload && !selectedLog.response_payload) && (
                                        <div className="text-center py-12 text-gray-400">
                                            <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                                            <p>No payload data available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalTab === 'headers' && (
                                <div className="space-y-6">
                                    <JsonDisplay title="Headers" data={selectedLog.headers} />
                                    {!selectedLog.headers && (
                                        <div className="text-center py-12 text-gray-400">
                                            <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                                            <p>No header data available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Logs;
