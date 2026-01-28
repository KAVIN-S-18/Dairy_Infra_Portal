const sequelize = require('./config/db');
const User = require('./models/User');
const Farmer = require('./models/Farmer');
const bcrypt = require('bcrypt');

(async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');

    // Check if MPCS Officer exists
    let mpcsOfficer = await User.findOne({ where: { role: 'MPCS_OFFICER' } });

    if (!mpcsOfficer) {
      console.log('Creating test MPCS Officer...');
      const hash = await bcrypt.hash('password123', 10);
      mpcsOfficer = await User.create({
        fullName: 'Test MPCS Officer',
        email: 'mpcs@test.com',
        passwordHash: hash,
        role: 'MPCS_OFFICER',
        status: 'APPROVED',
      });
      console.log('✅ MPCS Officer created:', mpcsOfficer.toJSON());
    } else {
      console.log('✅ MPCS Officer already exists:', mpcsOfficer.toJSON());
    }

    // List all farmers
    const farmers = await Farmer.findAll();
    console.log('\n📋 All Farmers:', JSON.stringify(farmers, null, 2));

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
