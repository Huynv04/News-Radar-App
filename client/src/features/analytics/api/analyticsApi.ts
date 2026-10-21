import apiClient from '../../../api/client';
import type { DashboardAnalytics } from '../types';

export const analyticsApi = {
    getDashboard: async (): Promise<DashboardAnalytics> => {
        const response = await apiClient.get<DashboardAnalytics>('/analytics/dashboard');
        return response.data;
    },

    reprocessArticles: async (): Promise<{ message: string; totalRemaining: number }> => {
        const response = await apiClient.post<{ message: string; totalRemaining: number }>('/analytics/reprocess');
        return response.data;
    },
};
