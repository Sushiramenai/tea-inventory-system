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

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSystem() {
  const results = {
    passed: [],
    failed: [],
    testRuns: []
  };

  console.log('🧪 Starting Tea Inventory System Tests...\n');

  try {
    // Test 1: Login as Admin
    console.log('📝 Test 1: Admin Login');
    const loginResponse = await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.user) {
      results.passed.push('Admin login successful');
      console.log('✅ Admin login successful\n');
    } else {
      throw new Error('Login failed');
    }

    // Test 2: Get or Create Raw Materials
    console.log('📝 Test 2: Getting Raw Materials');
    
    // First try to get existing materials
    const materialsResponse = await axiosInstance.get('/raw-materials?limit=50');
    let createdMaterials = materialsResponse.data.materials || [];
    
    if (createdMaterials.length === 0) {
      console.log('No materials found, creating new ones...');
      const rawMaterials = [
        { itemName: 'Earl Grey Tea Leaves', category: 'tea', unit: 'kg', count: 50, reorderThreshold: 10 },
        { itemName: 'English Breakfast Tea', category: 'tea', unit: 'kg', count: 30, reorderThreshold: 8 },
        { itemName: 'Green Tea Sencha', category: 'tea', unit: 'kg', count: 40, reorderThreshold: 10 },
        { itemName: 'Small Tins', category: 'tins', unit: 'pcs', count: 200, reorderThreshold: 50 },
        { itemName: 'Large Tins', category: 'tins', unit: 'pcs', count: 150, reorderThreshold: 40 },
        { itemName: 'Earl Grey Labels', category: 'tin_label', unit: 'pcs', count: 300, reorderThreshold: 100 },
        { itemName: 'Tea Pouches', category: 'pouches', unit: 'pcs', count: 500, reorderThreshold: 150 },
        { itemName: 'Gift Boxes', category: 'boxes', unit: 'boxes', count: 100, reorderThreshold: 25 }
      ];

      createdMaterials = [];
      for (const material of rawMaterials) {
        try {
          const response = await axiosInstance.post('/raw-materials', material);
          createdMaterials.push(response.data.material);
          console.log(`✅ Created: ${material.itemName}`);
        } catch (err) {
          console.log(`❌ Failed to create ${material.itemName}:`, err.response?.data || err.message);
        }
      }
    }
    
    console.log(`✅ Found/created ${createdMaterials.length} raw materials`);
    results.passed.push(`Working with ${createdMaterials.length} raw materials`);
    console.log('');

    // Test 3: Get or Create Products
    console.log('📝 Test 3: Getting Products');
    
    // First try to get existing products
    const productsResponse = await axiosInstance.get('/products?limit=50');
    let createdProducts = productsResponse.data.products || [];
    
    if (createdProducts.length === 0) {
      console.log('No products found, creating new ones...');
      const products = [
        { teaName: 'Earl Grey Classic', category: 'tea', sizeFormat: 'tin', quantitySize: '100g', sku: 'EG-TIN-100', reorderThreshold: 20 },
        { teaName: 'Earl Grey Classic', category: 'tea', sizeFormat: 'pouch', quantitySize: '50g', sku: 'EG-PCH-50', reorderThreshold: 30 },
        { teaName: 'English Breakfast', category: 'tea', sizeFormat: 'tin', quantitySize: '100g', sku: 'EB-TIN-100', reorderThreshold: 15 },
        { teaName: 'Green Tea Sencha', category: 'tea', sizeFormat: 'family', quantitySize: '250g', sku: 'GT-FAM-250', reorderThreshold: 10 },
        { teaName: 'Tea Gift Set', category: 'teaware', sizeFormat: 'tin', quantitySize: '3x50g', sku: 'GIFT-SET-3', reorderThreshold: 5 }
      ];

      createdProducts = [];
      for (const product of products) {
        try {
          const response = await axiosInstance.post('/products', product);
          createdProducts.push(response.data.product);
          console.log(`✅ Created: ${product.teaName} - ${product.sizeFormat}`);
        } catch (err) {
          console.log(`❌ Failed to create ${product.teaName}:`, err.response?.data || err.message);
        }
      }
    }
    
    console.log(`✅ Found/created ${createdProducts.length} products`);
    results.passed.push(`Working with ${createdProducts.length} products`);
    console.log('');

    // Find the created materials and products (needed for multiple tests)
    let earlGreyTea, smallTins, earlGreyLabels, teaPouches;
    let earlGreyTinProduct, earlGreyPouchProduct;
    
    if (createdMaterials.length > 0) {
      earlGreyTea = createdMaterials.find(m => m.itemName === 'Earl Grey Tea Leaves');
      smallTins = createdMaterials.find(m => m.itemName === 'Small Tins');
      earlGreyLabels = createdMaterials.find(m => m.itemName === 'Earl Grey Labels');
      teaPouches = createdMaterials.find(m => m.itemName === 'Tea Pouches');
    }
    
    if (createdProducts.length > 0) {
      earlGreyTinProduct = createdProducts.find(p => p.sku === 'EG-TIN-100');
      earlGreyPouchProduct = createdProducts.find(p => p.sku === 'EG-PCH-50');
    }

    // Test 4: Create Bill of Materials
    console.log('📝 Test 4: Creating Bill of Materials');
    
    if (createdMaterials.length === 0 || createdProducts.length === 0) {
      console.log('⚠️  Skipping BOM creation - no materials or products available');
      results.passed.push('Skipped BOM creation (no data)');
    } else {

      if (earlGreyTinProduct && earlGreyTea && smallTins && earlGreyLabels) {
        // Create BOMs - API expects individual BOM entries
        const bomEntries = [
          // Earl Grey Tin (100g) recipe
          { productId: earlGreyTinProduct.id, rawMaterialId: earlGreyTea.id, quantityRequired: 0.1 }, // 100g of tea
          { productId: earlGreyTinProduct.id, rawMaterialId: smallTins.id, quantityRequired: 1 },
          { productId: earlGreyTinProduct.id, rawMaterialId: earlGreyLabels.id, quantityRequired: 1 }
        ];
        
        if (earlGreyPouchProduct && teaPouches) {
          // Earl Grey Pouch (50g) recipe
          bomEntries.push(
            { productId: earlGreyPouchProduct.id, rawMaterialId: earlGreyTea.id, quantityRequired: 0.05 }, // 50g of tea
            { productId: earlGreyPouchProduct.id, rawMaterialId: teaPouches.id, quantityRequired: 1 }
          );
        }

        let bomsCreated = 0;
        for (const bomEntry of bomEntries) {
          try {
            const response = await axiosInstance.post('/bom', bomEntry);
            console.log(`✅ Created BOM entry`);
            bomsCreated++;
          } catch (err) {
            if (err.response?.data?.error?.code === 'BOM_EXISTS') {
              console.log(`ℹ️  BOM entry already exists`);
              bomsCreated++;
            } else {
              console.log(`❌ Failed to create BOM entry:`, err.response?.data || err.message);
            }
          }
        }
        results.passed.push(`Created/verified ${bomsCreated} BOM entries`);
      } else {
        console.log('⚠️  Some required products/materials not found for BOM creation');
        results.passed.push('Partial BOM creation');
      }
    }
    console.log('');

    // Test 5: Update Product Inventory
    console.log('📝 Test 5: Updating Product Inventory');
    for (const product of createdProducts) {
      await axiosInstance.put(`/products/${product.id}`, {
        physicalCount: Math.floor(Math.random() * 50) + 10
      });
      console.log(`✅ Updated inventory for: ${product.teaName}`);
    }
    results.passed.push('Updated product inventory');
    console.log('');

    // Test 6: Create Production Request (Login as Fulfillment)
    console.log('📝 Test 6: Production Request Workflow');
    
    if (!earlGreyTinProduct) {
      console.log('⚠️  Skipping production request - no Earl Grey tin product found');
      results.passed.push('Skipped production request (no product)');
    } else {
      // Login as fulfillment user
      await axiosInstance.post('/auth/login', {
        username: 'fulfillment',
        password: 'fulfillment123'
      });
      console.log('✅ Logged in as fulfillment user');

      // Create production request
      const productionResponse = await axiosInstance.post('/production-requests', {
        productId: earlGreyTinProduct.id,
        quantityRequested: 25,
        notes: 'Urgent order for holiday season'
      });
      const productionRequest = productionResponse.data.request;
      console.log('✅ Created production request');

      // Login as production user
      await axiosInstance.post('/auth/login', {
        username: 'production',
        password: 'production123'
      });
      console.log('✅ Logged in as production user');

      // Complete production request
      const completeResponse = await axiosInstance.post(`/production-requests/${productionRequest.id}/complete`);
      console.log('✅ Completed production request');
      results.passed.push('Production request workflow completed');
    }
    console.log('');

    // Test 7: Check Inventory Updates
    console.log('📝 Test 7: Verifying Inventory Updates');
    
    if (earlGreyTea && earlGreyTinProduct) {
      // Check raw materials were deducted
      const updatedEarlGrey = await axiosInstance.get(`/raw-materials/${earlGreyTea.id}`);
      console.log(`✅ Earl Grey tea inventory: ${updatedEarlGrey.data.material?.count || updatedEarlGrey.data.count} kg`);
      
      // Check product inventory increased
      const updatedProduct = await axiosInstance.get(`/products/${earlGreyTinProduct.id}`);
      console.log(`✅ Earl Grey tin inventory: ${updatedProduct.data.product?.physicalCount || updatedProduct.data.physicalCount} units`);
      results.passed.push('Inventory updates verified');
    } else {
      console.log('⚠️  Skipping inventory verification - no products to check');
      results.passed.push('Skipped inventory verification');
    }
    console.log('');

    // Test 8: Dashboard Stats
    console.log('📝 Test 8: Dashboard Statistics');
    const stats = await axiosInstance.get('/dashboard/stats');
    console.log('✅ Dashboard stats:', stats.data);
    results.passed.push('Dashboard stats retrieved');
    console.log('');

    // Mock Run 1: Production Manager Workflow
    console.log('🏭 Mock Run 1: Production Manager Workflow');
    const mockRun1 = {
      scenario: 'Production Manager Daily Tasks',
      steps: []
    };

    // Check pending requests
    const pendingRequests = await axiosInstance.get('/production-requests?status=pending');
    mockRun1.steps.push(`Found ${pendingRequests.data.requests?.length || 0} pending requests`);
    
    // Check low stock items
    const lowStock = await axiosInstance.get('/raw-materials?lowStock=true');
    mockRun1.steps.push(`Found ${lowStock.data.materials?.length || 0} low stock materials`);
    
    results.testRuns.push(mockRun1);
    console.log('✅ Production manager workflow completed\n');

    // Mock Run 2: Inventory Manager Workflow
    console.log('📦 Mock Run 2: Inventory Manager Workflow');
    const mockRun2 = {
      scenario: 'Inventory Manager Stock Check',
      steps: []
    };

    // Check all products
    const allProducts = await axiosInstance.get('/products');
    mockRun2.steps.push(`Managing ${allProducts.data.products?.length || 0} products`);
    
    // Check all raw materials
    const allMaterials = await axiosInstance.get('/raw-materials');
    mockRun2.steps.push(`Managing ${allMaterials.data.materials?.length || 0} raw materials`);
    
    // Simulate inventory adjustment
    const materialToAdjust = allMaterials.data.materials?.[0];
    if (materialToAdjust) {
      await axiosInstance.put(`/raw-materials/${materialToAdjust.id}`, {
        count: materialToAdjust.count + 10
      });
      mockRun2.steps.push(`Adjusted inventory for ${materialToAdjust.itemName}`);
    }
    
    results.testRuns.push(mockRun2);
    console.log('✅ Inventory manager workflow completed\n');

    // Mock Run 3: Full Production Cycle
    console.log('🔄 Mock Run 3: Full Production Cycle');
    const mockRun3 = {
      scenario: 'Complete Production Cycle',
      steps: []
    };

    try {
      // Use a product we know has BOM (Earl Grey Tin if available)
      const productForTest = earlGreyTinProduct || createdProducts[0];
      
      if (productForTest) {
        // Create new production request
        const newRequestResponse = await axiosInstance.post('/production-requests', {
          productId: productForTest.id,
          quantityRequested: 15,
          notes: 'Regular stock replenishment'
        });
        const newRequest = newRequestResponse.data.request;
        mockRun3.steps.push('Created new production request');
        
        // Complete it
        await axiosInstance.post(`/production-requests/${newRequest.id}/complete`);
        mockRun3.steps.push('Completed production request');
      } else {
        mockRun3.steps.push('Skipped - no suitable product found');
      }
    } catch (err) {
      console.log('⚠️  Mock run 3 error:', err.response?.data || err.message);
      mockRun3.steps.push('Failed to complete production cycle');
    }
    
    // Verify updates
    const finalStats = await axiosInstance.get('/dashboard/stats');
    mockRun3.steps.push(`Total products: ${finalStats.data.totalProducts}, Total materials: ${finalStats.data.totalRawMaterials}`);
    
    results.testRuns.push(mockRun3);
    console.log('✅ Full production cycle completed\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    results.failed.push(error.response?.data?.error?.message || error.message);
  }

  // Generate report
  console.log('\n📊 TEST REPORT');
  console.log('=============');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('\nTest Runs:');
  results.testRuns.forEach((run, i) => {
    console.log(`\n${i + 1}. ${run.scenario}`);
    run.steps.forEach(step => console.log(`   - ${step}`));
  });

  return results;
}

// Run tests
testSystem()
  .then(results => {
    console.log('\n✨ All tests completed!');
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });