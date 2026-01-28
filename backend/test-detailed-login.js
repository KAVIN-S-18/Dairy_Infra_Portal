const http = require('http');

const email = 'tm1@dm1.com';
const password = 'tm@123';

const data = JSON.stringify({
  email,
  password
});

console.log('Sending JSON:', data);
console.log('Length:', data.length);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Headers:', options.headers);

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => {
    body += chunk;
    console.log('Received chunk:', chunk.toString());
  });
  res.on('end', () => {
    console.log('\nFull response:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.log('Error:', e.message);
  process.exit(1);
});

console.log('\nWriting data...');
req.write(data);
req.end();
console.log('Request sent');
