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
const MPCSDispatch = require('./models/MPCSDispatch');
const ChillerTank = require('./models/ChillerTank');
const DairyInfrastructure = require('./models/DairyInfrastructure');

async function seedDatabase() {
  try {
    console.log('🚮 Clearing existing data (FRESH START)...');
    await sequelize.sync({ force: true });

    const hashedDefaultPassword = await bcrypt.hash('admin123', 10);
    const commonPassword = await bcrypt.hash('pass123', 10);

    // 1. Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'superadmin@dairyportal.com',
      passwordHash: hashedDefaultPassword,
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      approvedAt: new Date(),
    });

    // 2. Admin
    const admin = await Admin.create({
      adminId: 'A1',
      fullName: 'Supreme Admin',
      email: 'admin@test.com',
      passwordHash: commonPassword,
      organizationName: 'Regional Dairy Cooperative',
      status: 'APPROVED',
    });
    await User.create({ fullName: 'Supreme Admin', email: 'admin@test.com', passwordHash: commonPassword, role: 'ADMIN', status: 'APPROVED' });

    // 3. District Manager
    const dm = await DistrictManager.create({
      dmId: 'A1-DM1',
      fullName: 'Kavin District Manager',
      email: 'dm@test.com',
      passwordHash: commonPassword,
      adminId: admin.id,
      adminNumber: 'A1',
      status: 'ACTIVE',
    });
    await User.create({ fullName: 'Kavin DM', email: 'dm@test.com', passwordHash: commonPassword, role: 'DISTRICT_MANAGER', status: 'APPROVED' });

    // 4. Transport Manager
    const tm = await TransportManager.create({
      tmId: 'A1-DM1-TM1',
      fullName: 'Logistics Manager Kumar',
      email: 'tm@test.com',
      passwordHash: commonPassword,
      dmId: dm.id,
      dmNumber: 'A1-DM1',
      adminNumber: 'A1',
    });
    await User.create({ fullName: 'TM Kumar', email: 'tm@test.com', passwordHash: commonPassword, role: 'TRANSPORT_MANAGER', status: 'APPROVED' });

    // 5. MPCS Officer
    const mpcs = await MPCSofficer.create({
      mpcsId: 'A1-DM1-MPCS1',
      fullName: 'MPCS Officer Ravi',
      email: 'mpcs@test.com',
      passwordHash: commonPassword,
      dmId: dm.id,
      dmNumber: 'A1-DM1',
      adminId: admin.id,
      adminNumber: 'A1',
    });
    await User.create({ fullName: 'Officer Ravi', email: 'mpcs@test.com', passwordHash: commonPassword, role: 'MPCS_OFFICER', status: 'APPROVED' });

    for (let i = 2; i <= 3; i++) {
      const m = await MPCSofficer.create({
          mpcsId: `A1-DM1-MPCS${i}`,
          fullName: `MPCS Officer ${i}`,
          email: `mpcs${i}@test.com`,
          passwordHash: commonPassword,
          dmId: dm.id,
          dmNumber: 'A1-DM1',
          adminId: admin.id,
          adminNumber: 'A1',
      });
      await User.create({ fullName: `Officer ${i}`, email: `mpcs${i}@test.com`, passwordHash: commonPassword, role: 'MPCS_OFFICER', status: 'APPROVED' });
    }

    // 6. Supervisors
    const collSup = await Supervisor.create({
      supId: 'A1-DM1-SUP1',
      fullName: 'Supervisor Arun (Collection)',
      email: 'coll@test.com',
      passwordHash: commonPassword,
      specialization: 'COLLECTION',
      adminId: admin.id,
      dmId: dm.id,
      dmNumber: 'A1-DM1',
      adminNumber: 'A1',
    });
    await User.create({ fullName: 'Supervisor Arun', email: 'coll@test.com', passwordHash: commonPassword, role: 'SUPERVISOR', status: 'APPROVED', specialization: 'COLLECTION' });

    const prodSup = await Supervisor.create({
      supId: 'A1-DM1-SUP2',
      fullName: 'Supervisor Bala (Production)',
      email: 'prod@test.com',
      passwordHash: commonPassword,
      specialization: 'PRODUCTION',
      adminId: admin.id,
      dmId: dm.id,
      dmNumber: 'A1-DM1',
      adminNumber: 'A1',
    });
    await User.create({ fullName: 'Supervisor Bala', email: 'prod@test.com', passwordHash: commonPassword, role: 'SUPERVISOR', status: 'APPROVED', specialization: 'PRODUCTION' });

    for (let i = 3; i <= 6; i++) {
        await Supervisor.create({
          supId: `A1-DM1-SUP${i}`,
          fullName: `Supervisor ${i} (Production)`,
          email: `prod${i}@test.com`,
          passwordHash: commonPassword,
          specialization: 'PRODUCTION',
          adminId: admin.id,
          dmId: dm.id,
          dmNumber: 'A1-DM1',
          adminNumber: 'A1',
        });
        await User.create({ fullName: `Supervisor ${i}`, email: `prod${i}@test.com`, passwordHash: commonPassword, role: 'SUPERVISOR', status: 'APPROVED', specialization: 'PRODUCTION' });
    }

    // 7. Operator
    const operator = await Operator.create({
      opId: 'A1-DM1-SUP2-OP1',
      fullName: 'Operator Selvam',
      email: 'op@test.com',
      passwordHash: commonPassword,
      supervisorId: prodSup.id,
      adminId: admin.id,
      dmId: dm.id,
      supNumber: 'A1-DM1-SUP2',
      dmNumber: 'A1-DM1',
      adminNumber: 'A1',
    });
    await User.create({ fullName: 'Operator Selvam', email: 'op@test.com', passwordHash: commonPassword, role: 'OPERATOR', status: 'APPROVED' });

    for (let i = 2; i <= 11; i++) {
        await Operator.create({
          opId: `A1-DM1-SUP2-OP${i}`,
          fullName: `Operator ${i}`,
          email: `op${i}@test.com`,
          passwordHash: commonPassword,
          supervisorId: prodSup.id,
          adminId: admin.id,
          dmId: dm.id,
          supNumber: 'A1-DM1-SUP2',
          dmNumber: 'A1-DM1',
          adminNumber: 'A1',
        });
        await User.create({ fullName: `Operator ${i}`, email: `op${i}@test.com`, passwordHash: commonPassword, role: 'OPERATOR', status: 'APPROVED' });
    }

    // 8. Driver and Vehicle
    const driver = await Driver.create({
      driverId: 'A1-DM1-TM1-DRV1',
      fullName: 'Driver Mani',
      email: 'driver@test.com',
      passwordHash: commonPassword,
      tmId: tm.id,
      dmId: dm.id,
      tmNumber: 'A1-DM1-TM1',
      dmNumber: 'A1-DM1',
      adminNumber: 'A1',
      drivingLicenseNumber: 'DL-TN-2023-0001',
      licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
      licenseClass: 'HMV',
      status: 'ACTIVE',
    });
    await User.create({ fullName: 'Driver Mani', email: 'driver@test.com', passwordHash: commonPassword, role: 'DRIVER', status: 'APPROVED' });

    await MotorVehicle.create({
      vehicleId: 'A1-DM1-TM1-V1',
      registrationNumber: 'TN-01-AB-1234',
      chasisNumber: 'CH-TN-0001',
      engineNumber: 'EN-TN-0001',
      vehicleType: 'TRUCK',
      manufactureBrand: 'TATA',
      year: 2023,
      registrationExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
      capacity: 5000,
      tmId: tm.id,
      dmId: dm.id,
      tmNumber: 'A1-DM1-TM1',
      dmNumber: 'A1-DM1',
      adminNumber: 'A1',
      status: 'ACTIVE',
    });

    for (let i = 2; i <= 5; i++) {
        await Driver.create({
          driverId: `A1-DM1-TM1-DRV${i}`,
          fullName: `Driver ${i}`,
          email: `driver${i}@test.com`,
          passwordHash: commonPassword,
          tmId: tm.id,
          dmId: dm.id,
          tmNumber: 'A1-DM1-TM1',
          dmNumber: 'A1-DM1',
          adminNumber: 'A1',
          drivingLicenseNumber: `DL-TN-2023-000${i}`,
          licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
          licenseClass: 'HMV',
          status: 'ACTIVE',
        });
        await User.create({ fullName: `Driver ${i}`, email: `driver${i}@test.com`, passwordHash: commonPassword, role: 'DRIVER', status: 'APPROVED' });

        await MotorVehicle.create({
          vehicleId: `A1-DM1-TM1-V${i}`,
          registrationNumber: `TN-01-AB-100${i}`,
          chasisNumber: `CH-TN-000${i}`,
          engineNumber: `EN-TN-000${i}`,
          vehicleType: 'TRUCK',
          manufactureBrand: 'TATA',
          year: 2023,
          registrationExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
          capacity: 5000,
          tmId: tm.id,
          dmId: dm.id,
          tmNumber: 'A1-DM1-TM1',
          dmNumber: 'A1-DM1',
          adminNumber: 'A1',
          status: 'ACTIVE',
        });
    }

    // 9. Farmers
    const farmer1 = await Farmer.create({
      farmerId: 'A1-DM1-MPCS1-F1',
      fullName: 'Farmer Murugan',
      email: 'farmer@test.com',
      phoneNumber: '9876543210',
      mpcsOfficerId: mpcs.id,
      createdByMpcsOfficerId: mpcs.id,
      mpcsNumber: 'A1-DM1-MPCS1',
      dateOfBirth: '1990-01-01',
      villageId: 101,
      farmSize: 5.5,
      numberOfCattle: 15,
      landDetails: { area: '5.5 acres', location: 'North Village', irrigationType: 'Borewell' },
      cattleDetails: { breeds: ['Holstein Friesian', 'Jersey'], count: 15, healthStatus: 'Excellent' },
      status: 'ACTIVE'
    });

    await DairyInfrastructure.bulkCreate([
      { farmerId: farmer1.id, equipmentName: 'Bulk Milk Cooler 500L', equipmentType: 'COOLER', purchaseDate: '2023-01-15', lastMaintenanceDate: '2025-10-10', nextMaintenanceDate: '2026-04-10', condition: 'GOOD' },
      { farmerId: farmer1.id, equipmentName: 'Milking Machine V2', equipmentType: 'PUMP', purchaseDate: '2024-05-20', lastMaintenanceDate: '2025-12-01', nextMaintenanceDate: '2026-06-01', condition: 'GOOD' },
      { farmerId: farmer1.id, equipmentName: 'Stainless Steel Container 50L', equipmentType: 'CONTAINER', purchaseDate: '2025-01-10', condition: 'GOOD' }
    ]);
    for (let i = 2; i <= 4; i++) {
        const farmerExtra = await Farmer.create({
          farmerId: `A1-DM1-MPCS1-F${i}`,
          fullName: `Farmer ${i}`,
          email: `farmer${i}@test.com`,
          phoneNumber: `987654321${i}`,
          mpcsOfficerId: mpcs.id,
          createdByMpcsOfficerId: mpcs.id,
          mpcsNumber: 'A1-DM1-MPCS1',
          dateOfBirth: '1990-01-01',
          villageId: 101 + i,
          farmSize: Math.round((2.5 + i * 1.2) * 10) / 10,
          numberOfCattle: 5 + i * 2,
          landDetails: { area: `${Math.round((2.5 + i * 1.2) * 10) / 10} acres`, location: `Village Zone ${i}`, irrigationType: i % 2 === 0 ? 'Canal' : 'Rainfed' },
          cattleDetails: { breeds: ['Local Breed', 'Murrah'], count: 5 + i * 2, healthStatus: 'Good' },
          status: 'ACTIVE'
        });

        await DairyInfrastructure.bulkCreate([
          { farmerId: farmerExtra.id, equipmentName: `Cooling Tank ${i}00L`, equipmentType: 'COOLER', purchaseDate: `2023-0${i}-15`, nextMaintenanceDate: `2026-0${i + 2}-15`, condition: i % 2 === 0 ? 'GOOD' : 'FAIR' },
          { farmerId: farmerExtra.id, equipmentName: `Milking Vacuum Pump`, equipmentType: 'PUMP', condition: 'GOOD' }
        ]);
    }

    // 10. Chiller Tanks
    await ChillerTank.create({
      tankId: 'TANK-COW-01',
      name: 'Primary Cow Milk Silo',
      milkType: 'COW',
      capacity: 10000,
      dmId: dm.id,
      currentLevel: 0,
      temperature: 4.0,
      status: 'ACTIVE'
    });
    await ChillerTank.create({
      tankId: 'TANK-BUF-01',
      name: 'Primary Buffalo Milk Silo',
      milkType: 'BUFFALO',
      capacity: 8000,
      dmId: dm.id,
      currentLevel: 0,
      temperature: 4.2,
      status: 'ACTIVE'
    });

    console.log('🎉 Database seeding completed with clear hierarchy!');
    console.log('CREDENTIALS: all use password "pass123" EXCEPT Farmer');
    console.log('Superadmin: superadmin@dairyportal.com / admin123');
    console.log('Admin: admin@test.com | DM: dm@test.com | TM: tm@test.com | MPCS: mpcs@test.com');
    console.log('Farmer: 9876543210 / 01011990 (DOB)');
    console.log('Coll Sup: coll@test.com | Prod Sup: prod@test.com | Op: op@test.com | Driver: driver@test.com');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
