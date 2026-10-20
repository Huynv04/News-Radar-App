import axios from 'axios';
import type { DashboardAnalytics } from '../types/analytics';

const API_BASE_URL = 'http://localhost:5275/api';

export const analyticsApi = {
    getDashboard: async (): Promise<DashboardAnalytics> => {
        const response = await axios.get<DashboardAnalytics>(`${API_BASE_URL}/analytics/dashboard`);
        return response.data;
    },
    reprocessArticles: async (): Promise<{ message: string; totalRemaining: number }> => {
        const response = await axios.post(`${API_BASE_URL}/analytics/reprocess`);
        return response.data;
    },
};