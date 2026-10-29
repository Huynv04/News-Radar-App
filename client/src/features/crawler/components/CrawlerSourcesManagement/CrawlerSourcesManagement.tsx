import React, { useState, useEffect, useCallback } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from 'recharts';
import { useCrawlerSources } from '../../hooks/useCrawlerSources';
import { crawlerSourceApi } from '../../api/crawlerSourceApi';
import type { CreateCrawlerSourceDto, CrawlerSource, CrawlerLogDto, CrawlerHourlyStatDto } from '../../types';
import { formatDate } from '../../../../utils';
import './CrawlerSourcesManagement.css';

export const CrawlerSourcesManagement: React.FC = () => {
    const { sources, loading, statusMsg, createSource, toggleStatus, deleteSource } = useCrawlerSources();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    // === STATE CHO MODAL XEM NHẬT KÝ (LOGS) ===
    const [logsModalSource, setLogsModalSource] = useState<CrawlerSource | null>(null);
    const [logs, setLogs] = useState<CrawlerLogDto[]>([]);
    const [logsLoading, setLogsLoading] = useState<boolean>(false);

    // === STATE CHO BIỂU ĐỒ GIÁM SÁT TIẾN TRÌNH CÀO TIN THEO GIỜ ===
    const [hourlyStats, setHourlyStats] = useState<CrawlerHourlyStatDto[]>([]);
    const [statsLoading, setStatsLoading] = useState<boolean>(false);

    const loadHourlyStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const data = await crawlerSourceApi.getHourlyStats();
            setHourlyStats(data);
        } catch (err) {
            console.error('Lỗi tải thống kê cào tin theo giờ:', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHourlyStats();
    }, [loadHourlyStats]);

    // Hàm mở modal và lấy 20 log gần nhất của nguồn
    const handleViewLogs = async (source: CrawlerSource) => {
        setLogsModalSource(source);
        setLogsLoading(true);
        try {
            const data = await crawlerSourceApi.getLogs(source.id, 20);
            setLogs(data);
        } catch (err) {
            console.error('Lỗi khi tải nhật ký cào tin:', err);
        } finally {
            setLogsLoading(false);
        }
    };
    const [formData, setFormData] = useState<CreateCrawlerSourceDto>({
        id: '',
        name: '',
        rssUrl: '',
        baseUrl: '',
        isActive: true,
        scanIntervalMinutes: 10,
        selectors: '{"content":"//article","sapo":"//h2[contains(@class,\'sapo\')]"}'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSource(formData);
            setIsModalOpen(false);
            setFormData({
                id: '',
                name: '',
                rssUrl: '',
                baseUrl: '',
                isActive: true,
                scanIntervalMinutes: 10,
                selectors: '{"content":"//article","sapo":"//h2[contains(@class,\'sapo\')]"}'
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
            alert(`Không thể thêm nguồn cào mới: ${msg}`);
        }
    };

    return (
        <div className="crawler-mgmt-container">
            <div className="crawler-mgmt-header">
                <div>
                    <h1 className="crawler-mgmt-title">
                        Quản Lý Nguồn Cào Tin Tức
                    </h1>
                    <p className="crawler-mgmt-subtitle">
                        Cấu hình RSS Feeds, chu kỳ thu thập nền và biểu thức XPath để bóc tách nội dung chi tiết
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-add-source"
                >
                    + Thêm Nguồn Cào Mới
                </button>
            </div>

            {statusMsg && (
                <div className="status-alert">
                    ℹ️ {statusMsg}
                </div>
            )}

            {/* Biểu đồ Giám Sát Tiến Trình Cào Tin Theo Giờ */}
            <div className="crawler-chart-card" style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                            📊 Giám Sát Tiến Trình Cào Tin Theo Giờ (24h qua)
                        </h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                            Biểu đồ theo dõi số lượng bài cào thành công, thất bại và tổng bài viết nạp mới theo từng giờ
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadHourlyStats}
                        disabled={statsLoading}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#334155' }}
                    >
                        {statsLoading ? '⏳ Đang nạp...' : '🔄 Làm mới'}
                    </button>
                </div>
                <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer>
                        <BarChart data={hourlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} interval={2} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="successCount" name="Quét thành công" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="failureCount" name="Quét lỗi" fill="#dc2626" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="totalArticlesInserted" name="Bài viết mới" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {loading ? (
                <div className="crawler-mgmt-loading">
                    <div className="loading-spinner"></div>
                    Đang tải danh sách nguồn tin...
                </div>
            ) : (
                <div className="crawler-table-card">
                    <table className="crawler-table">
                        <thead>
                            <tr>
                                <th>Tên Nguồn / ID</th>
                                <th>RSS Feed URL</th>
                                <th>Chu kỳ</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        Chưa có nguồn cào nào. Hãy nhấn "+ Thêm Nguồn Cào Mới" để bắt đầu.
                                    </td>
                                </tr>
                            ) : (
                                sources.map((source) => (
                                    <tr key={source.id}>
                                        <td>
                                            <div className="source-cell-name">{source.name}</div>
                                            <div className="source-cell-id">{source.id}</div>
                                        </td>
                                        <td className="source-cell-url">
                                            <a href={source.rssUrl} target="_blank" rel="noreferrer">
                                                {source.rssUrl}
                                            </a>
                                            <div className="source-cell-base">{source.baseUrl}</div>
                                        </td>
                                        <td style={{ color: '#334155', fontWeight: 600 }}>
                                            {source.scanIntervalMinutes} phút
                                        </td>
                                        {/* CỘT TRẠNG THÁI & HUY HIỆU CIRCUIT BREAKER */}
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStatus(source)}
                                                    className={`source-status-badge ${source.isActive ? 'source-status-active' : 'source-status-inactive'}`}
                                                    title="Nhấn để bật / tắt nguồn cào"
                                                >
                                                    <span>{source.isActive ? '● Đang chạy' : '○ Tạm dừng'}</span>
                                                </button>
                                                {/* Huy hiệu Circuit Breaker khi lỗi liên tiếp >= 5 */}
                                                {(source.consecutiveFailures ?? 0) >= 5 && (
                                                    <span className="badge-circuit-breaker" title="Hệ thống tự động ngắt mạch do 5 lần lỗi liên tiếp">
                                                        ⚡ Ngắt mạch ({source.consecutiveFailures}/5 lỗi)
                                                    </span>
                                                )}
                                                {/* Cảnh báo khi có lỗi nhưng chưa chạm ngưỡng 5 lần */}
                                                {(source.consecutiveFailures ?? 0) > 0 && (source.consecutiveFailures ?? 0) < 5 && (
                                                    <span className="badge-failure-warning" title="Số lần lỗi liên tiếp gần đây">
                                                        ⚠️ Lỗi: {source.consecutiveFailures}/5
                                                    </span>
                                                )}
                                                {/* Hiển thị lần quét gần nhất */}
                                                {source.lastScannedAt && (
                                                    <span className="source-last-scanned">
                                                        Quét: {formatDate(source.lastScannedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* CỘT THAO TÁC: THÊM NÚT "NHẬT KÝ" */}
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewLogs(source)}
                                                    className="btn-view-logs"
                                                    title="Xem lịch sử các lần cào tin của nguồn này"
                                                >
                                                    📜 Nhật ký
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteSource(source.id, source.name)}
                                                    className="btn-delete-source"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Form thêm nguồn */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Thêm Nguồn Cào Tin Mới
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="modal-close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div>
                                <label className="form-field-label">
                                    Mã định danh (ID)
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ví dụ: vnexpress-thoisu"
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="form-field-label">
                                    Tên nguồn báo
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ví dụ: VnExpress - Thời sự"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="form-field-label">
                                    RSS Feed URL
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://vnexpress.net/rss/thoi-su.rss"
                                    value={formData.rssUrl}
                                    onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="form-field-label">
                                    Base Website URL
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://vnexpress.net"
                                    value={formData.baseUrl}
                                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-field-label">
                                        Chu kỳ quét (phút)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1440"
                                        required
                                        value={formData.scanIntervalMinutes}
                                        onChange={(e) => setFormData({ ...formData, scanIntervalMinutes: Number(e.target.value) })}
                                        className="form-input"
                                    />
                                </div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        Kích hoạt ngay
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="form-field-label">
                                    XPath Selectors (JSON cấu hình bóc tách chi tiết)
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.selectors}
                                    onChange={(e) => setFormData({ ...formData, selectors: e.target.value })}
                                    className="form-textarea"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-modal-cancel"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-submit"
                                >
                                    Lưu nguồn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* === MODAL XEM NHẬT KÝ CÀO TIN (LOGS) === */}
            {logsModalSource && (
                <div className="modal-overlay" onClick={() => setLogsModalSource(null)}>
                    <div className="modal-content logs-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">📜 Nhật Ký Quét: {logsModalSource.name}</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                                    Mã nguồn: <code>{logsModalSource.id}</code> | Lỗi liên tiếp: {logsModalSource.consecutiveFailures ?? 0}
                                </p>
                            </div>
                            <button
                                onClick={() => setLogsModalSource(null)}
                                className="modal-close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="logs-modal-body">
                            {logsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                                    <div className="loading-spinner"></div>
                                    Đang tải lịch sử quét tin...
                                </div>
                            ) : logs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                    Chưa có nhật ký nào được ghi nhận cho nguồn này.
                                </div>
                            ) : (
                                <table className="logs-table">
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th>Trạng thái</th>
                                            <th style={{ textAlign: 'center' }}>Số bài RSS</th>
                                            <th style={{ textAlign: 'center' }}>Lưu mới</th>
                                            <th style={{ textAlign: 'center' }}>Thời lượng</th>
                                            <th>Ghi chú / Lỗi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                                                    {formatDate(log.scannedAt)}
                                                </td>
                                                <td>
                                                    {log.isSuccess ? (
                                                        <span className="log-badge-success">✅ Thành công</span>
                                                    ) : (
                                                        <span className="log-badge-fail">
                                                            ❌ Lỗi {log.httpStatusCode ? `(HTTP ${log.httpStatusCode})` : ''}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{log.articlesFound}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>
                                                    +{log.articlesInserted}
                                                </td>
                                                <td style={{ textAlign: 'center', color: '#64748b' }}>{log.durationMs} ms</td>
                                                <td className="log-error-cell">
                                                    {log.errorMessage ? (
                                                        <span className="log-error-text" title={log.errorMessage}>
                                                            {log.errorMessage}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8' }}>—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setLogsModalSource(null)}
                                className="modal-close-action-btn"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
