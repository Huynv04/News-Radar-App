import axios from 'axios';
import type { Article, ArticleFilterParams, CursorPagedResult } from '../types/article';

const API_BASE_URL = 'http://localhost:5275/api';

export const articleApi = {
    getArticles: async (params: ArticleFilterParams): Promise<CursorPagedResult<Article>> => {
        const response = await axios.get<CursorPagedResult<Article>>(`${API_BASE_URL}/articles`, {
            params,
        });
        return response.data;
    },
};