import axios from 'axios';
import { logout } from './auth';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'X-API-Key': 'kobliat-secret-key'
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export interface ApiLog {
    id: string;
    method: string;
    path: string;
    status_code: number;
    duration_ms: number;
    ip_address?: string;
    request_payload?: unknown;
    response_payload?: unknown;
    headers?: unknown;
    created_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface LogFilters {
    method?: string;
    path?: string;
    status?: string;
    page?: number;
    perPage?: number;
    startDate?: string;
    endDate?: string;
}

export const getLogs = async (filters: LogFilters = {}): Promise<PaginatedResponse<ApiLog>> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {};
    if (filters.method) params.method = filters.method;
    if (filters.path) params.path = filters.path;
    if (filters.status) params.status = filters.status;
    if (filters.page) params.page = filters.page;
    if (filters.perPage) params.per_page = filters.perPage;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;

    const response = await api.get('/logs', { params });
    // Laravel pagination returns the object directly
    return response.data;
};

export const getLogDetails = async (id: string) => {
    const response = await api.get(`/logs/${id}`);
    return response.data;
};

// Service Management
export interface ServiceHealth {
    name: string;
    key: string;
    status: 'healthy' | 'unhealthy' | 'offline';
    port: number;
    response_time?: number;
    version?: string;
    uptime?: string;
    error?: string;
    last_checked: string;
}

export interface ServiceHealthResponse {
    services: Record<string, ServiceHealth>;
    checked_at: string;
}

export const getServices = async (): Promise<ServiceHealth[]> => {
    const response = await api.get<ServiceHealthResponse>('/services/health');
    return Object.values(response.data.services);
};

export const getServiceHealth = async (serviceKey: string): Promise<ServiceHealth> => {
    const response = await api.get<ServiceHealth>(`/services/health/${serviceKey}`);
    return response.data;
};

// Legacy interfaces for backward compatibility
export interface ServiceStatus {
    id: string;
    name: string;
    status: string;
    uptime: string;
    version: string;
    cpu_usage: number;
    memory_usage: number;
}

export interface ServiceEvent {
    id: string;
    service_name: string;
    type: string;
    message: string;
    timestamp: string;
}

export const getServiceEvents = async (): Promise<ServiceEvent[]> => {
    // This would come from a real endpoint in production
    // For now, return empty array as we don't have event tracking yet
    return [];
};

export const startService = async (serviceKey: string): Promise<unknown> => {
    const response = await api.post(`/services/${serviceKey}/start`);
    return response.data;
};

export const stopService = async (serviceKey: string): Promise<unknown> => {
    const response = await api.post(`/services/${serviceKey}/stop`);
    return response.data;
};

export const restartService = async (serviceKey: string): Promise<unknown> => {
    const response = await api.post(`/services/${serviceKey}/restart`);
    return response.data;
};

// Media Service
export interface MediaFile {
    id: string;
    filename: string;
    mime_type: string;
    size: number;
    url: string;
    created_at: string;
}

export const uploadMedia = async (file: File, conversationId?: string): Promise<MediaFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner_service', 'ops-dashboard');
    if (conversationId) {
        formData.append('metadata', JSON.stringify({ conversation_id: conversationId }));
    }

    const response = await api.post('/media/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    // Transform response to match MediaFile interface
    const media = response.data;
    return {
        id: media.id,
        filename: media.filename,
        mime_type: media.content_type,
        size: media.size,
        url: `http://localhost:8000/api/v1/media/${media.id}`,
        created_at: media.created_at
    };
};
