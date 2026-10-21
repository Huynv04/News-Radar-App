import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import './AuthPage.css';

type AuthMode = 'login' | 'register';
declare global { interface Window { google: any } }
export function AuthPage() {
    const { login, register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        // Kiểm tra SDK đã tải xong chưa
        if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response: { credential: string }) => {
                    try {
                        setIsLoading(true);
                        setError(null);
                        // response.credential chính là idToken mà backend cần
                        await loginWithGoogle(response.credential);
                        navigate('/feed', { replace: true });
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.');
                    } finally {
                        setIsLoading(false);
                    }
                },
            });

            // Vẽ nút đăng nhập chuẩn của Google vào một thẻ div (hoặc dùng Prompt)
            const googleBtnContainer = document.getElementById('google-signin-container');
            if (googleBtnContainer) {
                window.google.accounts.id.renderButton(googleBtnContainer, {
                    theme: 'filled_black',
                    size: 'large',
                    width: 320,
                    text: 'continue_with',
                    shape: 'pill',
                });
            }
        }
    }, [loginWithGoogle, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (mode === 'login') {
                await login({ email, password });
            } else {
                if (!displayName.trim()) { setError('Vui lòng nhập tên hiển thị.'); return; }
                if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
                await register({ displayName, email, password });
            }
            navigate('/feed', { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };


    const switchMode = () => {
        setMode(m => m === 'login' ? 'register' : 'login');
        setError(null);
        setDisplayName('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="auth-page">
            {/* Background animated gradient */}
            <div className="auth-bg">
                <div className="auth-bg-orb auth-bg-orb-1" />
                <div className="auth-bg-orb auth-bg-orb-2" />
                <div className="auth-bg-orb auth-bg-orb-3" />
            </div>

            <div className="auth-container">
                {/* Logo */}
                <div className="auth-brand">
                    <div className="auth-brand-icon">📡</div>
                    <div>
                        <h1 className="auth-brand-title">News Radar</h1>
                        <p className="auth-brand-sub">Enterprise Intelligence Platform</p>
                    </div>
                </div>

                {/* Card */}
                <div className="auth-card">
                    {/* Tabs */}
                    <div className="auth-tabs">
                        <button
                            id="auth-tab-login"
                            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => mode !== 'login' && switchMode()}
                        >
                            Đăng nhập
                        </button>
                        <button
                            id="auth-tab-register"
                            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => mode !== 'register' && switchMode()}
                        >
                            Đăng ký
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {mode === 'register' && (
                            <div className="auth-field">
                                <label htmlFor="auth-display-name">Tên hiển thị</label>
                                <input
                                    id="auth-display-name"
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        )}

                        <div className="auth-field">
                            <label htmlFor="auth-email">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="auth-password">Mật khẩu</label>
                            <div className="auth-password-wrapper">
                                <input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    id="auth-toggle-password"
                                    className="auth-eye-toggle"
                                    onClick={() => setShowPassword(v => !v)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            id="auth-submit-btn"
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="auth-spinner" />
                            ) : (
                                mode === 'login' ? '🔑 Đăng nhập' : '🚀 Tạo tài khoản'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="auth-divider">
                        <span>hoặc</span>
                    </div>

                    {/* Google OAuth2 */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                        <div id="google-signin-container"></div>
                    </div>

                    <p className="auth-switch-hint">
                        {mode === 'login'
                            ? 'Chưa có tài khoản? '
                            : 'Đã có tài khoản? '}
                        <button
                            id="auth-switch-mode"
                            type="button"
                            className="auth-switch-link"
                            onClick={switchMode}
                        >
                            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
