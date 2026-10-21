import apiClient from '../../../api/client';
import type { BookmarkDto, AddBookmarkRequest } from '../types';

export const bookmarkApi = {
    getAll: async (): Promise<BookmarkDto[]> => {
        const res = await apiClient.get<BookmarkDto[]>('/bookmarks');
        return res.data;
    },

    add: async (data: AddBookmarkRequest): Promise<BookmarkDto> => {
        const res = await apiClient.post<BookmarkDto>('/bookmarks', data);
        return res.data;
    },

    remove: async (articleId: string): Promise<void> => {
        await apiClient.delete(`/bookmarks/${articleId}`);
    },

    isBookmarked: async (articleId: string): Promise<boolean> => {
        const res = await apiClient.get<{ isBookmarked: boolean }>(`/bookmarks/${articleId}/status`);
        return res.data.isBookmarked;
    },
};
