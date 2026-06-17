async function request(path) {
  const res = await fetch('http://localhost:5173/api' + path, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (res.status >= 400) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (json.code !== undefined && json.code !== 0) throw new Error(json.message || 'fail');
  return json.data;
}

async function test() {
  const endpoints = [
    ['/services?role=citizen', 'services'],
    ['/news', 'news'],
    ['/platform/stats', 'stats'],
    ['/identity/providers', 'identity'],
    ['/gov/documents', 'govDocs'],
    ['/tour/spots', 'spots'],
    ['/tour/routes', 'routes'],
    ['/tour/complaints', 'complaints'],
    ['/livelihood/subsidies', 'subsidies'],
    ['/livelihood/insurance', 'insurance'],
    ['/monitor/sla', 'sla'],
    ['/monitor/sla/history', 'slaHistory'],
    ['/monitor/policies', 'policies'],
  ];
  for (const [path, name] of endpoints) {
    try {
      const d = await request(path);
      const len = Array.isArray(d) ? d.length : (d ? 'object' : 'null');
      console.log(name.padEnd(14), 'OK  dataLen=' + len);
    } catch (e) {
      console.log(name.padEnd(14), 'FAIL:', e.message);
    }
  }
}
test();
