const BASE = 'http://localhost:5173/api';
async function request(path) {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' } });
  if (res.status >= 400) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (json.code !== undefined && json.code !== 0) throw new Error(json.message || 'fail');
  return json.data !== undefined ? json.data : json;
}
async function test() {
  const eps = [
    ['/health','health'],['/platform/stats','stats'],['/services?role=citizen','services'],
    ['/news','news'],['/identity/providers','identity'],['/gov/documents','govDocs'],
    ['/gov/meetings','meetings'],['/gov/tasks','tasks'],['/tour/spots','spots'],
    ['/tour/routes','routes'],['/tour/complaints','complaints'],['/livelihood/subsidies','subsidies'],
    ['/livelihood/insurance','insurance'],['/monitor/sla','sla'],['/monitor/sla/history','slaHistory'],
    ['/monitor/policies','policies']
  ];
  let pass = 0, fail = 0;
  for (const [p,n] of eps) {
    try {
      const d = await request(p);
      const l = Array.isArray(d) ? d.length : (d ? 'obj' : 'null');
      console.log('PASS', n.padEnd(14), 'dataLen=' + l);
      pass++;
    } catch(e) { console.log('FAIL', n.padEnd(14), e.message); fail++; }
  }
  console.log('---');
  console.log('Total:', pass + '/' + (pass+fail), 'passed');
}
test();
