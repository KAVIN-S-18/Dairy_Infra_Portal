const jwt = require('jsonwebtoken');

// Generate a token for the MPCS officer
const mpcsOfficerUser = {
  id: 3,
  email: 'kavin@gmail.com',
  role: 'MPCS_OFFICER'
};

const token = jwt.sign(
  mpcsOfficerUser,
  process.env.JWT_SECRET || 'your_secret_key'
);

console.log('JWT Token for MPCS Officer:');
console.log(token);
