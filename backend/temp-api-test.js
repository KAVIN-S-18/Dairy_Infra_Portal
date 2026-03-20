const fetch = require('node-fetch');

(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mpcs1@dm1.com', password: 'mpcs@123' }),
    });
    const loginJson = await loginRes.json();
    console.log('login status', loginRes.status, loginJson);

    if (!loginJson.token) {
      return;
    }
    const token = loginJson.token;

    const summaryRes = await fetch('http://localhost:5000/api/mpcs-officer/milk-procurement/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const summaryJson = await summaryRes.text();
    console.log('summary status', summaryRes.status, summaryJson);

    const payload = {
      farmerId: 1,
      quantityLiters: 10,
      milkType: 'COW',
      session: 'MORNING',
      temperature: 30,
      pricePerLiter: 45,
      snf: 8.5,
      fat: 4.2,
      procurementDate: new Date().toISOString(),
      notes: 'test log',
    };

    const logRes = await fetch('http://localhost:5000/api/mpcs-officer/milk-procurement', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const logJson = await logRes.text();
    console.log('log status', logRes.status, logJson);
  } catch (error) {
    console.error('Error in API test', error);
  }
})();