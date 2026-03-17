const MilkProcurement = require('./models/MilkProcurement');
const Batch = require('./models/Batch');
const Farmer = require('./models/Farmer');
const MPCSofficer = require('./models/MPCSofficer');
const sequelize = require('./config/db');

async function resetAndPopulate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Clear dispatches/procurements and batches
        await MilkProcurement.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Cleared Milk Procurement data.');

        // Check if Batch model exists 
        try {
            await Batch.destroy({ where: {}, truncate: { cascade: true } });
            console.log('Cleared Batch data.');
        } catch (e) {
            console.log('Batch model skip clearing.');
        }

        // Find the first MPCS officer
        const mpcsOfficer = await MPCSofficer.findOne({ where: { email: 'mpcs1@dm1.com' } });
        if (!mpcsOfficer) throw new Error('No MPCS Officer found with email mpcs1@dm1.com');

        // Find a farmer under this officer
        const farmer = await Farmer.findOne({ where: { createdByMpcsOfficerId: mpcsOfficer.id } });
        if (!farmer) {
            // Create a dummy farmer if not found
            console.log('Farmer not found, creating a test farmer...');
            const tempFarmer = await Farmer.create({
                farmerId: `${mpcsOfficer.mpcsId}-F1`,
                fullName: 'Test Farmer MPCS1',
                email: 'farmer1@mpcs1.com',
                phoneNumber: '9000000001',
                villageId: 101,
                farmSize: 5.5,
                numberOfCattle: 10,
                createdByMpcsOfficerId: mpcsOfficer.id,
                mpcsOfficerMpcsId: mpcsOfficer.mpcsId,
                status: 'ACTIVE'
            });
            return await createLog(tempFarmer, mpcsOfficer);
        }

        await createLog(farmer, mpcsOfficer);

        async function createLog(f, o) {
            // Log 500L of milk
            await MilkProcurement.create({
                farmerId: f.id,
                farmerFarmerId: f.farmerId,
                quantityLiters: 500,
                quality: 'A',
                temperature: 4.5,
                pricePerLiter: 37.5,
                totalAmount: 500 * 37.5,
                procurementDate: new Date(),
                loggedByMpcsOfficerId: o.id,
                notes: 'Initial Demo Log',
                snf: 8.5,
                fat: 4.5
            });
            console.log(`Successfully logged 500L for farmer ${f.fullName}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
}

resetAndPopulate();
