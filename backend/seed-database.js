const sequelize = require('./config/db');
const User = require('./models/User');
const Farmer = require('./models/Farmer');
const MilkProcurement = require('./models/MilkProcurement');
const bcrypt = require('bcrypt');

(async () => {
  try {
    console.log('?? Starting database sync and targeted seeding...');

    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Only clear milk procurement logs (retain user and farmer records)
    await MilkProcurement.destroy({ where: {} });
    console.log('??? Cleared old milk procurement logs.');

    const superAdmin = await User.findOne({ where: { role: 'SUPER_ADMIN' } });
    if (!superAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({ fullName: 'Super Admin', email: 'superadmin@dairyportal.com', passwordHash: hash, role: 'SUPER_ADMIN', status: 'APPROVED' });
      console.log('? Super Admin created');
    } else {
      console.log('? Super Admin exists');
    }

    const mpcsOfficer = await User.findOne({ where: { role: 'MPCS_OFFICER' } });
    if (!mpcsOfficer) {
      const hash = await bcrypt.hash('mpcs@123', 10);
      await User.create({ fullName: 'MPCS Officer', email: 'mpcs@demo.com', passwordHash: hash, role: 'MPCS_OFFICER', status: 'APPROVED', mpcsId: 'DIST-1-MPCS-1', hierarchyCode: 'DIST-1-MPCS-1' });
    }

    const farmers = await Farmer.findAll({ limit: 5 });
    if (farmers.length === 0) {
      const newFarmer = await Farmer.create({ farmerId: 'DIST-1-MPCS-1-1', fullName: 'Farmer Seed 1', phoneNumber: '9880000001', dateOfBirth: new Date('1980-01-01'), villageId: 101, farmSize: 5.0, numberOfCattle: 8, createdByMpcsOfficerId: mpcsOfficer ? mpcsOfficer.id : null, mpcsOfficerMpcsId: 'DIST-1-MPCS-1', status: 'ACTIVE' });
      farmers.push(newFarmer);
    }

    const today = new Date();
    const morningDate = new Date(today.setHours(8, 0, 0, 0));
    const eveningDate = new Date(today.setHours(17, 0, 0, 0));

    for (const farmer of farmers) {
      await MilkProcurement.create({ farmerId: farmer.id, farmerFarmerId: farmer.farmerId, quantityLiters: 22, milkType: 'COW', session: 'MORNING', temperature: 4.5, pricePerLiter: 50, totalAmount: 22 * 50, procurementDate: morningDate, loggedByMpcsOfficerId: mpcsOfficer ? mpcsOfficer.id : null, notes: '[Session: Morning] Auto seeding', snf: 8.5, fat: 4.5, isDispatched: true, dispatchedAt: new Date(morningDate) });
      await MilkProcurement.create({ farmerId: farmer.id, farmerFarmerId: farmer.farmerId, quantityLiters: 18, milkType: 'BUFFALO', session: 'EVENING', temperature: 5.0, pricePerLiter: 55, totalAmount: 18 * 55, procurementDate: eveningDate, loggedByMpcsOfficerId: mpcsOfficer ? mpcsOfficer.id : null, notes: '[Session: Evening] Auto seeding', snf: 9.0, fat: 6.2, isDispatched: true, dispatchedAt: new Date(eveningDate) });
    }

    console.log('? Seeded today\'s procurement logs for available farmers.');
    process.exit(0);
  } catch (error) {
    console.error('? Seed error:', error);
    process.exit(1);
  }
})();
