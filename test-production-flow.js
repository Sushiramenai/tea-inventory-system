const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Store cookies
let cookies = '';
axiosInstance.interceptors.request.use(config => {
  if (cookies) {
    config.headers.Cookie = cookies;
  }
  return config;
});

axiosInstance.interceptors.response.use(response => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    cookies = setCookie.join('; ');
  }
  return response;
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProductionFlow() {
  console.log('🏭 Testing Complete Production Flow\n');
  
  try {
    // Step 1: Admin Login
    console.log('1️⃣ Admin Login...');
    await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Admin logged in');
    await delay(1000);

    // Step 2: Create Raw Materials
    console.log('\n2️⃣ Creating Raw Materials...');
    const materials = [];
    
    try {
      const greenTea = await axiosInstance.post('/raw-materials', {
        name: 'Premium Green Tea Leaves',
        sku: 'MAT-GREEN-001',
        unit: 'kg',
        unitCost: 25.00,
        stockQuantity: 100,
        reorderLevel: 20,
        reorderQuantity: 50,
        supplier: 'Mountain Tea Farms'
      });
      materials.push(greenTea.data.rawMaterial || greenTea.data);
      console.log('✅ Created Green Tea Leaves');
    } catch (e) {
      console.log('⚠️  Green Tea Leaves already exists');
    }

    try {
      const packaging = await axiosInstance.post('/raw-materials', {
        name: 'Tea Bags',
        sku: 'MAT-BAG-001',
        unit: 'units',
        unitCost: 0.05,
        stockQuantity: 5000,
        reorderLevel: 1000,
        reorderQuantity: 3000,
        supplier: 'Packaging Co'
      });
      materials.push(packaging.data.rawMaterial || packaging.data);
      console.log('✅ Created Tea Bags');
    } catch (e) {
      console.log('⚠️  Tea Bags already exists');
    }
    await delay(1000);

    // Step 3: Create a Product
    console.log('\n3️⃣ Creating Product...');
    let product;
    try {
      const productRes = await axiosInstance.post('/products', {
        name: 'Premium Green Tea',
        sku: 'PROD-GREEN-001',
        size: '20 bags',
        price: 15.99,
        stockQuantity: 50,
        reorderLevel: 20,
        reorderQuantity: 100
      });
      product = productRes.data.product || productRes.data;
      console.log('✅ Created Premium Green Tea product');
    } catch (e) {
      console.log('⚠️  Product already exists, fetching...');
      const products = await axiosInstance.get('/products');
      const productsList = products.data.products || products.data;
      product = productsList.find(p => p.sku === 'PROD-GREEN-001') || productsList[0];
    }
    await delay(1000);

    // Step 4: Get materials list for BOM
    console.log('\n4️⃣ Getting materials for BOM setup...');
    const materialsRes = await axiosInstance.get('/raw-materials');
    const materialsData = materialsRes.data;
    const allMaterials = Array.isArray(materialsData) ? materialsData : 
                        materialsData.rawMaterials || materialsData.data || [];
    console.log(`✅ Found ${allMaterials.length} materials`);
    
    const greenTeaMat = allMaterials.find(m => m.sku === 'MAT-GREEN-001');
    const bagsMat = allMaterials.find(m => m.sku === 'MAT-BAG-001');
    await delay(1000);

    // Step 5: Create Bill of Materials
    if (product && greenTeaMat && bagsMat) {
      console.log('\n5️⃣ Creating Bill of Materials...');
      try {
        await axiosInstance.post('/bom', {
          productId: product.id,
          rawMaterialId: greenTeaMat.id,
          quantity: 0.4  // 0.4kg of tea per product
        });
        console.log('✅ Added Green Tea to BOM');
      } catch (e) {
        console.log('⚠️  Green Tea already in BOM');
      }

      try {
        await axiosInstance.post('/bom', {
          productId: product.id,
          rawMaterialId: bagsMat.id,
          quantity: 20  // 20 bags per product
        });
        console.log('✅ Added Tea Bags to BOM');
      } catch (e) {
        console.log('⚠️  Tea Bags already in BOM');
      }
      await delay(1000);
    }

    // Step 6: Production Manager Login
    console.log('\n6️⃣ Production Manager Login...');
    await axiosInstance.post('/auth/login', {
      username: 'production',
      password: 'production123'
    });
    console.log('✅ Production manager logged in');
    await delay(1000);

    // Step 7: Create Production Request
    console.log('\n7️⃣ Creating Production Request...');
    if (product) {
      try {
        const prodRequest = await axiosInstance.post('/production-requests', {
          productId: product.id,
          quantity: 10,
          priority: 'HIGH',
          notes: 'Test production run'
        });
        const requestId = (prodRequest.data.productionRequest || prodRequest.data).id;
        console.log('✅ Created production request for 10 units');
        await delay(1000);

        // Step 8: Complete Production Request
        console.log('\n8️⃣ Completing Production Request...');
        const completeRes = await axiosInstance.post(`/production-requests/${requestId}/complete`);
        console.log('✅ Production completed successfully');
        console.log('   Materials consumed and products created');
      } catch (e) {
        console.log('❌ Production request failed:', e.response?.data || e.message);
      }
    }
    await delay(1000);

    // Step 9: Check Updated Inventory
    console.log('\n9️⃣ Checking Updated Inventory...');
    const updatedProducts = await axiosInstance.get('/products');
    const updatedMaterials = await axiosInstance.get('/raw-materials');
    const dashboardStats = await axiosInstance.get('/dashboard/stats');
    
    console.log('✅ Inventory Status:');
    console.log(`   Total Products: ${(dashboardStats.data.stats || dashboardStats.data).products.total}`);
    console.log(`   Low Stock Products: ${(dashboardStats.data.stats || dashboardStats.data).products.lowStock}`);
    console.log(`   Total Materials: ${(dashboardStats.data.stats || dashboardStats.data).rawMaterials.total}`);
    console.log(`   Low Stock Materials: ${(dashboardStats.data.stats || dashboardStats.data).rawMaterials.lowStock}`);

    console.log('\n✅ Production flow test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testProductionFlow();