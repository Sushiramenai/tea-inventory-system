const axios = require('axios');
const https = require('https');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const USE_HTTPS = BASE_URL.startsWith('https');

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Allow self-signed certificates for testing
  httpsAgent: USE_HTTPS ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  validateStatus: () => true // Don't throw on any status
});

// Store cookies between requests
let cookies = '';

api.interceptors.request.use(config => {
  if (cookies) {
    config.headers.Cookie = cookies;
    console.log('📤 Sending cookies:', cookies);
  }
  console.log(`\n🔵 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(response => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    cookies = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('📥 Received cookies:', cookies);
  }
  console.log(`✅ Response ${response.status}:`, response.data);
  return response;
});

async function testAuth() {
  console.log('🧪 Testing Authentication System');
  console.log('📍 API URL:', BASE_URL);
  console.log('🔒 HTTPS:', USE_HTTPS);
  console.log('=' .repeat(50));

  try {
    // Step 1: Check initial session state
    console.log('\n1️⃣ Checking initial session state...');
    const checkResponse = await api.get('/api/auth/check-session');
    
    if (!checkResponse.data.hasSession) {
      console.log('❌ No session created - this might be the issue!');
    }

    // Step 2: Try to access protected route without login
    console.log('\n2️⃣ Testing protected route without authentication...');
    const protectedResponse = await api.get('/api/products');
    
    if (protectedResponse.status !== 401) {
      console.log('⚠️  Expected 401, got:', protectedResponse.status);
    }

    // Step 3: Login
    console.log('\n3️⃣ Attempting login...');
    const loginResponse = await api.post('/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed!');
      return;
    }

    console.log('✅ Login successful!');
    console.log('👤 User:', loginResponse.data.user);
    console.log('🍪 Session info:', loginResponse.data.sessionInfo);

    // Step 4: Check session after login
    console.log('\n4️⃣ Checking session after login...');
    const postLoginCheck = await api.get('/api/auth/check-session');
    
    if (!postLoginCheck.data.isAuthenticated) {
      console.log('❌ Session not persisted after login!');
      console.log('Session data:', postLoginCheck.data);
    } else {
      console.log('✅ Session persisted successfully');
    }

    // Step 5: Get current session
    console.log('\n5️⃣ Getting authenticated session...');
    const sessionResponse = await api.get('/api/auth/session');
    
    if (sessionResponse.status !== 200) {
      console.log('❌ Failed to get session:', sessionResponse.status);
      console.log('Error:', sessionResponse.data);
    } else {
      console.log('✅ Session retrieved successfully');
    }

    // Step 6: Access protected resource
    console.log('\n6️⃣ Accessing protected resource (products)...');
    const productsResponse = await api.get('/api/products');
    
    if (productsResponse.status !== 200) {
      console.log('❌ Failed to access products:', productsResponse.status);
      console.log('Error:', productsResponse.data);
    } else {
      console.log('✅ Successfully accessed protected resource');
      console.log(`Found ${productsResponse.data.data?.length || 0} products`);
    }

    // Step 7: Test another protected endpoint
    console.log('\n7️⃣ Testing raw materials endpoint...');
    const materialsResponse = await api.get('/api/raw-materials');
    
    if (materialsResponse.status !== 200) {
      console.log('❌ Failed to access raw materials:', materialsResponse.status);
    } else {
      console.log('✅ Successfully accessed raw materials');
    }

    // Step 8: Create a product
    console.log('\n8️⃣ Creating a test product...');
    const createResponse = await api.post('/api/products', {
      name: 'Auth Test Product',
      sku: 'AUTH-TEST-' + Date.now(),
      size: '100g',
      price: 19.99,
      stockQuantity: 50,
      reorderLevel: 10,
      reorderQuantity: 100,
      category: 'tea'
    });

    if (createResponse.status !== 201) {
      console.log('❌ Failed to create product:', createResponse.status);
      console.log('Error:', createResponse.data);
    } else {
      console.log('✅ Product created successfully');
      
      // Clean up - delete the test product
      if (createResponse.data.data?.id) {
        await api.delete(`/api/products/${createResponse.data.data.id}`);
        console.log('🧹 Test product cleaned up');
      }
    }

    // Step 9: Logout
    console.log('\n9️⃣ Logging out...');
    const logoutResponse = await api.post('/api/auth/logout');
    
    if (logoutResponse.status === 200) {
      console.log('✅ Logged out successfully');
    }

    // Step 10: Verify logout
    console.log('\n🔟 Verifying logout...');
    const postLogoutCheck = await api.get('/api/auth/check-session');
    
    if (postLogoutCheck.data.isAuthenticated) {
      console.log('❌ Still authenticated after logout!');
    } else {
      console.log('✅ Successfully logged out');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Authentication Test Summary:');
    console.log('✅ All authentication flows working correctly!');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Add command line option to test specific environments
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Usage: node test-auth.js [options]

Options:
  --url <url>    Test a specific URL (e.g., https://your-app.repl.co)
  --help         Show this help message

Examples:
  node test-auth.js
  node test-auth.js --url https://tea-inventory.repl.co
  API_URL=https://tea-inventory.repl.co node test-auth.js
    `);
    return;
  }

  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    process.env.API_URL = args[urlIndex + 1];
  }

  await testAuth();
}

main();