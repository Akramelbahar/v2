// ets-reselec-backend/test-user-routes.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Test credentials - adjust as needed
const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

async function testUserRoutes() {
  try {
    console.log('🔐 Testing login...');
    
    // Login first
    const loginResponse = await axios.post(`${API_URL}/auth/login`, adminCredentials);
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Set default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    // Test get all users
    console.log('\n📋 Testing GET /api/users...');
    try {
      const usersResponse = await axios.get(`${API_URL}/users`);
      console.log('✅ Get users successful:', {
        total: usersResponse.data.pagination?.total || usersResponse.data.data?.length,
        page: usersResponse.data.pagination?.page
      });
    } catch (error) {
      console.error('❌ Get users failed:', error.response?.data || error.message);
    }
    
    // Test get all roles
    console.log('\n📋 Testing GET /api/roles...');
    try {
      const rolesResponse = await axios.get(`${API_URL}/roles`);
      console.log('✅ Get roles successful:', {
        count: rolesResponse.data.data?.length
      });
    } catch (error) {
      console.error('❌ Get roles failed:', error.response?.data || error.message);
    }
    
    // Test get permissions
    console.log('\n📋 Testing GET /api/permissions...');
    try {
      const permissionsResponse = await axios.get(`${API_URL}/permissions`);
      console.log('✅ Get permissions successful:', {
        count: permissionsResponse.data.data?.length
      });
    } catch (error) {
      console.error('❌ Get permissions failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
console.log('🚀 Starting user routes tests...\n');
testUserRoutes();