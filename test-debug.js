const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Cookie handling
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

async function debugTests() {
  // Login as admin
  await axiosInstance.post('/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  // Debug raw material creation
  console.log('Testing raw material creation...');
  try {
    const res = await axiosInstance.post('/raw-materials', {
      name: 'Debug Material',
      sku: `DEBUG-${Date.now()}`,
      unit: 'kg',
      unitCost: 10.00,
      stockQuantity: 100,
      reorderLevel: 20,
      reorderQuantity: 50,
      supplier: 'Debug Supplier',
      category: 'tea'
    });
    console.log('Success:', res.data);
  } catch (error) {
    console.log('Error:', error.response?.status, JSON.stringify(error.response?.data, null, 2));
  }

  // Debug production completion
  console.log('\nTesting production completion...');
  
  // Login as production
  await axiosInstance.post('/auth/login', {
    username: 'production',
    password: 'production123'
  });

  // Create a production request first
  const products = await axiosInstance.get('/products');
  const product = products.data.find(p => p.sku === 'PROD-GREEN-001');
  
  if (product) {
    console.log('Creating production request...');
    const createRes = await axiosInstance.post('/production-requests', {
      productId: product.id,
      quantityRequested: 2,
      priority: 'MEDIUM',
      notes: 'Debug test'
    });
    console.log('Created request:', createRes.data.id);
    
    // Now try to complete it
    try {
      const res = await axiosInstance.post(`/production-requests/${createRes.data.id}/complete`);
      console.log('Completion success:', res.data.status);
    } catch (error) {
      console.log('Completion error:', error.response?.status, JSON.stringify(error.response?.data, null, 2));
    }
  }

  // Test CORS on health endpoint
  console.log('\nTesting CORS headers...');
  const healthRes = await axios.get('http://localhost:3001/health');
  console.log('CORS headers:', {
    'access-control-allow-origin': healthRes.headers['access-control-allow-origin'],
    'access-control-allow-credentials': healthRes.headers['access-control-allow-credentials']
  });
}

debugTests().catch(console.error);