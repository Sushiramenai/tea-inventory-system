const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Create axios instance with cookie jar support
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store cookies manually since we're in Node.js
let sessionCookie = '';

// Interceptor to add cookies to requests
axiosInstance.interceptors.request.use((config) => {
  if (sessionCookie) {
    config.headers.Cookie = sessionCookie;
  }
  return config;
});

// Interceptor to capture cookies from responses
axiosInstance.interceptors.response.use((response) => {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    // Extract the session cookie
    const cookieMatch = setCookieHeader[0].match(/tea-inventory-session=[^;]+/);
    if (cookieMatch) {
      sessionCookie = cookieMatch[0];
      console.log('Session cookie saved:', sessionCookie);
    }
  }
  return response;
}, (error) => {
  // Log detailed error information
  if (error.response) {
    console.error('Error Response:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  }
  return Promise.reject(error);
});

async function login() {
  console.log('Attempting to login as admin...');
  try {
    const response = await axiosInstance.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

async function createProduct(productData) {
  console.log('\nCreating product:', productData.name);
  console.log('Sending data:', JSON.stringify(productData, null, 2));
  
  try {
    const response = await axiosInstance.post('/products', productData);
    console.log('Product created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to create product ${productData.name}:`);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        validationErrors: error.response.data?.errors,
      });
    }
    throw error;
  }
}

async function testProductCreation() {
  try {
    // Step 1: Login
    await login();
    
    // Step 2: Create Premium Matcha
    const matchaProduct = {
      name: "Premium Matcha",
      category: "tea",
      size: "30g",
      sku: "MATCHA-TIN-30G",
      price: 24.99,
      stockQuantity: 30,
      reorderLevel: 10
    };
    
    try {
      await createProduct(matchaProduct);
    } catch (error) {
      console.error('Matcha creation failed, continuing with other products...');
    }
    
    // Step 3: Create other tea products
    const otherProducts = [
      {
        name: "Sencha Green Tea",
        category: "tea",
        size: "50g bags",
        sku: "SENCHA-BAG-50G",
        price: 18.99,
        stockQuantity: 25,
        reorderLevel: 8
      },
      {
        name: "Jasmine Tea",
        category: "tea",
        size: "20 tea bags",
        sku: "JASMINE-BAGS-20",
        price: 15.99,
        stockQuantity: 40,
        reorderLevel: 15
      },
      {
        name: "Pu-erh Tea",
        category: "tea",
        size: "100g cake",
        sku: "PUERH-CAKE-100G",
        price: 32.99,
        stockQuantity: 15,
        reorderLevel: 5
      }
    ];
    
    for (const product of otherProducts) {
      try {
        await createProduct(product);
      } catch (error) {
        console.error(`Failed to create ${product.name}, continuing...`);
      }
    }
    
    console.log('\n=== Test Summary ===');
    console.log('Session cookie:', sessionCookie);
    console.log('\nPlease check the above output for any validation errors or field mismatches.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testProductCreation();