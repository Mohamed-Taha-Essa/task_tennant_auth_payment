import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      
      login: (tokens) => set({
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        user: tokens.user,
      }),
      
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      
      // Add token refresh functionality
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          console.log('No refresh token available');
          return false;
        }

        try {
          console.log('Attempting to refresh access token...');
          const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: refreshToken
          });

          const newAccessToken = response.data.access;
          set({ accessToken: newAccessToken });
          console.log('Access token refreshed successfully');
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout the user
          get().logout();
          return false;
        }
      },

      // Check if token is expired and refresh if needed
      ensureValidToken: async () => {
        const { accessToken, refreshAccessToken } = get();
        
        if (!accessToken) {
          return false;
        }

        // Decode JWT to check expiration (basic check without verification)
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          // If token expires in less than 5 minutes, refresh it
          if (payload.exp - currentTime < 300) {
            console.log('Token expires soon, refreshing...');
            return await refreshAccessToken();
          }
          
          return true;
        } catch (error) {
          console.error('Error checking token expiration:', error);
          return await refreshAccessToken();
        }
      },
      
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      }
    }),
    {
      name: 'auth-storage', // name of the item in storage (must be unique)
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
