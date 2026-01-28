const jwt = require('jsonwebtoken');
const sequelize = require('./config/db');
const User = require('./models/User');
const Farmer = require('./models/Farmer');

const JWT_SECRET = 'your_secret_key';

// Generate token for admin
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, email: 'admin@test.com', role },
    JWT_SECRET
  );
};

const makeRequest = async (method, endpoint, body = null, userId, role) => {
  const token = generateToken(userId, role);
  const url = `http://127.0.0.1:5000${endpoint}`;
  
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

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${data.message || data.error}`);
    }
    
    return data;
  } catch (err) {
    console.error(`API Error: ${err.message}`);
    throw err;
  }
};

(async () => {
  try {
    console.log('🧪 Testing Hierarchical Organization Structure\n');

    // Get or create admin
    const admin = await User.findOne({ where: { role: 'COOPERATIVE_ADMIN' } });
    if (!admin) {
      console.log('❌ No admin found in database');
      process.exit(1);
    }
    const adminId = admin.id;
    console.log(`✅ Using Admin ID: ${adminId}\n`);

    // Test 1: Create District Manager
    console.log('1️⃣ Creating District Manager...');
    const dmRes = await makeRequest('POST', '/api/admin/district-managers', {
      fullName: 'Test District Manager',
      email: `dm${Date.now()}@test.com`,
      password: 'password123'
    }, adminId, 'COOPERATIVE_ADMIN');
    
    const dmId = dmRes.data.id;
    const dmHierarchyCode = dmRes.data.hierarchyCode;
    console.log(`✅ DM Created: ${dmHierarchyCode} (ID: ${dmId})\n`);

    // Test 2: Create Supervisor
    console.log('2️⃣ Creating Supervisor under DM...');
    const supRes = await makeRequest('POST', '/api/admin/staff/supervisor', {
      fullName: 'Test Supervisor',
      email: `sup${Date.now()}@test.com`,
      password: 'password123',
      districtManagerId: dmId
    }, adminId, 'COOPERATIVE_ADMIN');
    
    const supHierarchyCode = supRes.data.hierarchyCode;
    console.log(`✅ Supervisor Created: ${supHierarchyCode}\n`);

    // Test 3: Create Operator
    console.log('3️⃣ Creating Operator under DM...');
    const opRes = await makeRequest('POST', '/api/admin/staff/operator', {
      fullName: 'Test Operator',
      email: `op${Date.now()}@test.com`,
      password: 'password123',
      districtManagerId: dmId
    }, adminId, 'COOPERATIVE_ADMIN');
    
    const opHierarchyCode = opRes.data.hierarchyCode;
    console.log(`✅ Operator Created: ${opHierarchyCode}\n`);

    // Test 4: Create MPCS Officer
    console.log('4️⃣ Creating MPCS Officer under DM...');
    const mpcsRes = await makeRequest('POST', '/api/admin/staff/mpcs-officer', {
      fullName: 'Test MPCS Officer',
      email: `mpcs${Date.now()}@test.com`,
      password: 'password123',
      districtManagerId: dmId
    }, adminId, 'COOPERATIVE_ADMIN');
    
    const mpcsId = mpcsRes.data.id;
    const mpcsHierarchyCode = mpcsRes.data.hierarchyCode;
    console.log(`✅ MPCS Officer Created: ${mpcsHierarchyCode} (ID: ${mpcsId})\n`);

    // Test 5: Add Farmer under MPCS Officer
    console.log('5️⃣ Adding Farmer under MPCS Officer...');
    const mpcsToken = generateToken(mpcsId, 'MPCS_OFFICER');
    const farmerRes = await makeRequest('POST', '/api/mpcs-officer/farmers', {
      fullName: 'Test Farmer',
      email: `farmer${Date.now()}@test.com`,
      phoneNumber: '9876543210',
      villageId: 1,
      farmSize: 5,
      numberOfCattle: 8
    }, mpcsId, 'MPCS_OFFICER');
    
    const farmerHierarchyId = farmerRes.data.farmerId;
    console.log(`✅ Farmer Created: ${farmerHierarchyId}\n`);

    // Test 6: Get all staff under admin
    console.log('6️⃣ Getting all staff under admin...');
    const staffRes = await makeRequest('GET', '/api/admin/staff', null, adminId, 'COOPERATIVE_ADMIN');
    console.log(`✅ Total Staff: ${staffRes.data.length}`);
    staffRes.data.forEach(s => {
      console.log(`  - ${s.role}: ${s.hierarchyCode}`);
    });
    console.log('');

    // Test 7: Verify hierarchical IDs in database
    console.log('7️⃣ Verifying data in database...');
    const allUsers = await User.findAll({
      where: { adminId },
      attributes: ['id', 'fullName', 'role', 'hierarchyCode', 'districtCode']
    });
    
    console.log('All users under admin:');
    allUsers.forEach(u => {
      console.log(`  - ${u.role}: ${u.hierarchyCode || 'N/A'}`);
    });
    console.log('');

    const farmers = await Farmer.findAll({
      attributes: ['farmerId', 'fullName']
    });
    
    if (farmers.length > 0) {
      console.log('All farmers:');
      farmers.forEach(f => {
        console.log(`  - ${f.farmerId}: ${f.fullName}`);
      });
    }

    console.log('\n✅✅✅ All tests completed successfully!\n');
    console.log('Summary:');
    console.log(`  District Manager: ${dmHierarchyCode}`);
    console.log(`  Supervisor: ${supHierarchyCode}`);
    console.log(`  Operator: ${opHierarchyCode}`);
    console.log(`  MPCS Officer: ${mpcsHierarchyCode}`);
    console.log(`  Farmer: ${farmerHierarchyId}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
})();
