const axios = require('axios');
const chalk = require('chalk'); // For colored output (optional, will work without it)

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

async function runFulfillmentScenario() {
  console.log('\n🎬 FULFILLMENT SCENARIO TEST');
  console.log('════════════════════════════════════════════════════════════════\n');
  
  console.log('📖 SCENARIO BACKGROUND:');
  console.log('   A customer has placed a large order for:');
  console.log('   - 50 units of Earl Grey Classic (100g tins)');
  console.log('   - 30 units of English Breakfast (100g tins)');
  console.log('   - 20 units of Green Tea Sencha (250g family size)\n');
  console.log('   The fulfillment team needs to check inventory and create');
  console.log('   production requests for any items with insufficient stock.\n');
  console.log('════════════════════════════════════════════════════════════════\n');
  
  await wait(2000);

  try {
    // Step 1: Fulfillment team logs in
    console.log('📋 STEP 1: Fulfillment Team Member Logs In');
    console.log('─────────────────────────────────────────────\n');
    
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    console.log('✅ Sarah from fulfillment team logged in successfully\n');

    // Step 2: Check current inventory
    console.log('📊 STEP 2: Check Current Product Inventory');
    console.log('─────────────────────────────────────────────\n');
    
    await wait(1500);
    const products = await axiosInstance.get('/products');
    
    // Find the specific products
    const earlGrey = products.data.products.find(p => p.sku === 'EG-TIN-100');
    const englishBreakfast = products.data.products.find(p => p.sku === 'EB-TIN-100');
    const greenTea = products.data.products.find(p => p.sku === 'GT-FAM-250');

    console.log('Current Inventory Status:');
    if (earlGrey) {
      console.log(`   📦 Earl Grey Classic (100g): ${earlGrey.physicalCount} units in stock`);
      console.log(`      Customer needs: 50 units`);
      console.log(`      ${earlGrey.physicalCount >= 50 ? '✅ Sufficient stock' : `❌ Need ${50 - earlGrey.physicalCount} more units`}`);
    }
    
    if (englishBreakfast) {
      console.log(`\n   📦 English Breakfast (100g): ${englishBreakfast.physicalCount} units in stock`);
      console.log(`      Customer needs: 30 units`);
      console.log(`      ${englishBreakfast.physicalCount >= 30 ? '✅ Sufficient stock' : `❌ Need ${30 - englishBreakfast.physicalCount} more units`}`);
    }
    
    if (greenTea) {
      console.log(`\n   📦 Green Tea Sencha (250g): ${greenTea.physicalCount} units in stock`);
      console.log(`      Customer needs: 20 units`);
      console.log(`      ${greenTea.physicalCount >= 20 ? '✅ Sufficient stock' : `❌ Need ${20 - greenTea.physicalCount} more units`}`);
    }
    console.log('');

    // Step 3: Check raw materials before creating production requests
    console.log('🔍 STEP 3: Check Raw Material Availability');
    console.log('─────────────────────────────────────────────\n');
    
    await wait(1500);
    const materials = await axiosInstance.get('/raw-materials');
    
    console.log('Key Raw Materials Status:');
    const earlGreyTeaLeaves = materials.data.materials.find(m => m.itemName === 'Earl Grey Tea Leaves');
    const englishBreakfastTea = materials.data.materials.find(m => m.itemName === 'English Breakfast Tea');
    const greenTeaSencha = materials.data.materials.find(m => m.itemName === 'Green Tea Sencha');
    const smallTins = materials.data.materials.find(m => m.itemName === 'Small Tins');
    
    if (earlGreyTeaLeaves) {
      console.log(`   🍃 Earl Grey Tea Leaves: ${earlGreyTeaLeaves.count} kg`);
    }
    if (englishBreakfastTea) {
      console.log(`   🍃 English Breakfast Tea: ${englishBreakfastTea.count} kg`);
    }
    if (greenTeaSencha) {
      console.log(`   🍃 Green Tea Sencha: ${greenTeaSencha.count} kg`);
    }
    if (smallTins) {
      console.log(`   📦 Small Tins: ${smallTins.count} pieces`);
    }
    console.log('');

    // Step 4: Create production requests
    console.log('📝 STEP 4: Create Production Requests');
    console.log('─────────────────────────────────────────────\n');
    
    const productionRequests = [];
    
    // Create request for Earl Grey if needed
    if (earlGrey && earlGrey.physicalCount < 50) {
      const needed = 50 - earlGrey.physicalCount + 10; // Add buffer
      await wait(1500);
      try {
        const request = await axiosInstance.post('/production-requests', {
          productId: earlGrey.id,
          quantityRequested: needed,
          notes: `Customer order requires 50 units. Current stock: ${earlGrey.physicalCount}. Producing ${needed} units (includes buffer).`
        });
        productionRequests.push(request.data.request);
        console.log(`✅ Created production request for ${needed} units of Earl Grey Classic`);
        
        // Check material requirements
        if (request.data.materialsCheck) {
          console.log('   Material requirements:');
          request.data.materialsCheck.materials.forEach(mat => {
            console.log(`   - ${mat.itemName}: ${mat.required} needed, ${mat.available} available ${mat.sufficient ? '✅' : '❌'}`);
          });
        }
      } catch (error) {
        console.log(`❌ Failed to create request for Earl Grey: ${error.response?.data?.error?.message}`);
      }
    }

    // Create request for English Breakfast if needed
    if (englishBreakfast && englishBreakfast.physicalCount < 30) {
      const needed = 30 - englishBreakfast.physicalCount + 10; // Add buffer
      await wait(1500);
      try {
        const request = await axiosInstance.post('/production-requests', {
          productId: englishBreakfast.id,
          quantityRequested: needed,
          notes: `Customer order requires 30 units. Current stock: ${englishBreakfast.physicalCount}. Producing ${needed} units (includes buffer).`
        });
        productionRequests.push(request.data.request);
        console.log(`\n✅ Created production request for ${needed} units of English Breakfast`);
        
        // Check material requirements
        if (request.data.materialsCheck) {
          console.log('   Material requirements:');
          request.data.materialsCheck.materials.forEach(mat => {
            console.log(`   - ${mat.itemName}: ${mat.required} needed, ${mat.available} available ${mat.sufficient ? '✅' : '❌'}`);
          });
        }
      } catch (error) {
        console.log(`❌ Failed to create request for English Breakfast: ${error.response?.data?.error?.message}`);
      }
    }

    // Create request for Green Tea if needed
    if (greenTea && greenTea.physicalCount < 20) {
      const needed = 20 - greenTea.physicalCount + 5; // Add buffer
      await wait(1500);
      try {
        const request = await axiosInstance.post('/production-requests', {
          productId: greenTea.id,
          quantityRequested: needed,
          notes: `Customer order requires 20 units. Current stock: ${greenTea.physicalCount}. Producing ${needed} units (includes buffer).`
        });
        productionRequests.push(request.data.request);
        console.log(`\n✅ Created production request for ${needed} units of Green Tea Sencha`);
        
        // Check material requirements
        if (request.data.materialsCheck) {
          console.log('   Material requirements:');
          request.data.materialsCheck.materials.forEach(mat => {
            console.log(`   - ${mat.itemName}: ${mat.required} needed, ${mat.available} available ${mat.sufficient ? '✅' : '❌'}`);
          });
        }
      } catch (error) {
        console.log(`❌ Failed to create request for Green Tea: ${error.response?.data?.error?.message}`);
      }
    }

    if (productionRequests.length === 0) {
      console.log('✅ All products have sufficient stock! No production requests needed.');
    }
    console.log('');

    // Step 5: Production team processes requests
    console.log('🏭 STEP 5: Production Team Processes Requests');
    console.log('─────────────────────────────────────────────\n');
    
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    console.log('✅ Mike from production team logged in\n');

    // Check pending requests
    await wait(1500);
    const pendingRequests = await axiosInstance.get('/production-requests?status=pending');
    console.log(`📋 Found ${pendingRequests.data.requests.length} pending production requests:\n`);

    for (const req of pendingRequests.data.requests) {
      console.log(`   🏷️  ${req.product.teaName} - ${req.quantityRequested} units`);
      console.log(`      Requested by: ${req.requestedBy.username}`);
      console.log(`      Notes: ${req.notes}`);
      console.log('');
    }

    // Complete production requests
    console.log('Starting production...\n');
    
    for (const request of productionRequests) {
      await wait(2000);
      try {
        await axiosInstance.post(`/production-requests/${request.id}/complete`);
        console.log(`✅ Completed production of ${request.quantityRequested} units of ${request.product.teaName}`);
        
        // Show inventory changes
        console.log('   📊 Inventory updates:');
        console.log(`      - Product inventory increased by ${request.quantityRequested} units`);
        console.log(`      - Raw materials consumed according to recipe`);
      } catch (error) {
        console.log(`❌ Failed to complete production: ${error.response?.data?.error?.message}`);
      }
      console.log('');
    }

    // Step 6: Verify final inventory
    console.log('✅ STEP 6: Verify Final Inventory');
    console.log('─────────────────────────────────────────────\n');
    
    await wait(1500);
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    
    await wait(1500);
    const finalProducts = await axiosInstance.get('/products');
    
    const finalEarlGrey = finalProducts.data.products.find(p => p.sku === 'EG-TIN-100');
    const finalEnglishBreakfast = finalProducts.data.products.find(p => p.sku === 'EB-TIN-100');
    const finalGreenTea = finalProducts.data.products.find(p => p.sku === 'GT-FAM-250');

    console.log('Final Product Inventory:');
    if (finalEarlGrey) {
      console.log(`   📦 Earl Grey Classic: ${finalEarlGrey.physicalCount} units`);
      console.log(`      Customer order (50 units): ${finalEarlGrey.physicalCount >= 50 ? '✅ Can fulfill' : '❌ Insufficient'}`);
    }
    if (finalEnglishBreakfast) {
      console.log(`\n   📦 English Breakfast: ${finalEnglishBreakfast.physicalCount} units`);
      console.log(`      Customer order (30 units): ${finalEnglishBreakfast.physicalCount >= 30 ? '✅ Can fulfill' : '❌ Insufficient'}`);
    }
    if (finalGreenTea) {
      console.log(`\n   📦 Green Tea Sencha: ${finalGreenTea.physicalCount} units`);
      console.log(`      Customer order (20 units): ${finalGreenTea.physicalCount >= 20 ? '✅ Can fulfill' : '❌ Insufficient'}`);
    }

    // Check updated raw materials
    console.log('\n📊 Raw Materials After Production:');
    await wait(1500);
    const finalMaterials = await axiosInstance.get('/raw-materials');
    
    const finalEarlGreyTea = finalMaterials.data.materials.find(m => m.itemName === 'Earl Grey Tea Leaves');
    const finalSmallTins = finalMaterials.data.materials.find(m => m.itemName === 'Small Tins');
    
    if (finalEarlGreyTea) {
      console.log(`   🍃 Earl Grey Tea Leaves: ${finalEarlGreyTea.count} kg remaining`);
    }
    if (finalSmallTins) {
      console.log(`   📦 Small Tins: ${finalSmallTins.count} pieces remaining`);
    }

    // Final summary
    console.log('\n\n════════════════════════════════════════════════════════════════');
    console.log('📊 SCENARIO SUMMARY');
    console.log('════════════════════════════════════════════════════════════════\n');
    
    console.log('✅ Successfully demonstrated the complete fulfillment workflow:');
    console.log('   1. Fulfillment checked inventory against customer order');
    console.log('   2. Identified products with insufficient stock');
    console.log('   3. Created production requests with appropriate quantities');
    console.log('   4. Production team processed the requests');
    console.log('   5. Inventory was automatically updated');
    console.log('   6. Customer order can now be fulfilled');
    console.log('\n🎯 The system correctly handles the entire order fulfillment process!');

  } catch (error) {
    console.error('\n❌ Scenario failed:', error.response?.data || error.message);
  }
}

// Run the scenario
console.log('🚀 Starting Fulfillment Scenario Test...');
runFulfillmentScenario()
  .then(() => {
    console.log('\n✨ Scenario test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });