// Global authentication state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          
          if (response.success && response.data) {
            const { user, token } = response.data as any;
            
            // Store token in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_token', token);
            }
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: response.error || 'Login failed' };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed',
          };
        }
      },

      register: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          
          if (response.success && response.data) {
            const { user, token } = response.data as any;
            
            // Store token in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_token', token);
            }
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: response.error || 'Registration failed' };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          };
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        authApi.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        if (typeof window !== 'undefined' && token) {
          localStorage.setItem('auth_token', token);
        }
        set({ token });
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.me();
          
          if (response.success && response.data) {
            set({
              user: response.data as User,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token invalid, clear auth state
            get().logout();
            set({ isLoading: false });
          }
        } catch (error) {
          get().logout();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);
