import apiClient from '../../../api/client';
import type {
    AuthResponse,
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    UserProfile,
} from '../types';

export const authApi = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const res = await apiClient.post<AuthResponse>('/auth/register', data);
        return res.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const res = await apiClient.post<AuthResponse>('/auth/login', data);
        return res.data;
    },

    loginWithGoogle: async (data: GoogleLoginRequest): Promise<AuthResponse> => {
        const res = await apiClient.post<AuthResponse>('/auth/google', data);
        return res.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    getProfile: async (): Promise<UserProfile> => {
        const res = await apiClient.get<UserProfile>('/auth/profile');
        return res.data;
    },
};
