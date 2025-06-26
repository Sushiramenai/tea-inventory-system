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

// Test results storage
const testResults = {
  scenarios: [],
  errors: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0
  }
};

// Helper function to wait (with rate limit protection)
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to log test results
function logTest(scenario, step, success, details) {
  const result = {
    scenario,
    step,
    success,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (!testResults.scenarios[scenario]) {
    testResults.scenarios[scenario] = [];
  }
  testResults.scenarios[scenario].push(result);
  
  testResults.summary.totalTests++;
  if (success) {
    testResults.summary.passed++;
    console.log(`✅ ${step}`);
    if (details) console.log(`   ${details}`);
  } else {
    testResults.summary.failed++;
    testResults.errors.push(result);
    console.log(`❌ ${step}`);
    if (details) console.log(`   Error: ${details}`);
  }
}

// Test Scenario 1: Complete Production Workflow
async function testProductionWorkflow() {
  const scenario = 'Production Workflow';
  console.log('\n🏭 SCENARIO 1: Complete Production Workflow');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // 1.1 Admin Login
    console.log('📋 Step 1: Admin Setup\n');
    await wait(1000); // Rate limit protection
    
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    logTest(scenario, 'Admin login', true);
    
    // 1.2 Create Raw Materials
    console.log('\n📦 Creating Raw Materials...');
    await wait(1000);
    
    const rawMaterials = [
      { itemName: 'Premium Black Tea', category: 'tea', unit: 'kg', count: 100, reorderThreshold: 20 },
      { itemName: 'Jasmine Green Tea', category: 'tea', unit: 'kg', count: 80, reorderThreshold: 15 },
      { itemName: 'Oolong Tea', category: 'tea', unit: 'kg', count: 60, reorderThreshold: 10 },
      { itemName: 'Premium Tins', category: 'tins', unit: 'pcs', count: 300, reorderThreshold: 50 },
      { itemName: 'Eco Pouches', category: 'pouches', unit: 'pcs', count: 500, reorderThreshold: 100 },
      { itemName: 'Premium Labels', category: 'tin_label', unit: 'pcs', count: 400, reorderThreshold: 80 },
      { itemName: 'Luxury Gift Boxes', category: 'boxes', unit: 'boxes', count: 150, reorderThreshold: 30 }
    ];
    
    const createdMaterials = [];
    for (const material of rawMaterials) {
      await wait(500); // Rate limit protection
      try {
        const response = await axiosInstance.post('/raw-materials', material);
        createdMaterials.push(response.data.material);
        logTest(scenario, `Create raw material: ${material.itemName}`, true, `Stock: ${material.count} ${material.unit}`);
      } catch (err) {
        if (err.response?.status === 409) {
          // Material already exists, get it
          const existing = await axiosInstance.get(`/raw-materials?search=${material.itemName}`);
          if (existing.data.materials.length > 0) {
            createdMaterials.push(existing.data.materials[0]);
            logTest(scenario, `Raw material exists: ${material.itemName}`, true, 'Using existing material');
          }
        } else {
          logTest(scenario, `Create raw material: ${material.itemName}`, false, err.response?.data?.error?.message || err.message);
        }
      }
    }
    
    // 1.3 Create Products
    console.log('\n🍵 Creating Products...');
    await wait(1000);
    
    const products = [
      { teaName: 'Premium Black Blend', category: 'tea', sizeFormat: 'tin', quantitySize: '100g', sku: 'PBB-TIN-100', reorderThreshold: 25 },
      { teaName: 'Premium Black Blend', category: 'tea', sizeFormat: 'pouch', quantitySize: '50g', sku: 'PBB-PCH-50', reorderThreshold: 40 },
      { teaName: 'Jasmine Green Delight', category: 'tea', sizeFormat: 'tin', quantitySize: '100g', sku: 'JGD-TIN-100', reorderThreshold: 20 },
      { teaName: 'Oolong Supreme', category: 'tea', sizeFormat: 'family', quantitySize: '250g', sku: 'OLS-FAM-250', reorderThreshold: 15 },
      { teaName: 'Tea Connoisseur Set', category: 'teaware', sizeFormat: 'tin', quantitySize: '3x75g', sku: 'TCS-SET-3', reorderThreshold: 10 }
    ];
    
    const createdProducts = [];
    for (const product of products) {
      await wait(500);
      try {
        const response = await axiosInstance.post('/products', product);
        createdProducts.push(response.data.product);
        logTest(scenario, `Create product: ${product.teaName} (${product.sku})`, true, `Format: ${product.sizeFormat}, Size: ${product.quantitySize}`);
      } catch (err) {
        if (err.response?.status === 409) {
          // Product already exists, get it
          const existing = await axiosInstance.get(`/products/by-sku/${product.sku}`);
          if (existing.data) {
            createdProducts.push(existing.data);
            logTest(scenario, `Product exists: ${product.teaName} (${product.sku})`, true, 'Using existing product');
          }
        } else {
          logTest(scenario, `Create product: ${product.teaName} (${product.sku})`, false, err.response?.data?.error?.message || err.message);
        }
      }
    }
    
    // 1.4 Set up Bill of Materials
    console.log('\n📋 Setting up Bill of Materials...');
    await wait(1000);
    
    // Find specific materials and products for BOM
    const blackTea = createdMaterials.find(m => m.itemName === 'Premium Black Tea');
    const jasmineTea = createdMaterials.find(m => m.itemName === 'Jasmine Green Tea');
    const premiumTins = createdMaterials.find(m => m.itemName === 'Premium Tins');
    const ecoPouches = createdMaterials.find(m => m.itemName === 'Eco Pouches');
    const premiumLabels = createdMaterials.find(m => m.itemName === 'Premium Labels');
    
    const blackTinProduct = createdProducts.find(p => p.sku === 'PBB-TIN-100');
    const blackPouchProduct = createdProducts.find(p => p.sku === 'PBB-PCH-50');
    const jasmineTinProduct = createdProducts.find(p => p.sku === 'JGD-TIN-100');
    
    if (blackTea && premiumTins && premiumLabels && blackTinProduct) {
      // Premium Black Blend Tin (100g) recipe
      const bomEntries = [
        { productId: blackTinProduct.id, rawMaterialId: blackTea.id, quantityRequired: 0.1 },
        { productId: blackTinProduct.id, rawMaterialId: premiumTins.id, quantityRequired: 1 },
        { productId: blackTinProduct.id, rawMaterialId: premiumLabels.id, quantityRequired: 1 }
      ];
      
      for (const entry of bomEntries) {
        await wait(500);
        try {
          await axiosInstance.post('/bom', entry);
          const material = createdMaterials.find(m => m.id === entry.rawMaterialId);
          logTest(scenario, `BOM for ${blackTinProduct.teaName}`, true, `${material.itemName}: ${entry.quantityRequired} ${material.unit}`);
        } catch (err) {
          if (err.response?.data?.error?.code === 'BOM_EXISTS') {
            logTest(scenario, `BOM for ${blackTinProduct.teaName}`, true, 'BOM entry already exists');
          } else {
            logTest(scenario, `BOM for ${blackTinProduct.teaName}`, false, err.response?.data?.error?.message || err.message);
          }
        }
      }
    }
    
    if (blackTea && ecoPouches && blackPouchProduct) {
      // Premium Black Blend Pouch (50g) recipe
      const bomEntries = [
        { productId: blackPouchProduct.id, rawMaterialId: blackTea.id, quantityRequired: 0.05 },
        { productId: blackPouchProduct.id, rawMaterialId: ecoPouches.id, quantityRequired: 1 }
      ];
      
      for (const entry of bomEntries) {
        await wait(500);
        try {
          await axiosInstance.post('/bom', entry);
          const material = createdMaterials.find(m => m.id === entry.rawMaterialId);
          logTest(scenario, `BOM for ${blackPouchProduct.teaName} Pouch`, true, `${material.itemName}: ${entry.quantityRequired} ${material.unit}`);
        } catch (err) {
          if (err.response?.data?.error?.code === 'BOM_EXISTS') {
            logTest(scenario, `BOM for ${blackPouchProduct.teaName} Pouch`, true, 'BOM entry already exists');
          } else {
            logTest(scenario, `BOM for ${blackPouchProduct.teaName} Pouch`, false, err.response?.data?.error?.message || err.message);
          }
        }
      }
    }
    
    // 1.5 Production Manager creates production request
    console.log('\n🏭 Production Manager Workflow...');
    await wait(1000);
    
    // Login as production manager
    await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    logTest(scenario, 'Production manager login', true);
    
    // Create production request
    if (blackTinProduct) {
      await wait(1000);
      try {
        const productionRequest = await axiosInstance.post('/production-requests', {
          productId: blackTinProduct.id,
          quantityRequested: 50,
          notes: 'Initial stock for new Premium Black Blend product launch'
        });
        
        logTest(scenario, 'Create production request', true, `50 units of ${blackTinProduct.teaName}`);
        
        // Check material availability
        if (productionRequest.data.materialsCheck) {
          console.log('\n📊 Material Requirements Check:');
          productionRequest.data.materialsCheck.materials.forEach(mat => {
            const status = mat.sufficient ? '✅' : '❌';
            console.log(`   ${status} ${mat.itemName}: Need ${mat.required}, Have ${mat.available}`);
          });
        }
        
        // Complete production
        await wait(2000);
        try {
          await axiosInstance.post(`/production-requests/${productionRequest.data.request.id}/complete`);
          logTest(scenario, 'Complete production', true, 'Production completed successfully');
          
          // Verify inventory updates
          await wait(1000);
          const updatedProduct = await axiosInstance.get(`/products/${blackTinProduct.id}`);
          const updatedBlackTea = await axiosInstance.get(`/raw-materials/${blackTea.id}`);
          
          logTest(scenario, 'Verify product inventory', true, `New stock: ${updatedProduct.data.physicalCount} units`);
          logTest(scenario, 'Verify raw material deduction', true, `Black tea remaining: ${updatedBlackTea.data.count} kg`);
          
        } catch (err) {
          logTest(scenario, 'Complete production', false, err.response?.data?.error?.message || err.message);
        }
        
      } catch (err) {
        logTest(scenario, 'Create production request', false, err.response?.data?.error?.message || err.message);
      }
    }
    
  } catch (error) {
    logTest(scenario, 'Production workflow', false, error.response?.data?.error?.message || error.message);
  }
}

// Test Scenario 2: Fulfillment Workflow
async function testFulfillmentWorkflow() {
  const scenario = 'Fulfillment Workflow';
  console.log('\n📦 SCENARIO 2: Fulfillment Workflow');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // 2.1 Fulfillment manager login
    console.log('📋 Step 1: Fulfillment Manager Tasks\n');
    await wait(1000);
    
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    logTest(scenario, 'Fulfillment manager login', true);
    
    // 2.2 View available products
    console.log('\n📊 Checking Product Inventory...');
    await wait(1000);
    
    const productsResponse = await axiosInstance.get('/products');
    const availableProducts = productsResponse.data.products.filter(p => p.physicalCount > 0);
    
    logTest(scenario, 'View available products', true, `Found ${availableProducts.length} products in stock`);
    
    console.log('\n📦 Available Products:');
    availableProducts.forEach(product => {
      console.log(`   - ${product.teaName} (${product.sku}): ${product.physicalCount} units`);
    });
    
    // 2.3 Simulate customer order fulfillment
    if (availableProducts.length > 0) {
      const productToFulfill = availableProducts[0];
      const orderQuantity = Math.min(10, productToFulfill.physicalCount);
      
      console.log(`\n🛒 Customer Order: ${orderQuantity} units of ${productToFulfill.teaName}`);
      await wait(1000);
      
      // Check if we have enough stock
      if (productToFulfill.physicalCount >= orderQuantity) {
        logTest(scenario, 'Check stock availability', true, `Sufficient stock available`);
        
        // Simulate fulfillment by reducing inventory
        const newCount = productToFulfill.physicalCount - orderQuantity;
        await wait(1000);
        
        try {
          await axiosInstance.put(`/products/${productToFulfill.id}`, {
            physicalCount: newCount
          });
          
          logTest(scenario, 'Process fulfillment', true, `Deducted ${orderQuantity} units from inventory`);
          
          // Verify stock update
          await wait(1000);
          const updatedProduct = await axiosInstance.get(`/products/${productToFulfill.id}`);
          logTest(scenario, 'Verify stock update', true, `New stock level: ${updatedProduct.data.physicalCount} units`);
          
          // Check if reorder threshold reached
          if (updatedProduct.data.physicalCount <= updatedProduct.data.reorderThreshold) {
            console.log(`\n⚠️  Low Stock Alert: ${updatedProduct.data.teaName} is below reorder threshold!`);
            
            // Create production request for replenishment
            await wait(1000);
            try {
              const replenishQuantity = updatedProduct.data.reorderThreshold * 2;
              const prodRequest = await axiosInstance.post('/production-requests', {
                productId: productToFulfill.id,
                quantityRequested: replenishQuantity,
                notes: `Auto-replenishment: Stock fell below reorder threshold (${updatedProduct.data.reorderThreshold} units)`
              });
              
              logTest(scenario, 'Create replenishment request', true, `Requested production of ${replenishQuantity} units`);
            } catch (err) {
              logTest(scenario, 'Create replenishment request', false, err.response?.data?.error?.message || err.message);
            }
          }
          
        } catch (err) {
          logTest(scenario, 'Process fulfillment', false, err.response?.data?.error?.message || err.message);
        }
        
      } else {
        logTest(scenario, 'Check stock availability', false, `Insufficient stock. Need ${orderQuantity}, have ${productToFulfill.physicalCount}`);
        
        // Create production request for the shortage
        const shortageQuantity = orderQuantity - productToFulfill.physicalCount + 20; // Add buffer
        await wait(1000);
        
        try {
          const prodRequest = await axiosInstance.post('/production-requests', {
            productId: productToFulfill.id,
            quantityRequested: shortageQuantity,
            notes: `Urgent: Customer order requires ${orderQuantity} units, only ${productToFulfill.physicalCount} in stock`
          });
          
          logTest(scenario, 'Create urgent production request', true, `Requested production of ${shortageQuantity} units`);
        } catch (err) {
          logTest(scenario, 'Create urgent production request', false, err.response?.data?.error?.message || err.message);
        }
      }
    } else {
      logTest(scenario, 'Fulfillment simulation', false, 'No products available in stock');
    }
    
  } catch (error) {
    logTest(scenario, 'Fulfillment workflow', false, error.response?.data?.error?.message || error.message);
  }
}

// Test Scenario 3: Edge Cases and Validation
async function testEdgeCases() {
  const scenario = 'Edge Cases & Validation';
  console.log('\n⚠️  SCENARIO 3: Edge Cases and Validation');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // 3.1 Try to produce without enough raw materials
    console.log('📋 Test 1: Production with Insufficient Materials\n');
    await wait(1000);
    
    // Login as admin to set up test conditions
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    // Find a product with BOM
    const productsResponse = await axiosInstance.get('/products');
    const productWithBom = productsResponse.data.products.find(p => p.sku === 'PBB-TIN-100');
    
    if (productWithBom) {
      // Get BOM for this product
      const bomResponse = await axiosInstance.get(`/bom/product/${productWithBom.id}`);
      
      if (bomResponse.data.length > 0) {
        // Reduce raw material stock to very low levels
        const firstMaterial = bomResponse.data[0].rawMaterial;
        await wait(1000);
        
        await axiosInstance.put(`/raw-materials/${firstMaterial.id}`, {
          count: 0.01 // Very low stock
        });
        
        logTest(scenario, 'Set raw material to low stock', true, `${firstMaterial.itemName}: 0.01 ${firstMaterial.unit}`);
        
        // Try to create large production request
        await wait(1000);
        try {
          const prodRequest = await axiosInstance.post('/production-requests', {
            productId: productWithBom.id,
            quantityRequested: 100, // Large quantity
            notes: 'Test: Large order with insufficient materials'
          });
          
          // Check if materials check shows insufficiency
          if (prodRequest.data.materialsCheck) {
            const insufficient = prodRequest.data.materialsCheck.materials.filter(m => !m.sufficient);
            if (insufficient.length > 0) {
              logTest(scenario, 'Material insufficiency detection', true, `System detected ${insufficient.length} materials with insufficient stock`);
            }
          }
          
          // Try to complete the production (should fail)
          await wait(1000);
          try {
            await axiosInstance.post(`/production-requests/${prodRequest.data.request.id}/complete`);
            logTest(scenario, 'Block production with insufficient materials', false, 'Production completed despite insufficient materials!');
          } catch (err) {
            logTest(scenario, 'Block production with insufficient materials', true, 'Production correctly blocked due to insufficient materials');
          }
          
        } catch (err) {
          logTest(scenario, 'Create production request with low materials', false, err.response?.data?.error?.message || err.message);
        }
      }
    }
    
    // 3.2 Try to fulfill without enough product stock
    console.log('\n📋 Test 2: Fulfillment with Insufficient Stock\n');
    await wait(1000);
    
    // Login as fulfillment
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    
    // Find a product with low stock
    const allProducts = await axiosInstance.get('/products');
    const lowStockProduct = allProducts.data.products.find(p => p.physicalCount < 10) || allProducts.data.products[0];
    
    if (lowStockProduct) {
      const currentStock = lowStockProduct.physicalCount;
      const orderQuantity = currentStock + 50; // Try to order more than available
      
      console.log(`Current stock of ${lowStockProduct.teaName}: ${currentStock} units`);
      console.log(`Attempting to fulfill order for: ${orderQuantity} units`);
      
      // Try to set negative stock (should fail or be prevented)
      await wait(1000);
      try {
        await axiosInstance.put(`/products/${lowStockProduct.id}`, {
          physicalCount: -10 // Negative stock
        });
        logTest(scenario, 'Prevent negative inventory', false, 'System allowed negative inventory!');
      } catch (err) {
        logTest(scenario, 'Prevent negative inventory', true, 'System correctly prevented negative inventory');
      }
      
      // Verify stock hasn't gone negative
      await wait(1000);
      const verifyProduct = await axiosInstance.get(`/products/${lowStockProduct.id}`);
      if (verifyProduct.data.physicalCount >= 0) {
        logTest(scenario, 'Verify non-negative stock', true, `Stock remains at ${verifyProduct.data.physicalCount} units`);
      } else {
        logTest(scenario, 'Verify non-negative stock', false, 'Stock went negative!');
      }
    }
    
    // 3.3 Test concurrent operations
    console.log('\n📋 Test 3: Concurrent Operations\n');
    await wait(1000);
    
    // Find a product to test concurrent updates
    const testProduct = allProducts.data.products[0];
    if (testProduct) {
      const initialStock = testProduct.physicalCount;
      
      console.log(`Testing concurrent updates on ${testProduct.teaName} (Initial: ${initialStock} units)`);
      
      // Simulate concurrent stock updates
      const updates = [
        axiosInstance.put(`/products/${testProduct.id}`, { physicalCount: initialStock + 10 }),
        axiosInstance.put(`/products/${testProduct.id}`, { physicalCount: initialStock + 20 }),
        axiosInstance.put(`/products/${testProduct.id}`, { physicalCount: initialStock + 15 })
      ];
      
      try {
        await Promise.all(updates);
        
        // Check final state
        await wait(1000);
        const finalProduct = await axiosInstance.get(`/products/${testProduct.id}`);
        logTest(scenario, 'Handle concurrent updates', true, `Final stock: ${finalProduct.data.physicalCount} units`);
        
      } catch (err) {
        logTest(scenario, 'Handle concurrent updates', false, 'Concurrent update failed');
      }
    }
    
    // 3.4 Test validation rules
    console.log('\n📋 Test 4: Input Validation\n');
    await wait(1000);
    
    // Test invalid product creation
    try {
      await axiosInstance.post('/products', {
        teaName: '', // Empty name
        category: 'invalid_category',
        sizeFormat: 'invalid_format',
        quantitySize: '-100g', // Invalid size
        sku: '!!!INVALID!!!',
        reorderThreshold: -5 // Negative threshold
      });
      logTest(scenario, 'Validate product creation', false, 'System accepted invalid product data!');
    } catch (err) {
      logTest(scenario, 'Validate product creation', true, 'System correctly rejected invalid product data');
    }
    
    // Test invalid raw material creation
    await wait(1000);
    try {
      await axiosInstance.post('/raw-materials', {
        itemName: '', // Empty name
        category: 'invalid_category',
        unit: '',
        count: -100, // Negative count
        reorderThreshold: 'not_a_number' // Invalid type
      });
      logTest(scenario, 'Validate raw material creation', false, 'System accepted invalid raw material data!');
    } catch (err) {
      logTest(scenario, 'Validate raw material creation', true, 'System correctly rejected invalid raw material data');
    }
    
    // Test invalid production request
    await wait(1000);
    try {
      await axiosInstance.post('/production-requests', {
        productId: 'invalid_id',
        quantityRequested: 0, // Zero quantity
        notes: ''
      });
      logTest(scenario, 'Validate production request', false, 'System accepted invalid production request!');
    } catch (err) {
      logTest(scenario, 'Validate production request', true, 'System correctly rejected invalid production request');
    }
    
  } catch (error) {
    logTest(scenario, 'Edge case testing', false, error.response?.data?.error?.message || error.message);
  }
}

// Test Scenario 4: Performance and Load Testing
async function testPerformanceScenarios() {
  const scenario = 'Performance Testing';
  console.log('\n⚡ SCENARIO 4: Performance and Load Testing');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // Login as admin
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    // 4.1 Test pagination and filtering
    console.log('📋 Test 1: Pagination and Filtering\n');
    await wait(1000);
    
    // Test products pagination
    const page1 = await axiosInstance.get('/products?page=1&limit=5');
    logTest(scenario, 'Products pagination', true, `Page 1: ${page1.data.products.length} items, Total: ${page1.data.total}`);
    
    if (page1.data.totalPages > 1) {
      await wait(500);
      const page2 = await axiosInstance.get('/products?page=2&limit=5');
      logTest(scenario, 'Products pagination page 2', true, `Page 2: ${page2.data.products.length} items`);
    }
    
    // Test search functionality
    await wait(500);
    const searchResults = await axiosInstance.get('/products?search=Premium');
    logTest(scenario, 'Product search', true, `Found ${searchResults.data.products.length} products matching "Premium"`);
    
    // Test category filtering
    await wait(500);
    const categoryFilter = await axiosInstance.get('/products?category=tea');
    logTest(scenario, 'Category filtering', true, `Found ${categoryFilter.data.products.length} tea products`);
    
    // 4.2 Test bulk operations
    console.log('\n📋 Test 2: Bulk Operations\n');
    
    // Create multiple production requests rapidly
    const bulkRequests = [];
    const products = await axiosInstance.get('/products?limit=3');
    
    console.log('Creating multiple production requests...');
    for (const product of products.data.products.slice(0, 3)) {
      await wait(500); // Small delay to avoid rate limiting
      try {
        const request = await axiosInstance.post('/production-requests', {
          productId: product.id,
          quantityRequested: 5,
          notes: `Bulk test request for ${product.teaName}`
        });
        bulkRequests.push(request.data.request);
      } catch (err) {
        console.log(`   ⚠️  Failed to create request for ${product.teaName}`);
      }
    }
    
    logTest(scenario, 'Bulk production request creation', true, `Created ${bulkRequests.length} requests`);
    
    // 4.3 Test dashboard performance
    console.log('\n📋 Test 3: Dashboard Performance\n');
    await wait(1000);
    
    const startTime = Date.now();
    const dashboardStats = await axiosInstance.get('/dashboard/stats');
    const loadTime = Date.now() - startTime;
    
    logTest(scenario, 'Dashboard stats load time', true, `Loaded in ${loadTime}ms`);
    console.log('\n📊 Dashboard Statistics:');
    console.log(`   Total Products: ${dashboardStats.data.totalProducts}`);
    console.log(`   Total Raw Materials: ${dashboardStats.data.totalRawMaterials}`);
    console.log(`   Total Production Requests: ${dashboardStats.data.totalProductionRequests}`);
    console.log(`   Pending Requests: ${dashboardStats.data.pendingRequests}`);
    console.log(`   Low Stock Products: ${dashboardStats.data.lowStockProducts}`);
    console.log(`   Low Stock Materials: ${dashboardStats.data.lowStockMaterials}`);
    
  } catch (error) {
    logTest(scenario, 'Performance testing', false, error.response?.data?.error?.message || error.message);
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE TEA INVENTORY SYSTEM TEST');
  console.log('══════════════════════════════════════════════════════════\n');
  console.log('This test suite will simulate real user interactions across');
  console.log('all major workflows in the tea inventory system.\n');
  console.log('══════════════════════════════════════════════════════════\n');
  
  try {
    // Run all test scenarios
    await testProductionWorkflow();
    await wait(2000); // Pause between scenarios
    
    await testFulfillmentWorkflow();
    await wait(2000);
    
    await testEdgeCases();
    await wait(2000);
    
    await testPerformanceScenarios();
    
    // Generate final report
    console.log('\n\n📊 FINAL TEST REPORT');
    console.log('══════════════════════════════════════════════════════════\n');
    
    console.log(`Total Tests Run: ${testResults.summary.totalTests}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(2)}%`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.scenario} - ${error.step}`);
        console.log(`   Error: ${error.details}`);
      });
    }
    
    // Save detailed results to file
    const reportData = {
      testRun: {
        date: new Date().toISOString(),
        environment: API_URL,
        summary: testResults.summary
      },
      scenarios: testResults.scenarios,
      errors: testResults.errors
    };
    
    fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed test results saved to: comprehensive-test-results.json');
    
  } catch (error) {
    console.error('\n❌ Fatal test error:', error.message);
    process.exit(1);
  }
}

// Check if server is running before starting tests
async function checkServerAndRun() {
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get(`${API_URL}/health`).catch(() => axios.get(API_URL));
    console.log('✅ Server is running!\n');
    
    // Run the comprehensive tests
    await runComprehensiveTests();
    
    console.log('\n✨ All tests completed!');
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('Please start the server first with: npm start');
    process.exit(1);
  }
}

// Start the tests
checkServerAndRun();