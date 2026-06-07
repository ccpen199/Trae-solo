const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

(async () => {
  try {
    // 1. Login as admin
    const loginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59020,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });
    const token = loginRes.data.data.token;
    console.log('Admin Token:', token.substring(0, 50) + '...');
    
    // 2. Get health center data
    const healthRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59020,
      path: '/api/admin/health-center',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('\n=== Health Center ===');
    console.log('Job Survival Rate:', healthRes.data.data.jobSurvivalRate);
    console.log('Avg Completion Time:', healthRes.data.data.avgCompletionTime);
    console.log('Total Jobs:', healthRes.data.data.totalJobs);
    console.log('Completed Jobs:', healthRes.data.data.completedJobs);
    console.log('Disputed Orders:', healthRes.data.data.disputedOrders);
    console.log('Total Orders:', healthRes.data.data.totalOrders);
    console.log('Complaints:', healthRes.data.data.complaintTypeClustering);
    
    // 3. Get financial audit data
    const finRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59020,
      path: '/api/admin/financial-audit',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('\n=== Financial Audit ===');
    console.log('Withdrawal Success Rate:', finRes.data.data.withdrawalSuccessRate);
    console.log('Abnormal Interception Rate:', finRes.data.data.abnormalInterceptionRate);
    console.log('Fund Pool:', finRes.data.data.fundPool);
    
    // 4. Get student ops data
    const studentRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59020,
      path: '/api/admin/student-ops',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('\n=== Student Ops ===');
    console.log('Predictions:', studentRes.data.data.predictions);
    console.log('Ambassadors:', studentRes.data.data.ambassadors);
    console.log('Certifications:', studentRes.data.data.certifications);
    
    // 5. Login as worker and get settlements
    const workerLoginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59020,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'worker1', password: 'worker123' });
    const workerToken = workerLoginRes.data.data.token;
    console.log('\nWorker Token:', workerToken.substring(0, 50) + '...');
    
    const settleRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59020,
      path: '/api/settlements',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + workerToken }
    });
    console.log('\n=== Settlements ===');
    console.log('Settlements count:', settleRes.data.data ? settleRes.data.data.length : 0);
    if (settleRes.data.data && settleRes.data.data.length > 0) {
      console.log('First settlement:', settleRes.data.data[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
