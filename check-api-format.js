const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let cookies = '';
axiosInstance.interceptors.request.use(config => {
  if (cookies) config.headers.Cookie = cookies;
  return config;
});

axiosInstance.interceptors.response.use(response => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) cookies = setCookie.join('; ');
  return response;
});

async function checkFormats() {
  // Login first
  await axiosInstance.post('/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  console.log('Checking API response formats:\n');
  
  // Check raw materials format
  const materials = await axiosInstance.get('/raw-materials');
  console.log('Raw Materials Response Structure:');
  console.log('Type:', typeof materials.data);
  console.log('Is Array:', Array.isArray(materials.data));
  console.log('Keys:', Object.keys(materials.data));
  console.log('Sample:', JSON.stringify(materials.data, null, 2).substring(0, 200) + '...\n');
  
  // Check products format
  const products = await axiosInstance.get('/products');
  console.log('Products Response Structure:');
  console.log('Type:', typeof products.data);
  console.log('Is Array:', Array.isArray(products.data));
  console.log('Keys:', Object.keys(products.data));
  console.log('Sample:', JSON.stringify(products.data, null, 2).substring(0, 200) + '...\n');
}

checkFormats().catch(console.error);