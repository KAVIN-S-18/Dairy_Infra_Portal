const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:5000';
const JWT_SECRET = 'your_secret_key';

// Generate JWT token for MPCS officer
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, email: 'kavin@gmail.com', role },
    JWT_SECRET
  );
};

const makeRequest = async (method, endpoint, body = null) => {
  const token = generateToken(3, 'MPCS_OFFICER');
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.message || data.error}`);
  }
  
  return data;
};

(async () => {
  try {
    console.log('🧪 Testing MPCS Officer API Endpoints...\n');

    // Test 1: Get farmers list
    console.log('1️⃣ Testing GET /farmers...');
    const farmersRes = await makeRequest('GET', '/api/mpcs-officer/farmers');
    console.log(`✅ Farmers list: ${farmersRes.data.length} farmers`);

    // Test 2: Get farmers for milk procurement dropdown
    console.log('\n2️⃣ Testing GET /farmers/list/ids...');
    const farmersForMilkRes = await makeRequest('GET', '/api/mpcs-officer/farmers/list/ids');
    console.log(`✅ Farmers for milk procurement: ${farmersForMilkRes.data.length} farmers`);
    if (farmersForMilkRes.data.length > 0) {
      console.log('Sample:', JSON.stringify(farmersForMilkRes.data[0], null, 2));
    }

    // Test 3: Add a new farmer
    console.log('\n3️⃣ Testing POST /farmers (Add Farmer)...');
    const newFarmerRes = await makeRequest('POST', '/api/mpcs-officer/farmers', {
      fullName: 'Jane Smith',
      email: `farmer${Date.now()}@test.com`,
      phoneNumber: '9876543210',
      villageId: 1,
      farmSize: 5,
      numberOfCattle: 8
    });
    console.log('✅ Farmer added:', JSON.stringify(newFarmerRes.data, null, 2));

    // Test 4: Get updated farmers list
    console.log('\n4️⃣ Testing GET /farmers (updated list)...');
    const updatedFarmersRes = await makeRequest('GET', '/api/mpcs-officer/farmers');
    console.log(`✅ Updated farmers list: ${updatedFarmersRes.data.length} farmers`);

    // Test 5: Log milk procurement
    console.log('\n5️⃣ Testing POST /milk-procurement (Log Milk)...');
    const procurementRes = await makeRequest('POST', '/api/mpcs-officer/milk-procurement', {
      farmerId: newFarmerRes.data.id,
      quantityLiters: 25.5,
      quality: 'A',
      temperature: 28.5,
      pricePerLiter: 45,
      notes: 'Good quality milk'
    });
    console.log('✅ Milk procurement logged:', JSON.stringify(procurementRes.data, null, 2));

    // Test 6: Get procurement summary
    console.log('\n6️⃣ Testing GET /milk-procurement/summary...');
    const summaryRes = await makeRequest('GET', '/api/mpcs-officer/milk-procurement/summary');
    console.log('✅ Procurement summary:');
    console.log('  - Total Quantity:', summaryRes.data.totalQuantity, 'L');
    console.log('  - Total Amount: ₹', summaryRes.data.totalAmount);
    console.log('  - Total Transactions:', summaryRes.data.totalTransactions);

    console.log('\n✅✅✅ All tests passed! System is working correctly.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
