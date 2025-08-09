import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; // Replace with your Django backend URL

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
