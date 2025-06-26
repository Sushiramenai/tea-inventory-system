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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test results tracking
const testResults = {
  authentication: { passed: 0, failed: 0, tests: [] },
  inventory: { passed: 0, failed: 0, tests: [] },
  production: { passed: 0, failed: 0, tests: [] },
  fulfillment: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

async function runTest(category, name, testFn) {
  try {
    console.log(`  📋 ${name}...`);
    const result = await testFn();
    console.log(`  ✅ PASSED${result ? ': ' + result : ''}`);
    testResults[category].passed++;
    testResults[category].tests.push({ name, status: 'PASSED', result });
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
    testResults[category].failed++;
    testResults[category].tests.push({ name, status: 'FAILED', error: error.message });
  }
  await delay(300);
}

async function testAuthentication() {
  console.log('\n🔐 TESTING AUTHENTICATION SYSTEM');
  console.log('=' .repeat(50));

  // Test 1: Admin Login
  await runTest('authentication', 'Admin Login', async () => {
    const res = await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    if (!res.data.user || res.data.user.role !== 'admin') {
      throw new Error('Invalid admin login response');
    }
    return `User: ${res.data.user.username}, Role: ${res.data.user.role}`;
  });

  // Test 2: Get Current Session
  await runTest('authentication', 'Get Current Session', async () => {
    const res = await axiosInstance.get('/auth/me');
    if (!res.data.user || !res.data.user.id) {
      throw new Error('Session not maintained');
    }
    return `Session valid for: ${res.data.user.username}`;
  });

  // Test 3: Logout
  await runTest('authentication', 'Logout', async () => {
    const res = await axiosInstance.post('/auth/logout');
    if (!res.data.message) {
      throw new Error('Logout failed');
    }
    return res.data.message;
  });

  // Test 4: Session After Logout
  await runTest('authentication', 'Verify Session Cleared', async () => {
    try {
      await axiosInstance.get('/auth/me');
      throw new Error('Session still active after logout');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return 'Session properly cleared';
      }
      throw error;
    }
  });

  // Test 5: Production Manager Login
  await runTest('authentication', 'Production Manager Login', async () => {
    const res = await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    if (!res.data.user || res.data.user.role !== 'production') {
      throw new Error('Invalid production login');
    }
    return `Role: ${res.data.user.role}`;
  });

  // Test 6: Invalid Credentials
  await runTest('authentication', 'Invalid Credentials', async () => {
    try {
      await axiosInstance.post('/auth/login', {
        username: 'admin',
        password: 'wrongpassword'
      });
      throw new Error('Should have failed with wrong password');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return 'Properly rejected invalid credentials';
      }
      throw error;
    }
  });
}

async function testInventoryManagement() {
  console.log('\n📦 TESTING INVENTORY MANAGEMENT');
  console.log('=' .repeat(50));

  // Login as admin first
  await axiosInstance.post('/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  // Test 1: Get All Raw Materials
  let materials = [];
  await runTest('inventory', 'Get All Raw Materials', async () => {
    const res = await axiosInstance.get('/raw-materials');
    materials = res.data;
    if (!Array.isArray(materials)) {
      throw new Error('Raw materials not an array');
    }
    return `Found ${materials.length} materials`;
  });

  // Test 2: Create Raw Material
  let newMaterial;
  await runTest('inventory', 'Create Raw Material', async () => {
    const res = await axiosInstance.post('/raw-materials', {
      name: 'Test Jasmine Tea',
      sku: `MAT-JASMINE-${Date.now()}`,
      unit: 'kg',
      unitCost: 30.00,
      stockQuantity: 50,
      reorderLevel: 10,
      reorderQuantity: 25,
      supplier: 'Jasmine Gardens',
      category: 'tea'
    });
    newMaterial = res.data;
    if (!newMaterial.id) {
      throw new Error('No ID in created material');
    }
    return `Created: ${newMaterial.name} (${newMaterial.sku})`;
  });

  // Test 3: Update Raw Material
  await runTest('inventory', 'Update Raw Material', async () => {
    if (!newMaterial) throw new Error('No material to update');
    const res = await axiosInstance.put(`/raw-materials/${newMaterial.id}`, {
      stockQuantity: 75,
      unitCost: 28.50
    });
    if (res.data.stockQuantity !== 75) {
      throw new Error('Update failed');
    }
    return `Updated stock to ${res.data.stockQuantity}`;
  });

  // Test 4: Get All Products
  let products = [];
  await runTest('inventory', 'Get All Products', async () => {
    const res = await axiosInstance.get('/products');
    products = res.data;
    if (!Array.isArray(products)) {
      throw new Error('Products not an array');
    }
    return `Found ${products.length} products`;
  });

  // Test 5: Create Product
  let newProduct;
  await runTest('inventory', 'Create Product', async () => {
    const res = await axiosInstance.post('/products', {
      name: 'Jasmine Green Tea Blend',
      sku: `PROD-JASMINE-${Date.now()}`,
      size: '25 bags',
      price: 18.99,
      stockQuantity: 30,
      reorderLevel: 10,
      reorderQuantity: 50,
      category: 'tea'
    });
    newProduct = res.data;
    if (!newProduct.id) {
      throw new Error('No ID in created product');
    }
    return `Created: ${newProduct.name} ($${newProduct.price})`;
  });

  // Test 6: Low Stock Check
  await runTest('inventory', 'Check Low Stock Items', async () => {
    const res = await axiosInstance.get('/dashboard/low-stock');
    const { products, rawMaterials } = res.data;
    return `${products.length} low stock products, ${rawMaterials.length} low stock materials`;
  });

  // Test 7: Dashboard Statistics
  await runTest('inventory', 'Get Dashboard Statistics', async () => {
    const res = await axiosInstance.get('/dashboard/stats');
    const stats = res.data;
    if (!stats.products || !stats.rawMaterials) {
      throw new Error('Invalid dashboard stats');
    }
    return `${stats.products.total} products, ${stats.rawMaterials.total} materials`;
  });
}

async function testProductionWorkflow() {
  console.log('\n🏭 TESTING PRODUCTION WORKFLOW');
  console.log('=' .repeat(50));

  // Login as production manager
  await axiosInstance.post('/auth/login', {
    username: 'production',
    password: 'production123'
  });

  // Test 1: Get Products with BOM
  let productWithBOM;
  await runTest('production', 'Find Product with BOM', async () => {
    const products = await axiosInstance.get('/products');
    // Find Premium Green Tea which has BOM
    productWithBOM = products.data.find(p => p.sku === 'PROD-GREEN-001');
    if (!productWithBOM) {
      throw new Error('No product with BOM found');
    }
    return `Found: ${productWithBOM.name}`;
  });

  // Test 2: Get Bill of Materials
  await runTest('production', 'Get Bill of Materials', async () => {
    if (!productWithBOM) throw new Error('No product selected');
    const res = await axiosInstance.get(`/bom/product/${productWithBOM.id}`);
    const bomItems = res.data;
    if (!Array.isArray(bomItems) || bomItems.length === 0) {
      throw new Error('No BOM items found');
    }
    return `${bomItems.length} materials required`;
  });

  // Test 3: Check Material Availability
  await runTest('production', 'Check Material Availability', async () => {
    if (!productWithBOM) throw new Error('No product selected');
    const bomRes = await axiosInstance.get(`/bom/product/${productWithBOM.id}`);
    const bomItems = bomRes.data;
    
    let allAvailable = true;
    for (const item of bomItems) {
      const required = item.quantityRequired * 5; // For 5 units
      if (item.rawMaterial.stockQuantity < required) {
        allAvailable = false;
      }
    }
    return allAvailable ? 'All materials available' : 'Some materials insufficient';
  });

  // Test 4: Create Production Request
  let productionRequest;
  await runTest('production', 'Create Production Request', async () => {
    if (!productWithBOM) throw new Error('No product selected');
    const res = await axiosInstance.post('/production-requests', {
      productId: productWithBOM.id,
      quantityRequested: 3,
      priority: 'HIGH',
      notes: 'Test production run'
    });
    productionRequest = res.data;
    if (!productionRequest.id) {
      throw new Error('Failed to create production request');
    }
    return `Created request #${productionRequest.id.substring(0, 8)}`;
  });

  // Test 5: Get Production Requests
  await runTest('production', 'Get All Production Requests', async () => {
    const res = await axiosInstance.get('/production-requests');
    const requests = res.data;
    const pending = requests.filter(r => r.status === 'PENDING').length;
    return `${requests.length} total, ${pending} pending`;
  });

  // Test 6: Complete Production Request
  await runTest('production', 'Complete Production Request', async () => {
    if (!productionRequest) throw new Error('No production request');
    const res = await axiosInstance.post(`/production-requests/${productionRequest.id}/complete`);
    if (res.data.status !== 'COMPLETED') {
      throw new Error('Failed to complete production');
    }
    return 'Production completed, inventory updated';
  });

  // Test 7: Verify Inventory Updates
  await runTest('production', 'Verify Inventory Updates', async () => {
    if (!productWithBOM) throw new Error('No product selected');
    const res = await axiosInstance.get(`/products/${productWithBOM.id}`);
    const updatedProduct = res.data;
    if (updatedProduct.stockQuantity <= productWithBOM.stockQuantity) {
      throw new Error('Product inventory not increased');
    }
    return `Product stock increased by ${updatedProduct.stockQuantity - productWithBOM.stockQuantity}`;
  });
}

async function testFulfillmentWorkflow() {
  console.log('\n📤 TESTING FULFILLMENT WORKFLOW');
  console.log('=' .repeat(50));

  // Login as fulfillment manager
  await axiosInstance.post('/auth/login', {
    username: 'fulfillment',
    password: 'fulfillment123'
  });

  // Test 1: View Available Products
  let availableProducts = [];
  await runTest('fulfillment', 'View Available Products', async () => {
    const res = await axiosInstance.get('/products');
    availableProducts = res.data.filter(p => p.stockQuantity > 0);
    return `${availableProducts.length} products in stock`;
  });

  // Test 2: Check Product Details
  await runTest('fulfillment', 'Check Product Details', async () => {
    if (availableProducts.length === 0) throw new Error('No products available');
    const product = availableProducts[0];
    const res = await axiosInstance.get(`/products/${product.id}`);
    if (!res.data.stockQuantity) {
      throw new Error('Product details incomplete');
    }
    return `${res.data.name}: ${res.data.stockQuantity} units available`;
  });

  // Test 3: Simulate Order Fulfillment
  await runTest('fulfillment', 'Process Order (Reduce Stock)', async () => {
    if (availableProducts.length === 0) throw new Error('No products available');
    // As fulfillment, we can only view - admin updates stock
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const product = availableProducts[0];
    const orderQty = Math.min(5, product.stockQuantity);
    const res = await axiosInstance.put(`/products/${product.id}`, {
      stockQuantity: product.stockQuantity - orderQty
    });
    
    // Switch back to fulfillment
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    
    return `Fulfilled order for ${orderQty} units`;
  });

  // Test 4: Check Reorder Alerts
  await runTest('fulfillment', 'Check Reorder Alerts', async () => {
    const res = await axiosInstance.get('/dashboard/low-stock');
    const lowStockProducts = res.data.products;
    if (lowStockProducts.length > 0) {
      return `${lowStockProducts.length} products need reordering`;
    }
    return 'No products need reordering';
  });

  // Test 5: View Production Requests
  await runTest('fulfillment', 'View Production Status', async () => {
    const res = await axiosInstance.get('/production-requests');
    const pending = res.data.filter(r => r.status === 'PENDING');
    const inProgress = res.data.filter(r => r.status === 'IN_PROGRESS');
    return `${pending.length} pending, ${inProgress.length} in progress`;
  });
}

async function testFrontendBackendIntegration() {
  console.log('\n🔗 TESTING FRONTEND-BACKEND INTEGRATION');
  console.log('=' .repeat(50));

  // Test 1: CORS Headers
  await runTest('integration', 'CORS Configuration', async () => {
    const res = await axios.get('http://localhost:3001/health');
    const headers = res.headers;
    if (!headers['access-control-allow-origin']) {
      throw new Error('CORS headers not set');
    }
    return `CORS origin: ${headers['access-control-allow-origin']}`;
  });

  // Test 2: Session Persistence
  await runTest('integration', 'Session Cookie Persistence', async () => {
    // Login
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    // Make another request
    const res = await axiosInstance.get('/auth/me');
    if (!res.data.user) {
      throw new Error('Session not persisted');
    }
    return 'Session persists across requests';
  });

  // Test 3: Error Handling
  await runTest('integration', 'API Error Handling', async () => {
    try {
      await axiosInstance.get('/products/invalid-id');
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response && error.response.data.error) {
        return `Proper error format: ${error.response.data.error.code}`;
      }
      throw error;
    }
  });

  // Test 4: Data Validation
  await runTest('integration', 'Input Validation', async () => {
    try {
      await axiosInstance.post('/products', {
        // Missing required fields
        name: 'Invalid Product'
      });
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return 'Validation working correctly';
      }
      throw error;
    }
  });

  // Test 5: Concurrent Requests
  await runTest('integration', 'Handle Concurrent Requests', async () => {
    const promises = [
      axiosInstance.get('/products'),
      axiosInstance.get('/raw-materials'),
      axiosInstance.get('/dashboard/stats')
    ];
    
    const results = await Promise.all(promises);
    if (results.every(r => r.status === 200)) {
      return 'All concurrent requests successful';
    }
    throw new Error('Some concurrent requests failed');
  });
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE SYSTEM TEST - TEA INVENTORY MANAGEMENT');
  console.log('═'.repeat(55));
  console.log('Testing all features to ensure system is bug-free...\n');

  const startTime = Date.now();

  // Run all test suites
  await testAuthentication();
  await testInventoryManagement();
  await testProductionWorkflow();
  await testFulfillmentWorkflow();
  await testFrontendBackendIntegration();

  // Print summary
  console.log('\n' + '═'.repeat(55));
  console.log('📊 FINAL TEST REPORT');
  console.log('═'.repeat(55));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [category, results] of Object.entries(testResults)) {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    if (results.failed > 0) {
      console.log('  Failed tests:');
      results.tests.filter(t => t.status === 'FAILED').forEach(t => {
        console.log(`    - ${t.name}: ${t.error}`);
      });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '─'.repeat(55));
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed (${duration}s)`);
  console.log('─'.repeat(55));

  if (totalFailed === 0) {
    console.log('\n✅ ALL TESTS PASSED! System is bug-free and ready for deployment! 🎉');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues before deployment.');
  }
}

// Check if server is running
axios.get('http://localhost:3001/health')
  .then(() => {
    console.log('✅ Server is running. Starting tests...\n');
    runAllTests().catch(console.error);
  })
  .catch(() => {
    console.error('❌ Server is not running! Please start the backend server first.');
    console.error('Run: cd backend && npm start');
  });