import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { AccessDeniedPage } from '../../pages/AccessDeniedPage';

interface AdminRouteProps {
    children: React.ReactElement;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    // 1. Khi đang nạp thông tin user từ localStorage -> Chưa render vội
    if (isLoading) {
        return null;
    }

    // 2. Nếu là Guest (Chưa đăng nhập) -> Chuyển hướng sang trang Đăng nhập
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // 3. Nếu đã đăng nhập nhưng KHÔNG PHẢI Admin -> Hiển thị trang 403 Forbidden
    if (user?.role?.toLowerCase() !== 'admin') {
        return <AccessDeniedPage />;
    }

    // 4. Đúng là Admin -> Cho phép truy cập vào trang
    return children;
};

export default AdminRoute;
