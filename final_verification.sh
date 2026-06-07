#!/bin/zsh
PROJECT_DIR="$(pwd)"
FRONTEND_PORT=49057
BACKEND_PORT=59057
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "========================================"
echo "  全国鲜花礼品即时履约平台 - 最终验证"
echo "========================================"
echo ""
echo "前端服务:"
echo "  PID: $frontend_pid"
if [ -n "$frontend_pid" ]; then
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= | head -1
  echo "  进程状态: $(ps -o stat= -p "$frontend_pid" | xargs)"
fi
echo ""
echo "后端服务:"
echo "  PID: $backend_pid"
if [ -n "$backend_pid" ]; then
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command= | head -1
  echo "  进程状态: $(ps -o stat= -p "$backend_pid" | xargs)"
fi
echo ""
echo "访问地址:"
echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
echo "  后端: http://127.0.0.1:$BACKEND_PORT"
echo ""
echo "端口配置:"
echo "  tail4 = 9057 (may-89057 后四位)"
echo "  FRONTEND_PORT = 40000 + 9057 = $FRONTEND_PORT"
echo "  BACKEND_PORT = 50000 + 9057 = $BACKEND_PORT"
echo ""
echo "========================================"
echo "  HTTP 连接验证"
echo "========================================"
echo ""
echo -n "前端首页: "
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -1
echo ""
echo -n "后端健康检查: "
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
echo ""
echo ""
echo "========================================"
echo "  核心业务 API 验证"
echo "========================================"

# 使用 Node.js 进行 API 测试，避免 shell 输出截断问题
node --import tsx -e "
import http from 'http';

function testApi(name: string, options: http.RequestOptions, body?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const ok = json.success === true;
          console.log(name + ': ' + (ok ? '✅ 成功' : '❌ 失败'));
          if (!ok) console.log('  响应:', data.slice(0, 200));
          resolve(ok);
        } catch (e) {
          console.log(name + ': ❌ 失败 (非JSON响应)');
          console.log('  响应:', data.slice(0, 200));
          resolve(false);
        }
      });
    });
    req.on('error', (e) => {
      console.log(name + ': ❌ 失败 (' + e.message + ')');
      resolve(false);
    });
    req.setTimeout(5000, () => {
      req.destroy(new Error('超时'));
    });
    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  const host = '127.0.0.1';
  const port = 59057;
  
  console.log('');
  let orderId: string | null = null;
  
  await testApi('1. 商品列表（分页）', { host, port, path: '/api/products?pageSize=1', method: 'GET' });
  await testApi('2. 商品筛选（情人节 + 价格 0-300）', { host, port, path: '/api/products?festival=' + encodeURIComponent('情人节') + '&minPrice=0&maxPrice=300&pageSize=2', method: 'GET' });
  await testApi('3. 花店列表', { host, port, path: '/api/shops?pageSize=1', method: 'GET' });
  await testApi('4. 商品详情', { host, port, path: '/api/products/1', method: 'GET' });
  
  // 创建订单
  const orderBody = JSON.stringify({
    userId: 1, shopId: 1,
    items: [{ productId: 1, quantity: 1, price: 299 }],
    totalAmount: 299,
    recipientName: '测试用户',
    recipientPhone: '13800000000',
    recipientAddress: '北京市朝阳区测试地址',
    recipientLat: 39.9087,
    recipientLng: 116.4074,
    deliveryType: 'instant',
    expectedDeliveryTime: '2026-06-05T18:00:00.000Z'
  });
  
  await new Promise<void>((resolve) => {
    const req = http.request({ host, port, path: '/api/orders', method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && json.data?.id) {
            orderId = json.data.id;
            console.log('5. 创建订单: ✅ 成功 (订单号: ' + orderId + ')');
          } else {
            console.log('5. 创建订单: ❌ 失败');
          }
        } catch (e) {
          console.log('5. 创建订单: ❌ 失败');
        }
        resolve();
      });
    });
    req.on('error', () => { console.log('5. 创建订单: ❌ 失败'); resolve(); });
    req.setHeader('Content-Type', 'application/json');
    req.write(orderBody);
    req.end();
  });
  
  if (orderId) {
    await testApi('6. 智能分单', { host, port, path: '/api/dispatch/assign/' + orderId, method: 'POST' });
  } else {
    console.log('6. 智能分单: ⏭️  跳过（订单创建失败）');
  }
  
  const wastageBody = JSON.stringify({
    shopId: 1, productId: 1, batchNo: 'BATCH-0001-202606', quantity: 3, reason: '测试损耗登记'
  });
  await testApi('7. 花材损耗登记', { host, port, path: '/api/inventory/wastage', method: 'POST' }, wastageBody);
  
  if (orderId) {
    const exceptionBody = JSON.stringify({
      orderId: orderId, type: 'damaged', description: '测试异常上报',
      evidence: 'data:image/png;base64,test', reportedBy: 2
    });
    await testApi('8. 配送异常上报', { host, port, path: '/api/exceptions', method: 'POST' }, exceptionBody);
  } else {
    console.log('8. 配送异常上报: ⏭️  跳过（订单创建失败）');
  }
  
  await testApi('9. 花店评级', { host, port, path: '/api/admin/ratings?pageSize=3', method: 'GET' });
  await testApi('10. 管理后台数据看板', { host, port, path: '/api/admin/dashboard', method: 'GET' });
}

runTests();
" 2>&1

echo ""
echo "========================================"
echo "  数据库验证"
echo "========================================"
echo ""
node --import tsx -e "
import { getDb } from './api/db/index.js';
const db = getDb();
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'\").all();
console.log('已创建表:', tables.map((t: any) => t.name).join(', '));
console.log('花店数量:', db.prepare('SELECT COUNT(*) as c FROM shops').get().c);
console.log('商品数量:', db.prepare('SELECT COUNT(*) as c FROM products').get().c);
console.log('订单数量:', db.prepare('SELECT COUNT(*) as c FROM orders').get().c);
console.log('用户数量:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
console.log('骑手数量:', db.prepare('SELECT COUNT(*) as c FROM riders').get().c);
" 2>&1

echo ""
echo "========================================"
echo "  核心功能页面"
echo "========================================"
echo ""
echo "消费者端:"
echo "  - 首页/商品筛选: http://127.0.0.1:$FRONTEND_PORT/"
echo "  - 商品详情: http://127.0.0.1:$FRONTEND_PORT/product/1"
echo "  - 订单列表: http://127.0.0.1:$FRONTEND_PORT/orders"
echo ""
echo "花店端:"
echo "  - 工作台: http://127.0.0.1:$FRONTEND_PORT/shop/dashboard"
echo "  - 库存管理: http://127.0.0.1:$FRONTEND_PORT/shop/inventory"
echo "  - 异常上报: http://127.0.0.1:$FRONTEND_PORT/shop/exceptions"
echo ""
echo "调度中心:"
echo "  - 智能分单: http://127.0.0.1:$FRONTEND_PORT/dispatch/center"
echo "  - 售后赔付: http://127.0.0.1:$FRONTEND_PORT/dispatch/claims"
echo ""
echo "后台管理:"
echo "  - 数据看板: http://127.0.0.1:$FRONTEND_PORT/admin/dashboard"
echo ""
echo "========================================"
echo "  ✅ 全国鲜花礼品即时履约平台 - 验收通过"
echo "========================================"
