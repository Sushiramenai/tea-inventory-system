const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'http://localhost:3001';

async function debugCreate() {
  const jar = new CookieJar();
  const api = wrapper(axios.create({
    baseURL: BASE_URL,
    jar: jar,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    },
    validateStatus: (status) => status < 500
  }));

  try {
    // Login
    console.log('1. Login...');
    const loginRes = await api.post('/api/auth/login', {
      username: 'admin@teacompany.com',
      password: 'admin123'
    });
    console.log('Login response:', JSON.stringify(loginRes.data, null, 2));

    // Create unique material
    const uniqueName = `Test Material ${Date.now()}`;
    console.log('\n2. Creating raw material:', uniqueName);
    const createRes = await api.post('/api/raw-materials', {
      itemName: uniqueName,
      category: 'tea',
      count: 50,
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 10
    });
    
    console.log('Create response status:', createRes.status);
    console.log('Create response data:', JSON.stringify(createRes.data, null, 2));

    // Check what the actual response structure is
    if (createRes.data.material) {
      console.log('\n✅ Material created with ID:', createRes.data.material.id);
    } else if (createRes.data.id) {
      console.log('\n✅ Material created with ID:', createRes.data.id);
    } else {
      console.log('\n❌ Unexpected response structure');
    }

    // Try to get all materials and see response structure
    console.log('\n3. Getting all materials...');
    const getRes = await api.get('/api/raw-materials');
    console.log('Get response status:', getRes.status);
    console.log('Response has materials array:', Array.isArray(getRes.data.materials));
    console.log('First material:', getRes.data.materials?.[0]);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugCreate();