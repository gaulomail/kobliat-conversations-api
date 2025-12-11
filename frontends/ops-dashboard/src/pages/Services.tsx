import { useEffect, useState } from 'react';
import {
    getServices,
    type ServiceHealth
} from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import Paper from '../components/Paper';
import Button from '../components/Button';
import {
    Server,
    Activity,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Info,
    Clock,
    Zap
} from 'lucide-react';

const Services = () => {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const servicesData = await getServices();
            setServices(servicesData);
        } catch (error) {
            console.error("Failed to fetch service data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50';
            case 'unhealthy': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50';
            case 'offline': return 'text-gray-500 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle size={20} className="text-emerald-500" />;
            case 'unhealthy': return <AlertTriangle size={20} className="text-amber-500" />;
            case 'offline': return <XCircle size={20} className="text-gray-500" />;
            default: return <Info size={20} />;
        }
    };

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const offlineCount = services.filter(s => s.status === 'offline').length;

    return (
        <DashboardLayout>
            {/* Hero Banner */}
            <div className="mb-8 bg-teal-600 dark:bg-teal-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Server size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Service Health Monitor</h1>
                                <p className="text-white/90 text-sm">Real-time monitoring of all microservices</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            variant="outlined"
                            className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Total Services</div>
                            <div className="text-3xl font-bold">{services.length}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Healthy</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                {healthyCount}
                                <CheckCircle size={20} className="text-green-300" />
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Unhealthy</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                {unhealthyCount}
                                <AlertTriangle size={20} className="text-amber-300" />
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Offline</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                {offlineCount}
                                <XCircle size={20} className="text-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center p-12 text-gray-400">Loading services...</div>
                ) : (
                    services.map((service) => (
                        <Paper key={service.key} className="relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                                {/* Status Line */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${service.status === 'healthy' ? 'bg-emerald-500' :
                                    service.status === 'unhealthy' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-700'
                                    }`}></div>

                                {/* Service Info */}
                                <div className="flex-1 pl-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStatusIcon(service.status)}
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{service.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(service.status)} flex items-center gap-1.5`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${service.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                                                service.status === 'unhealthy' ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'
                                                }`}></span>
                                            {service.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Server size={14} />
                                            <span>Port: <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">{service.port}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Activity size={14} />
                                            <span>Version: {service.version || 'unknown'}</span>
                                        </div>
                                        {service.response_time && (
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={14} />
                                                <span>Response: <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">{service.response_time}ms</span></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            <span className="text-xs">Checked: {new Date(service.last_checked).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    {service.error && (
                                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                            {service.error}
                                        </div>
                                    )}
                                </div>

                                {/* Service URL */}
                                <div className="text-right">
                                    <a
                                        href={`http://localhost:${service.port}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                                    >
                                        localhost:{service.port}
                                    </a>
                                </div>
                            </div>
                        </Paper>
                    ))
                )}
            </div>

            {/* Info Panel */}
            <Paper className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mt-6">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Service Health Monitoring</p>
                        <p className="text-xs">
                            Services are automatically checked every 30 seconds. Click "Refresh" to check immediately.
                            All services are running on localhost with their respective ports.
                        </p>
                    </div>
                </div>
            </Paper>
        </DashboardLayout>
    );
};

export default Services;
