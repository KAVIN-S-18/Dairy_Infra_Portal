const sequelize = require('./config/db');
const MilkProcurement = require('./models/MilkProcurement');
const FarmerMilkLog = require('./models/FarmerMilkLog');
const Farmer = require('./models/Farmer');
const User = require('./models/User');

async function reset() {
    try {
        await sequelize.authenticate();

        console.log('Truncating procurement and milk logs...');
        await MilkProcurement.destroy({ where: {} });
        await FarmerMilkLog.destroy({ where: {} });

        console.log('Updating all farmers to have consistent cattle/infra records...');
        const farmers = await Farmer.findAll();
        for (const farmer of farmers) {
            const list = [
                { tagNumber: 'TAG-1011', breed: 'Holstein Friesian', lastVaccination: '2026-02-01' },
                { tagNumber: 'TAG-1012', breed: 'Jersey', lastVaccination: '2026-01-15' }
            ];

            farmer.landDetails = {
                description: '2 well-maintained milking sheds with automated pipelines',
                totalArea: 5,
                location: 'Registered Colony',
                irrigationType: 'Drip',
                soilType: 'Loamy'
            };

            farmer.cattleDetails = {
                totalCount: 2,
                list: list,
                healthStatus: 'HEALTHY'
            };

            farmer.numberOfCattle = 2;
            farmer.farmSize = 5;

            await farmer.save();
        }

        console.log('Creating sample logs...');
        const officer = await User.findOne({ where: { role: 'MPCS_OFFICER' } });

        if (officer && farmers.length > 0) {
            const farmer = farmers[0];
            await MilkProcurement.create({
                farmerId: farmer.id,
                farmerFarmerId: farmer.farmerId,
                quantityLiters: 15.5,
                quality: 'A',
                temperature: 4.1,
                pricePerLiter: 34.56,
                totalAmount: 15.5 * 34.56,
                procurementDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                loggedByMpcsOfficerId: officer.id,
                notes: '[Session: Morning] Excellent quality',
                snf: 8.0,
                fat: 4.0
            });

            await MilkProcurement.create({
                farmerId: farmer.id,
                farmerFarmerId: farmer.farmerId,
                quantityLiters: 12.0,
                quality: 'B',
                temperature: 4.5,
                pricePerLiter: 33.5,
                totalAmount: 12.0 * 33.5,
                procurementDate: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
                loggedByMpcsOfficerId: officer.id,
                notes: '[Session: Evening] Good quality',
                snf: 8.2,
                fat: 3.8
            });
        }

        console.log('Database logs cleared and consistent farmer records established.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reset();
