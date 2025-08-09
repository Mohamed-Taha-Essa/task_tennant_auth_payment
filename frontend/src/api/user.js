import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (zustand persist)
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        const token = authData?.state?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('API: Authentication failed, redirecting to login');
      // Token might be expired, let the calling component handle it
    }
    return Promise.reject(error);
  }
);

// Get user profile information
export const getUserProfile = () => {
  return apiClient.get('/api/accounts/profile/');
};

// Get user subscription information
export const getUserSubscription = () => {
  return apiClient.get('/subscriptions/api/subscription/');
};

// Update user profile
export const updateUserProfile = (data) => {
  return apiClient.put('/api/accounts/profile/edit-profile/', data);
};

// Test subscription creation (for debugging)
export const createTestSubscription = (planId) => {
  return apiClient.post('/api/payment/test-subscription/', {
    plan_id: planId
  });
}; 