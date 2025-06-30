const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const COOKIE_FILE = 'test-cookies.txt';

// Test data
const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123' },
  production: { username: 'production', password: 'production123' },
  fulfillment: { username: 'fulfillment', password: 'fulfillment123' }
};

// Axios instance with cookie support
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  validateStatus: () => true // Don't throw on any status
});

// Cookie management
let cookies = '';

api.interceptors.request.use(config => {
  if (cookies) {
    config.headers.Cookie = cookies;
  }
  return config;
});

api.interceptors.response.use(response => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    cookies = setCookie.join('; ');
    fs.writeFileSync(COOKIE_FILE, cookies);
  }
  return response;
});

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Test utilities
function log(message, type = 'info') {
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪'
  };
  console.log(`${prefix[type] || '•'} ${message}`);
}

function reportError(test, error, details = null) {
  testResults.failed++;
  testResults.errors.push({ test, error, details });
  log(`${test}: ${error}`, 'error');
  if (details) {
    console.log('   Details:', details);
  }
}

function reportSuccess(test) {
  testResults.passed++;
  log(`${test}`, 'success');
}

async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
  try {
    const config = { method, url };
    if (data) config.data = data;
    
    const response = await api(config);
    
    if (response.status === expectedStatus) {
      reportSuccess(name);
      return response.data;
    } else {
      reportError(name, `Expected status ${expectedStatus}, got ${response.status}`, 
        response.data?.error?.details ? JSON.stringify(response.data.error.details, null, 2) : response.data);
      return null;
    }
  } catch (error) {
    reportError(name, error.message);
    return null;
  }
}

// Test Suite 1: Authentication
async function testAuthentication() {
  log('Testing Authentication System', 'test');
  
  // Test login with each user type
  for (const [role, credentials] of Object.entries(TEST_USERS)) {
    const result = await testEndpoint(
      `Login as ${role}`,
      'post',
      '/auth/login',
      credentials,
      200
    );
    
    if (result) {
      // Test session endpoint
      await testEndpoint(
        `Get session for ${role}`,
        'get',
        '/auth/session',
        null,
        200
      );
      
      // Test logout
      await testEndpoint(
        `Logout ${role}`,
        'post',
        '/auth/logout',
        null,
        200
      );
    }
  }
  
  // Test invalid login
  await testEndpoint(
    'Login with invalid credentials',
    'post',
    '/auth/login',
    { username: 'invalid', password: 'wrong' },
    401
  );
}

// Test Suite 2: Products
async function testProducts() {
  log('Testing Product Management', 'test');
  
  // Login as admin
  await api.post('/auth/login', TEST_USERS.admin);
  
  // Get products
  const products = await testEndpoint(
    'Get all products',
    'get',
    '/products',
    null,
    200
  );
  
  if (products && products.data) {
    log(`Found ${products.data.length} products`, 'info');
    
    // Test pagination
    await testEndpoint(
      'Get products with pagination',
      'get',
      '/products?page=1&limit=5',
      null,
      200
    );
    
    // Test search
    await testEndpoint(
      'Search products',
      'get',
      '/products?search=tea',
      null,
      200
    );
    
    // Test filters
    await testEndpoint(
      'Filter products by low stock',
      'get',
      '/products?lowStock=true',
      null,
      200
    );
    
    // Test single product
    if (products.data.length > 0) {
      await testEndpoint(
        'Get single product',
        'get',
        `/products/${products.data[0].id}`,
        null,
        200
      );
    }
  }
  
  // Test create product (as admin)
  const newProduct = await testEndpoint(
    'Create new product',
    'post',
    '/products',
    {
      name: 'Test Tea Product',
      sku: 'TEST-' + Date.now(),
      size: '100g',
      price: 19.99,
      stockQuantity: 50,
      reorderLevel: 10,
      reorderQuantity: 100,
      category: 'tea'
    },
    201
  );
  
  if (newProduct && newProduct.data) {
    // Test update
    await testEndpoint(
      'Update product',
      'put',
      `/products/${newProduct.data.id}`,
      { stockQuantity: 75 },
      200
    );
    
    // Test delete
    await testEndpoint(
      'Delete product',
      'delete',
      `/products/${newProduct.data.id}`,
      null,
      200
    );
  }
}

// Test Suite 3: Raw Materials
async function testRawMaterials() {
  log('Testing Raw Materials Management', 'test');
  
  // Get raw materials
  const materials = await testEndpoint(
    'Get all raw materials',
    'get',
    '/raw-materials',
    null,
    200
  );
  
  if (materials && materials.data) {
    log(`Found ${materials.data.length} raw materials`, 'info');
    
    // Test single material
    if (materials.data.length > 0) {
      await testEndpoint(
        'Get single raw material',
        'get',
        `/raw-materials/${materials.data[0].id}`,
        null,
        200
      );
    }
  }
  
  // Test create material
  const newMaterial = await testEndpoint(
    'Create new raw material',
    'post',
    '/raw-materials',
    {
      name: 'Test Material',
      sku: 'TEST-MAT-' + Date.now(),
      stockQuantity: 100,
      reorderLevel: 20,
      reorderQuantity: 200,
      unit: 'kg',
      unitCost: 10.50,
      supplier: 'Test Supplier Inc.',
      category: 'other',
      notes: 'Test material created by automated test'
    },
    201
  );
  
  if (newMaterial && newMaterial.data) {
    // Test update
    await testEndpoint(
      'Update raw material',
      'put',
      `/raw-materials/${newMaterial.data.id}`,
      { stockQuantity: 150 },
      200
    );
    
    // Test delete
    await testEndpoint(
      'Delete raw material',
      'delete',
      `/raw-materials/${newMaterial.data.id}`,
      null,
      200
    );
  }
}

// Test Suite 4: Bill of Materials
async function testBOM() {
  log('Testing Bill of Materials', 'test');
  
  // Get products and materials for testing
  const products = await api.get('/products');
  const materials = await api.get('/raw-materials');
  
  if (products.data?.data?.length && materials.data?.data?.length) {
    const product = products.data.data[0];
    const material = materials.data.data[0];
    
    // Get BOM for product
    await testEndpoint(
      'Get BOM for product',
      'get',
      `/bom?productId=${product.id}`,
      null,
      200
    );
    
    // Create BOM entry
    const newBOM = await testEndpoint(
      'Create BOM entry',
      'post',
      '/bom',
      {
        productId: product.id,
        rawMaterialId: material.id,
        quantityRequired: 10
      },
      201
    );
    
    if (newBOM && newBOM.data) {
      // Update BOM
      await testEndpoint(
        'Update BOM entry',
        'put',
        `/bom/${newBOM.data.id}`,
        { quantityRequired: 15 },
        200
      );
      
      // Delete BOM
      await testEndpoint(
        'Delete BOM entry',
        'delete',
        `/bom/${newBOM.data.id}`,
        null,
        200
      );
    }
  }
}

// Test Suite 5: Production Requests
async function testProductionRequests() {
  log('Testing Production Requests', 'test');
  
  // Login as fulfillment to create requests
  await api.post('/auth/login', TEST_USERS.fulfillment);
  
  // Get requests
  const requests = await testEndpoint(
    'Get all production requests',
    'get',
    '/production-requests',
    null,
    200
  );
  
  if (requests && requests.data) {
    log(`Found ${requests.data.requests.length} production requests`, 'info');
    
    // Test filters
    await testEndpoint(
      'Filter production requests by status',
      'get',
      '/production-requests?status=pending',
      null,
      200
    );
  }
  
  // Get a product with BOM for testing
  const products = await api.get('/products');
  const productWithBOM = products.data?.data?.find(p => p.billOfMaterials?.length > 0);
  
  if (productWithBOM) {
    // Create production request
    const newRequest = await testEndpoint(
      'Create production request',
      'post',
      '/production-requests',
      {
        productId: productWithBOM.id,
        quantityRequested: 5,
        notes: 'Test production request'
      },
      201
    );
    
    if (newRequest && newRequest.data) {
      // Login as production to process request
      await api.post('/auth/login', TEST_USERS.production);
      
      // Start production
      await testEndpoint(
        'Start production',
        'put',
        `/production-requests/${newRequest.data.id}`,
        { status: 'in_progress' },
        200
      );
      
      // Complete production
      await testEndpoint(
        'Complete production',
        'post',
        `/production-requests/${newRequest.data.id}/complete`,
        {},
        200
      );
    }
  }
}

// Test Suite 6: Inventory Adjustments
async function testInventoryAdjustments() {
  log('Testing Inventory Adjustments', 'test');
  
  // Login as admin
  await api.post('/auth/login', TEST_USERS.admin);
  
  // Get adjustments
  await testEndpoint(
    'Get all inventory adjustments',
    'get',
    '/inventory-adjustments',
    null,
    200
  );
  
  // Get a product for testing
  const products = await api.get('/products');
  if (products.data?.data?.length) {
    const product = products.data.data[0];
    
    // Create product adjustment
    await testEndpoint(
      'Create product stock adjustment',
      'post',
      '/inventory-adjustments/products',
      {
        itemId: product.id,
        adjustmentType: 'add',
        quantity: 10,
        reason: 'inventory_count',
        notes: 'Test adjustment'
      },
      201
    );
    
    // Get product adjustment history
    await testEndpoint(
      'Get product adjustment history',
      'get',
      `/inventory-adjustments/products/${product.id}`,
      null,
      200
    );
  }
  
  // Get a material for testing
  const materials = await api.get('/raw-materials');
  if (materials.data?.data?.length) {
    const material = materials.data.data[0];
    
    // Create material adjustment
    await testEndpoint(
      'Create material stock adjustment',
      'post',
      '/inventory-adjustments/raw-materials',
      {
        itemId: material.id,
        adjustmentType: 'remove',
        quantity: 5,
        reason: 'damaged',
        notes: 'Test adjustment for damaged goods'
      },
      201
    );
  }
}

// Test Suite 7: Dashboard
async function testDashboard() {
  log('Testing Dashboard Endpoints', 'test');
  
  // Get dashboard stats
  await testEndpoint(
    'Get dashboard statistics',
    'get',
    '/dashboard/stats',
    null,
    200
  );
  
  // Note: Activity endpoint not implemented yet
  // Skipping activity test
  
  // Get low stock alerts
  await testEndpoint(
    'Get low stock alerts',
    'get',
    '/dashboard/low-stock',
    null,
    200
  );
}

// Test Suite 8: Role-Based Access Control
async function testRBAC() {
  log('Testing Role-Based Access Control', 'test');
  
  // Test production user restrictions
  await api.post('/auth/login', TEST_USERS.production);
  
  // Should not be able to create products
  await testEndpoint(
    'Production user cannot create products',
    'post',
    '/products',
    { name: 'Unauthorized Product', sku: 'UNAUTH-1' },
    403
  );
  
  // Should be able to complete production requests
  const requests = await api.get('/production-requests?status=in_progress');
  if (requests.data?.requests?.length) {
    await testEndpoint(
      'Production user can complete requests',
      'post',
      `/production-requests/${requests.data.requests[0].id}/complete`,
      {},
      200
    );
  }
  
  // Test fulfillment user restrictions
  await api.post('/auth/login', TEST_USERS.fulfillment);
  
  // Should be able to create production requests
  const products = await api.get('/products');
  if (products.data?.data?.length) {
    await testEndpoint(
      'Fulfillment user can create requests',
      'post',
      '/production-requests',
      {
        productId: products.data.data[0].id,
        quantityRequested: 1
      },
      201
    );
  }
  
  // Should not be able to delete products
  if (products.data?.data?.length) {
    await testEndpoint(
      'Fulfillment user cannot delete products',
      'delete',
      `/products/${products.data.data[0].id}`,
      null,
      403
    );
  }
}

// Test Suite 9: Error Handling
async function testErrorHandling() {
  log('Testing Error Handling', 'test');
  
  // Test 404 errors
  await testEndpoint(
    'Non-existent endpoint returns 404',
    'get',
    '/non-existent',
    null,
    404
  );
  
  // Test validation errors
  await api.post('/auth/login', TEST_USERS.admin);
  
  await testEndpoint(
    'Invalid product data returns 400',
    'post',
    '/products',
    { name: '' }, // Missing required fields
    400
  );
  
  // Test unauthorized access
  await api.post('/auth/logout');
  
  await testEndpoint(
    'Unauthorized access returns 401',
    'get',
    '/products',
    null,
    401
  );
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Comprehensive System Tests');
  console.log('📍 API URL:', BASE_URL);
  console.log('=' .repeat(50));
  
  try {
    // Check if server is running
    try {
      await axios.get(BASE_URL.replace('/api', '/health'));
      log('Server is running', 'success');
    } catch (error) {
      log('Server is not running!', 'error');
      return;
    }
    
    // Run all test suites
    await testAuthentication();
    console.log('');
    
    await testProducts();
    console.log('');
    
    await testRawMaterials();
    console.log('');
    
    await testBOM();
    console.log('');
    
    await testProductionRequests();
    console.log('');
    
    await testInventoryAdjustments();
    console.log('');
    
    await testDashboard();
    console.log('');
    
    await testRBAC();
    console.log('');
    
    await testErrorHandling();
    console.log('');
    
  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'error');
  }
  
  // Print summary
  console.log('=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round(testResults.passed / (testResults.passed + testResults.failed) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
      if (error.details) {
        console.log(`   Details:`, error.details);
      }
    });
  }
  
  // Clean up
  if (fs.existsSync(COOKIE_FILE)) {
    fs.unlinkSync(COOKIE_FILE);
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests();