const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = path.resolve(__dirname, '..');
loadEnv(path.join(projectDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59108);
const dbPath = path.resolve(projectDir, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const now = () => new Date().toISOString();
const image = (prompt, size = 'square') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

const categories = [
  { id: 'cat-food', name: '主粮', code: 'FOOD', icon: 'Bone', level: 1, sortOrder: 1, children: [] },
  { id: 'cat-toy', name: '玩具', code: 'TOY', icon: 'Sparkles', level: 1, sortOrder: 2, children: [] },
  { id: 'cat-care', name: '护理', code: 'CARE', icon: 'HeartPulse', level: 1, sortOrder: 3, children: [] },
];

const products = [
  product('spu1', 'cat-food', '皇家猫粮10kg', 39.9, 89.9, 'royal canin cat food bag product'),
  product('spu2', 'cat-care', '宠物自动饮水机', 19.9, 59.9, 'pet water fountain dispenser'),
  product('spu3', 'cat-toy', '猫咪逗猫棒套装', 9.9, 29.9, 'cat teaser toy set colorful'),
  product('spu4', 'cat-food', '宠物智能喂食器', 49.9, 129.9, 'smart pet feeder automatic'),
  product('spu5', 'cat-care', '福来恩体外驱虫', 29.9, 69.9, 'pet flea tick treatment package'),
  product('spu6', 'cat-toy', 'KONG经典狗玩具', 24.9, 49.9, 'red dog chew toy product'),
];

const flashSales = [
  {
    id: 'fs1',
    title: '春日宠物囤货节',
    description: '精选主粮、玩具、护理用品限时优惠',
    bannerImage: image('cute orange cat with pet toys spring sale banner warm colors', 'landscape_16_9'),
    startTime: now(),
    endTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'active',
    totalStock: 850,
    soldCount: 412,
    items: products.slice(0, 4).map((item, index) => ({
      id: `fsi${index + 1}`,
      flashSaleId: 'fs1',
      skuId: item.skus[0].id,
      spuId: item.id,
      salePrice: item.skus[0].price,
      originalPrice: item.skus[0].originalPrice,
      saleStock: 100 + index * 40,
      soldCount: 35 + index * 18,
      limitPerUser: 2,
      sortOrder: index + 1,
      name: item.name,
      image: item.mainImage,
    })),
    createdAt: now(),
    updatedAt: now(),
  },
];

const orders = [
  {
    id: 'order1',
    orderNo: 'PL202606090001',
    userId: 'user1',
    merchantId: 'merchant1',
    status: 'shipped',
    totalAmount: 89.8,
    discountAmount: 10,
    shippingFee: 0,
    actualAmount: 79.8,
    pointUsed: 0,
    pointEarned: 80,
    paymentMethod: 'alipay',
    paymentStatus: 'paid',
    shippingStatus: 'in_transit',
    trackingNo: 'YT888800001',
    trackingCompany: '圆通速递',
    shippingAddress: address(),
    items: [orderItem(products[0], 2)],
    remark: '工作日配送',
    createdAt: now(),
    updatedAt: now(),
  },
];

const coupons = [
  { id: 'coupon1', userId: 'user1', couponId: 'c1', code: 'PET20', status: 'unused', receivedAt: now(), expireAt: new Date(Date.now() + 7 * 86400000).toISOString() },
  { id: 'coupon2', userId: 'user1', couponId: 'c2', code: 'FOOD10', status: 'unused', receivedAt: now(), expireAt: new Date(Date.now() + 14 * 86400000).toISOString() },
];

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') return writeJson(res, 204, {}, origin);

  try {
    const url = new URL(req.url || '/', `http://${host}:${port}`);
    const route = url.pathname.replace(/^\/api(?:\/v1)?/, '').replace(/\/$/, '') || '/';

    if (req.method === 'GET' && (url.pathname === '/api/health' || route === '/health')) {
      return writeJson(res, 200, { success: true, message: 'ok', service: 'may-89108-local-api', db: dbPath }, origin);
    }

    if (req.method === 'POST' && ['/auth/login', '/auth/login/sms'].includes(route)) {
      record('auth.login', await readBody(req));
      return writeJson(res, 200, {
        accessToken: `local-access-${Date.now()}`,
        refreshToken: `local-refresh-${Date.now()}`,
        user: demoUser(),
      }, origin);
    }

    if (req.method === 'GET' && ['/auth/me', '/user/profile', '/users/profile'].includes(route)) {
      return writeJson(res, 200, demoUser(), origin);
    }

    if (req.method === 'GET' && ['/product/categories/tree', '/product-category/tree'].includes(route)) {
      return writeJson(res, 200, categories, origin);
    }

    if (req.method === 'GET' && ['/products', '/product/spus', '/product-spu'].includes(route)) {
      return writeJson(res, 200, paginate(filterProducts(url), url), origin);
    }

    if (req.method === 'GET' && route === '/search') {
      return writeJson(res, 200, paginate(filterProducts(url), url), origin);
    }

    const productDetail = route.match(/^\/(?:product\/spus|product-spu)\/([^/]+)$/);
    if (req.method === 'GET' && productDetail) {
      return writeJson(res, 200, products.find((item) => item.id === productDetail[1]) || products[0], origin);
    }

    if (req.method === 'GET' && ['/flash-sales', '/flash-sale'].includes(route)) {
      const list = route === '/flash-sales' ? paginate(flashSales, url) : flashSales;
      return writeJson(res, 200, list, origin);
    }

    const flashSaleItems = route.match(/^\/flash-sales\/([^/]+)\/items$/);
    if (req.method === 'GET' && flashSaleItems) {
      return writeJson(res, 200, flashSales[0].items, origin);
    }

    const flashSaleDetail = route.match(/^\/flash-sales\/([^/]+)$/);
    if (req.method === 'GET' && flashSaleDetail) {
      return writeJson(res, 200, flashSales.find((item) => item.id === flashSaleDetail[1]) || flashSales[0], origin);
    }

    if (req.method === 'POST' && route === '/flash-sales/purchase') {
      record('flash.purchase', await readBody(req));
      return writeJson(res, 200, { orderId: `order-${Date.now()}`, orderNo: `PL${Date.now()}` }, origin);
    }

    if (req.method === 'GET' && ['/orders', '/order'].includes(route)) {
      return writeJson(res, 200, paginate(orders, url), origin);
    }

    const orderDetail = route.match(/^\/(?:orders|order)\/([^/]+)$/);
    if (req.method === 'GET' && orderDetail) {
      return writeJson(res, 200, orders.find((item) => item.id === orderDetail[1]) || orders[0], origin);
    }

    if (req.method === 'POST' && ['/orders', '/order'].includes(route)) {
      const body = await readBody(req);
      const item = products[0];
      const order = {
        id: `order-${Date.now()}`,
        orderNo: `PL${Date.now()}`,
        userId: 'user1',
        merchantId: 'merchant1',
        status: 'pending_payment',
        totalAmount: item.skus[0].price,
        discountAmount: 0,
        shippingFee: 0,
        actualAmount: item.skus[0].price,
        pointUsed: 0,
        pointEarned: Math.round(item.skus[0].price),
        paymentMethod: body.paymentMethod || 'alipay',
        paymentStatus: 'pending',
        shippingStatus: 'pending',
        shippingAddress: address(),
        items: [orderItem(item, 1)],
        remark: body.remark || '',
        createdAt: now(),
        updatedAt: now(),
      };
      orders.unshift(order);
      record('order.create', body);
      return writeJson(res, 200, order, origin);
    }

    if (req.method === 'POST' && ['/orders/cancel', '/orders/confirm-receive'].includes(route)) {
      record(route.slice(1), await readBody(req));
      return writeJson(res, 200, { success: true }, origin);
    }

    if (req.method === 'GET' && route === '/cart') {
      return writeJson(res, 200, {
        items: products.slice(0, 2).map((item, index) => ({
          id: `cart${index + 1}`,
          userId: 'user1',
          skuId: item.skus[0].id,
          spuId: item.id,
          name: item.name,
          image: item.mainImage,
          price: item.skus[0].price,
          originalPrice: item.skus[0].originalPrice,
          quantity: index + 1,
          selected: true,
          attributes: item.skus[0].attributes,
          createdAt: now(),
          updatedAt: now(),
        })),
        total: 2,
      }, origin);
    }

    if (route.startsWith('/cart') && ['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
      record('cart.change', await readBody(req));
      return writeJson(res, 200, { success: true }, origin);
    }

    if (req.method === 'GET' && ['/coupons', '/coupons/available'].includes(route)) {
      return writeJson(res, 200, coupons, origin);
    }

    if (req.method === 'GET' && route === '/users/addresses') {
      return writeJson(res, 200, [address()], origin);
    }

    writeJson(res, 404, { success: false, message: `No local route for ${url.pathname}` }, origin);
  } catch (error) {
    writeJson(res, 500, { success: false, message: error.message || String(error) }, origin);
  }
});

server.listen(port, host, () => {
  console.log(`may-89108 local API ready on http://${host}:${port}`);
  console.log(`SQLite database: ${dbPath}`);
});

function product(id, categoryId, name, price, originalPrice, prompt) {
  const createdAt = now();
  return {
    id,
    merchantId: 'merchant1',
    categoryId,
    name,
    subtitle: '平台严选宠物好物',
    description: `${name}，适合日常囤货与宠物健康管理。`,
    mainImage: image(prompt),
    images: [image(prompt), image(`${prompt} lifestyle`)],
    attributes: [{ id: `${id}-attr`, name: '规格', values: ['标准装'], isVariant: true }],
    status: 'on_sale',
    salesCount: 1200 + Number(id.replace(/\D/g, '')) * 320,
    reviewCount: 200 + Number(id.replace(/\D/g, '')) * 40,
    rating: 4.6 + (Number(id.replace(/\D/g, '')) % 3) * 0.1,
    createdAt,
    updatedAt: createdAt,
    skus: [{
      id: `${id}-sku1`,
      spuId: id,
      skuCode: `${id.toUpperCase()}-STD`,
      attributes: { 规格: '标准装' },
      price,
      originalPrice,
      cost: Math.round(price * 0.6 * 100) / 100,
      stock: 200,
      stockLocked: 0,
      weight: 1,
      image: image(prompt),
      status: 'active',
    }],
  };
}

function orderItem(item, quantity) {
  return {
    id: `${item.id}-order-item`,
    orderId: 'order1',
    skuId: item.skus[0].id,
    productName: item.name,
    productImage: item.mainImage,
    attributes: item.skus[0].attributes,
    price: item.skus[0].price,
    quantity,
    subtotal: Math.round(item.skus[0].price * quantity * 100) / 100,
    isReviewed: false,
  };
}

function address() {
  return {
    id: 'addr1',
    name: '张三',
    phone: '138****1234',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '朝阳路 123 号',
    postalCode: '100000',
  };
}

function demoUser() {
  return {
    id: 'user1',
    phone: '13800000000',
    email: 'demo@pet.local',
    nickname: '萌宠会员',
    avatar: '',
    gender: 'unknown',
    role: 'customer',
    membershipLevel: 'gold',
    growthPoints: 1680,
    balance: 268.5,
    point: 3200,
    isVerified: true,
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };
}

function filterProducts(url) {
  const keyword = url.searchParams.get('keyword') || '';
  const categoryId = url.searchParams.get('categoryId') || '';
  return products.filter((item) => {
    const keywordOk = !keyword || item.name.includes(keyword) || item.subtitle.includes(keyword);
    const categoryOk = !categoryId || item.categoryId === categoryId;
    return keywordOk && categoryOk;
  });
}

function paginate(items, url) {
  const page = Number(url.searchParams.get('page') || 1);
  const pageSize = Number(url.searchParams.get('pageSize') || 10);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

function record(type, payload) {
  db.prepare('INSERT INTO events (type, payload, created_at) VALUES (?, ?, ?)').run(type, JSON.stringify(payload || {}), now());
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function writeJson(res, status, payload, origin) {
  const allowedOrigin = origin && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin) ? origin : 'http://127.0.0.1:49108';
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin',
  });
  res.end(body);
}
