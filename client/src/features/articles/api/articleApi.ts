import apiClient from '../../../api/client';
import type { Article, ArticleFilterParams, CursorPagedResult } from '../types';

export const articleApi = {
    getArticles: async (params: ArticleFilterParams): Promise<CursorPagedResult<Article>> => {
        const response = await apiClient.get<CursorPagedResult<Article>>('/articles', {
            params,
        });
        return response.data;
    },

    getArticleById: async (id: string): Promise<Article> => {
        const response = await apiClient.get<Article>(`/articles/${id}`);
        return response.data;
    },
    togglePin: async (id: string): Promise<{ isPinned: boolean; message: string }> => {
        const response = await apiClient.patch<{ isPinned: boolean; message: string }>(`/articles/${id}/pin`);
        return response.data;
    },
    overrideMetadata: async (id: string, data: { category?: string; sentimentLabel?: string }): Promise<Article> => {
        const response = await apiClient.patch<Article>(`/articles/${id}/override`, data);
        return response.data;
    },

};
