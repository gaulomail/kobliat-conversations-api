import React, { useState, useEffect, useCallback } from 'react';
import { FileText, AlertCircle, RefreshCw, Download } from 'lucide-react';
import Button from '../components/Button';
import DashboardLayout from '../layouts/DashboardLayout';

interface ServiceLog {
    service: string;
    port: number;
    logPath: string;
    color: string;
}

const services: ServiceLog[] = [
    { service: 'API Gateway', port: 8000, logPath: 'services/api-gateway/storage/logs/laravel.log', color: 'blue' },
    { service: 'Customer Service', port: 8001, logPath: 'services/customer-service/storage/logs/laravel.log', color: 'green' },
    { service: 'Conversation Service', port: 8002, logPath: 'services/conversation-service/storage/logs/laravel.log', color: 'purple' },
    { service: 'Messaging Service', port: 8003, logPath: 'services/messaging-service/storage/logs/laravel.log', color: 'yellow' },
    { service: 'Media Service', port: 8004, logPath: 'services/media-service/storage/logs/laravel.log', color: 'cyan' },
    { service: 'Inbound Gateway', port: 8005, logPath: 'services/inbound-gateway/storage/logs/laravel.log', color: 'red' },
    { service: 'Chat Simulator', port: 8006, logPath: 'services/chat-simulator/storage/logs/laravel.log', color: 'orange' },
];

const ServiceLogs: React.FC = () => {
    const [selectedService, setSelectedService] = useState<ServiceLog>(services[0]);
    const [logs, setLogs] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8000/api/v1/logs?path=${encodeURIComponent(selectedService.logPath)}`,
                {
                    headers: {
                        'X-API-Key': 'kobliat-secret-key'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }

            const data = await response.json();
            setLogs(data.logs || 'No logs available');
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs(`Failed to load logs for ${selectedService.service}.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure:\n1. The service is running\n2. The API Gateway is accessible\n3. Log files exist at: ${selectedService.logPath}`);
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

    const filteredLogs = logs.split('\n').filter(line => {
        if (filter === 'error') return line.includes('ERROR');
        if (filter === 'warning') return line.includes('WARNING');
        return true;
    }).join('\n');

    const downloadLogs = () => {
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedService.service.toLowerCase().replace(/\s+/g, '-')}-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Logs</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            View and monitor error logs from all microservices
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outlined"
                            startIcon={<RefreshCw className={autoRefresh ? 'animate-spin' : ''} />}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={downloadLogs}
                        >
                            Download
                        </Button>
                        <Button
                            startIcon={<RefreshCw />}
                            onClick={fetchLogs}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Service Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {services.map((service) => (
                        <button
                            key={service.service}
                            onClick={() => setSelectedService(service)}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedService.service === service.service
                                ? `border-${service.color}-500 bg-${service.color}-50 dark:bg-${service.color}-900/20`
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <FileText className={`w-6 h-6 ${selectedService.service === service.service
                                    ? `text-${service.color}-600 dark:text-${service.color}-400`
                                    : 'text-gray-400'
                                    }`} />
                                <div className="text-center">
                                    <div className={`text-sm font-medium ${selectedService.service === service.service
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {service.service}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                        :{service.port}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        All Logs
                    </button>
                    <button
                        onClick={() => setFilter('error')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'error'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Errors Only
                    </button>
                    <button
                        onClick={() => setFilter('warning')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'warning'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        Warnings Only
                    </button>
                </div>

                {/* Logs Display */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedService.service} Logs
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedService.logPath}
                            </span>
                        </div>
                    </div>

                    <div className="p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-[600px] overflow-y-auto">
                                {filteredLogs || 'No logs available'}
                            </pre>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">To view real-time logs:</p>
                                <code className="block bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-xs mt-2">
                                    tail -f {selectedService.logPath}
                                </code>
                                <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                    Or implement a backend endpoint to stream logs via WebSocket
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ServiceLogs;

