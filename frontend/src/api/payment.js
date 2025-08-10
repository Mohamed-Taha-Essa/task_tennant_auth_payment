import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:8000`,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('=== Payment API Request ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('=== Payment API Response (Success) ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    console.error('=== Payment API Response (Error) ===');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Request Headers:', error.config?.headers);
    console.error('Request Data:', error.config?.data);
    return Promise.reject(error);
  }
);

export const createCheckoutSession = (planId, token, mode = 'subscription') => {
  console.log('Creating checkout session with Plan ID:', planId);
  console.log('Payment Mode:', mode);
  console.log('Using Auth Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

  if (!planId) {
    throw new Error('Plan ID is required');
  }

  if (!token) {
    throw new Error('Authentication token is required');
  }

  if (!['subscription', 'payment'].includes(mode)) {
    throw new Error('Payment mode must be either "subscription" or "payment"');
  }

  return apiClient.post('/api/payment/create-checkout-session/', {
    plan_id: planId,
    mode: mode  // Add payment mode to request
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
