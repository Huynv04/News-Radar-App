// ── Auth Types ────────────────────────────────────────────────────────────────

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
}

export interface RegisterRequest {
    displayName: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface GoogleLoginRequest {
    idToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface AuthState {
    user: UserProfile | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
