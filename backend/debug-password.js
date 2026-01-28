const db = require('./config/db');
const bcrypt = require('bcrypt');

async function test() {
  try {
    await db.authenticate();
    
    // Get TM user
    const users = await db.query('SELECT email, passwordHash FROM users WHERE email = ?', {
      replacements: ['tm1@dm1.com'],
      type: db.QueryTypes.SELECT
    });
    
    if (users.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('Found user:', user.email);
    console.log('Hash stored:', user.passwordHash);
    console.log('Hash length:', user.passwordHash.length);
    
    // Test bcrypt
    const match = await bcrypt.compare('tm@123', user.passwordHash);
    console.log('\nPassword match result:', match);
    
    if (match) {
      console.log('✅ LOGIN WILL WORK');
    } else {
      console.log('❌ LOGIN WILL FAIL');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
