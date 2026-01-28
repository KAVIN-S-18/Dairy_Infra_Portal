const http = require('http');

const data = JSON.stringify({
  email: 'tm1@dm1.com',
  password: 'tm@123'
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
    console.log('Status:', res.statusCode);
    const resp = JSON.parse(body);
    console.log('Message:', resp.message);
    if (resp.token) {
      console.log('Token:', resp.token.substring(0, 20) + '...');
      console.log('Role:', resp.user.role);
      console.log('\n✅ TM LOGIN SUCCESS');
    } else if (resp.error) {
      console.log('Error:', resp.error);
    }
    process.exit(0);
  });
});

req.on('error', e => {
  console.log('Request error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
