const bcrypt = require('bcrypt');
const sequelize = require('./config/db');
const User = require('./models/User');
const Farmer = require('./models/Farmer');
const MilkProcurement = require('./models/MilkProcurement');
const Admin = require('./models/Admin');
const DistrictManager = require('./models/DistrictManager');
const Supervisor = require('./models/Supervisor');
const Operator = require('./models/Operator');
const MPCSofficer = require('./models/MPCSofficer');
const TransportManager = require('./models/TransportManager');
const Driver = require('./models/Driver');
const MotorVehicle = require('./models/MotorVehicle');
const Trip = require('./models/Trip');
const DairyInfrastructure = require('./models/DairyInfrastructure');

async function seedDatabase() {
  try {
    // Sync database - use force: true to drop and recreate tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Keep only Super Admin, delete rest
    await User.destroy({ where: { role: { [require('sequelize').Op.ne]: 'SUPER_ADMIN' } } });
    await Admin.destroy({ truncate: true });
    await DistrictManager.destroy({ truncate: true });
    await Supervisor.destroy({ truncate: true });
    await Operator.destroy({ truncate: true });
    await MPCSofficer.destroy({ truncate: true });
    await TransportManager.destroy({ truncate: true });
    await Driver.destroy({ truncate: true });
    await MotorVehicle.destroy({ truncate: true });
    await Trip.destroy({ truncate: true });
    await Farmer.destroy({ truncate: true });
    await MilkProcurement.destroy({ truncate: true });
    console.log('✅ Old data removed');

    // Verify Super Admin exists
    const superAdmin = await User.findOne({ where: { role: 'SUPER_ADMIN' } });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        fullName: 'Super Admin',
        email: 'superadmin@dairyportal.com',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'APPROVED',
        approvedAt: new Date(),
      });
      console.log('✅ Super Admin created');
    } else {
      console.log('✅ Super Admin exists');
    }

    // Create 2 Admins
    const adminData = [];
    for (let i = 1; i <= 2; i++) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      const admin = await Admin.create({
        adminId: `A${i}`,
        fullName: `Admin ${i}`,
        email: `admin${i}@cooperative.com`,
        passwordHash: hashedPassword,
        organizationName: `Cooperative ${i}`,
        organizationType: 'COOPERATIVE',
        status: 'APPROVED',
        approvedAt: new Date(),
      });
      adminData.push(admin);
      console.log(`✅ Admin created: ${admin.adminId} (ID: ${admin.id})`);
    }

    // Create 2 District Managers per Admin
    const dmData = [];
    for (let adminIdx = 0; adminIdx < adminData.length; adminIdx++) {
      const admin = adminData[adminIdx];
      for (let dmIdx = 1; dmIdx <= 2; dmIdx++) {
        const hashedPassword = await bcrypt.hash('dm@123', 10);
        const dm = await DistrictManager.create({
          dmId: `${admin.adminId}-DM${dmIdx}`,
          adminId: admin.id,
          adminNumber: admin.adminId,
          fullName: `District Manager ${dmIdx} under ${admin.adminId}`,
          email: `dm${dmIdx}@admin${admin.id}.com`,
          passwordHash: hashedPassword,
          status: 'ACTIVE',
        });
        dmData.push(dm);
        console.log(`✅ District Manager created: ${dm.dmId} (ID: ${dm.id})`);
      }
    }

    // Create Supervisors, Operators, MPCS Officers per DM
    const mpcsData = [];
    for (const dm of dmData) {
      // Create 2 Supervisors per DM
      for (let supIdx = 1; supIdx <= 2; supIdx++) {
        const hashedPassword = await bcrypt.hash('sup@123', 10);
        const sup = await Supervisor.create({
          supId: `${dm.dmId}-SUP${supIdx}`,
          adminId: dm.adminId,
          dmId: dm.id,
          adminNumber: dm.adminNumber,
          dmNumber: dm.dmId,
          fullName: `Supervisor ${supIdx} under ${dm.dmId}`,
          email: `sup${supIdx}@dm${dm.id}.com`,
          passwordHash: hashedPassword,
          status: 'ACTIVE',
        });
        console.log(`✅ Supervisor created: ${sup.supId}`);
      }

      // Create 2 Operators per DM
      for (let opIdx = 1; opIdx <= 2; opIdx++) {
        const hashedPassword = await bcrypt.hash('op@123', 10);
        const op = await Operator.create({
          opId: `${dm.dmId}-OP${opIdx}`,
          adminId: dm.adminId,
          dmId: dm.id,
          adminNumber: dm.adminNumber,
          dmNumber: dm.dmId,
          fullName: `Operator ${opIdx} under ${dm.dmId}`,
          email: `op${opIdx}@dm${dm.id}.com`,
          passwordHash: hashedPassword,
          status: 'ACTIVE',
        });
        console.log(`✅ Operator created: ${op.opId}`);
      }

      // Create 2 MPCS Officers per DM
      for (let mpcsIdx = 1; mpcsIdx <= 2; mpcsIdx++) {
        const hashedPassword = await bcrypt.hash('mpcs@123', 10);
        const mpcsOfficer = await MPCSofficer.create({
          mpcsId: `${dm.dmId}-MPCS${mpcsIdx}`,
          adminId: dm.adminId,
          dmId: dm.id,
          adminNumber: dm.adminNumber,
          dmNumber: dm.dmId,
          fullName: `MPCS Officer ${mpcsIdx} under ${dm.dmId}`,
          email: `mpcs${mpcsIdx}@dm${dm.id}.com`,
          passwordHash: hashedPassword,
          status: 'ACTIVE',
        });
        mpcsData.push(mpcsOfficer);
        console.log(`✅ MPCS Officer created: ${mpcsOfficer.mpcsId} (ID: ${mpcsOfficer.id})`);
      }
    }

    // Create Transport Managers, Drivers, and Vehicles per DM
    let tmData = [];
    for (const dm of dmData) {
      // Create 1 Transport Manager per DM
      const hashedPassword = await bcrypt.hash('tm@123', 10);
      const tmFullName = `Transport Manager under ${dm.dmId}`;
      const tmEmail = `tm1@dm${dm.id}.com`;

      const tm = await TransportManager.create({
        tmId: `${dm.dmId}-TM1`,
        dmId: dm.id,
        dmNumber: dm.dmId,
        adminNumber: dm.adminNumber,
        fullName: tmFullName,
        email: tmEmail,
        passwordHash: hashedPassword,
        phoneNumber: `98${String(Math.random()).slice(2, 10)}`,
        licenseNumber: `TM${dm.id}${Math.random().toString().slice(2, 6)}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      });

      // Create User record for Transport Manager
      await User.create({
        fullName: tmFullName,
        email: tmEmail,
        passwordHash: hashedPassword,
        role: 'TRANSPORT_MANAGER',
        status: 'APPROVED',
        approvedAt: new Date(),
      });

      tmData.push(tm);
      console.log(`✅ Transport Manager created: ${tm.tmId}`);

      // Create 2 Drivers per Transport Manager
      for (let drIdx = 1; drIdx <= 2; drIdx++) {
        const driverPassword = await bcrypt.hash('driver@123', 10);
        const driverFullName = `Driver ${drIdx} under ${tm.tmId}`;
        const driverEmail = `driver${drIdx}@tm${tm.id}.com`;

        const driver = await Driver.create({
          driverId: `${tm.tmId}-DR${drIdx}`,
          tmId: tm.id,
          tmNumber: tm.tmId,
          dmNumber: tm.dmNumber,
          adminNumber: tm.adminNumber,
          fullName: driverFullName,
          email: driverEmail,
          passwordHash: driverPassword,
          phoneNumber: `98${String(Math.random()).slice(2, 10)}`,
          drivingLicenseNumber: `DL${tm.id}${drIdx}${Math.random().toString().slice(2, 5)}`,
          licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
          licenseClass: ['LMV', 'HMV', 'HPMV'][drIdx % 3],
          status: 'ACTIVE',
        });

        // Create User record for Driver
        await User.create({
          fullName: driverFullName,
          email: driverEmail,
          passwordHash: driverPassword,
          role: 'DRIVER',
          status: 'APPROVED',
          approvedAt: new Date(),
        });

        console.log(`✅ Driver created: ${driver.driverId}`);
      }

      // Create 2 Motor Vehicles per Transport Manager
      for (let vIdx = 1; vIdx <= 2; vIdx++) {
        const vehicle = await MotorVehicle.create({
          vehicleId: `${tm.tmId}-V${vIdx}`,
          tmId: tm.id,
          tmNumber: tm.tmId,
          dmNumber: tm.dmNumber,
          adminNumber: tm.adminNumber,
          registrationNumber: `MILK${tm.id}${vIdx}${Math.random().toString().slice(2, 5)}`,
          chasisNumber: `CH${tm.id}${vIdx}${Math.random().toString().slice(2, 8)}`,
          engineNumber: `EN${tm.id}${vIdx}${Math.random().toString().slice(2, 8)}`,
          vehicleType: vIdx === 1 ? 'TANKER' : 'REFRIGERATED',
          manufactureBrand: ['Tata', 'Mahindra', 'Ashok Leyland'][vIdx % 3],
          year: 2020 + (vIdx % 4),
          capacity: 1000 + (vIdx * 500),
          registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          insuranceCompany: 'Insurance Co',
          status: 'ACTIVE',
        });
        console.log(`✅ Motor Vehicle created: ${vehicle.vehicleId}`);
      }
    }

    // Create 3 Farmers per MPCS Officer
    let procurementRecords = 0;
    for (const mpcsOfficer of mpcsData) {
      for (let farmerIdx = 1; farmerIdx <= 3; farmerIdx++) {
        // Generate a date of birth (default password format: DDMMYYYY)
        const dob = new Date(1980 + (farmerIdx % 20), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));
        const day = String(dob.getDate()).padStart(2, '0');
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const year = dob.getFullYear();
        const dobString = `${day}${month}${year}`; // DDMMYYYY format

        const farmer = await Farmer.create({
          farmerId: `${mpcsOfficer.mpcsId}-F${farmerIdx}`,
          mpcsOfficerId: mpcsOfficer.id,
          mpcsNumber: mpcsOfficer.mpcsId,
          fullName: `Farmer ${farmerIdx} under ${mpcsOfficer.mpcsId}`,
          phoneNumber: `98${String(Math.random()).slice(2, 10)}`,
          dateOfBirth: dob,
          farmSize: 5 + (farmerIdx * 1.5),
          numberOfCattle: 10 + farmerIdx,
          landDetails: {
            totalArea: 5 + (farmerIdx * 1.5),
            location: `Village ${farmerIdx}, Sector ${mpcsOfficer.id}`,
            irrigationType: ['CANAL', 'WELL', 'BOREWELL'][farmerIdx % 3],
            soilType: ['Black', 'Red', 'Alluvial'][farmerIdx % 3],
            cropPattern: 'Paddy, Sugarcane'
          },
          cattleDetails: {
            totalCount: 10 + farmerIdx,
            breed: ['Holstein', 'Jersey', 'Gir'][farmerIdx % 3],
            healthStatus: 'HEALTHY',
            lastVaccineDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            notes: 'Regular checkup completed'
          },
          status: 'ACTIVE',
          createdByMpcsOfficerId: mpcsOfficer.id,
        });
        console.log(`✅ Farmer created: ${farmer.farmerId} (ID: ${farmer.id}) - DOB Password: ${dobString}`);

        // Create 2 Infrastructure records per Farmer (assigned by MPCS Officer logic)
        const infraTypes = [
          { name: 'Bulk Milk Cooler', type: 'COOLER' },
          { name: 'Electric Pump', type: 'PUMP' },
          { name: 'Stainless Steel Container', type: 'CONTAINER' }
        ];
        for (let i = 0; i < 2; i++) {
          const type = infraTypes[(farmerIdx + i) % 3];
          await DairyInfrastructure.create({
            farmerId: farmer.id,
            equipmentName: type.name,
            equipmentType: type.type,
            purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            condition: 'GOOD',
            maintenanceNotes: 'Assigned and inspected by MPCS Officer',
            lastMaintenanceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            nextMaintenanceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          });
        }

        // Create 3 Milk Procurement records per Farmer
        for (let procIdx = 1; procIdx <= 3; procIdx++) {
          const quantity = 20 + (procIdx * 5);
          const quality = ['A', 'B', 'C'][procIdx - 1];

          await MilkProcurement.create({
            farmerId: farmer.id,
            farmerFarmerId: farmer.farmerId,
            quantityLiters: quantity,
            quality,
            temperature: 37 - (procIdx * 0.5),
            procurementDate: new Date(Date.now() - (3 - procIdx) * 24 * 60 * 60 * 1000),
            loggedByMpcsOfficerId: mpcsOfficer.id,
            pricePerLiter: 30,
            totalAmount: quantity * 30,
            notes: `Procurement record ${procIdx} for farmer ${farmer.farmerId}`,
          });
          procurementRecords++;
        }
      }
    }

    console.log(`✅ Created ${procurementRecords} procurement records`);
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admins: 2`);
    console.log(`   - District Managers: 4`);
    console.log(`   - Transport Managers: 4`);
    console.log(`   - Drivers: 8`);
    console.log(`   - Motor Vehicles: 8`);
    console.log(`   - Supervisors: 8`);
    console.log(`   - Operators: 8`);
    console.log(`   - MPCS Officers: 8`);
    console.log(`   - Farmers: ${mpcsData.length * 3}`);
    console.log(`   - Milk Procurement Records: ${procurementRecords}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   - Super Admin: superadmin@dairyportal.com / admin123');
    console.log('   - Admin: admin1@cooperative.com / admin@123');
    console.log('   - DM: dm1@admin1.com / dm@123');
    console.log('   - TM: tm1@dm1.com / tm@123');
    console.log('   - Driver: driver1@tm1.com / driver@123');
    console.log('   - MPCS Officer: mpcs1@dm1.com / mpcs@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
