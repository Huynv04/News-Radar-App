import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { NewsFeedPage } from './pages/NewsFeedPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { CrawlerSourcesPage } from './pages/CrawlerSourcesPage';
import { AuthPage } from './pages/AuthPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { HotNewsToast } from './components/Toast/HotNewsToast';
import { SignalRProvider, useSignalR } from './providers/SignalRProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import './App.css';
import { ReadingHistoryPage } from './pages/ReadingHistoryPage';
import { AdminRoute } from './components/AdminRoute';
import { ArticleReaderModal } from './features/articles/components/ArticleReaderModal';
import { articleApi } from './features/articles/api/articleApi';
import type { Article } from './types/article';

function MainLayout() {
    const { status, latestHotNews, clearHotNews } = useSignalR();
    const { user, isAuthenticated, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // State lưu bài viết đang mở đọc nhanh từ tin nóng
    const [readingArticle, setReadingArticle] = useState<Article | null>(null);
    // Hàm xử lý khi click vào Toast Tin Nóng
    const handleHotNewsClick = async (articleId: string) => {
        try {
            clearHotNews(); // Đóng toast
            const article = await articleApi.getArticleById(articleId);
            if (article) {
                setReadingArticle(article); // Mở Modal đọc bài viết
            }
        } catch (err) {
            console.error('Không thể tải bài viết tin nóng:', err);
        }
    };

    const isAdmin = Boolean(isAuthenticated && user?.role?.toLowerCase() === 'admin');

    return (
        <div>
            {/* Top Enterprise Header */}
            <header className="top-navbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <NavLink to="/" className="brand-wrapper">
                        <div className="radar-icon-pulse">📡</div>
                        <h1 className="brand-title">
                            News Radar <span className="brand-badge">ENTERPRISE</span>
                        </h1>
                    </NavLink>

                    <nav className="nav-links">
                        <NavLink
                            to="/feed"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            📰 Bảng Tin
                        </NavLink>
                        <NavLink
                            to="/analytics"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            📊 Phân Tích &amp; NLP
                        </NavLink>
                        {/* Quản lý nguồn cào - Chỉ hiển thị cho Admin */}
                        {isAdmin && (
                            <NavLink
                                to="/sources"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                ⚙️ Quản Lý Nguồn Cào
                            </NavLink>
                        )}

                        {isAuthenticated && (
                            <>
                                <NavLink
                                    to="/bookmarks"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    🔖 Đã Lưu
                                </NavLink>
                                <NavLink
                                    to="/subscriptions"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    🔔 Theo Dõi
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>

                <div className="navbar-right">
                    <div className={`signalr-status-badge status-${status}`}>
                        <span className="status-dot"></span>
                        <span>
                            {status === 'connected' && 'Live Radar'}
                            {status === 'reconnecting' && 'Đang kết nối lại...'}
                            {status === 'disconnected' && 'Radar Offline'}
                        </span>
                    </div>

                    {/* ── Auth Area ─────────────────────────────────────────── */}
                    {isAuthenticated && user ? (
                        <div className="user-menu-wrapper">
                            <button
                                id="user-menu-trigger"
                                className="user-avatar-btn"
                                onClick={() => setShowUserMenu(v => !v)}
                            >
                                {user.avatarUrl
                                    ? <img src={user.avatarUrl} alt={user.displayName} className="user-avatar-img" />
                                    : <span className="user-avatar-initials">
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </span>
                                }
                                <span className="user-display-name">{user.displayName}</span>
                                {isAdmin && (
                                    <span style={{ fontSize: '10px', background: '#e11d48', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                        ADMIN
                                    </span>
                                )}
                                <span className="user-chevron">▾</span>
                            </button>

                            {showUserMenu && (
                                <div className="user-dropdown" onMouseLeave={() => setShowUserMenu(false)}>
                                    <div className="user-dropdown-header">
                                        <span className="user-email">{user.email}</span>
                                    </div>

                                    {isAdmin && (
                                        <NavLink
                                            to="/sources"
                                            className="user-dropdown-item"
                                            onClick={() => setShowUserMenu(false)}
                                            style={{ color: '#0284c7', fontWeight: 600 }}
                                        >
                                            ⚙️ Quản Lý Nguồn Cào
                                        </NavLink>
                                    )}

                                    <NavLink
                                        to="/bookmarks"
                                        className="user-dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        🔖 Bài viết đã lưu
                                    </NavLink>
                                    <NavLink
                                        to="/subscriptions"
                                        className="user-dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        🔔 Đăng ký theo dõi
                                    </NavLink>
                                    <NavLink
                                        to="/history"
                                        className="user-dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        🕒 Lịch Sử Đọc
                                    </NavLink>

                                    <div className="user-dropdown-divider" />
                                    <button
                                        id="user-logout-btn"
                                        className="user-dropdown-logout"
                                        onClick={() => { logout(); setShowUserMenu(false); }}
                                    >
                                        🚪 Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NavLink to="/auth" className="navbar-login-btn" id="navbar-login-btn">
                            🔑 Đăng nhập
                        </NavLink>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main>
                <Routes>
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    <Route path="/feed" element={<NewsFeedPage />} />
                    <Route path="/analytics" element={<AnalyticsDashboardPage />} />
                    <Route
                        path="/sources"
                        element={
                            <AdminRoute>
                                <CrawlerSourcesPage />
                            </AdminRoute>
                        }
                    />

                    <Route path="/auth" element={
                        isAuthenticated ? <Navigate to="/feed" replace /> : <AuthPage />
                    } />
                    <Route path="/bookmarks" element={
                        isAuthenticated ? <BookmarksPage /> : <Navigate to="/auth" replace />
                    } />
                    <Route path="/subscriptions" element={
                        isAuthenticated ? <SubscriptionsPage /> : <Navigate to="/auth" replace />
                    } />
                    <Route path="*" element={<Navigate to="/feed" replace />} />
                    <Route
                        path="/history"
                        element={isAuthenticated ? <ReadingHistoryPage /> : <Navigate to="/auth" replace />}
                    />

                </Routes>
            </main>

            {/* Global Real-time Hot News Notification */}
            <HotNewsToast
                item={latestHotNews}
                onClose={clearHotNews}
                onClickItem={handleHotNewsClick}
            />
            {/* Modal đọc nhanh toàn cục khi click vào thông báo Tin Nóng */}
            {readingArticle && (
                <ArticleReaderModal
                    article={readingArticle}
                    onClose={() => setReadingArticle(null)}
                />
            )}
        </div>
    );
}

export function App() {
    return (
        <AuthProvider>
            <SignalRProvider>
                <BrowserRouter>
                    <MainLayout />
                </BrowserRouter>
            </SignalRProvider>
        </AuthProvider>
    );
}

export default App;
