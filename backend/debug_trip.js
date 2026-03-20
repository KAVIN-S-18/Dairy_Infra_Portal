const sequelize = require('./config/db');
const MPCSDispatch = require('./models/MPCSDispatch');
const Trip = require('./models/Trip');

async function check() {
    try {
        const tripId = 'TRIP-2026-0001';
        const trip = await Trip.findOne({ where: { tripId } });
        console.log('--- TRIP INFO ---');
        console.log('ID:', trip ? trip.id : 'N/A', 'Status:', trip ? trip.tripStatus : 'NOT FOUND');
        
        const dispatches = await MPCSDispatch.findAll({ where: { assignedTripId: tripId } });
        console.log('--- DISPATCHES LINKED ---');
        console.log('Count:', dispatches.length);
        dispatches.forEach(d => {
            console.log(`ID: ${d.id}, DispatchID: ${d.dispatchId}, Status: ${d.status}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
