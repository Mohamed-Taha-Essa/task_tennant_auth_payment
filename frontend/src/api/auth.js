import axios from 'axios';

const API_URL = `${window.location.protocol}//${window.location.hostname}:8000`; // Dynamically set API_URL

export const signUp = (userData) => {
  const fullUrl = `${API_URL}/api/accounts/signup/`;
  console.log(fullUrl);
  console.log(userData);
  return axios.post(fullUrl, userData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const login = (credentials) => {
  const fullUrl = `${API_URL}/api/accounts/login/`; // Standard Djoser/SimpleJWT endpoint
  console.log(fullUrl);
  console.log(credentials);
  return axios.post(fullUrl, credentials, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
