const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Store cookies
let cookies = '';
axiosInstance.interceptors.request.use(config => {
  if (cookies) {
    config.headers.Cookie = cookies;
  }
  return config;
});

axiosInstance.interceptors.response.use(response => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    cookies = setCookie.join('; ');
  }
  return response;
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFinalSystem() {
  console.log('🧪 FINAL COMPREHENSIVE SYSTEM TEST\n');
  console.log('=' .repeat(50));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  async function runTest(name, testFn) {
    try {
      console.log(`\n📋 ${name}...`);
      await testFn();
      console.log('✅ PASSED');
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log('❌ FAILED:', error.response?.data || error.message);
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.response?.data || error.message });
    }
    await delay(500);
  }

  // Test 1: Health Check
  await runTest('Health Check', async () => {
    const res = await axios.get('http://localhost:3001/health');
    if (!res.data.status) throw new Error('No status in health response');
  });

  // Test 2: Admin Login
  await runTest('Admin Login', async () => {
    const res = await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    if (!res.data.user || !res.data.user.id) throw new Error('No user ID in login response');
  });

  // Test 3: Get Raw Materials
  await runTest('Get Raw Materials', async () => {
    const res = await axiosInstance.get('/raw-materials');
    console.log(`   Found ${res.data.length} materials`);
    if (!Array.isArray(res.data)) throw new Error('Raw materials not an array');
    if (res.data.length === 0) throw new Error('No raw materials found');
    
    // Check field names
    const material = res.data[0];
    const requiredFields = ['id', 'name', 'sku', 'unit', 'stockQuantity', 'unitCost'];
    for (const field of requiredFields) {
      if (!(field in material)) {
        throw new Error(`Missing field: ${field}`);
      }
    }
    console.log(`   ✓ All fields present: ${requiredFields.join(', ')}`);
  });

  // Test 4: Get Products  
  await runTest('Get Products', async () => {
    const res = await axiosInstance.get('/products');
    console.log(`   Found ${res.data.length} products`);
    if (!Array.isArray(res.data)) throw new Error('Products not an array');
    if (res.data.length === 0) throw new Error('No products found');
    
    // Check field names
    const product = res.data[0];
    const requiredFields = ['id', 'name', 'sku', 'size', 'price', 'stockQuantity'];
    for (const field of requiredFields) {
      if (!(field in product)) {
        throw new Error(`Missing field: ${field}`);
      }
    }
    console.log(`   ✓ All fields present: ${requiredFields.join(', ')}`);
  });

  // Test 5: Create Raw Material
  await runTest('Create Raw Material', async () => {
    const res = await axiosInstance.post('/raw-materials', {
      name: `Test Material ${Date.now()}`,
      sku: `TEST-${Date.now()}`,
      unit: 'kg',
      unitCost: 10.50,
      stockQuantity: 100,
      reorderLevel: 20,
      reorderQuantity: 50,
      supplier: 'Test Supplier'
    });
    if (!res.data.id) throw new Error('No ID in created material');
    console.log(`   Created: ${res.data.name} (${res.data.sku})`);
  });

  // Test 6: Create Product
  await runTest('Create Product', async () => {
    const res = await axiosInstance.post('/products', {
      name: `Test Product ${Date.now()}`,
      sku: `PROD-TEST-${Date.now()}`,
      size: '100g',
      price: 25.99,
      stockQuantity: 50,
      reorderLevel: 10,
      reorderQuantity: 30
    });
    if (!res.data.id) throw new Error('No ID in created product');
    console.log(`   Created: ${res.data.name} (${res.data.sku})`);
  });

  // Test 7: Get Dashboard Stats
  await runTest('Get Dashboard Stats', async () => {
    const res = await axiosInstance.get('/dashboard/stats');
    const stats = res.data;
    if (!stats.products || !stats.rawMaterials || !stats.productionRequests) {
      throw new Error('Missing dashboard sections');
    }
    console.log(`   Products: ${stats.products.total} (${stats.products.lowStock} low stock)`);
    console.log(`   Materials: ${stats.rawMaterials.total} (${stats.rawMaterials.lowStock} low stock)`);
    console.log(`   Requests: ${stats.productionRequests.pending} pending`);
  });

  // Test 8: Production Manager Login
  await runTest('Production Manager Login', async () => {
    const res = await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    if (!res.data.user || res.data.user.role !== 'production') {
      throw new Error('Invalid production login response');
    }
  });

  // Test 9: Create Production Request
  await runTest('Create Production Request', async () => {
    // First get a product with BOM
    const products = await axiosInstance.get('/products');
    const productWithBOM = products.data.find(p => p.sku === 'PROD-GREEN-001');
    
    if (!productWithBOM) {
      throw new Error('No product with BOM found');
    }

    const res = await axiosInstance.post('/production-requests', {
      productId: productWithBOM.id,
      quantityRequested: 5,
      priority: 'MEDIUM',
      notes: 'Test production request'
    });
    
    if (!res.data.id) throw new Error('No ID in production request');
    console.log(`   Created request for ${res.data.quantity} units of ${productWithBOM.name}`);
  });

  // Test 10: Get BOM for Product
  await runTest('Get Bill of Materials', async () => {
    const products = await axiosInstance.get('/products');
    const product = products.data.find(p => p.sku === 'PROD-GREEN-001');
    
    if (!product) throw new Error('Product not found');
    
    const res = await axiosInstance.get(`/bom/product/${product.id}`);
    if (!Array.isArray(res.data)) throw new Error('BOM not an array');
    
    console.log(`   Found ${res.data.length} materials in BOM`);
    res.data.forEach(item => {
      console.log(`   - ${item.rawMaterial.name}: ${item.quantityRequired} ${item.rawMaterial.unit}`);
    });
  });

  // Test 11: Fulfillment Manager Login
  await runTest('Fulfillment Manager Login', async () => {
    const res = await axiosInstance.post('/auth/login', {
      username: 'fulfillment', 
      password: 'fulfillment123'
    });
    if (!res.data.user || res.data.user.role !== 'fulfillment') {
      throw new Error('Invalid fulfillment login response');
    }
  });

  // Test 12: Low Stock Check
  await runTest('Check Low Stock Items', async () => {
    const res = await axiosInstance.get('/dashboard/low-stock');
    const { products, rawMaterials } = res.data;
    
    console.log(`   Low stock products: ${products.length}`);
    console.log(`   Low stock materials: ${rawMaterials.length}`);
    
    if (products.length > 0) {
      console.log(`   Example: ${products[0].name} - ${products[0].stockQuantity} remaining`);
    }
  });

  // Print Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📋 Total: ${results.tests.length}`);
  
  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`- ${t.name}: ${JSON.stringify(t.error)}`);
    });
  }

  console.log('\n🎯 OVERALL RESULT:', results.failed === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');
}

// Run the test
testFinalSystem().catch(console.error);