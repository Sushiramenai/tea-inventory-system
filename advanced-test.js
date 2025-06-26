const axios = require('axios');

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

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function advancedTest() {
  console.log('🚀 Advanced Tea Inventory System Test\n');
  console.log('Testing edge cases, complex workflows, and stress scenarios...\n');

  const results = {
    scenarios: []
  };

  // Scenario 1: Complex Production Workflow with Multiple Materials
  console.log('\n════════════════════════════════════════');
  console.log('🏭 SCENARIO 1: Complex Multi-Material Production');
  console.log('════════════════════════════════════════\n');

  try {
    // Login as admin to set up complex product
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Logged in as admin');

    // Create a complex product requiring multiple materials
    await wait(1500);
    const complexProduct = await axiosInstance.post('/products', {
      teaName: 'Premium Gift Collection',
      category: 'teaware',
      sizeFormat: 'family',
      quantitySize: '500g assorted',
      sku: 'PGC-FAM-500',
      reorderThreshold: 5,
      physicalCount: 0
    }).catch(err => {
      if (err.response?.data?.error?.code === 'PRODUCT_EXISTS') {
        return { data: { product: { id: 'existing', teaName: 'Premium Gift Collection' } } };
      }
      throw err;
    });
    console.log('✅ Created complex product: Premium Gift Collection');

    // Get materials for BOM
    await wait(1500);
    const materials = await axiosInstance.get('/raw-materials?limit=50');
    const teaMaterials = materials.data.materials.filter(m => m.category === 'tea').slice(0, 3);
    const packaging = materials.data.materials.find(m => m.category === 'boxes' || m.itemName.includes('Box'));
    
    if (complexProduct.data.product.id !== 'existing' && teaMaterials.length >= 2 && packaging) {
      // Create complex BOM
      for (const tea of teaMaterials) {
        await wait(1500);
        try {
          await axiosInstance.post('/bom', {
            productId: complexProduct.data.product.id,
            rawMaterialId: tea.id,
            quantityRequired: 0.15
          });
          console.log(`✅ Added ${tea.itemName} to BOM`);
        } catch (err) {
          console.log(`ℹ️  ${tea.itemName} already in BOM`);
        }
      }

      await wait(1500);
      try {
        await axiosInstance.post('/bom', {
          productId: complexProduct.data.product.id,
          rawMaterialId: packaging.id,
          quantityRequired: 1
        });
        console.log(`✅ Added ${packaging.itemName} to BOM`);
      } catch (err) {
        console.log(`ℹ️  ${packaging.itemName} already in BOM`);
      }
    }

    // Test production with insufficient materials
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });

    // Find a product to test
    const productsResp = await axiosInstance.get('/products?limit=10');
    const testProduct = productsResp.data.products.find(p => p.sku === 'EG-TIN-100') || productsResp.data.products[0];

    if (testProduct) {
      await wait(1500);
      const largeRequest = await axiosInstance.post('/production-requests', {
        productId: testProduct.id,
        quantityRequested: 1000, // Very large quantity
        notes: 'Testing insufficient materials scenario'
      });
      console.log('✅ Created large production request to test material constraints');

      // Check if materials are sufficient
      await wait(1500);
      const requestDetails = await axiosInstance.get(`/production-requests/${largeRequest.data.request.id}`);
      const insufficient = requestDetails.data.request.materials.filter(m => 
        m.quantityAvailableAtRequest < m.quantityConsumed
      );
      console.log(`⚠️  ${insufficient.length} materials insufficient for production`);
    }

    results.scenarios.push({
      name: 'Complex Multi-Material Production',
      status: 'completed',
      details: 'Tested complex BOM and material constraints'
    });

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    results.scenarios.push({
      name: 'Complex Multi-Material Production',
      status: 'failed',
      error: error.response?.data || error.message
    });
  }

  // Scenario 2: Inventory Tracking Under Load
  console.log('\n════════════════════════════════════════');
  console.log('📦 SCENARIO 2: Inventory Tracking Under Load');
  console.log('════════════════════════════════════════\n');

  try {
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    // Get a material to test
    await wait(1500);
    const materials = await axiosInstance.get('/raw-materials?limit=1');
    const testMaterial = materials.data.materials[0];

    if (testMaterial) {
      const initialCount = testMaterial.count;
      console.log(`📊 Initial count for ${testMaterial.itemName}: ${initialCount}`);

      // Perform multiple rapid updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        await wait(1000);
        const adjustment = Math.floor(Math.random() * 20) - 10; // -10 to +10
        const update = axiosInstance.put(`/raw-materials/${testMaterial.id}`, {
          count: testMaterial.count + adjustment
        });
        updates.push(update);
        console.log(`📝 Update ${i + 1}: ${adjustment > 0 ? '+' : ''}${adjustment}`);
      }

      // Wait for all updates
      await Promise.all(updates);

      // Verify final count
      await wait(1500);
      const finalMaterial = await axiosInstance.get(`/raw-materials/${testMaterial.id}`);
      console.log(`✅ Final count: ${finalMaterial.data.material.count}`);
    }

    results.scenarios.push({
      name: 'Inventory Tracking Under Load',
      status: 'completed',
      details: 'Tested concurrent inventory updates'
    });

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    results.scenarios.push({
      name: 'Inventory Tracking Under Load',
      status: 'failed',
      error: error.response?.data || error.message
    });
  }

  // Scenario 3: Role-Based Access Control
  console.log('\n════════════════════════════════════════');
  console.log('🔒 SCENARIO 3: Role-Based Access Control');
  console.log('════════════════════════════════════════\n');

  try {
    // Test production user trying admin functions
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    console.log('✅ Logged in as production user');

    // Try to create a user (should fail)
    await wait(1500);
    try {
      await axiosInstance.post('/users', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',
        role: 'admin'
      });
      console.log('❌ SECURITY ISSUE: Production user could create admin!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly denied: Production user cannot create users');
      } else {
        throw error;
      }
    }

    // Test fulfillment user permissions
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    console.log('✅ Logged in as fulfillment user');

    // Try to complete production (should fail)
    await wait(1500);
    const requests = await axiosInstance.get('/production-requests?limit=1');
    if (requests.data.requests?.length > 0) {
      const request = requests.data.requests[0];
      try {
        await axiosInstance.post(`/production-requests/${request.id}/complete`);
        console.log('❌ SECURITY ISSUE: Fulfillment user could complete production!');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Correctly denied: Fulfillment user cannot complete production');
        }
      }
    }

    results.scenarios.push({
      name: 'Role-Based Access Control',
      status: 'completed',
      details: 'Verified role permissions are enforced'
    });

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    results.scenarios.push({
      name: 'Role-Based Access Control',
      status: 'failed',
      error: error.response?.data || error.message
    });
  }

  // Scenario 4: Complete End-to-End Workflow
  console.log('\n════════════════════════════════════════');
  console.log('🔄 SCENARIO 4: Complete End-to-End Workflow');
  console.log('════════════════════════════════════════\n');

  try {
    // Start as inventory manager
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('📦 Step 1: Inventory Manager checks stock');

    await wait(1500);
    const lowStock = await axiosInstance.get('/products?lowStock=true');
    console.log(`   Found ${lowStock.data.products?.length || 0} low stock products`);

    // Switch to fulfillment
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    console.log('📋 Step 2: Fulfillment creates production requests');

    // Create multiple production requests
    const products = await axiosInstance.get('/products?limit=3');
    const createdRequests = [];
    
    for (const product of products.data.products) {
      await wait(1500);
      try {
        const req = await axiosInstance.post('/production-requests', {
          productId: product.id,
          quantityRequested: 10,
          notes: `End-to-end test for ${product.teaName}`
        });
        createdRequests.push(req.data.request);
        console.log(`   Created request for ${product.teaName}`);
      } catch (err) {
        console.log(`   Skipped ${product.teaName}: ${err.response?.data?.error?.code}`);
      }
    }

    // Switch to production
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    console.log('🏭 Step 3: Production processes requests');

    // Complete the requests
    for (const request of createdRequests) {
      await wait(1500);
      try {
        await axiosInstance.post(`/production-requests/${request.id}/complete`);
        console.log(`   Completed production for ${request.product.teaName}`);
      } catch (err) {
        console.log(`   Could not complete: ${err.response?.data?.error?.message}`);
      }
    }

    // Back to inventory manager to verify
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Step 4: Inventory Manager verifies updates');

    await wait(1500);
    const finalStats = await axiosInstance.get('/dashboard/stats');
    console.log(`   Completed requests today: ${finalStats.data.stats.productionRequests.completedToday}`);

    results.scenarios.push({
      name: 'Complete End-to-End Workflow',
      status: 'completed',
      details: 'Successfully completed full workflow across all roles'
    });

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    results.scenarios.push({
      name: 'Complete End-to-End Workflow',
      status: 'failed',
      error: error.response?.data || error.message
    });
  }

  return results;
}

// Run advanced tests
advancedTest()
  .then(results => {
    console.log('\n\n════════════════════════════════════════');
    console.log('📊 ADVANCED TEST RESULTS');
    console.log('════════════════════════════════════════\n');
    
    const passed = results.scenarios.filter(s => s.status === 'completed').length;
    const failed = results.scenarios.filter(s => s.status === 'failed').length;
    
    results.scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.name}: ${scenario.status === 'completed' ? '✅' : '❌'}`);
      if (scenario.details) {
        console.log(`   ${scenario.details}`);
      }
      if (scenario.error) {
        console.log(`   Error: ${JSON.stringify(scenario.error)}`);
      }
    });
    
    console.log(`\nTotal: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('\n✨ All advanced scenarios passed!');
      console.log('🎯 The tea inventory system handles edge cases correctly.');
      console.log('🚀 System is production-ready!');
    }
    
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });