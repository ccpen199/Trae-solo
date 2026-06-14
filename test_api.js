const http = require('http');

const postData = JSON.stringify({
  idCard: '440101199001012000',
  name: 'API测试工人',
  gender: '男',
  age: 28,
  phone: '13800138899',
  address: '广东省广州市天河区',
  tradeIds: [1, 3],
  healthStatus: 'green',
  healthCodeSource: 'yueshengshi',
  healthCodeUpdatedAt: '2024-06-07',
  nucleicAcidStatus: 'negative',
  vaccinationStatus: 'three_doses',
  skillCertificates: [
    {
      certificateType: '电工证',
      certificateNumber: 'API001',
      issuingAuthority: '广东省应急管理厅',
      issueDate: '2023-01-01',
      expiryDate: '2026-01-01',
      ocrResult: '已识别',
      verified: true
    }
  ],
  safetyTrainings: [
    {
      trainingName: '安全生产培训',
      trainingDate: '2024-01-10',
      trainingHours: 8,
      examScore: 90,
      passed: true
    }
  ]
});

const options = {
  hostname: '127.0.0.1',
  port: 59080,
  path: '/api/workers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing POST /api/workers...');
console.log('Request data:', postData);
console.log('');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const result = JSON.parse(data);
      if (result.code === 0) {
        console.log('\n✓ API call successful!');
        console.log('Worker ID:', result.data.id);
      } else {
        console.log('\n✗ API call failed:', result.message);
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();
