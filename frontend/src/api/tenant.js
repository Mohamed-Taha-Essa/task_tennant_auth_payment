import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; // Public endpoint for tenant creation

export const createTenant = (tenantData) => {
  console.log("=========",tenantData)
  const fullUrl = `${API_URL}/api/accounts/tenant-signup/`;
  return axios.post(fullUrl, tenantData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
