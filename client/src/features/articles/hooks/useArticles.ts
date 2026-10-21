import { useState, useEffect, useCallback, useRef } from 'react';
import { articleApi } from '../api/articleApi';
import type { Article } from '../types';

export function useArticles() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    // Bộ lọc thời gian: 'all' | '24h' | '3d' | '7d' | 'custom'
    const [timeRange, setTimeRange] = useState<string>('all');
    const [customFromDate, setCustomFromDate] = useState<string>('');
    const [customToDate, setCustomToDate] = useState<string>('');

    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const nextCursorRef = useRef<{
        lastPublishedAt?: string;
        lastId?: string;
    }>({});

    const fetchArticles = useCallback(async (isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setError(null);
            }
            // Tính toán FromDate / ToDate dựa vào timeRange
            let fromDate: string | undefined = undefined;
            let toDate: string | undefined = undefined;

            const now = Date.now();
            if (timeRange === '24h') {
                fromDate = new Date(now - 24 * 60 * 60 * 1000).toISOString();
            } else if (timeRange === '3d') {
                fromDate = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
            } else if (timeRange === '7d') {
                fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
            } else if (timeRange === 'custom') {
                if (customFromDate) fromDate = new Date(`${customFromDate}T00:00:00Z`).toISOString();
                if (customToDate) toDate = new Date(`${customToDate}T23:59:59Z`).toISOString();
            }

            const params = {
                pageSize: 15,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                sentiment: selectedSentiment !== 'all' ? selectedSentiment : undefined,
                sourceId: selectedSource !== 'all' ? selectedSource : undefined,
                searchKeyword: searchKeyword.trim() ? searchKeyword.trim() : undefined,
                fromDate,
                toDate,
                lastPublishedAt: isLoadMore ? nextCursorRef.current.lastPublishedAt : undefined,
                lastId: isLoadMore ? nextCursorRef.current.lastId : undefined,
            };

            const data = await articleApi.getArticles(params);

            if (isLoadMore) {
                setArticles((prev) => [...prev, ...data.items]);
            } else {
                setArticles(data.items);
            }

            nextCursorRef.current = {
                lastPublishedAt: data.nextLastPublishedAt,
                lastId: data.nextLastId,
            };
            setHasNextPage(data.hasNextPage);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Lỗi không xác định khi tải danh sách bài viết';
            setError(message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [selectedCategory, selectedSentiment, selectedSource, searchKeyword, timeRange, customFromDate, customToDate]);


    useEffect(() => {
        fetchArticles(false);
    }, [selectedCategory, selectedSentiment, selectedSource, searchKeyword, timeRange, customFromDate, customToDate]);

    const refetch = useCallback(() => {
        fetchArticles(false);
    }, [fetchArticles]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasNextPage) {
            fetchArticles(true);
        }
    }, [loadingMore, hasNextPage, fetchArticles]);

    return {
        articles,
        loading,
        loadingMore,
        error,
        hasNextPage,
        selectedCategory,
        setSelectedCategory,
        selectedSentiment,
        setSelectedSentiment,
        selectedSource,
        setSelectedSource,
        searchKeyword,
        setSearchKeyword,
        refetch,
        loadMore,
        timeRange,
        setTimeRange,
        customFromDate,
        setCustomFromDate,
        customToDate,
        setCustomToDate,
    };
}
