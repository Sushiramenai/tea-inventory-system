const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'http://localhost:3001';

// Helper to add delays between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function slowTest() {
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

  console.log('🧪 Starting Slow Test with Delays...\n');

  try {
    // Test 1: Login
    console.log('1. Testing Admin Login...');
    await delay(5000); // Wait 5 seconds
    
    const loginRes = await api.post('/api/auth/login', {
      username: 'admin@teacompany.com',
      password: 'admin123'
    });
    
    if (loginRes.status === 200 && loginRes.data.user) {
      console.log('✅ Login successful');
      console.log('   User:', loginRes.data.user.username);
      console.log('   Role:', loginRes.data.user.role);
    } else if (loginRes.status === 429) {
      console.log('❌ Rate limited. Waiting 60 seconds...');
      await delay(60000);
      return;
    } else {
      console.log('❌ Login failed:', loginRes.data);
    }

    // Test 2: Dashboard
    console.log('\n2. Testing Dashboard Access...');
    await delay(3000);
    
    const dashRes = await api.get('/api/dashboard/stats');
    if (dashRes.status === 200) {
      console.log('✅ Dashboard accessible');
      console.log('   Products:', dashRes.data.stats.products.total);
      console.log('   Raw Materials:', dashRes.data.stats.rawMaterials.total);
      console.log('   Low Stock Products:', dashRes.data.stats.products.lowStock);
    } else {
      console.log('❌ Dashboard failed:', dashRes.status);
    }

    // Test 3: Get Products
    console.log('\n3. Testing Products List...');
    await delay(3000);
    
    const prodRes = await api.get('/api/products');
    if (prodRes.status === 200 && prodRes.data.products) {
      console.log('✅ Products retrieved');
      console.log('   Total products:', prodRes.data.products.length);
      console.log('   Sample product:', prodRes.data.products[0]?.teaName);
    } else {
      console.log('❌ Products failed:', prodRes.status);
    }

    // Test 4: Get Raw Materials
    console.log('\n4. Testing Raw Materials List...');
    await delay(3000);
    
    const matRes = await api.get('/api/raw-materials');
    if (matRes.status === 200 && matRes.data.materials) {
      console.log('✅ Raw materials retrieved');
      console.log('   Total materials:', matRes.data.materials.length);
      console.log('   Low stock materials:', matRes.data.materials.filter(m => m.isLowStock).length);
    } else {
      console.log('❌ Raw materials failed:', matRes.status);
    }

    // Test 5: Production Manager Login
    console.log('\n5. Testing Production Manager Login...');
    await delay(5000);
    
    const prodLoginRes = await api.post('/api/auth/login', {
      username: 'production@teacompany.com',
      password: 'production123'
    });
    
    if (prodLoginRes.status === 200) {
      console.log('✅ Production manager login successful');
    } else {
      console.log('❌ Production login failed:', prodLoginRes.status);
    }

    // Test 6: Get Production Requests
    console.log('\n6. Testing Production Requests...');
    await delay(3000);
    
    const reqRes = await api.get('/api/production-requests');
    if (reqRes.status === 200 && reqRes.data.requests) {
      console.log('✅ Production requests retrieved');
      console.log('   Total requests:', reqRes.data.requests.length);
      const pending = reqRes.data.requests.filter(r => r.status === 'pending').length;
      console.log('   Pending requests:', pending);
    } else {
      console.log('❌ Production requests failed:', reqRes.status);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

// Run the test
slowTest();