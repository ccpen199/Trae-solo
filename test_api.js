const http = require('http');
const fs = require('fs');
const out = fs.createWriteStream('/Users/chen/Documents/trae_projects/local_projects/may-86935/test_result.txt');

function log(msg) { out.write(msg + '\n'); }

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 56935,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve({raw: data}); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  log('Starting API tests...');
  try {
    log('1. Health check...');
    const health = await makeRequest('GET', '/api/health');
    log('   Result: ' + JSON.stringify(health));

    log('2. Shipper login...');
    const shipper = await makeRequest('POST', '/api/auth/login', { phone: '13800138001', password: '123456' });
    log('   Result: ' + (shipper.success ? 'OK - ' + shipper.data.name + ' ' + shipper.data.role : 'FAIL'));

    log('3. Create order...');
    const order = await makeRequest('POST', '/api/orders', {
      shipper_id: 1, order_type: 'instant', cargo_type: '建材', loading_address: '北京丰台', unloading_address: '北京通州', vehicle_type_required: '平板'
    });
    log('   Result: ' + (order.success ? 'OK - ' + order.data.order_no : 'FAIL - ' + JSON.stringify(order)));

    if (order.success) {
      const oid = order.data.id;
      log('4. Accept order ' + oid + '...');
      const accept = await makeRequest('POST', '/api/orders/' + oid + '/accept', { driver_id: 1, vehicle_id: 1 });
      log('   Result: ' + (accept.success ? 'OK' : JSON.stringify(accept)));

      log('5. Arrive...');
      const arrive = await makeRequest('POST', '/api/orders/' + oid + '/arrive');
      log('   Result: ' + (arrive.success ? 'OK' : JSON.stringify(arrive)));

      log('6. Complete...');
      const complete = await makeRequest('POST', '/api/orders/' + oid + '/complete');
      log('   Result: ' + (complete.success ? 'OK' : JSON.stringify(complete)));
    }

    log('7. SLA stats...');
    const sla = await makeRequest('GET', '/api/statistics/sla');
    log('   Result: accept:' + sla.data.accept_rate + '% arrive:' + sla.data.arrive_rate + '%');

    log('All tests completed!');
  } catch (e) {
    log('ERROR: ' + e.message);
  }
  out.end();
}

test();
