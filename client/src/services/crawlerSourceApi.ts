import axios from 'axios';
import type { CrawlerSource, CreateCrawlerSourceDto } from '../types/crawlerSource';

const API_BASE_URL = 'http://localhost:5275/api/v1/crawler-sources';

export const crawlerSourceApi = {
    getAll: async (): Promise<CrawlerSource[]> => {
        const response = await axios.get<CrawlerSource[]>(API_BASE_URL);
        return response.data;
    },

    getById: async (id: string): Promise<CrawlerSource> => {
        const response = await axios.get<CrawlerSource>(`${API_BASE_URL}/${id}`);
        return response.data;
    },

    create: async (data: CreateCrawlerSourceDto): Promise<CrawlerSource> => {
        const response = await axios.post<CrawlerSource>(API_BASE_URL, data);
        return response.data;
    },

    update: async (id: string, data: CreateCrawlerSourceDto): Promise<void> => {
        await axios.put(`${API_BASE_URL}/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/${id}`);
    }
};