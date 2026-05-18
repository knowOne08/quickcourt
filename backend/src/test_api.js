// backend/src/test_api.js
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

const testApi = async () => {
  console.log('🚀 Starting API Route Tests...\n');

  const routes = [
    { name: 'Health Check', url: 'http://localhost:4000/health', method: 'GET' },
    { name: 'API Base', url: 'http://localhost:4000/api', method: 'GET' },
    { name: 'Auth Status', url: `${API_URL}/auth/me`, method: 'GET' }, // Should return 401 if not logged in
    { name: 'Venues List', url: `${API_URL}/venues`, method: 'GET' },
  ];

  for (const route of routes) {
    try {
      console.log(`Testing [${route.method}] ${route.name}...`);
      const response = await axios({
        method: route.method,
        url: route.url,
        validateStatus: () => true, // Don't throw for 401/404 etc
      });
      
      const statusIcon = response.status >= 200 && response.status < 300 ? '✅' : 
                         response.status === 401 ? '🔒' : '⚠️';
      
      console.log(`${statusIcon} Status: ${response.status} - ${response.statusText}`);
      if (response.data && response.data.success !== undefined) {
        console.log(`   Success property: ${response.data.success}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Error testing ${route.name}: ${error.message}\n`);
    }
  }

  console.log('🏁 Tests completed.');
};

testApi();
