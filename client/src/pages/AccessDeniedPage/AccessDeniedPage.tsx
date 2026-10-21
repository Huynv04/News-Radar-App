import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import './AccessDeniedPage.css';

export const AccessDeniedPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSwitchAccount = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <div className="access-denied-container">
            <div className="access-denied-card">
                <div className="access-denied-icon-wrap">
                    🛡️
                </div>

                <span className="access-denied-badge">403 FORBIDDEN</span>

                <h1 className="access-denied-title">Quyền Truy Cập Bị Từ Chối</h1>

                <p className="access-denied-desc">
                    Trang <strong>Quản Lý Nguồn Cào Tin</strong> chỉ dành riêng cho tài khoản có vai trò <strong>Quản trị viên (Admin)</strong>. Tài khoản hiện tại của bạn không có thẩm quyền truy cập vào phân hệ này.
                </p>

                {/* Thông tin tài khoản hiện tại */}
                {user && (
                    <div className="current-user-box">
                        <div style={{ textAlign: 'left' }}>
                            <span className="current-user-name">{user.displayName}</span>
                            <span className="current-user-email">{user.email}</span>
                        </div>
                        <span className="current-user-role">Vai trò: {user.role || 'User'}</span>
                    </div>
                )}

                {/* 2 Lựa chọn hành động chuẩn UX */}
                <div className="access-denied-actions">
                    <button
                        type="button"
                        className="btn-back-feed"
                        onClick={() => navigate('/feed')}
                    >
                        📰 Quay Lại Bảng Tin
                    </button>

                    <button
                        type="button"
                        className="btn-switch-account"
                        onClick={handleSwitchAccount}
                    >
                        🔄 Đổi Tài Khoản Admin
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
