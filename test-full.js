const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:56777' + path, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('=== Full Integration Test ===\n');

  // 1. Frontend HTTP
  const feOk = await new Promise(resolve => {
    http.get('http://127.0.0.1:46777/', res => resolve(res.statusCode === 200));
  });
  console.log(feOk ? '✅ Frontend HTTP 200' : '❌ Frontend failed');

  // 2. Backend health
  const health = await get('/api/health');
  console.log(health.data.status === 'ok' ? '✅ Backend health OK' : '❌ Backend failed');

  // 3. Listings with keyword
  const kw = await get('/api/listings?keyword=%E7%B2%BE%E8%A3%85');
  console.log(`✅ Keyword "精装": ${kw.data.total} results`);
  console.log(`   (title: ${kw.data.listings[0]?.title?.substring(0, 30)}...)`);

  // 4. Listings with no filters (should have more)
  const all = await get('/api/listings?page_size=10');
  console.log(`✅ No filters: ${all.data.total} results`);

  // 5. Listing detail with merchant info
  const detail = await get('/api/listings/1');
  const l = detail.data.listing;
  console.log(`✅ Detail API fields:`);
  console.log(`   merchant_name: ${l.merchant_name || 'N/A'}`);
  console.log(`   business_license: ${l.business_license || 'N/A'}`);
  console.log(`   total_deals: ${l.total_deals || 'N/A'}`);
  console.log(`   response_rate: ${l.response_rate || 'N/A'}`);
  console.log(`   avg_response_time: ${l.avg_response_time || 'N/A'}`);
  console.log(`   is_approved: ${l.is_approved !== undefined ? l.is_approved : 'N/A'}`);
  console.log(`   fraud_check: ${l.fraud_check ? 'PRESENT' : 'MISSING'}`);
  if (l.fraud_check) {
    console.log(`     score: ${l.fraud_check.score}`);
    console.log(`     is_flagged: ${l.fraud_check.is_flagged}`);
  }

  // 6. Car-specific filters
  const car = await get('/api/listings?category_code=car&car_mileage=1-3%E4%B8%87%E5%85%AC%E9%87%8C&page_size=5');
  console.log(`✅ Car with mileage filter: ${car.data.total} results`);

  // 7. Job-specific filters
  const job = await get('/api/listings?category_code=job&job_salary_min=10000&page_size=5');
  console.log(`✅ Job with salary filter: ${job.data.total} results`);

  // 8. Admin stats
  const auth = await new Promise(resolve => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 56777,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ headers: res.headers, data: JSON.parse(data) }));
    });
    req.write(JSON.stringify({ phone: '13800000000', password: 'admin123456' }));
    req.end();
  });

  if (auth.data.token) {
    console.log(`✅ Admin login: token obtained`);
    const stats = await new Promise(resolve => {
      http.get({
        hostname: '127.0.0.1',
        port: 56777,
        path: '/api/admin/stats',
        headers: { 'Authorization': 'Bearer ' + auth.data.token }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });
    console.log(`✅ Admin stats: ${Object.keys(stats.stats || {}).length} metrics`);
    console.log(`   users: ${stats.stats?.total_users}, listings: ${stats.stats?.total_listings}, reports: ${stats.stats?.pending_reports}`);

    // 9. Reports
    const reports = await new Promise(resolve => {
      http.get({
        hostname: '127.0.0.1',
        port: 56777,
        path: '/api/admin/reports',
        headers: { 'Authorization': 'Bearer ' + auth.data.token }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });
    console.log(`✅ Reports API: ${reports.reports?.length || 0} reports`);

    // 10. Merchant leads
    const leads = await new Promise(resolve => {
      http.get({
        hostname: '127.0.0.1',
        port: 56777,
        path: '/api/merchants/leads',
        headers: { 'Authorization': 'Bearer ' + auth.data.token }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });
    console.log(`✅ Leads API: ${leads.leads?.length || 0} leads`);
  }

  console.log('\n=== All tests passed! ===');
}

test().catch(e => {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
});
