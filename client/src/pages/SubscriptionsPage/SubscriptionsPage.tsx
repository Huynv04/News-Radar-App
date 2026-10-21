import React, { useEffect, useState } from 'react';
import { subscriptionApi } from '../../features/subscriptions';
import type { SubscriptionDto, CreateSubscriptionRequest } from '../../types/auth';
import './SubscriptionsPage.css';

const SUGGESTED_KEYWORDS = [
    'AI', 'Công nghệ', 'Chứng khoán', 'Bitcoin', 'Bất động sản',
    'Bóng đá', 'Sức khỏe', 'Chính trị', 'Kinh tế', 'Khởi nghiệp',
];

const CATEGORIES = [
    'Thời sự', 'Công nghệ', 'Kinh tế', 'Thể thao', 'Giáo dục',
    'Sức khỏe', 'Giải trí', 'Quốc tế', 'Khoa học',
];

export function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [channel, setChannel] = useState<'InApp' | 'Email'>('InApp');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Toggle states
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await subscriptionApi.getAll();
            setSubscriptions(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách đăng ký.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!keyword.trim()) { setFormError('Vui lòng nhập từ khóa.'); return; }

        setIsSubmitting(true);
        try {
            const req: CreateSubscriptionRequest = {
                keyword: keyword.trim(),
                category: category || undefined,
                channel,
            };
            const newSub = await subscriptionApi.create(req);
            setSubscriptions(prev => [newSub, ...prev]);
            setKeyword('');
            setCategory('');
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Không thể tạo đăng ký.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (sub: SubscriptionDto) => {
        setTogglingId(sub.id);
        try {
            const updated = await subscriptionApi.update(sub.id, {
                keyword: sub.keyword,
                category: sub.category,
                channel: sub.channel,
                isActive: !sub.isActive,
            });
            setSubscriptions(prev => prev.map(s => s.id === sub.id ? updated : s));
        } catch (err) {
            console.error('Toggle subscription error:', err);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await subscriptionApi.delete(id);
            setSubscriptions(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Delete subscription error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const channelIcon = (ch: string) => ch === 'Email' ? '📧' : '🔔';

    return (
        <div className="subs-page">
            {/* Header */}
            <div className="subs-header">
                <div className="subs-header-icon">🔔</div>
                <div>
                    <h2 className="subs-title">Đăng Ký Theo Dõi Từ Khóa</h2>
                    <p className="subs-subtitle">
                        Nhận thông báo ngay khi có bài viết mới theo chủ đề bạn quan tâm
                    </p>
                </div>
            </div>

            {/* Create Form */}
            <div className="subs-form-card">
                <h3 className="subs-form-title">➕ Thêm đăng ký mới</h3>
                <form onSubmit={handleCreate} className="subs-form">
                    {/* Keyword */}
                    <div className="subs-field">
                        <label htmlFor="sub-keyword">Từ khóa quan tâm *</label>
                        <input
                            id="sub-keyword"
                            type="text"
                            placeholder="VD: AI, Bitcoin, Bóng đá..."
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            maxLength={100}
                        />
                        {/* Gợi ý từ khóa */}
                        <div className="subs-suggestions">
                            {SUGGESTED_KEYWORDS.map(kw => (
                                <button
                                    key={kw}
                                    id={`suggest-kw-${kw}`}
                                    type="button"
                                    className={`subs-suggest-chip ${keyword === kw ? 'active' : ''}`}
                                    onClick={() => setKeyword(kw)}
                                >
                                    {kw}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="subs-form-row">
                        {/* Category */}
                        <div className="subs-field">
                            <label htmlFor="sub-category">Danh mục (tùy chọn)</label>
                            <select
                                id="sub-category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="">-- Tất cả danh mục --</option>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Channel */}
                        <div className="subs-field">
                            <label>Kênh nhận thông báo</label>
                            <div className="subs-channel-btns">
                                <button
                                    id="sub-channel-inapp"
                                    type="button"
                                    className={`subs-channel-btn ${channel === 'InApp' ? 'active' : ''}`}
                                    onClick={() => setChannel('InApp')}
                                >
                                    🔔 In-App
                                </button>
                                <button
                                    id="sub-channel-email"
                                    type="button"
                                    className={`subs-channel-btn ${channel === 'Email' ? 'active' : ''}`}
                                    onClick={() => setChannel('Email')}
                                >
                                    📧 Email
                                </button>
                            </div>
                        </div>
                    </div>

                    {formError && (
                        <div className="subs-form-error">⚠️ {formError}</div>
                    )}

                    <button
                        id="sub-create-btn"
                        type="submit"
                        className="subs-create-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? <><span className="btn-spinner-white" /> Đang tạo...</>
                            : '✨ Tạo đăng ký'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="subs-list-section">
                <h3 className="subs-list-title">
                    📋 Danh sách đăng ký của bạn
                    <span className="subs-count">{subscriptions.length}</span>
                </h3>

                {isLoading && (
                    <div className="subs-loading">
                        {[...Array(2)].map((_, i) => <div key={i} className="subs-skeleton" />)}
                    </div>
                )}

                {error && <div className="subs-error">⚠️ {error}</div>}

                {!isLoading && !error && subscriptions.length === 0 && (
                    <div className="subs-empty">
                        <div className="subs-empty-icon">🔕</div>
                        <p>Chưa có đăng ký nào. Tạo đăng ký đầu tiên ngay!</p>
                    </div>
                )}

                <div className="subs-grid">
                    {subscriptions.map(sub => (
                        <div
                            key={sub.id}
                            className={`subs-card ${!sub.isActive ? 'inactive' : ''}`}
                        >
                            <div className="subs-card-header">
                                <div className="subs-card-info">
                                    <span className="subs-keyword">🔍 {sub.keyword}</span>
                                    {sub.category && (
                                        <span className="subs-category">{sub.category}</span>
                                    )}
                                </div>
                                <span className={`subs-channel-badge channel-${sub.channel.toLowerCase()}`}>
                                    {channelIcon(sub.channel)} {sub.channel}
                                </span>
                            </div>

                            <div className="subs-card-footer">
                                <div
                                    id={`sub-status-${sub.id}`}
                                    className={`subs-status ${sub.isActive ? 'active' : 'paused'}`}
                                >
                                    <span className="status-dot" />
                                    {sub.isActive ? 'Đang hoạt động' : 'Đã tạm dừng'}
                                </div>

                                <div className="subs-actions">
                                    <button
                                        id={`sub-toggle-${sub.id}`}
                                        className="subs-action-btn toggle-btn"
                                        onClick={() => handleToggleActive(sub)}
                                        disabled={togglingId === sub.id}
                                        title={sub.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                                    >
                                        {togglingId === sub.id
                                            ? <span className="btn-spinner-sm" />
                                            : sub.isActive ? '⏸' : '▶'}
                                    </button>
                                    <button
                                        id={`sub-delete-${sub.id}`}
                                        className="subs-action-btn delete-btn"
                                        onClick={() => handleDelete(sub.id)}
                                        disabled={deletingId === sub.id}
                                        title="Xóa đăng ký"
                                    >
                                        {deletingId === sub.id
                                            ? <span className="btn-spinner-sm" />
                                            : '🗑️'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
