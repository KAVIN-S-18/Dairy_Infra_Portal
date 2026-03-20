const sequelize = require('./config/db');
const MilkProcurement = require('./models/MilkProcurement');
const MPCSDispatch = require('./models/MPCSDispatch');
const Trip = require('./models/Trip');
const Driver = require('./models/Driver');
const MotorVehicle = require('./models/MotorVehicle');

async function clearLogs() {
  try {
    console.log('🧹 Clearing logs...');
    
    // Clear transactional tables
    await MPCSDispatch.destroy({ where: {}, truncate: { cascade: true } });
    await MilkProcurement.destroy({ where: {}, truncate: { cascade: true } });
    await Trip.destroy({ where: {}, truncate: { cascade: true } });
    
    // Reset driver and vehicle statuses
    await Driver.update({ status: 'ACTIVE' }, { where: {} });
    await MotorVehicle.update({ status: 'ACTIVE' }, { where: {} });
    
    console.log('✅ Logs cleared and driver/vehicle statuses reset.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing logs:', error);
    process.exit(1);
  }
}

clearLogs();
