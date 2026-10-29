import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

export interface HotNewsNotification {
    articleId: string;
    title: string;
    trendScore: number;
    sourceName: string;
    publishedAt?: string;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface SignalRContextValue {
    status: ConnectionStatus;
    latestHotNews: HotNewsNotification | null;
    clearHotNews: () => void;
    subscribe: <T>(eventName: string, handler: (data: T) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextValue | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [latestHotNews, setLatestHotNews] = useState<HotNewsNotification | null>(null);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectingRef = useRef<boolean>(false);

    useEffect(() => {
        // Tránh tạo nhiều connection trong React StrictMode
        if (connectionRef.current || isConnectingRef.current) return;

        const rawApi = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5275';
        const defaultHubUrl = rawApi.replace(/\/api\/?$/, '') + '/hubs/news';
        const hubUrl = import.meta.env.VITE_HUB_URL || defaultHubUrl;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
                accessTokenFactory: () => localStorage.getItem('accessToken') || '',
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = connection;
        isConnectingRef.current = true;

        connection.onreconnecting(() => setStatus('reconnecting'));
        connection.onreconnected(() => setStatus('connected'));
        connection.onclose(() => setStatus('disconnected'));

        // Lắng nghe sự kiện tin nóng mặc định
        connection.on('ReceiveHotNews', (data: HotNewsNotification) => {
            setLatestHotNews(data);
        });

        // Lắng nghe thông báo riêng từ khóa đã đăng ký
        connection.on('ReceiveKeywordAlert', (data: { keyword: string; articleTitle: string; sourceName: string }) => {
            alert(`🔔 [Từ khóa theo dõi: #${data.keyword}]\nNguồn: ${data.sourceName}\n${data.articleTitle}`);
        });
        // Lắng nghe cảnh báo Circuit Breaker từ hệ thống cào tin
        connection.on('ReceiveCrawlerAlert', (data: { sourceId: string; sourceName: string; consecutiveFailures: number; reason: string }) => {
            alert(`⚡ [CẢNH BÁO CIRCUIT BREAKER]\n${data.reason}\nVui lòng kiểm tra lại RSS URL trong trang Quản lý nguồn cào.`);
        });


        connection
            .start()
            .then(() => {
                setStatus('connected');
                isConnectingRef.current = false;
            })
            .catch((err) => {
                console.warn('[SignalR Connection Warning]:', err.message);
                setStatus('disconnected');
                isConnectingRef.current = false;
            });

        return () => {
            // Khi toàn bộ Provider unmount (app tắt) mới đóng connection
            if (connectionRef.current) {
                connectionRef.current.stop().catch(() => { });
                connectionRef.current = null;
                isConnectingRef.current = false;
            }
        };
    }, []);

    const clearHotNews = useCallback(() => {
        setLatestHotNews(null);
    }, []);

    // Pub/Sub: Cho phép bất kỳ feature nào subscribe vào event riêng
    const subscribe = useCallback(<T,>(eventName: string, handler: (data: T) => void) => {
        const conn = connectionRef.current;
        if (!conn) return () => { };

        conn.on(eventName, handler);
        return () => {
            conn.off(eventName, handler);
        };
    }, []);

    return (
        <SignalRContext.Provider value={{ status, latestHotNews, clearHotNews, subscribe }}>
            {children}
        </SignalRContext.Provider>
    );
};

export function useSignalR(): SignalRContextValue {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
}
