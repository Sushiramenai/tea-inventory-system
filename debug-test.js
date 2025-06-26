const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'http://localhost:3001';

async function debugTest() {
  const jar = new CookieJar();
  const api = wrapper(axios.create({
    baseURL: BASE_URL,
    jar: jar,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  }));

  try {
    // Login
    console.log('1. Testing login...');
    const loginRes = await api.post('/api/auth/login', {
      username: 'admin@teacompany.com',
      password: 'admin123'
    });
    console.log('Login response:', loginRes.data);

    // Try to create a raw material
    console.log('\n2. Testing raw material creation...');
    const material = {
      itemName: 'Debug Test Material',
      category: 'tea',
      count: 100,
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 20
    };
    
    try {
      const createRes = await api.post('/api/raw-materials', material);
      console.log('Create response status:', createRes.status);
      console.log('Create response data:', createRes.data);
    } catch (error) {
      console.log('Create error:', error.response?.data || error.message);
    }

    // Try to get all materials
    console.log('\n3. Testing get all raw materials...');
    try {
      const getRes = await api.get('/api/raw-materials');
      console.log('Get response status:', getRes.status);
      console.log('Get response data type:', typeof getRes.data);
      console.log('Get response data keys:', Object.keys(getRes.data));
      console.log('Get response data:', getRes.data);
    } catch (error) {
      console.log('Get error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error);
  }
}

debugTest();