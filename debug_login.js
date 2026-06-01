const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('=== 1. 直连后端登录 ===');
    const loginData1 = JSON.stringify({ phone: '13800138001', password: '123456' });
    const res1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 56935,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData1.length
      }
    }, loginData1);
    console.log('HTTP:', res1.status);
    console.log('Body:', res1.body);

    console.log('\n=== 2. 通过Vite代理登录 ===');
    const res2 = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData1.length
      }
    }, loginData1);
    console.log('HTTP:', res2.status);
    console.log('Body:', res2.body);

    console.log('\n=== 3. 检查 axios 响应拦截器 ===');
    const res3 = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/src/api/index.js',
      method: 'GET'
    });
    console.log(res3.body);

    console.log('\n=== 4. 检查编译后 Login.vue 的 handleLogin 函数 ===');
    const res4 = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/src/views/Login.vue',
      method: 'GET'
    });
    const scriptStart = res4.body.indexOf('const handleLogin');
    if (scriptStart > 0) {
      console.log(res4.body.substring(scriptStart, scriptStart + 1500));
    } else {
      console.log('handleLogin not found in script');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
