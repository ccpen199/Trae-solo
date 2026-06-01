import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 56893,
      path: '/api' + path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function generateTestData() {
  const dates = [
    { date: '2026-05-20', weather: 'rainy', activity: 'normal' },
    { date: '2026-05-21', weather: 'normal', activity: 'weekend' },
    { date: '2026-05-22', weather: 'normal', activity: 'normal' },
    { date: '2026-05-23', weather: 'hot', activity: 'promotion' }
  ];

  for (const d of dates) {
    const gen = await post('/prep/generate', { 
      store_id: 1, 
      plan_date: d.date, 
      weather: d.weather, 
      activity: d.activity 
    });
    
    if (gen.success && gen.data.length > 0) {
      for (const item of gen.data) {
        await post('/prep', {
          store_id: 1,
          plan_date: d.date,
          material_id: item.material_id,
          predicted_qty: item.predicted_qty,
          actual_prep_qty: item.predicted_qty,
          weather: d.weather,
          activity: d.activity
        });
      }
      console.log('Saved plans for', d.date);
    }
  }
  console.log('Done!');
}

generateTestData().catch(console.error);
