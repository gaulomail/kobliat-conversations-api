import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLogs, type ApiLog } from '../services/api';
import { RefreshCw, Search, Eye, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import Paper from '../components/Paper';
import Button from '../components/Button';
import Input from '../components/Input';

function Logs() {
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
    const [filterMethod, setFilterMethod] = useState('');
    const [filterPath, setFilterPath] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getLogs({
                method: filterMethod || undefined,
                path: filterPath || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setLogs(data.data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    }, [filterMethod, filterPath, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Filter and paginate
    const filteredLogs = useMemo(() => {
        let filtered = [...logs];
        if (filterStatus) {
            const statusCode = parseInt(filterStatus);
            filtered = filtered.filter(log => log.status_code === statusCode);
        }
        return filtered;
    }, [logs, filterStatus]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterMethod, filterPath, filterStatus, startDate, endDate]);

    const clearFilters = () => {
        setFilterMethod('');
        setFilterPath('');
        setFilterStatus('');
        setStartDate('');
        setEndDate('');
    };

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
            {/* Hero Banner */}
            <div className="mb-8 bg-purple-600 dark:bg-purple-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Filter size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">API Request Logs</h1>
                                <p className="text-white/90 text-sm">Detailed logging and monitoring of all API requests</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outlined"
                                onClick={clearFilters}
                                className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm"
                            >
                                <X size={16} />
                                Clear
                            </Button>
                            <Button
                                onClick={fetchLogs}
                                disabled={loading}
                                className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Paper className="overflow-hidden">
                {/* Filters */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-800">
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
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
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
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
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
                        />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
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
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No logs found</td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(log.method)}`}>
                                                {log.method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300 max-w-md truncate">
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
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                            {log.ip_address || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-800">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option value="10">10 per page</option>
                                <option value="25">25 per page</option>
                                <option value="50">50 per page</option>
                                <option value="100">100 per page</option>
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
                        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="text-xl font-bold text-white">Request Details</h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Method</span>
                                    <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.method}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                                    <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.status_code}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
                                    <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.duration_ms}ms</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 uppercase">IP Address</span>
                                    <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-200">{selectedLog.ip_address || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Request Path</h4>
                                <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                                    <code className="text-sm text-emerald-400 font-mono">{selectedLog.path}</code>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                <strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Logs;
