const sequelize = require('./config/db');
const User = require('./models/User');
const Farmer = require('./models/Farmer');
const MilkProcurement = require('./models/MilkProcurement');
const bcrypt = require('bcrypt');

(async () => {
  try {
    console.log('🔄 Starting database reset and seeding...\n');

    // 1. Sync database
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced\n');

    // 2. Delete all data except Super Admin
    console.log('🗑️ Cleaning database (keeping Super Admin)...');
    const superAdmin = await User.findOne({ where: { role: 'SUPER_ADMIN' } });
    
    await MilkProcurement.destroy({ where: {} });
    await Farmer.destroy({ where: {} });
    await User.destroy({ where: { role: { [require('sequelize').Op.not]: 'SUPER_ADMIN' } } });
    
    console.log('✅ Old data removed\n');

    // 3. Get or create Super Admin
    if (!superAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({
        fullName: 'System Super Admin',
        email: 'superadmin@dairyportal.com',
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        status: 'APPROVED',
      });
      console.log('✅ Super Admin created\n');
    } else {
      console.log('✅ Super Admin exists\n');
    }

    // 4. Create Admin (Cooperative)
    console.log('📝 Creating Admin...');
    const adminHash = await bcrypt.hash('admin@123', 10);
    const admin = await User.create({
      fullName: 'Cooperative Admin',
      email: 'admin@cooperative.com',
      passwordHash: adminHash,
      role: 'COOPERATIVE_ADMIN',
      status: 'APPROVED',
    });
    console.log(`✅ Admin created (ID: ${admin.id})\n`);

    // 5. Create District Managers
    console.log('📝 Creating District Managers...');
    const dms = [];
    for (let i = 1; i <= 2; i++) {
      const hash = await bcrypt.hash('dm@123', 10);
      const dm = await User.create({
        fullName: `District Manager ${i}`,
        email: `dm${i}@dairy.com`,
        passwordHash: hash,
        role: 'DISTRICT_MANAGER',
        status: 'APPROVED',
        adminId: admin.id,
        hierarchyCode: `DIST-${i}`,
        districtCode: `DIST-${i}`,
      });
      dms.push(dm);
      console.log(`  ✅ DIST-${i} (ID: ${dm.id})`);
    }
    console.log('');

    // 6. Create Supervisors and Operators under each DM
    console.log('📝 Creating Supervisors and Operators...');
    for (const dm of dms) {
      const distNum = dm.hierarchyCode.split('-')[1];

      // Create Supervisors
      for (let i = 1; i <= 2; i++) {
        const hash = await bcrypt.hash('sup@123', 10);
        const sup = await User.create({
          fullName: `Supervisor ${distNum}-${i}`,
          email: `sup-dist${distNum}-${i}@dairy.com`,
          passwordHash: hash,
          role: 'SUPERVISOR',
          status: 'APPROVED',
          adminId: admin.id,
          districtManagerId: dm.id,
          districtCode: dm.districtCode,
          hierarchyCode: `DIST-${distNum}-SUP-${i}`,
        });
        console.log(`  ✅ DIST-${distNum}-SUP-${i} (ID: ${sup.id})`);
      }

      // Create Operators
      for (let i = 1; i <= 2; i++) {
        const hash = await bcrypt.hash('op@123', 10);
        const op = await User.create({
          fullName: `Operator ${distNum}-${i}`,
          email: `op-dist${distNum}-${i}@dairy.com`,
          passwordHash: hash,
          role: 'OPERATOR',
          status: 'APPROVED',
          adminId: admin.id,
          districtManagerId: dm.id,
          districtCode: dm.districtCode,
          hierarchyCode: `DIST-${distNum}-OP-${i}`,
        });
        console.log(`  ✅ DIST-${distNum}-OP-${i} (ID: ${op.id})`);
      }
    }
    console.log('');

    // 7. Create MPCS Officers under each DM with their farmers
    console.log('📝 Creating MPCS Officers and Farmers...');
    const farmers = [];
    for (const dm of dms) {
      const distNum = dm.hierarchyCode.split('-')[1];

      // Create MPCS Officers
      for (let m = 1; m <= 2; m++) {
        const hash = await bcrypt.hash('mpcs@123', 10);
        const mpcs = await User.create({
          fullName: `MPCS Officer ${distNum}-${m}`,
          email: `mpcs-dist${distNum}-${m}@dairy.com`,
          passwordHash: hash,
          role: 'MPCS_OFFICER',
          status: 'APPROVED',
          adminId: admin.id,
          districtManagerId: dm.id,
          districtCode: dm.districtCode,
          hierarchyCode: `DIST-${distNum}-MPCS-${m}`,
          mpcsId: `DIST-${distNum}-MPCS-${m}`,
        });
        console.log(`  ✅ DIST-${distNum}-MPCS-${m} (ID: ${mpcs.id})`);

        // Create Farmers under this MPCS Officer
        for (let f = 1; f <= 3; f++) {
          const farmerId = `DIST-${distNum}-MPCS-${m}-${f}`;
          const farmer = await Farmer.create({
            farmerId,
            fullName: `Farmer ${farmerId}`,
            email: `farmer-${farmerId}@dairy.com`,
            phoneNumber: `988000${distNum}${m}${f}`,
            villageId: parseInt(`${distNum}${m}${f}`),
            farmSize: 5.5 + (f * 0.5),
            numberOfCattle: 8 + f,
            status: 'ACTIVE',
            createdByMpcsOfficerId: mpcs.id,
            mpcsOfficerMpcsId: mpcs.hierarchyCode,
          });
          farmers.push(farmer);
          console.log(`    ✅ Farmer: ${farmerId} (ID: ${farmer.id})`);
        }
      }
    }
    console.log('');

    // 8. Create sample Milk Procurement records
    console.log('📝 Creating Milk Procurement records...');
    let procurementCount = 0;
    for (const farmer of farmers) {
      const mpcsUser = await User.findOne({
        where: { role: 'MPCS_OFFICER', hierarchyCode: farmer.mpcsOfficerMpcsId }
      });

      if (mpcsUser) {
        // Create 2-3 procurement records per farmer
        for (let p = 1; p <= 3; p++) {
          const quantityLiters = 20 + (p * 5);
          const quality = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
          const pricePerLiter = quality === 'A' ? 50 : quality === 'B' ? 42 : 35;
          const totalAmount = quantityLiters * pricePerLiter;

          await MilkProcurement.create({
            farmerId: farmer.id,
            farmerFarmerId: farmer.farmerId,
            quantityLiters,
            quality,
            temperature: 4 + Math.random() * 2,
            pricePerLiter,
            totalAmount,
            procurementDate: new Date(Date.now() - (p * 24 * 60 * 60 * 1000)),
            loggedByMpcsOfficerId: mpcsUser.id,
            notes: `Sample procurement for ${farmer.farmerId}`,
          });
          procurementCount++;
        }
      }
    }
    console.log(`  ✅ Created ${procurementCount} procurement records\n`);

    // 9. Summary
    console.log('═'.repeat(50));
    console.log('✅✅✅ DATABASE SEEDING COMPLETE ✅✅✅');
    console.log('═'.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`  • Super Admin: 1`);
    console.log(`  • Admin (Cooperative): 1 (ID: ${admin.id})`);
    console.log(`  • District Managers: ${dms.length}`);
    console.log(`  • Supervisors: ${dms.length * 2}`);
    console.log(`  • Operators: ${dms.length * 2}`);
    console.log(`  • MPCS Officers: ${dms.length * 2}`);
    console.log(`  • Farmers: ${farmers.length}`);
    console.log(`  • Milk Procurement Records: ${procurementCount}`);

    console.log('\n🔐 Sample Credentials:');
    console.log('  Admin Login:');
    console.log('    Email: admin@cooperative.com');
    console.log('    Password: admin@123');
    console.log('\n  MPCS Officer Login:');
    console.log('    Email: mpcs-dist1-1@dairy.com');
    console.log('    Password: mpcs@123');

    console.log('\n🆔 Sample IDs:');
    console.log('  • District Manager: DIST-1, DIST-2');
    console.log('  • Supervisor: DIST-1-SUP-1, DIST-1-SUP-2');
    console.log('  • Operator: DIST-1-OP-1, DIST-1-OP-2');
    console.log('  • MPCS Officer: DIST-1-MPCS-1, DIST-1-MPCS-2');
    console.log('  • Farmer: DIST-1-MPCS-1-1, DIST-1-MPCS-1-2, etc.');

    console.log('\n✅ All data resets have ID starting from 1');
    console.log('═'.repeat(50));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
