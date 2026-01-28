const db = require('./config/db');
const Farmer = require('./models/Farmer');

(async () => {
  try {
    await db.authenticate();
    const farmers = await Farmer.findAll({ limit: 6 });
    
    console.log('\n📱 FARMER LOGIN CREDENTIALS:\n');
    farmers.forEach((f, idx) => {
      const dob = new Date(f.dateOfBirth);
      const day = String(dob.getDate()).padStart(2, '0');
      const month = String(dob.getMonth() + 1).padStart(2, '0');
      const year = dob.getFullYear();
      const dobPassword = `${day}${month}${year}`;
      
      console.log(`Farmer ${idx + 1}:`);
      console.log(`  Farmer ID: ${f.farmerId}`);
      console.log(`  Email: ${f.email}`);
      console.log(`  Phone: ${f.phoneNumber}`);
      console.log(`  Password (DOB DDMMYYYY): ${dobPassword}`);
      console.log('');
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
