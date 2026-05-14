require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9891;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'db.json');
let db = {
  users: [],
  products: [],
  carts: [],
  orders: [],
  coupons: [],
  banners: [],
  flashSales: [],
  groupDeals: [],
  userCoupons: []
};

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Creating new DB');
  }
};

const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

loadDB();

app.use(cors({ origin: 'http://localhost:9892', credentials: true }));
app.use(express.json());

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未登录' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yunji_secret');
    req.userId = decoded.userId;
    next();
  } catch (e) { res.status(401).json({ error: '登录已过期' }); }
};

app.post('/api/auth/send-code', (req, res) => {
  res.json({ success: true, message: '验证码已发送（测试用 123456）' });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, code } = req.body;
  if (code !== '123456') return res.status(400).json({ error: '验证码错误' });

  let user = db.users.find(u => u.phone === phone);
  if (!user) {
    user = { id: Date.now(), phone, nickname: `用户${phone.slice(-4)}`, memberLevel: 0, createTime: new Date().toISOString() };
    db.users.push(user);
    saveDB();
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'yunji_secret', { expiresIn: '7d' });
  res.json({ token, user });
});

app.get('/api/user', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.userId);
  res.json(user);
});

app.get('/api/banners', (req, res) => res.json(db.banners));
app.get('/api/products', (req, res) => res.json(db.products));
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  res.json(product);
});
app.get('/api/coupons', (req, res) => res.json(db.coupons));
app.get('/api/flash-sales', (req, res) => res.json(db.flashSales));
app.get('/api/group-deals', (req, res) => res.json(db.groupDeals));

app.post('/api/coupons/:id/claim', authMiddleware, (req, res) => {
  const couponId = parseInt(req.params.id);
  const coupon = db.coupons.find(c => c.id === couponId);
  if (!coupon) return res.status(404).json({ error: '优惠券不存在' });
  
  const alreadyClaimed = db.userCoupons.find(uc => uc.userId === req.userId && uc.couponId === couponId);
  if (alreadyClaimed) return res.status(400).json({ error: '已领取过该优惠券' });
  
  db.userCoupons.push({
    id: Date.now(),
    userId: req.userId,
    couponId,
    status: 'unused',
    claimTime: new Date().toISOString()
  });
  saveDB();
  res.json({ success: true, message: '领取成功' });
});

app.get('/api/my-coupons', authMiddleware, (req, res) => {
  const myCoupons = db.userCoupons
    .filter(uc => uc.userId === req.userId)
    .map(uc => {
      const coupon = db.coupons.find(c => c.id === uc.couponId);
      return { ...uc, coupon };
    });
  res.json(myCoupons);
});

app.get('/api/cart', authMiddleware, (req, res) => {
  const items = db.carts
    .filter(c => c.userId === req.userId)
    .map(c => {
      const product = db.products.find(p => p.id === c.productId);
      return { ...c, title: product?.title, price: product?.price, image: product?.image };
    });
  res.json(items);
});

app.post('/api/cart', authMiddleware, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const existing = db.carts.find(c => c.userId === req.userId && c.productId === parseInt(productId));
  if (existing) existing.quantity += quantity;
  else db.carts.push({ id: Date.now(), userId: req.userId, productId: parseInt(productId), quantity, createTime: new Date().toISOString() });
  saveDB();
  res.json({ success: true });
});

app.delete('/api/cart/:id', authMiddleware, (req, res) => {
  db.carts = db.carts.filter(c => !(c.id === parseInt(req.params.id) && c.userId === req.userId));
  saveDB();
  res.json({ success: true });
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const cartItems = db.carts.filter(c => c.userId === req.userId);
  let total = 0;
  const orderItems = cartItems.map(c => {
    const product = db.products.find(p => p.id === c.productId);
    total += product.price * c.quantity;
    return { productId: c.productId, quantity: c.quantity, price: product.price };
  });
  const order = {
    id: Date.now(),
    orderNo: 'YJ' + Date.now(),
    userId: req.userId,
    items: orderItems,
    totalAmount: total,
    status: 'pending',
    createTime: new Date().toISOString()
  };
  db.orders.push(order);
  db.carts = db.carts.filter(c => c.userId !== req.userId);
  saveDB();
  res.json({ orderNo: order.orderNo, success: true });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const orders = db.orders.filter(o => o.userId === req.userId).reverse();
  res.json(orders);
});

function initData() {
  if (db.products.length) return;
  db.banners = [
    { id: 1, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ecommerce%20banner%20sale%20shopping&image_size=landscape_16_9', link: '/products' },
    { id: 2, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=promotion%20discount%20deal&image_size=landscape_16_9', link: '/products' }
  ];
  db.products = [
    { id: 1, title: '精选进口水果礼盒', description: '新鲜进口水果，精选礼盒装', price: 99.0, originalPrice: 129.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20fruit%20gift%20box&image_size=square', category: 'food', stock: 100, freight: 0, sales: 123 },
    { id: 2, title: '智能保温杯', description: '304不锈钢真空保温杯', price: 59.0, originalPrice: 89.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20thermos%20cup&image_size=square', category: 'home', stock: 200, freight: 8, sales: 456 },
    { id: 3, title: '有机大米5kg装', description: '东北优质有机大米', price: 49.9, originalPrice: 69.9, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20rice%20package&image_size=square', category: 'food', stock: 150, freight: 0, sales: 789 },
    { id: 4, title: '护肤套装', description: '保湿补水护肤五件套', price: 299.0, originalPrice: 399.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20set%20cosmetics&image_size=square', category: 'beauty', stock: 80, freight: 0, sales: 234 },
    { id: 5, title: '蓝牙耳机', description: '无线降噪蓝牙耳机', price: 199.0, originalPrice: 299.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20earphone&image_size=square', category: 'digital', stock: 120, freight: 0, sales: 567 },
    { id: 6, title: '精选进口奶粉', description: '新西兰进口婴幼儿奶粉', price: 268.0, originalPrice: 328.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20milk%20powder%20can&image_size=square', category: 'food', stock: 90, freight: 10, sales: 345 },
    { id: 7, title: '纯棉T恤', description: '100%纯棉休闲T恤', price: 49.0, originalPrice: 79.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cotton%20t-shirt%20clothing&image_size=square', category: 'clothing', stock: 200, freight: 6, sales: 890 },
    { id: 8, title: '高端口红礼盒', description: '限定版口红礼盒套装', price: 368.0, originalPrice: 458.0, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20lipstick%20gift%20box&image_size=square', category: 'beauty', stock: 60, freight: 0, sales: 178 }
  ];
  db.coupons = [
    { id: 1, title: '新人专享券', discount: 20, minAmount: 100, expireTime: '2026-12-31', type: 'new' },
    { id: 2, title: '满200减30', discount: 30, minAmount: 200, expireTime: '2026-06-30', type: 'general' },
    { id: 3, title: '会员专享券', discount: 50, minAmount: 300, expireTime: '2026-07-15', type: 'vip' },
    { id: 4, title: '食品类券', discount: 15, minAmount: 80, expireTime: '2026-05-31', type: 'food' },
    { id: 5, title: '美妆满减券', discount: 40, minAmount: 250, expireTime: '2026-06-10', type: 'beauty' }
  ];
  db.flashSales = [
    { id: 1, productId: 2, price: 39.0, originalPrice: 59.0, stock: 50, sold: 28, startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString() },
    { id: 2, productId: 7, price: 29.9, originalPrice: 49.0, stock: 100, sold: 65, startTime: new Date(Date.now() - 1800000).toISOString(), endTime: new Date(Date.now() + 5400000).toISOString() },
    { id: 3, productId: 5, price: 149.0, originalPrice: 199.0, stock: 30, sold: 12, startTime: new Date(Date.now() - 600000).toISOString(), endTime: new Date(Date.now() + 10800000).toISOString() }
  ];
  db.groupDeals = [
    { id: 1, productId: 1, price: 79.0, originalPrice: 99.0, minPeople: 3, currentPeople: 12, expireTime: new Date(Date.now() + 86400000).toISOString() },
    { id: 2, productId: 3, price: 39.9, originalPrice: 49.9, minPeople: 5, currentPeople: 8, expireTime: new Date(Date.now() + 172800000).toISOString() },
    { id: 3, productId: 6, price: 199.0, originalPrice: 268.0, minPeople: 2, currentPeople: 25, expireTime: new Date(Date.now() + 259200000).toISOString() },
    { id: 4, productId: 8, price: 299.0, originalPrice: 368.0, minPeople: 3, currentPeople: 6, expireTime: new Date(Date.now() + 432000000).toISOString() }
  ];
  saveDB();
}
initData();

app.listen(PORT, () => console.log(`🚀 后端运行在 http://localhost:${PORT}`));
