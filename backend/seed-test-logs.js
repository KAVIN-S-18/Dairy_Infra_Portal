const sequelize = require('./config/db');
const MilkProcurement = require('./models/MilkProcurement');
const MPCSDispatch = require('./models/MPCSDispatch');
const Farmer = require('./models/Farmer');
const MPCSofficer = require('./models/MPCSofficer');

async function seedGroupedLogs() {
  try {
    console.log('🧹 Clearing old logs for fresh start...');
    await MPCSDispatch.destroy({ where: {}, truncate: { cascade: true } });
    await MilkProcurement.destroy({ where: {}, truncate: { cascade: true } });

    const mpcs = await MPCSofficer.findOne({ where: { mpcsId: 'A1-DM1-MPCS1' } });
    if (!mpcs) throw new Error('MPCS Officer MPCS1 not found');

    const farmers = await Farmer.findAll({ limit: 5 });
    if (farmers.length < 3) throw new Error('Need at least 3 farmers for testing');

    console.log('🚀 Seeding grouped session dispatches...');

    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Session: COW - MORNING (3 Farmers)
    const cowMorningQty = [50, 60, 40];
    const cowDispatch = await MPCSDispatch.create({
      dispatchId: `DISP-${mpcs.id}-${dateStr}-COW-MORNING-TEST`,
      mpcsOfficerId: mpcs.id,
      mpcsName: 'MPCS CENTER 1',
      milkType: 'COW',
      session: 'MORNING',
      totalQuantity: 150,
      status: 'WAITING_FOR_PICKUP'
    });

    for (let i = 0; i < 3; i++) {
      await MilkProcurement.create({
        farmerId: farmers[i].id,
        farmerFarmerId: farmers[i].farmerId,
        milkType: 'COW',
        quantityLiters: cowMorningQty[i],
        fat: 4.2,
        snf: 8.5,
        pricePerLiter: 38,
        totalAmount: cowMorningQty[i] * 38,
        mpcsDispatchId: cowDispatch.id,
        dispatchStatus: 'WAITING_FOR_PICKUP',
        procurementDate: new Date(),
        loggedByMpcsOfficerId: mpcs.id,
        session: 'MORNING',
        isDispatched: true
      });
    }

    // 2. Session: BUFFALO - MORNING (2 Farmers)
    const bufMorningQty = [80, 70];
    const bufDispatch = await MPCSDispatch.create({
      dispatchId: `DISP-${mpcs.id}-${dateStr}-BUFFALO-MORNING-TEST`,
      mpcsOfficerId: mpcs.id,
      mpcsName: 'MPCS CENTER 1',
      milkType: 'BUFFALO',
      session: 'MORNING',
      totalQuantity: 150,
      status: 'WAITING_FOR_PICKUP'
    });

    for (let i = 0; i < 2; i++) {
        await MilkProcurement.create({
          farmerId: farmers[i+1].id,
          farmerFarmerId: farmers[i+1].farmerId,
          milkType: 'BUFFALO',
          quantityLiters: bufMorningQty[i],
          fat: 6.5,
          snf: 9.0,
          pricePerLiter: 55,
          totalAmount: bufMorningQty[i] * 55,
          mpcsDispatchId: bufDispatch.id,
          dispatchStatus: 'WAITING_FOR_PICKUP',
          procurementDate: new Date(),
          loggedByMpcsOfficerId: mpcs.id,
          session: 'MORNING',
          isDispatched: true
        });
      }

    console.log('✅ Created 2 Grouped Dispatches (5 Farmer logs total)');
    console.log('🎉 Test data updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding logs:', error);
    process.exit(1);
  }
}

seedGroupedLogs();
