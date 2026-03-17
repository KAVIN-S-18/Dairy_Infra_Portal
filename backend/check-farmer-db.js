const Farmer = require('./models/Farmer');
const MilkProcurement = require('./models/MilkProcurement');
const DairyInfrastructure = require('./models/DairyInfrastructure');

async function checkFarmerData() {
    const farmer = await Farmer.findOne({ where: { phoneNumber: '9808087792' } });
    if (!farmer) {
        console.log('Farmer not found');
        return;
    }
    console.log(`Farmer Found: ${farmer.fullName} (ID: ${farmer.id})`);

    const logs = await MilkProcurement.findAll({ where: { farmerId: farmer.id } });
    console.log(`Milk Procurement Records: ${logs.length}`);

    const infra = await DairyInfrastructure.findAll({ where: { farmerId: farmer.id } });
    console.log(`Infrastructure Records: ${infra.length}`);
}

checkFarmerData();
