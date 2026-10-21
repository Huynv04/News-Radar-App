import apiClient from '../../../api/client';
import type { ReadingHistoryItem } from '../types/ReadingHistoryItem';

export const historyApi = {
    getAll: async (limit = 50): Promise<ReadingHistoryItem[]> => {
        const res = await apiClient.get<ReadingHistoryItem[]>(`/history?limit=${limit}`);
        return res.data;
    },

    record: async (articleId: string): Promise<void> => {
        await apiClient.post(`/history/${articleId}`);
    },

    clearAll: async (): Promise<void> => {
        await apiClient.delete('/history');
    },
};

