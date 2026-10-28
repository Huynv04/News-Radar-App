import apiClient from '../../../api/client';
import type { CrawlerSource, CreateCrawlerSourceDto, CrawlerLogDto } from '../types';


export const crawlerSourceApi = {
    getAll: async (): Promise<CrawlerSource[]> => {
        const response = await apiClient.get<CrawlerSource[]>('/crawler-sources');
        return response.data;
    },

    getById: async (id: string): Promise<CrawlerSource> => {
        const response = await apiClient.get<CrawlerSource>(`/crawler-sources/${id}`);
        return response.data;
    },

    create: async (data: CreateCrawlerSourceDto): Promise<CrawlerSource> => {
        const response = await apiClient.post<CrawlerSource>('/crawler-sources', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateCrawlerSourceDto>): Promise<CrawlerSource> => {
        const response = await apiClient.put<CrawlerSource>(`/crawler-sources/${id}`, data);
        return response.data;
    },

    toggleStatus: async (id: string, isActive: boolean): Promise<void> => {
        await apiClient.patch(`/crawler-sources/${id}/status?isActive=${isActive}`);
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/crawler-sources/${id}`);
    },
    // Trong object crawlerSourceApi:
    getLogs: async (sourceId?: string, limit = 50): Promise<CrawlerLogDto[]> => {
        const params = new URLSearchParams();
        if (sourceId) params.append('sourceId', sourceId);
        params.append('limit', limit.toString());
        const response = await apiClient.get<CrawlerLogDto[]>(`/crawler-sources/logs?${params.toString()}`);
        return response.data;
    },

    getHourlyStats: async (sourceId?: string): Promise<import('../types').CrawlerHourlyStatDto[]> => {
        const params = new URLSearchParams();
        if (sourceId) params.append('sourceId', sourceId);
        const response = await apiClient.get<import('../types').CrawlerHourlyStatDto[]>(`/crawler-sources/logs/hourly-stats?${params.toString()}`);
        return response.data;
    },
};
