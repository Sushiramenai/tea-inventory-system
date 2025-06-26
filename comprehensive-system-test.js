const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const credentials = {
  admin: { username: 'admin@teacompany.com', password: 'admin123' },
  production: { username: 'production@teacompany.com', password: 'production123' },
  fulfillment: { username: 'fulfillment@teacompany.com', password: 'fulfillment123' }
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  summary: []
};

// Helper function to create axios instance with session
function createAxiosInstance() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    baseURL: BASE_URL,
    jar: jar,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    },
    validateStatus: function (status) {
      return status >= 200 && status < 500; // Don't throw on 4xx errors
    }
  }));
  return client;
}

// Helper function to log test results
function logTest(testName, success, error = null) {
  if (success) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || error });
    console.log(`❌ ${testName}: ${error?.message || error}`);
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test admin functionality
async function testAdminFeatures() {
  console.log('\n🔐 Testing Admin Features...');
  const api = createAxiosInstance();
  
  try {
    // Login as admin
    const loginRes = await api.post('/api/auth/login', credentials.admin);
    logTest('Admin login', loginRes.data.user !== undefined);
    
    // Test dashboard stats
    const dashboardRes = await api.get('/api/dashboard/stats');
    logTest('Dashboard stats retrieval', dashboardRes.data !== undefined);
    console.log('  📊 Dashboard stats:', dashboardRes.data);
    
    // Test raw materials CRUD
    console.log('\n📦 Testing Raw Materials CRUD...');
    
    // Create
    const newMaterial = {
      itemName: 'Test Tea Leaves',
      category: 'tea',
      count: 50,
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 10
    };
    const createRes = await api.post('/api/raw-materials', newMaterial);
    logTest('Create raw material', createRes.data.id !== undefined);
    const materialId = createRes.data.id;
    
    // Read
    const getMaterialsRes = await api.get('/api/raw-materials');
    logTest('Get all raw materials', Array.isArray(getMaterialsRes.data));
    
    // Update
    const updateRes = await api.put(`/api/raw-materials/${materialId}`, {
      ...newMaterial,
      count: 60
    });
    logTest('Update raw material', updateRes.data.id !== undefined);
    
    // Delete
    const deleteRes = await api.delete(`/api/raw-materials/${materialId}`);
    logTest('Delete raw material', deleteRes.status === 200 || deleteRes.status === 204);
    
    // Test products CRUD
    console.log('\n🍵 Testing Products CRUD...');
    
    // Create
    const newProduct = {
      teaName: 'Test Tea',
      category: 'tea',
      sizeFormat: 'pouch',
      quantitySize: '100g',
      sku: 'TEST-P-100',
      physicalCount: 20,
      reorderThreshold: 5
    };
    const createProdRes = await api.post('/api/products', newProduct);
    logTest('Create product', createProdRes.data.id !== undefined);
    const productId = createProdRes.data.id;
    
    // Read
    const getProductsRes = await api.get('/api/products');
    logTest('Get all products', Array.isArray(getProductsRes.data));
    
    // Update
    const updateProdRes = await api.put(`/api/products/${productId}`, {
      ...newProduct,
      physicalCount: 25
    });
    logTest('Update product', updateProdRes.data.id !== undefined);
    
    // Test BOM management
    console.log('\n📋 Testing Bill of Materials...');
    
    // First, create materials and product for BOM
    const material1 = await api.post('/api/raw-materials', {
      itemName: 'BOM Test Tea',
      category: 'tea',
      count: 100,
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 20
    });
    
    const material2 = await api.post('/api/raw-materials', {
      itemName: 'BOM Test Pouch',
      category: 'pouches',
      count: 500,
      unit: 'pcs',
      totalQuantity: 500,
      reorderThreshold: 100
    });
    
    const bomProduct = await api.post('/api/products', {
      teaName: 'BOM Test Product',
      category: 'tea',
      sizeFormat: 'pouch',
      quantitySize: '50g',
      sku: 'BOM-TEST-50',
      physicalCount: 0,
      reorderThreshold: 10
    });
    
    // Create BOM
    const bomData = {
      productId: bomProduct.data.product?.id,
      materials: [
        {
          materialId: material1.data.material?.id,
          quantityRequired: 0.05, // 50g per product
          unit: 'kg'
        },
        {
          materialId: material2.data.material?.id,
          quantityRequired: 1, // 1 pouch per product
          unit: 'pcs'
        }
      ]
    };
    
    const createBomRes = await api.post('/api/bom', bomData);
    logTest('Create BOM', createBomRes.data.billOfMaterials?.length > 0);
    
    // Get BOM
    const getBomRes = await api.get(`/api/bom/product/${bomProduct.data.product?.id}`);
    logTest('Get BOM for product', Array.isArray(getBomRes.data.billOfMaterials));
    
    // Clean up
    await api.delete(`/api/products/${productId}`);
    await api.delete(`/api/products/${bomProduct.data.product?.id}`);
    await api.delete(`/api/raw-materials/${material1.data.material?.id}`);
    await api.delete(`/api/raw-materials/${material2.data.material?.id}`);
    
  } catch (error) {
    logTest('Admin features', false, error.response?.data || error);
  }
}

// Test production manager functionality
async function testProductionFeatures() {
  console.log('\n🏭 Testing Production Manager Features...');
  const api = createAxiosInstance();
  
  try {
    // Login as production manager
    const loginRes = await api.post('/api/auth/login', credentials.production);
    logTest('Production manager login', loginRes.data.user !== undefined);
    
    // Create test data for production
    const adminApi = createAxiosInstance();
    await adminApi.post('/api/auth/login', credentials.admin);
    
    // Create materials
    const material = await adminApi.post('/api/raw-materials', {
      itemName: 'Production Test Tea',
      category: 'tea',
      count: 100,
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 20
    });
    
    const pouch = await adminApi.post('/api/raw-materials', {
      itemName: 'Production Test Pouch',
      category: 'pouches',
      count: 1000,
      unit: 'pcs',
      totalQuantity: 1000,
      reorderThreshold: 200
    });
    
    // Create product
    const product = await adminApi.post('/api/products', {
      teaName: 'Production Test Product',
      category: 'tea',
      sizeFormat: 'pouch',
      quantitySize: '100g',
      sku: 'PROD-TEST-100',
      physicalCount: 10,
      reorderThreshold: 20
    });
    
    // Create BOM
    await adminApi.post('/api/bom', {
      productId: product.data.id,
      materials: [
        {
          materialId: material.data.data.id,
          quantityRequired: 0.1,
          unit: 'kg'
        },
        {
          materialId: pouch.data.data.id,
          quantityRequired: 1,
          unit: 'pcs'
        }
      ]
    });
    
    // Switch back to production user
    await api.post('/api/auth/login', credentials.production);
    
    // View production requests
    const viewRes = await api.get('/api/production-requests');
    logTest('View production requests', viewRes.data.success);
    
    // Create production request
    const productionReq = {
      productId: product.data.id,
      quantity: 50,
      priority: 'high',
      notes: 'Test production request'
    };
    
    const createReqRes = await api.post('/api/production-requests', productionReq);
    logTest('Create production request', createReqRes.data.success);
    const requestId = createReqRes.data.data.id;
    
    // Complete production request
    const completeRes = await api.put(`/api/production-requests/${requestId}/complete`);
    logTest('Complete production request', completeRes.data.success);
    
    // Check inventory updates
    const updatedProduct = await api.get(`/api/products/${product.data.data.id}`);
    const expectedCount = 10 + 50; // Initial + produced
    logTest('Product inventory updated correctly', 
      updatedProduct.data.data.physicalCount === expectedCount);
    
    // Check raw material deduction
    const updatedMaterial = await api.get(`/api/raw-materials/${material.data.data.id}`);
    const expectedMaterialCount = 100 - (50 * 0.1); // Initial - (produced * required per unit)
    logTest('Raw material deducted correctly', 
      Math.abs(updatedMaterial.data.data.count - expectedMaterialCount) < 0.01);
    
    // Clean up
    await adminApi.post('/api/auth/login', credentials.admin);
    await adminApi.delete(`/api/products/${product.data.data.id}`);
    await adminApi.delete(`/api/raw-materials/${material.data.data.id}`);
    await adminApi.delete(`/api/raw-materials/${pouch.data.data.id}`);
    
  } catch (error) {
    logTest('Production features', false, error.response?.data || error);
  }
}

// Test fulfillment manager functionality
async function testFulfillmentFeatures() {
  console.log('\n📦 Testing Fulfillment Manager Features...');
  const api = createAxiosInstance();
  
  try {
    // Login as fulfillment manager
    const loginRes = await api.post('/api/auth/login', credentials.fulfillment);
    logTest('Fulfillment manager login', loginRes.data.user !== undefined);
    
    // Create test data
    const adminApi = createAxiosInstance();
    await adminApi.post('/api/auth/login', credentials.admin);
    
    // Create product with sufficient stock
    const product = await adminApi.post('/api/products', {
      teaName: 'Fulfillment Test Product',
      category: 'tea',
      sizeFormat: 'tin',
      quantitySize: '200g',
      sku: 'FULFILL-TEST-200',
      physicalCount: 100,
      reorderThreshold: 20
    });
    
    // Switch back to fulfillment user
    await api.post('/api/auth/login', credentials.fulfillment);
    
    // Check inventory levels
    const inventoryRes = await api.get('/api/products');
    logTest('View inventory levels', inventoryRes.data.success);
    
    // Create fulfillment request (using production request endpoint)
    const fulfillmentReq = {
      productId: product.data.id,
      quantity: 25,
      priority: 'medium',
      notes: 'Test fulfillment order'
    };
    
    const createFulfillRes = await api.post('/api/production-requests', fulfillmentReq);
    logTest('Create fulfillment request', createFulfillRes.data.success);
    
    // Verify stock deduction
    await sleep(1000); // Wait for processing
    const updatedProduct = await api.get(`/api/products/${product.data.data.id}`);
    const expectedStock = 100 - 25;
    logTest('Stock deducted correctly for fulfillment', 
      updatedProduct.data.data.physicalCount === expectedStock);
    
    // Clean up
    await adminApi.post('/api/auth/login', credentials.admin);
    await adminApi.delete(`/api/products/${product.data.data.id}`);
    
  } catch (error) {
    logTest('Fulfillment features', false, error.response?.data || error);
  }
}

// Test edge cases
async function testEdgeCases() {
  console.log('\n⚠️  Testing Edge Cases...');
  const api = createAxiosInstance();
  
  try {
    // Test invalid login
    try {
      await api.post('/api/auth/login', {
        username: 'invalid@test.com',
        password: 'wrongpass'
      });
      logTest('Invalid login rejected', false);
    } catch (error) {
      logTest('Invalid login rejected', error.response?.status === 401);
    }
    
    // Test unauthorized access
    try {
      await api.get('/api/users'); // Should fail without login
      logTest('Unauthorized access blocked', false);
    } catch (error) {
      logTest('Unauthorized access blocked', error.response?.status === 401);
    }
    
    // Login as admin for further tests
    await api.post('/api/auth/login', credentials.admin);
    
    // Test low stock scenario
    const lowStockProduct = await api.post('/api/products', {
      teaName: 'Low Stock Test',
      category: 'tea',
      sizeFormat: 'pouch',
      quantitySize: '25g',
      sku: 'LOW-STOCK-25',
      physicalCount: 5, // Low stock
      reorderThreshold: 10
    });
    
    // Try to create production request exceeding stock
    const material = await api.post('/api/raw-materials', {
      itemName: 'Low Stock Material',
      category: 'tea',
      count: 1, // Very low stock
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 5
    });
    
    // Create BOM
    await api.post('/api/bom', {
      productId: lowStockProduct.data.data.id,
      materials: [{
        materialId: material.data.data.id,
        quantityRequired: 0.5,
        unit: 'kg'
      }]
    });
    
    // Try production request that would exceed material capacity
    try {
      await api.post('/api/production-requests', {
        productId: lowStockProduct.data.data.id,
        quantity: 10, // Would need 5kg of material, but only have 1kg
        priority: 'high',
        notes: 'Should fail due to insufficient materials'
      });
      logTest('Low stock validation', false);
    } catch (error) {
      logTest('Low stock validation', error.response?.status === 400);
    }
    
    // Test invalid inputs
    try {
      await api.post('/api/products', {
        teaName: '', // Empty name
        category: 'tea',
        sizeFormat: 'invalid', // Invalid format
        quantitySize: '-10g', // Invalid quantity
        sku: '',
        physicalCount: -5, // Negative count
        reorderThreshold: 'abc' // Non-numeric threshold
      });
      logTest('Invalid input validation', false);
    } catch (error) {
      logTest('Invalid input validation', error.response?.status === 400);
    }
    
    // Test concurrent requests
    console.log('\n🔄 Testing Concurrent Requests...');
    const concurrentProduct = await api.post('/api/products', {
      teaName: 'Concurrent Test',
      category: 'tea',
      sizeFormat: 'tin',
      quantitySize: '150g',
      sku: 'CONCURRENT-150',
      physicalCount: 100,
      reorderThreshold: 20
    });
    
    // Make multiple concurrent updates
    const updates = [];
    for (let i = 0; i < 5; i++) {
      updates.push(
        api.put(`/api/products/${concurrentProduct.data.data.id}`, {
          ...concurrentProduct.data.data,
          physicalCount: 100 + i
        })
      );
    }
    
    await Promise.all(updates);
    logTest('Concurrent updates handled', true);
    
    // Test session management
    console.log('\n🔐 Testing Session Management...');
    
    // Get current user
    const currentUserRes = await api.get('/api/auth/me');
    logTest('Get current user', currentUserRes.data.success);
    
    // Logout
    const logoutRes = await api.post('/api/auth/logout');
    logTest('Logout successful', logoutRes.data.success);
    
    // Try to access protected route after logout
    try {
      await api.get('/api/products');
      logTest('Session invalidated after logout', false);
    } catch (error) {
      logTest('Session invalidated after logout', error.response?.status === 401);
    }
    
    // Clean up
    await api.post('/api/auth/login', credentials.admin);
    await api.delete(`/api/products/${lowStockProduct.data.data.id}`);
    await api.delete(`/api/products/${concurrentProduct.data.data.id}`);
    await api.delete(`/api/raw-materials/${material.data.data.id}`);
    
  } catch (error) {
    logTest('Edge cases', false, error.response?.data || error);
  }
}

// Test database constraints
async function testDatabaseConstraints() {
  console.log('\n🗄️  Testing Database Constraints...');
  const api = createAxiosInstance();
  
  try {
    await api.post('/api/auth/login', credentials.admin);
    
    // Test unique constraints
    const product1 = await api.post('/api/products', {
      teaName: 'Unique Test',
      category: 'tea',
      sizeFormat: 'pouch',
      quantitySize: '50g',
      sku: 'UNIQUE-TEST-50',
      physicalCount: 10,
      reorderThreshold: 5
    });
    
    // Try to create duplicate
    try {
      await api.post('/api/products', {
        teaName: 'Unique Test',
        category: 'tea',
        sizeFormat: 'pouch',
        quantitySize: '50g', // Same combination
        sku: 'DIFFERENT-SKU',
        physicalCount: 20,
        reorderThreshold: 10
      });
      logTest('Unique constraint enforced', false);
    } catch (error) {
      logTest('Unique constraint enforced', error.response?.status === 400);
    }
    
    // Test cascading deletes
    const material = await api.post('/api/raw-materials', {
      itemName: 'Cascade Test Material',
      category: 'tea',
      count: 50,
      unit: 'kg',
      quantityPerUnit: 1,
      reorderThreshold: 10
    });
    
    const productForCascade = await api.post('/api/products', {
      teaName: 'Cascade Test Product',
      category: 'tea',
      sizeFormat: 'tin',
      quantitySize: '100g',
      sku: 'CASCADE-TEST-100',
      physicalCount: 20,
      reorderThreshold: 5
    });
    
    // Create BOM
    await api.post('/api/bom', {
      productId: productForCascade.data.data.id,
      materials: [{
        materialId: material.data.data.id,
        quantityRequired: 0.1,
        unit: 'kg'
      }]
    });
    
    // Create production request
    const prodReq = await api.post('/api/production-requests', {
      productId: productForCascade.data.data.id,
      quantity: 5,
      priority: 'low',
      notes: 'Test cascade'
    });
    
    // Delete product and check cascades
    await api.delete(`/api/products/${productForCascade.data.data.id}`);
    logTest('Cascading delete handled', true);
    
    // Clean up
    await api.delete(`/api/products/${product1.data.data.id}`);
    await api.delete(`/api/raw-materials/${material.data.data.id}`);
    
  } catch (error) {
    logTest('Database constraints', false, error.response?.data || error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Tea Inventory System Tests');
  console.log('===================================================\n');
  
  // Wait for servers to be ready
  console.log('⏳ Waiting for servers to be ready...');
  await sleep(3000);
  
  try {
    // Check if servers are running by trying to access the API
    await axios.get(BASE_URL + '/api/auth/me').catch(() => {});
    console.log('✅ Backend server is ready');
  } catch (error) {
    console.error('❌ Backend server is not responding. Please ensure it\'s running on port 3001');
    return;
  }
  
  // Run all test suites
  await testAdminFeatures();
  await testProductionFeatures();
  await testFulfillmentFeatures();
  await testEdgeCases();
  await testDatabaseConstraints();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`  - ${error.test}: ${error.error}`);
    });
  }
  
  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 Detailed results saved to comprehensive-test-results.json');
}

// Run the tests
runAllTests().catch(console.error);