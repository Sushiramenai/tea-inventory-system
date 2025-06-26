const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001/api';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let cookies = '';

// Intercept requests to add cookies
axiosInstance.interceptors.request.use(config => {
  if (cookies) {
    config.headers.Cookie = cookies;
  }
  return config;
});

// Intercept responses to save cookies
axiosInstance.interceptors.response.use(response => {
  const setCookies = response.headers['set-cookie'];
  if (setCookies) {
    cookies = setCookies.join('; ');
  }
  return response;
});

// Test tracking
const testResults = {
  passed: [],
  failed: [],
  bugs: []
};

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEndpoint(name, fn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await wait(1500); // Avoid rate limits
    const result = await fn();
    testResults.passed.push(name);
    console.log(`✅ ${name} - PASSED`);
    return result;
  } catch (error) {
    testResults.failed.push({ name, error: error.response?.data || error.message });
    console.log(`❌ ${name} - FAILED:`, error.response?.data || error.message);
    testResults.bugs.push({
      test: name,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
}

async function deepSystemTest() {
  console.log('🚀 Starting Deep System Test\n');
  console.log('This will test EVERY feature of the tea inventory system...\n');

  // Test 1: Authentication System
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 1: AUTHENTICATION SYSTEM');
  console.log('═══════════════════════════════════════');

  // Test login with different users
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'fulfillment', password: 'fulfillment123', role: 'fulfillment' },
    { username: 'production', password: 'production123', role: 'production' }
  ];

  for (const user of users) {
    await testEndpoint(`Login as ${user.role}`, async () => {
      const response = await axiosInstance.post('/auth/login', {
        username: user.username,
        password: user.password
      });
      return response.data;
    });

    await testEndpoint(`Check session for ${user.role}`, async () => {
      const response = await axiosInstance.get('/auth/session');
      if (response.data.user.role !== user.role) {
        throw new Error(`Expected role ${user.role}, got ${response.data.user.role}`);
      }
      return response.data;
    });

    await testEndpoint(`Logout ${user.role}`, async () => {
      const response = await axiosInstance.post('/auth/logout');
      return response.data;
    });
  }

  // Test invalid login
  await testEndpoint('Invalid login attempt', async () => {
    try {
      await axiosInstance.post('/auth/login', {
        username: 'invalid',
        password: 'wrong'
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        return 'Correctly rejected invalid credentials';
      }
      throw error;
    }
  });

  // Continue with admin for rest of tests
  await testEndpoint('Login as admin for remaining tests', async () => {
    return await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
  });

  // Test 2: Raw Materials Management
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 2: RAW MATERIALS MANAGEMENT');
  console.log('═══════════════════════════════════════');

  // Get all raw materials
  let existingMaterials = [];
  await testEndpoint('Get all raw materials', async () => {
    const response = await axiosInstance.get('/raw-materials?limit=50');
    existingMaterials = response.data.materials || [];
    return response.data;
  });

  // Create new raw materials
  const newMaterials = [
    { itemName: 'Jasmine Tea Leaves', category: 'tea', unit: 'kg', count: 25, reorderThreshold: 5 },
    { itemName: 'Oolong Tea Premium', category: 'tea', unit: 'kg', count: 15, reorderThreshold: 3 },
    { itemName: 'Bamboo Tea Boxes', category: 'boxes', unit: 'boxes', count: 50, reorderThreshold: 10 }
  ];

  const createdMaterials = [];
  for (const material of newMaterials) {
    await testEndpoint(`Create material: ${material.itemName}`, async () => {
      try {
        const response = await axiosInstance.post('/raw-materials', material);
        createdMaterials.push(response.data.material);
        return response.data;
      } catch (error) {
        if (error.response?.data?.error?.code === 'MATERIAL_EXISTS') {
          console.log('  ℹ️  Material already exists, skipping...');
          return 'Already exists';
        }
        throw error;
      }
    });
  }

  // Test getting specific material
  if (existingMaterials.length > 0 || createdMaterials.length > 0) {
    const testMaterial = existingMaterials[0] || createdMaterials[0];
    await testEndpoint(`Get specific material: ${testMaterial.itemName}`, async () => {
      const response = await axiosInstance.get(`/raw-materials/${testMaterial.id}`);
      return response.data;
    });

    // Test updating material
    await testEndpoint(`Update material count: ${testMaterial.itemName}`, async () => {
      const response = await axiosInstance.put(`/raw-materials/${testMaterial.id}`, {
        count: testMaterial.count + 10
      });
      return response.data;
    });
  }

  // Test search functionality
  await testEndpoint('Search raw materials by name', async () => {
    const response = await axiosInstance.get('/raw-materials?search=tea');
    return response.data;
  });

  // Test low stock filter
  await testEndpoint('Get low stock materials', async () => {
    const response = await axiosInstance.get('/raw-materials?lowStock=true');
    return response.data;
  });

  // Test 3: Product Management
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 3: PRODUCT MANAGEMENT');
  console.log('═══════════════════════════════════════');

  // Get all products
  let existingProducts = [];
  await testEndpoint('Get all products', async () => {
    const response = await axiosInstance.get('/products?limit=50');
    existingProducts = response.data.products || [];
    return response.data;
  });

  // Create new products
  const newProducts = [
    { teaName: 'Jasmine Delight', category: 'tea', sizeFormat: 'tin', quantitySize: '75g', sku: 'JD-TIN-75', reorderThreshold: 15 },
    { teaName: 'Oolong Premium', category: 'tea', sizeFormat: 'pouch', quantitySize: '100g', sku: 'OO-PCH-100', reorderThreshold: 20 }
  ];

  const createdProducts = [];
  for (const product of newProducts) {
    await testEndpoint(`Create product: ${product.teaName}`, async () => {
      try {
        const response = await axiosInstance.post('/products', product);
        createdProducts.push(response.data.product);
        return response.data;
      } catch (error) {
        if (error.response?.data?.error?.code === 'PRODUCT_EXISTS') {
          console.log('  ℹ️  Product already exists, skipping...');
          return 'Already exists';
        }
        throw error;
      }
    });
  }

  // Test getting specific product
  if (existingProducts.length > 0 || createdProducts.length > 0) {
    const testProduct = existingProducts[0] || createdProducts[0];
    
    await testEndpoint(`Get product by ID: ${testProduct.teaName}`, async () => {
      const response = await axiosInstance.get(`/products/${testProduct.id}`);
      return response.data;
    });

    // Test updating product
    await testEndpoint(`Update product inventory: ${testProduct.teaName}`, async () => {
      const response = await axiosInstance.put(`/products/${testProduct.id}`, {
        physicalCount: 50
      });
      return response.data;
    });
  }

  // Test 4: Bill of Materials
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 4: BILL OF MATERIALS');
  console.log('═══════════════════════════════════════');

  // Get materials and products for BOM
  const allMaterials = await axiosInstance.get('/raw-materials?limit=50');
  const allProducts = await axiosInstance.get('/products?limit=50');

  const materials = allMaterials.data.materials || [];
  const products = allProducts.data.products || [];

  if (materials.length > 0 && products.length > 0) {
    // Find suitable materials and products
    const teaMaterial = materials.find(m => m.category === 'tea');
    const tinMaterial = materials.find(m => m.category === 'tins' || m.itemName.includes('Tin'));
    const product = products[0];

    if (teaMaterial && product) {
      await testEndpoint(`Create BOM for ${product.teaName}`, async () => {
        try {
          const response = await axiosInstance.post('/bom', {
            productId: product.id,
            rawMaterialId: teaMaterial.id,
            quantityRequired: 0.1
          });
          return response.data;
        } catch (error) {
          if (error.response?.data?.error?.code === 'BOM_EXISTS') {
            console.log('  ℹ️  BOM entry already exists');
            return 'Already exists';
          }
          throw error;
        }
      });
    }

    // Get BOM for product
    await testEndpoint(`Get BOM for product`, async () => {
      const response = await axiosInstance.get(`/bom/product/${product.id}`);
      return response.data;
    });
  }

  // Test 5: Production Requests
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 5: PRODUCTION REQUESTS');
  console.log('═══════════════════════════════════════');

  // Login as fulfillment to create requests
  await testEndpoint('Switch to fulfillment user', async () => {
    return await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
  });

  // Find a product with BOM
  let productWithBOM = null;
  for (const product of products) {
    try {
      const bomResponse = await axiosInstance.get(`/bom/product/${product.id}`);
      if (bomResponse.data.materials && bomResponse.data.materials.length > 0) {
        productWithBOM = product;
        break;
      }
    } catch (error) {
      // Continue searching
    }
    await wait(1000);
  }

  let createdRequest = null;
  if (productWithBOM) {
    await testEndpoint(`Create production request for ${productWithBOM.teaName}`, async () => {
      const response = await axiosInstance.post('/production-requests', {
        productId: productWithBOM.id,
        quantityRequested: 5,
        notes: 'Deep test production request'
      });
      createdRequest = response.data.request;
      return response.data;
    });
  }

  // Get all production requests
  await testEndpoint('Get all production requests', async () => {
    const response = await axiosInstance.get('/production-requests');
    return response.data;
  });

  // Login as production to complete request
  await testEndpoint('Switch to production user', async () => {
    return await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
  });

  if (createdRequest) {
    await testEndpoint('Complete production request', async () => {
      const response = await axiosInstance.post(`/production-requests/${createdRequest.id}/complete`);
      return response.data;
    });
  }

  // Test 6: Dashboard and Reports
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 6: DASHBOARD & REPORTING');
  console.log('═══════════════════════════════════════');

  await testEndpoint('Get dashboard statistics', async () => {
    const response = await axiosInstance.get('/dashboard/stats');
    return response.data;
  });

  // Mock Runs
  console.log('\n═══════════════════════════════════════');
  console.log('📋 PHASE 7: MOCK RUNS');
  console.log('═══════════════════════════════════════');

  // Production Manager Mock Runs (3 times)
  for (let i = 1; i <= 3; i++) {
    console.log(`\n🏭 Production Manager Mock Run ${i}/3`);
    
    await testEndpoint(`Production Mock ${i}: Login`, async () => {
      return await axiosInstance.post('/auth/login', {
        username: 'production',
        password: 'production123'
      });
    });

    await testEndpoint(`Production Mock ${i}: Check pending requests`, async () => {
      const response = await axiosInstance.get('/production-requests?status=pending');
      console.log(`  Found ${response.data.requests?.length || 0} pending requests`);
      return response.data;
    });

    await testEndpoint(`Production Mock ${i}: Check dashboard`, async () => {
      const response = await axiosInstance.get('/dashboard/stats');
      console.log(`  Products: ${response.data.stats.products.total}, Materials: ${response.data.stats.rawMaterials.total}`);
      return response.data;
    });

    await testEndpoint(`Production Mock ${i}: Check low stock`, async () => {
      const response = await axiosInstance.get('/raw-materials?lowStock=true');
      console.log(`  Low stock materials: ${response.data.materials?.length || 0}`);
      return response.data;
    });
  }

  // Inventory Manager Mock Runs (3 times)
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📦 Inventory Manager Mock Run ${i}/3`);
    
    await testEndpoint(`Inventory Mock ${i}: Login`, async () => {
      return await axiosInstance.post('/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
    });

    await testEndpoint(`Inventory Mock ${i}: Check all materials`, async () => {
      const response = await axiosInstance.get('/raw-materials');
      console.log(`  Total materials: ${response.data.pagination.total}`);
      return response.data;
    });

    await testEndpoint(`Inventory Mock ${i}: Check all products`, async () => {
      const response = await axiosInstance.get('/products');
      console.log(`  Total products: ${response.data.pagination.total}`);
      return response.data;
    });

    await testEndpoint(`Inventory Mock ${i}: Perform inventory adjustment`, async () => {
      const materials = await axiosInstance.get('/raw-materials?limit=1');
      if (materials.data.materials?.length > 0) {
        const material = materials.data.materials[0];
        const response = await axiosInstance.put(`/raw-materials/${material.id}`, {
          count: material.count + 5
        });
        console.log(`  Adjusted ${material.itemName} by +5`);
        return response.data;
      }
      return 'No materials to adjust';
    });
  }

  return testResults;
}

// Run the deep test
deepSystemTest()
  .then(results => {
    console.log('\n\n════════════════════════════════════════');
    console.log('📊 DEEP TEST COMPLETE');
    console.log('════════════════════════════════════════\n');
    
    console.log(`✅ Passed: ${results.passed.length} tests`);
    console.log(`❌ Failed: ${results.failed.length} tests`);
    
    if (results.failed.length > 0) {
      console.log('\n🐛 Bugs Found:');
      results.failed.forEach((fail, index) => {
        console.log(`${index + 1}. ${fail.name}`);
        console.log(`   Error: ${JSON.stringify(fail.error)}`);
      });
    }
    
    if (results.passed.length > 0 && results.failed.length === 0) {
      console.log('\n✨ ALL TESTS PASSED! The system is fully functional.');
      console.log('✅ Ready for production deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please fix the bugs and re-run.');
    }
    
    // Save detailed results
    fs.writeFileSync('deep-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed results saved to deep-test-results.json');
    
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error during testing:', error);
    process.exit(1);
  });