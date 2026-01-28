const http = require('http');

function testLogin(email, password, label) {
  const data = JSON.stringify({
    email,
    password
  });

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

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const resp = JSON.parse(body);
      console.log(`\n${label}:`);
      console.log(`Status: ${res.statusCode}`);
      if (resp.message) console.log(`Message: ${resp.message}`);
      if (resp.error) console.log(`Error: ${resp.error}`);
      if (resp.token) {
        console.log(`Token: ${resp.token.substring(0, 20)}...`);
        console.log(`Role: ${resp.user.role}`);
        console.log(`✅ SUCCESS`);
      }
    });
  });

  req.on('error', (e) => {
    console.log(`${label}: ERROR - ${e.message}`);
  });

  req.write(data);
  req.end();
}

console.log('Testing credentials...');
testLogin('tm1@dm1.com', 'tm@123', 'Transport Manager');
setTimeout(() => {
  testLogin('driver1@tm1.com', 'driver@123', 'Driver');
}, 500);

setTimeout(() => process.exit(0), 2000);
