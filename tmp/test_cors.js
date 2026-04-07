const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://nearcharge.vercel.app',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  const origin = res.headers['access-control-allow-origin'];
  console.log(`Access-Control-Allow-Origin: ${origin}`);
  if (origin === 'https://nearcharge.vercel.app') {
    console.log('✅ CORS test passed!');
  } else {
    console.log('❌ CORS test failed!');
  }
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
