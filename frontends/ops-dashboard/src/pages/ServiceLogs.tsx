import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Download, Terminal, Search, Filter, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import DashboardLayout from '../layouts/DashboardLayout';

interface ServiceLog {
    key: string;
    service: string;
    port: number;
    color: string;
}

const services: ServiceLog[] = [
    { key: 'api-gateway', service: 'API Gateway', port: 8000, color: 'blue' },
    { key: 'customer-service', service: 'Customer Service', port: 8001, color: 'green' },
    { key: 'conversation-service', service: 'Conversation Service', port: 8002, color: 'purple' },
    { key: 'messaging-service', service: 'Messaging Service', port: 8003, color: 'yellow' },
    { key: 'media-service', service: 'Media Service', port: 8004, color: 'cyan' },
    { key: 'inbound-gateway', service: 'Inbound Gateway', port: 8005, color: 'red' },
    { key: 'chat-simulator', service: 'Chat Simulator', port: 8006, color: 'orange' },
];

interface LogEntry {
    id: number;
    raw: string;
    timestamp?: string;
    environment?: string;
    level?: string;
    message?: string;
    context?: any;
    isStackTrace?: boolean;
}

const parseLogLine = (line: string, index: number): LogEntry => {
    // Regex for Laravel logs: [2023-10-27 10:00:00] environment.LEVEL: Message verify
    const regex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] ([a-zA-Z0-9_]+)\.([A-Z]+): (.*)/;
    const match = line.match(regex);

    if (match) {
        return {
            id: index,
            raw: line,
            timestamp: match[1],
            environment: match[2],
            level: match[3],
            message: match[4],
            isStackTrace: false
        };
    }

    return {
        id: index,
        raw: line,
        isStackTrace: true, // Assuming lines without timestamp are stack traces or continuations
        message: line
    };
};

const LogRow = ({ entry, index }: { entry: LogEntry, index: number }) => {
    const getLevelColor = (level?: string) => {
        switch (level) {
            case 'ERROR': return 'text-red-500 font-bold';
            case 'CRITICAL':
            case 'EMERGENCY':
            case 'ALERT': return 'text-red-600 font-extrabold bg-red-500/10';
            case 'WARNING': return 'text-amber-500 font-semibold';
            case 'NOTICE': return 'text-blue-400';
            case 'INFO': return 'text-green-400';
            case 'DEBUG': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    if (entry.isStackTrace) {
        return (
            <div className={`flex gap-2 px-4 py-0.5 text-[11px] font-mono text-gray-500 leading-tight group ${index % 2 === 0 ? 'bg-white/[0.02]' : 'transparent'} hover:bg-white/5`}>
                <div className="w-40 shrink-0 border-r border-gray-800/50 mr-2"></div>
                <div className="flex-1 whitespace-pre-wrap break-all pl-28 opacity-80 group-hover:opacity-100 group-hover:text-gray-400 transition-opacity">
                    {entry.message}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-4 px-4 py-1.5 text-xs font-mono border-l-2 border-transparent hover:border-purple-500 transition-colors ${index % 2 === 0 ? 'bg-white/[0.02]' : 'transparent'} hover:bg-white/5`}>
            <div className="w-40 shrink-0 text-gray-500 select-none font-medium text-[11px] pt-0.5">
                {entry.timestamp}
            </div>

            <div className={`w-20 shrink-0 ${getLevelColor(entry.level)} pt-0.5`}>
                {entry.level}
            </div>

            <div className="flex-1 text-gray-300 break-words whitespace-pre-wrap leading-relaxed">
                {entry.message}
            </div>
        </div>
    );
};

const ServiceLogs: React.FC = () => {
    const [selectedService, setSelectedService] = useState<ServiceLog>(services[0]);
    const [logs, setLogs] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Data Table State
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8000/api/v1/service-logs/${selectedService.key}?lines=2000`,
                {
                    headers: {
                        'X-API-Key': 'kobliat-secret-key'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setLogs('Service log file not found. The service might not have generated any logs yet.');
                } else {
                    throw new Error(`Failed to fetch logs: ${response.statusText}`);
                }
                return;
            }

            const data = await response.json();
            setLogs(data.logs || 'No logs available');
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs(`[Error] Failed to load logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }, [selectedService]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, fetchLogs]);

    // Parse, Filter and Sort Logs
    const processedLogs = useMemo(() => {
        if (!logs) return [];

        const lines = logs.split('\n');
        // Parse
        let parsed = lines.map((line, i) => parseLogLine(line, i));

        // Filter
        parsed = parsed.filter(entry => {
            if (!entry.raw.trim()) return false;
            if (filter === 'error' && entry.level !== 'ERROR' && entry.level !== 'CRITICAL' && entry.level !== 'EMERGENCY' && !entry.isStackTrace) return false;
            if (filter === 'warning' && entry.level !== 'WARNING' && !entry.isStackTrace) return false;
            if (searchQuery && !entry.raw.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });

        // Sort (only by timestamp lines, assume stack traces follow their parent or simple order)
        // Since logs usually come time-ordered, reversing is enough for DESC.
        // But to be robust:
        if (sortOrder === 'asc') {
            // Default file order (usually ASC)
        } else {
            parsed.reverse();
        }

        return parsed;
    }, [logs, filter, searchQuery, sortOrder]);

    // Pagination
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedLogs.slice(start, start + itemsPerPage);
    }, [processedLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(processedLogs.length / itemsPerPage);

    const downloadLogs = () => {
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedService.key}-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const clearLogs = async () => {
        if (!window.confirm(`Are you sure you want to clear logs for ${selectedService.service}?`)) return;

        try {
            const response = await fetch(
                `http://localhost:8000/api/v1/service-logs/${selectedService.key}`,
                {
                    method: 'DELETE',
                    headers: { 'X-API-Key': 'kobliat-secret-key' }
                }
            );

            if (response.ok) {
                fetchLogs(); // Refresh
            } else {
                alert('Failed to clear logs');
            }
        } catch (error) {
            console.error('Error clearing logs:', error);
            alert('Error clearing logs');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Terminal className="text-purple-600" />
                            Service Logs
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
                            Real-time file stream monitoring with data table controls
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/50 w-48 transition-all focus:w-64"
                            />
                        </div>

                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                            {['all', 'error', 'warning'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => { setFilter(f as any); setCurrentPage(1); }}
                                    className={`px-3 py-1.5 capitalize text-xs font-medium rounded-md transition-all ${filter === f
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="outlined"
                            startIcon={<RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        >
                            {autoRefresh ? 'Live' : 'Poll'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={clearLogs}
                            className="bg-white dark:bg-gray-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                            title="Clear Logs"
                        >
                            <Trash2 size={16} />
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={downloadLogs}
                            className="bg-white dark:bg-gray-800"
                            title="Download Log File"
                        >
                            <Download size={16} />
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={fetchLogs}
                            disabled={loading}
                            className="bg-white dark:bg-gray-800"
                        >
                            <RefreshCw size={16} />
                        </Button>
                    </div>
                </div>

                {/* Service Selector (Pills) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 shrink-0">
                    {services.map((service) => (
                        <button
                            key={service.key}
                            onClick={() => { setSelectedService(service); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${selectedService.key === service.key
                                ? `border-${service.color}-500 bg-${service.color}-50 dark:bg-${service.color}-900/20 text-${service.color}-700 dark:text-${service.color}-300`
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full shrink-0 bg-${service.color}-500`} />
                            <span className="text-xs font-bold truncate">{service.service}</span>
                        </button>
                    ))}
                </div>

                {/* Data Table Container */}
                <div className="flex-1 min-h-0 bg-[#1e1e1e] rounded-xl border border-gray-800 shadow-inner flex flex-col overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-[#2d2d2d] border-b border-gray-700 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider shrink-0 select-none">
                        <div
                            className="w-40 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            Timestamp
                            {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        </div>
                        <div className="w-20">Level</div>
                        <div className="flex-1">Message</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {loading && processedLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                                <RefreshCw className="animate-spin text-purple-500" size={32} />
                                <span className="font-mono text-sm">Initializing log stream...</span>
                            </div>
                        ) : processedLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[200px] text-gray-500 italic mt-20">
                                <Filter size={32} className="mb-2 opacity-50" />
                                No logs found matching criteria
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {paginatedLogs.map((entry, index) => (
                                    <LogRow key={entry.id} entry={entry} index={index} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Table Footer / Pagination */}
                    <div className="bg-[#252525] border-t border-gray-800 px-4 py-2 text-xs font-mono text-gray-400 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <span>{processedLogs.length} matching events</span>
                            <span className="text-gray-600">|</span>
                            <div className="flex items-center gap-2">
                                <span>Rows per page:</span>
                                <select
                                    className="bg-[#1e1e1e] border border-gray-700 rounded px-1 py-0.5 outline-none focus:border-purple-500 text-gray-300"
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="mr-2">
                                Page {currentPage} of {Math.max(1, totalPages)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ServiceLogs;
