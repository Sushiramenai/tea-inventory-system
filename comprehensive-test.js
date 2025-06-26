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

// Add delay between API calls to avoid rate limiting
async function apiCall(fn) {
  await wait(500); // Wait 500ms between API calls
  return fn();
}

async function performMockRuns() {
  console.log('🎭 Starting Comprehensive Mock Run Tests...\n');
  
  const results = {
    productionManagerRuns: [],
    inventoryManagerRuns: []
  };

  // Perform 3 mock runs for Production Manager
  console.log('👷 PRODUCTION MANAGER MOCK RUNS\n');
  
  for (let run = 1; run <= 3; run++) {
    console.log(`\n📋 Production Manager Run ${run}/3`);
    const runResult = await performProductionManagerRun(run);
    results.productionManagerRuns.push(runResult);
    await wait(2000); // Wait between runs
  }

  // Perform 3 mock runs for Inventory Manager
  console.log('\n\n📦 INVENTORY MANAGER MOCK RUNS\n');
  
  for (let run = 1; run <= 3; run++) {
    console.log(`\n📋 Inventory Manager Run ${run}/3`);
    const runResult = await performInventoryManagerRun(run);
    results.inventoryManagerRuns.push(runResult);
    await wait(2000); // Wait between runs
  }

  return results;
}

async function performProductionManagerRun(runNumber) {
  const runResult = {
    runNumber,
    tasks: [],
    success: true
  };

  try {
    // Login as production user
    await apiCall(() => axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    }));
    runResult.tasks.push('✅ Logged in as production user');

    // 1. Check pending production requests
    const pendingRequests = await apiCall(() => axiosInstance.get('/production-requests?status=pending'));
    const pendingCount = pendingRequests.data.requests?.length || 0;
    runResult.tasks.push(`📊 Found ${pendingCount} pending production requests`);

    // 2. Check low stock materials
    const lowStockMaterials = await apiCall(() => axiosInstance.get('/raw-materials?lowStock=true'));
    const lowStockCount = lowStockMaterials.data.materials?.length || 0;
    runResult.tasks.push(`⚠️  Found ${lowStockCount} low stock materials`);

    // 3. Check dashboard stats
    const stats = await apiCall(() => axiosInstance.get('/dashboard/stats'));
    runResult.tasks.push(`📈 Dashboard: ${stats.data.stats.products.total} products, ${stats.data.stats.rawMaterials.total} materials`);

    // 4. Process a pending request if available
    if (pendingCount > 0) {
      const requestToProcess = pendingRequests.data.requests[0];
      
      // Check material availability
      const requestDetails = await apiCall(() => axiosInstance.get(`/production-requests/${requestToProcess.id}`));
      const allMaterialsAvailable = requestDetails.data.request.materials.every(m => 
        m.quantityAvailableAtRequest >= m.quantityConsumed
      );
      
      if (allMaterialsAvailable) {
        await apiCall(() => axiosInstance.post(`/production-requests/${requestToProcess.id}/complete`));
        runResult.tasks.push(`✅ Completed production request for ${requestToProcess.product.teaName}`);
      } else {
        runResult.tasks.push(`❌ Cannot complete request - insufficient materials`);
      }
    }

    // 5. Create a test production request as fulfillment user
    await apiCall(() => axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    }));
    
    // Get products
    const products = await apiCall(() => axiosInstance.get('/products'));
    if (products.data.products?.length > 0) {
      const randomProduct = products.data.products[Math.floor(Math.random() * products.data.products.length)];
      
      try {
        const newRequest = await apiCall(() => axiosInstance.post('/production-requests', {
          productId: randomProduct.id,
          quantityRequested: Math.floor(Math.random() * 20) + 5,
          notes: `Mock run ${runNumber} - test request`
        }));
        runResult.tasks.push(`📝 Created test production request for ${randomProduct.teaName}`);
      } catch (err) {
        if (err.response?.data?.error?.code === 'NO_BOM') {
          runResult.tasks.push(`⚠️  Skipped ${randomProduct.teaName} - no BOM defined`);
        }
      }
    }

  } catch (error) {
    runResult.success = false;
    runResult.error = error.response?.data || error.message;
    runResult.tasks.push(`❌ Error: ${error.response?.data?.error?.message || error.message}`);
  }

  return runResult;
}

async function performInventoryManagerRun(runNumber) {
  const runResult = {
    runNumber,
    tasks: [],
    success: true
  };

  try {
    // Login as admin (inventory manager)
    await apiCall(() => axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    }));
    runResult.tasks.push('✅ Logged in as inventory manager (admin)');

    // 1. Check all inventory levels
    const materials = await apiCall(() => axiosInstance.get('/raw-materials'));
    const products = await apiCall(() => axiosInstance.get('/products'));
    
    runResult.tasks.push(`📊 Managing ${materials.data.materials?.length || 0} materials and ${products.data.products?.length || 0} products`);

    // 2. Identify low stock items
    const lowStockMaterials = materials.data.materials?.filter(m => 
      (m.totalQuantity || m.count) < m.reorderThreshold
    ) || [];
    const lowStockProducts = products.data.products?.filter(p => 
      p.physicalCount < p.reorderThreshold
    ) || [];

    runResult.tasks.push(`⚠️  Low stock: ${lowStockMaterials.length} materials, ${lowStockProducts.length} products`);

    // 3. Perform inventory adjustments
    if (materials.data.materials?.length > 0) {
      // Adjust a random material's inventory
      const randomMaterial = materials.data.materials[Math.floor(Math.random() * materials.data.materials.length)];
      const adjustment = Math.floor(Math.random() * 50) + 10;
      
      await apiCall(() => axiosInstance.put(`/raw-materials/${randomMaterial.id}`, {
        count: randomMaterial.count + adjustment
      }));
      runResult.tasks.push(`📈 Added ${adjustment} ${randomMaterial.unit} to ${randomMaterial.itemName}`);
    }

    // 4. Update product counts
    if (products.data.products?.length > 0) {
      const randomProduct = products.data.products[Math.floor(Math.random() * products.data.products.length)];
      const newCount = Math.floor(Math.random() * 30) + 10;
      
      await apiCall(() => axiosInstance.put(`/products/${randomProduct.id}`, {
        physicalCount: newCount
      }));
      runResult.tasks.push(`📦 Updated ${randomProduct.teaName} count to ${newCount} units`);
    }

    // 5. Generate inventory report
    const statsAfter = await apiCall(() => axiosInstance.get('/dashboard/stats'));
    runResult.tasks.push(`📊 Final stats: ${statsAfter.data.stats.products.lowStock} low stock products`);

    // 6. Check for materials that need reordering
    if (lowStockMaterials.length > 0) {
      runResult.tasks.push(`🛒 Reorder needed for: ${lowStockMaterials.slice(0, 3).map(m => m.itemName).join(', ')}`);
    }

  } catch (error) {
    runResult.success = false;
    runResult.error = error.response?.data || error.message;
    runResult.tasks.push(`❌ Error: ${error.response?.data?.error?.message || error.message}`);
  }

  return runResult;
}

// Run the comprehensive tests
performMockRuns()
  .then(results => {
    console.log('\n\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('================================\n');
    
    console.log('Production Manager Runs:');
    results.productionManagerRuns.forEach(run => {
      console.log(`\nRun ${run.runNumber}: ${run.success ? '✅ Success' : '❌ Failed'}`);
      run.tasks.forEach(task => console.log(`  ${task}`));
    });
    
    console.log('\n\nInventory Manager Runs:');
    results.inventoryManagerRuns.forEach(run => {
      console.log(`\nRun ${run.runNumber}: ${run.success ? '✅ Success' : '❌ Failed'}`);
      run.tasks.forEach(task => console.log(`  ${task}`));
    });
    
    const allSuccess = [...results.productionManagerRuns, ...results.inventoryManagerRuns]
      .every(run => run.success);
    
    console.log(`\n\n${allSuccess ? '✨ All mock runs completed successfully!' : '❌ Some mock runs failed'}`);
    process.exit(allSuccess ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });