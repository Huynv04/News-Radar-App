import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, UserProfile, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../features/auth';

// ── State & Actions ───────────────────────────────────────────────────────────

type AuthAction =
    | { type: 'LOGIN_SUCCESS'; payload: { user: UserProfile; accessToken: string; refreshToken: string } }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true, // true khi khởi động để hydrate từ localStorage
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                accessToken: action.payload.accessToken,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'LOGOUT':
            return { ...initialState, isLoading: false };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        default:
            return state;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    loginWithGitHub: (code: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Hydrate auth state từ localStorage khi app khởi động
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userJson = localStorage.getItem('authUser');
        if (token && userJson) {
            try {
                const user: UserProfile = JSON.parse(userJson);
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: token, refreshToken: '' } });
            } catch {
                dispatch({ type: 'LOGOUT' });
            }
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    // Lắng nghe sự kiện auth:logout từ api interceptor (khi refresh token fail)
    useEffect(() => {
        const handleForceLogout = () => {
            dispatch({ type: 'LOGOUT' });
        };
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, []);

    const persistAuth = (accessToken: string, refreshToken: string, user: UserProfile) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('authUser', JSON.stringify(user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken, refreshToken } });
    };

    const login = useCallback(async (data: LoginRequest) => {
        const res = await authApi.login(data);
        persistAuth(res.accessToken, res.refreshToken, res.user);
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        const res = await authApi.register(data);
        persistAuth(res.accessToken, res.refreshToken, res.user);
    }, []);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const res = await authApi.loginWithGoogle({ idToken });
        persistAuth(res.accessToken, res.refreshToken, res.user);
    }, []);

    const loginWithGitHub = useCallback(async (code: string) => {
        const res = await authApi.loginWithGitHub({ code });
        persistAuth(res.accessToken, res.refreshToken, res.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch { /* Ignore logout errors */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authUser');
        dispatch({ type: 'LOGOUT' });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, loginWithGitHub, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
