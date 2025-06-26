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

async function demonstrateFulfillmentWorkflow() {
  console.log('\n🎬 FULFILLMENT WORKFLOW DEMONSTRATION');
  console.log('════════════════════════════════════════\n');
  
  console.log('📖 SCENARIO:');
  console.log('A customer wants to order 100 units of Earl Grey Classic.');
  console.log('Let\'s see how the fulfillment team handles this...\n');

  try {
    // Step 1: Fulfillment logs in
    console.log('1️⃣ FULFILLMENT TEAM CHECK');
    await wait(3000);
    await axiosInstance.post('/auth/login', {
      username: 'fulfillment',
      password: 'fulfillment123'
    });
    console.log('✅ Fulfillment team member logged in\n');

    // Check current stock
    await wait(3000);
    const products = await axiosInstance.get('/products');
    const earlGrey = products.data.products.find(p => p.sku === 'EG-TIN-100');
    
    if (!earlGrey) {
      console.log('❌ Earl Grey Classic product not found!');
      return;
    }

    console.log(`📦 Current Earl Grey stock: ${earlGrey.physicalCount} units`);
    console.log(`📋 Customer needs: 100 units`);
    
    if (earlGrey.physicalCount >= 100) {
      console.log('✅ Sufficient stock available! Order can be fulfilled immediately.\n');
      return;
    }

    const shortage = 100 - earlGrey.physicalCount;
    console.log(`❌ Shortage of ${shortage} units. Need to request production.\n`);

    // Step 2: Create production request
    console.log('2️⃣ CREATE PRODUCTION REQUEST');
    await wait(3000);
    
    const productionNeeded = shortage + 20; // Add buffer
    const requestData = {
      productId: earlGrey.id,
      quantityRequested: productionNeeded,
      notes: `Customer order: 100 units. Current stock: ${earlGrey.physicalCount}. Requesting ${productionNeeded} units (includes buffer).`
    };

    const productionRequest = await axiosInstance.post('/production-requests', requestData);
    console.log(`✅ Production request created for ${productionNeeded} units`);
    
    if (productionRequest.data.materialsCheck) {
      console.log('\n📊 Material Requirements Check:');
      productionRequest.data.materialsCheck.materials.forEach(mat => {
        const status = mat.sufficient ? '✅' : '❌ INSUFFICIENT';
        console.log(`   ${mat.itemName}: Need ${mat.required}, Have ${mat.available} - ${status}`);
      });
    }
    console.log('');

    // Step 3: Production processes the request
    console.log('3️⃣ PRODUCTION TEAM PROCESSES');
    await wait(3000);
    await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    console.log('✅ Production manager logged in\n');

    // Complete production
    await wait(3000);
    await axiosInstance.post(`/production-requests/${productionRequest.data.request.id}/complete`);
    console.log(`✅ Production completed: ${productionNeeded} units manufactured`);
    console.log('   • Raw materials consumed according to recipe');
    console.log('   • Product inventory increased\n');

    // Step 4: Verify final inventory
    console.log('4️⃣ FINAL INVENTORY CHECK');
    await wait(3000);
    
    const finalProducts = await axiosInstance.get('/products');
    const finalEarlGrey = finalProducts.data.products.find(p => p.sku === 'EG-TIN-100');
    
    console.log(`📦 New Earl Grey stock: ${finalEarlGrey.physicalCount} units`);
    console.log(`📋 Customer order: 100 units`);
    console.log(`✅ Order can now be fulfilled with ${finalEarlGrey.physicalCount - 100} units remaining\n`);

    // Summary
    console.log('════════════════════════════════════════');
    console.log('✅ WORKFLOW COMPLETED SUCCESSFULLY');
    console.log('════════════════════════════════════════\n');
    console.log('The system successfully handled:');
    console.log('• Inventory checking by fulfillment team');
    console.log('• Automatic shortage detection');
    console.log('• Production request creation');
    console.log('• Material availability verification');
    console.log('• Production completion by production team');
    console.log('• Automatic inventory updates');
    console.log('• Order fulfillment capability\n');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⚠️  Rate limit reached. Please wait a moment and try again.');
    }
  }
}

// Run the demonstration
demonstrateFulfillmentWorkflow()
  .then(() => {
    console.log('✨ Demonstration completed!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });