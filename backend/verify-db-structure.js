const sequelize = require('./config/db');
const User = require('./models/User');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database check:');
    
    const users = await User.findAll({ 
      attributes: ['id', 'role', 'hierarchyCode', 'adminId', 'districtManagerId', 'districtCode']
    });
    
    console.log('Total users:', users.length);
    users.forEach(u => {
      if (u.hierarchyCode) {
        console.log(`  - ID: ${u.id}, Role: ${u.role}, HierarchyCode: ${u.hierarchyCode}`);
      }
    });
    
    console.log('\n✅ Database structure is ready for hierarchical IDs');
    console.log('New fields added:');
    console.log('  - hierarchyCode');
    console.log('  - adminId');
    console.log('  - districtManagerId');
    console.log('  - districtCode');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
