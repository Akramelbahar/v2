// Create this file as: ets-reselec-backend/scripts/test-backend-direct.js
const axios = require('axios');
const { sequelize } = require('../config/database');

const testBackendDirect = async () => {
  try {
    console.log('🔍 Testing backend login directly...\n');

    // First, let's check what's actually in the database
    await sequelize.authenticate();
    
    const adminUser = await sequelize.query(`
      SELECT 
        u.id, u.nom, u.username, 
        CHAR_LENGTH(u.password) as pwd_len,
        LEFT(u.password, 15) as pwd_start,
        u.role_id, r.nom as role_name
      FROM Utilisateur u 
      LEFT JOIN Role r ON u.role_id = r.id 
      WHERE u.username = 'admin'
    `, { type: sequelize.QueryTypes.SELECT });

    if (adminUser.length === 0) {
      console.log('❌ No admin user found in database!');
      return;
    }

    const user = adminUser[0];
    console.log('📋 Admin user in database:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.nom}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Password length: ${user.pwd_len}`);
    console.log(`  Password starts: ${user.pwd_start}`);
    console.log(`  Role ID: ${user.role_id}`);
    console.log(`  Role name: ${user.role_name}`);

    // Test password hash manually
    const bcrypt = require('bcryptjs');
    const passwordTest = await bcrypt.compare('admin123', user.password || '');
    console.log(`  Password test: ${passwordTest ? '✅ VALID' : '❌ INVALID'}`);

    await sequelize.close();

    // Now test the backend API
    console.log('\n🌐 Testing backend API...');
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    console.log(`API URL: ${API_URL}`);

    // Test health endpoint first
    try {
      const healthResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('✅ Backend is running');
      console.log('Health response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n🔧 SOLUTION: Start your backend server:');
        console.log('   cd ets-reselec-backend');
        console.log('   npm start');
        return;
      }
    }

    // Test login endpoint
    console.log('\n🔐 Testing login endpoint...');
    
    const loginData = {
      username: 'admin',
      password: 'admin123'
    };

    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login successful!');
      console.log('Response:', loginResponse.data);
      
      if (loginResponse.data.data && loginResponse.data.data.user) {
        const userData = loginResponse.data.data.user;
        console.log('\n📋 User data received:');
        console.log(`  Name: ${userData.nom}`);
        console.log(`  Username: ${userData.username}`);
        console.log(`  Role: ${userData.role}`);
        console.log(`  Permissions: ${userData.permissions.length} found`);
        
        if (userData.permissions.length > 0) {
          console.log('  Sample permissions:');
          userData.permissions.slice(0, 5).forEach(perm => {
            console.log(`    - ${perm}`);
          });
        }
      }

    } catch (error) {
      console.log('❌ Login failed!');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else if (error.request) {
        console.log('Network error - no response received');
        console.log('Request details:', error.request);
      } else {
        console.log('Error:', error.message);
      }

      // Additional debugging
      console.log('\n🔍 Debug info:');
      console.log('Request URL:', `${API_URL}/auth/login`);
      console.log('Request data:', loginData);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testBackendDirect();