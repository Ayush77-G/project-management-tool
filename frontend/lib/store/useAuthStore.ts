// frontend/lib/store/useAuthStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient, User } from '../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        login: async (token: string) => {
          set({ loading: true, error: null });
          try {
            const user = await apiClient.login(token);
            set({ 
              user, 
              isAuthenticated: true, 
              loading: false 
            });
          } catch (error: any) {
            set({ 
              error: error.message || 'Login failed', 
              loading: false,
              isAuthenticated: false,
              user: null
            });
          }
        },

        logout: () => {
          apiClient.logout();
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          });
        },

        fetchCurrentUser: async () => {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ loading: true, error: null });
          try {
            const user = await apiClient.getCurrentUser();
            set({ 
              user, 
              isAuthenticated: true, 
              loading: false 
            });
          } catch (error: any) {
            set({ 
              error: error.message, 
              loading: false,
              isAuthenticated: false,
              user: null
            });
            localStorage.removeItem('access_token');
          }
        },

        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null })
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated 
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
);