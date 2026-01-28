const db = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function fixPasswords() {
  try {
    await db.authenticate();
    
    // Hash the passwords
    const tmHash = await bcrypt.hash('tm@123', 10);
    const driverHash = await bcrypt.hash('driver@123', 10);
    
    // Update TM password
    await User.update(
      { passwordHash: tmHash },
      { where: { email: 'tm1@dm1.com' } }
    );
    console.log('✅ TM password updated');
    
    // Update all driver passwords
    await User.update(
      { passwordHash: driverHash },
      { where: { role: 'DRIVER' } }
    );
    console.log('✅ Driver passwords updated');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixPasswords();
