const sequelize = require('./config/db');
const User = require('./models/User');
const Farmer = require('./models/Farmer');

(async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');

    // Get MPCS Officer
    const mpcsOfficer = await User.findOne({
      where: { role: 'MPCS_OFFICER' }
    });

    console.log('📦 MPCS Officer:', mpcsOfficer.toJSON());

    // Test generating MPCS ID
    const mpcsCount = await User.count({
      where: { role: 'MPCS_OFFICER', mpcsId: { [require('sequelize').Op.not]: null } }
    });
    const mpcsId = `MPCS-${mpcsCount + 1}`;
    console.log('Generated MPCS ID:', mpcsId);

    // Update MPCS Officer with ID
    await mpcsOfficer.update({ mpcsId });
    console.log('✅ MPCS Officer ID updated');

    // Count farmers for this officer
    const farmerCount = await Farmer.count({
      where: { createdByMpcsOfficerId: mpcsOfficer.id }
    });
    console.log('Current farmer count:', farmerCount);

    // Try to create a farmer
    const farmerId = `${mpcsId}-${farmerCount + 1}`;
    console.log('Generated Farmer ID:', farmerId);

    const farmer = await Farmer.create({
      farmerId,
      fullName: 'Test Farmer',
      email: `farmer${Date.now()}@test.com`,
      phoneNumber: '9876543210',
      villageId: 1,
      farmSize: 5.5,
      numberOfCattle: 10,
      createdByMpcsOfficerId: mpcsOfficer.id,
      mpcsOfficerMpcsId: mpcsId,
    });

    console.log('✅ Farmer created:', farmer.toJSON());

    // Verify farmer was created
    const farmers = await Farmer.findAll();
    console.log('\n📋 All Farmers:', JSON.stringify(farmers, null, 2));

    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
})();
