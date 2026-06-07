const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:59064/api';

async function test() {
  console.log('=== 1. Login as admin ===');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'admin',
    password: '123456'
  });
  const token = loginRes.data.token;
  console.log('Got token');
  console.log('');

  const headers = { Authorization: `Bearer ${token}` };

  const tests = [
    { name: 'Job Supply-Demand Ratio', endpoint: '/dashboard/job-supply-demand' },
    { name: 'Average Onboarding Cycle', endpoint: '/dashboard/average-onboarding-cycle' },
    { name: 'Talent Retention', endpoint: '/dashboard/talent-retention' },
    { name: 'Salary Trends', endpoint: '/dashboard/salary-trends' },
    { name: 'Application Funnel (admin view)', endpoint: '/dashboard/application-funnel' },
    { name: 'Dashboard Overview', endpoint: '/dashboard/overview' },
  ];

  for (const test of tests) {
    console.log(`=== ${test.name} ===`);
    try {
      const res = await axios.get(`${BASE_URL}${test.endpoint}`, { headers });
      console.log('Status:', res.status);
      const data = res.data;
      if (data.data && Array.isArray(data.data)) {
        console.log('Data rows:', data.data.length);
        if (data.data.length > 0) {
          console.log('First row:', JSON.stringify(data.data[0], null, 2));
        }
      } else if (data.funnel) {
        console.log('Funnel:', JSON.stringify(data.funnel, null, 2));
      } else if (data.summary) {
        console.log('Summary:', JSON.stringify(data.summary, null, 2));
        console.log('Recent apps:', (data.recentApplications || []).length);
        console.log('Hot jobs:', (data.hotJobs || []).length);
      } else {
        console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
      }
      if (data.overall) {
        console.log('Overall:', JSON.stringify(data.overall, null, 2));
      }
    } catch (e) {
      console.log('Error:', e.response?.data || e.message);
    }
    console.log('');
  }
}

test().catch(console.error);
