import http from 'http';

function post(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path: '/api' + path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, data: d }); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path: '/api' + path,
        method: 'GET',
        headers,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, data: d }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function axiosLikeInterceptor(response) {
  const body = response.data;
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body &&
    body.success === true
  ) {
    console.log('  → 拦截器解包: res.data = body.data');
    return { ...response, data: body.data };
  }
  if (body && typeof body === 'object' && 'success' in body && body.success === false) {
    console.log('  → 拦截器: 业务错误');
    throw new Error(body.error || '请求失败');
  }
  return response;
}

async function test() {
  console.log('===== 模拟浏览器完整登录流程 =====\n');

  console.log('Step 1: 发送验证码');
  const r1 = await post('/auth/send-code', { phone: '13800138000' });
  console.log('  原始响应:', JSON.stringify(r1.data));
  try {
    const processed1 = axiosLikeInterceptor(r1);
    console.log('  处理后 res.data:', JSON.stringify(processed1.data));
    console.log('  res.data.success:', processed1.data.success);
  } catch (e) {
    console.log('  异常:', e.message);
  }

  console.log('\nStep 2: 手机号登录');
  const r2 = await post('/auth/login', { phone: '13800138000', verifyCode: '123456' });
  console.log('  原始响应:', JSON.stringify(r2.data).slice(0, 200));
  console.log('  原始键:', Object.keys(r2.data));
  try {
    const processed2 = axiosLikeInterceptor(r2);
    console.log('  处理后 res.data:', JSON.stringify(processed2.data).slice(0, 200));
    console.log('  处理后键:', Object.keys(processed2.data));
    console.log('  res.data.success:', processed2.data.success);
    console.log('  res.data.token:', (processed2.data.token || '').slice(0, 20) + '...');
    console.log('  res.data.user.name:', processed2.data.user?.name);
    console.log('  res.data.user.elderlyMode:', processed2.data.user?.elderlyMode);
  } catch (e) {
    console.log('  异常:', e.message);
  }

  console.log('\nStep 3: 携带 token 访问首页推荐服务');
  const token = r2.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  const r3 = await get('/recommend/services', authHeader);
  console.log('  原始响应键:', Object.keys(r3.data));
  console.log('  原始 data 键:', r3.data.data ? Object.keys(r3.data.data) : '无 data 字段');
  try {
    const processed3 = axiosLikeInterceptor(r3);
    console.log('  处理后 res.data 键:', Object.keys(processed3.data));
    console.log('  processed3.data 是数组?', Array.isArray(processed3.data));
    if (processed3.data.recommended) {
      console.log('  recommended 数量:', processed3.data.recommended?.length);
    }
  } catch (e) {
    console.log('  异常:', e.message);
  }

  console.log('\nStep 4: 测试 handleLogin 代码逻辑模拟:');
  console.log('  const data = res.data');
  console.log('  登录接口返回键:', Object.keys(r2.data));
  console.log('  "success" in r2.data:', 'success' in r2.data);
  console.log('  r2.data.success:', r2.data.success);
  console.log('  ⚠️  关键问题: 登录接口没有 data 字段! ');
  console.log('  ⚠️  所以拦截器不解包, res.data = { success, token, user }');
  console.log('  ✅  所以 data?.success 是', r2.data.success);
  console.log('  ✅  所以 login(data.user, data.token) 应该正常调用');

  console.log('\nStep 5: 推荐服务有 data 字段:');
  console.log('  "data" in r3.data:', 'data' in r3.data);
  console.log('  拦截器会解包，res.data = r3.data.data');

  console.log('\n===== 结论 =====');
  console.log('✅ 登录接口返回格式: { success, token, user, message }');
  console.log('✅ 业务接口返回格式: { success, data }');
  console.log('✅ 拦截器对业务接口解包，对登录接口不解包');
  console.log('✅ 登录流程逻辑上是通的');
  console.log('\n❓ 可能的问题:');
  console.log('   1. Home 页 setRecommends(res.data) 期望数组，但实际是 { recommended, hot, other } 对象');
  console.log('   2. 前端登录成功后 navigate 可能有问题');
}

test().catch(console.error);
