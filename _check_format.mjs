import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 5173, path, method: 'GET' },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, url: path, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, url: path, data: d.slice(0, 300) }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  const endpoints = [
    '/api/recommend/services',
    '/api/social/account',
    '/api/social/records',
    '/api/household/list',
    '/api/transport/qr',
    '/api/transport/records',
    '/api/certificates',
    '/api/health/code',
    '/api/audit/logs',
    '/api/education/schools',
    '/api/education/districts',
  ];

  for (const ep of endpoints) {
    const r = await get(ep);
    const d = r.data;
    const keys = Object.keys(d);
    const hasSuccess = 'success' in d;
    const hasData = 'data' in d;
    const dataType = hasData ? (Array.isArray(d.data) ? 'array['+d.data.length+']' : typeof d.data) : 'N/A';
    const dataKeys = hasData && typeof d.data === 'object' && !Array.isArray(d.data) ? Object.keys(d.data).slice(0,5).join(',') : '';
    console.log(`${ep.split('/').slice(-2).join('/').padEnd(22)} status:${r.status} keys:[${keys.join(',')}] dataType:${dataType} ${dataKeys?'dataKeys:'+dataKeys:''}`);
  }
}
test().catch(console.error);
