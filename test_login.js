import http from 'http';

const testCases = [
  { account: '2021001', password: 'student123', role: 'student', desc: '学生正确登录' },
  { account: 'investor', password: 'invest123', role: 'investor', desc: '投资商正确登录' },
  { account: 'admin', password: 'admin123', role: 'admin', desc: '管理员正确登录' },
  { account: '2021001', password: 'wrongpass', role: 'student', desc: '学生错误密码' },
  { account: 'nonexist', password: 'student123', role: 'student', desc: '不存在账号' },
  { account: '2021001', password: 'student123', role: 'investor', desc: '角色不匹配' },
];

async function runTests() {
  for (const test of testCases) {
    console.log(`\n=== ${test.desc} ===`);
    const result = await makeRequest(test);
    console.log(`Status: ${result.status}`);
    console.log(`Code: ${result.code}`);
    console.log(`Message: ${result.message}`);
    if (result.data?.token) {
      console.log(`Token: ${result.data.token.slice(0, 30)}...`);
      console.log(`User: ${result.data.user.name} (${result.data.user.role})`);
    }
  }
}

function makeRequest(data) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, ...json });
        } catch (e) {
          resolve({ status: res.statusCode, code: -1, message: body, data: null });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, code: -1, message: e.message, data: null });
    });

    req.write(postData);
    req.end();
  });
}

runTests().catch(console.error);
