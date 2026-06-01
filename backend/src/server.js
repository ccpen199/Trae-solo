const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 44857;

app.use(cors());
app.use(bodyParser.json());

const mockData = {
  banners: [
    { id: 1, title: '暑期特惠 海岛游', image: 'https://picsum.photos/800/300?random=1', link: '/product/1' },
    { id: 2, title: '云南深度游', image: 'https://picsum.photos/800/300?random=2', link: '/product/2' }
  ],
  categories: [
    { id: 1, name: '跟团游', icon: '📍' },
    { id: 2, name: '自由行', icon: '✈️' },
    { id: 3, name: '酒店套餐', icon: '🏨' },
    { id: 4, name: '门票', icon: '🎫' },
    { id: 5, name: '当地游', icon: '🚗' },
    { id: 6, name: '签证', icon: '📋' }
  ],
  products: [
    { id: 1, title: '三亚5日4晚自由行', subtitle: '含往返机票+海景酒店', images: 'https://picsum.photos/400/300?random=10', price: 2999, original_price: 3999, tags: ['海岛', '亲子'], sales: 128, is_new: 1, is_exclusive: 0 },
    { id: 2, title: '云南大理丽江6日游', subtitle: '纯玩无购物', images: 'https://picsum.photos/400/300?random=11', price: 1899, original_price: 2599, tags: ['古镇', '摄影'], sales: 256, is_new: 0, is_exclusive: 1 },
    { id: 3, title: '上海迪士尼1日门票', subtitle: '官方授权', images: 'https://picsum.photos/400/300?random=12', price: 499, original_price: 599, tags: ['主题乐园', '亲子'], sales: 512, is_new: 1, is_exclusive: 0 },
    { id: 4, title: '马尔代夫7日蜜月游', subtitle: '水上别墅', images: 'https://picsum.photos/400/300?random=13', price: 18999, original_price: 25999, tags: ['蜜月', '海岛'], sales: 64, is_new: 0, is_exclusive: 1 },
    { id: 5, title: '日本东京大阪7日游', subtitle: '环球影城', images: 'https://picsum.photos/400/300?random=14', price: 6999, original_price: 8999, tags: ['购物', '美食'], sales: 192, is_new: 1, is_exclusive: 0 },
    { id: 6, title: '成都3日美食游', subtitle: '熊猫基地', images: 'https://picsum.photos/400/300?random=15', price: 1299, original_price: 1699, tags: ['美食', '熊猫'], sales: 320, is_new: 0, is_exclusive: 0 }
  ],
  themes: [
    { id: 1, title: '毕业旅行季', description: '青春不散场，毕业就出发' },
    { id: 2, title: '蜜月推荐', description: '最浪漫的蜜月目的地' }
  ],
  guides: [
    { id: 1, title: '三亚旅游攻略：第一次去必看', author: '旅游达人小美', summary: '三亚5天4晚超详细攻略', views: 12580, likes: 892 },
    { id: 2, title: '云南自由行攻略', author: '背包客阿杰', summary: '大理丽江省钱攻略', views: 28960, likes: 1523 }
  ],
  orders: [],
  users: [
    { id: 1, nickname: '旅游达人小王', avatar: 'https://picsum.photos/50/50?random=1', phone: '138****0001', role: 'user', created_at: '2024-01-15', orders: 5, spend: 12999 },
    { id: 2, nickname: '蜜月旅行者', avatar: 'https://picsum.photos/50/50?random=2', phone: '139****0002', role: 'user', created_at: '2024-02-20', orders: 3, spend: 28999 },
    { id: 3, nickname: '背包客阿强', avatar: 'https://picsum.photos/50/50?random=3', phone: '137****0003', role: 'user', created_at: '2024-03-10', orders: 8, spend: 8999 },
    { id: 4, nickname: '亲子游达人', avatar: 'https://picsum.photos/50/50?random=4', phone: '136****0004', role: 'user', created_at: '2024-04-05', orders: 2, spend: 5998 },
    { id: 5, nickname: '客服小红', avatar: 'https://picsum.photos/50/50?random=5', phone: '400****001', role: 'service', created_at: '2024-01-01', orders: 0, spend: 0 },
    { id: 6, nickname: '运营小李', avatar: 'https://picsum.photos/50/50?random=6', phone: '400****002', role: 'operation', created_at: '2024-01-01', orders: 0, spend: 0 }
  ]
};

app.get('/health', (req, res) => res.json({ status: 'ok', message: '旅游达人种草小程序后端服务运行正常' }));
app.get('/api/banners', (req, res) => res.json({ success: true, data: mockData.banners }));
app.get('/api/categories', (req, res) => res.json({ success: true, data: mockData.categories }));
app.get('/api/products', (req, res) => res.json({ success: true, data: { list: mockData.products, total: mockData.products.length } }));
app.get('/api/products/recommend', (req, res) => {
  const sorted = [...mockData.products].sort((a, b) => b.sales - a.sales).slice(0, 6);
  res.json({ success: true, data: sorted });
});
app.get('/api/products/:id', (req, res) => {
  const product = mockData.products.find(p => p.id == req.params.id);
  if (!product) return res.json({ success: false, message: '商品不存在' });
  res.json({ success: true, data: product });
});
app.get('/api/themes', (req, res) => res.json({ success: true, data: mockData.themes }));
app.get('/api/guides', (req, res) => res.json({ success: true, data: { list: mockData.guides, total: mockData.guides.length } }));
app.get('/api/orders', (req, res) => res.json({ success: true, data: { list: mockData.orders } }));
app.post('/api/orders', (req, res) => {
  const order = { id: mockData.orders.length + 1, order_no: 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase(), ...req.body, status: 'pending', created_at: new Date().toISOString() };
  mockData.orders.push(order);
  res.json({ success: true, data: { id: order.id, order_no: order.order_no } });
});
app.put('/api/orders/:id/status', (req, res) => {
  const order = mockData.orders.find(o => o.id == req.params.id);
  if (order) order.status = req.body.status;
  res.json({ success: true });
});
app.get('/api/admin/statistics', (req, res) => {
  res.json({ success: true, data: { total_orders: mockData.orders.length, total_revenue: mockData.orders.reduce((sum, o) => sum + (o.price || 0), 0), total_products: mockData.products.length, total_users: mockData.users.length }});
});

app.get('/api/admin/products', (req, res) => res.json({ success: true, data: { list: mockData.products, total: mockData.products.length } }));
app.post('/api/admin/products', (req, res) => {
  const newProduct = { id: mockData.products.length + 1, ...req.body, sales: 0, created_at: new Date().toISOString() };
  mockData.products.push(newProduct);
  res.json({ success: true, data: newProduct });
});
app.put('/api/admin/products/:id', (req, res) => {
  const index = mockData.products.findIndex(p => p.id == req.params.id);
  if (index > -1) { mockData.products[index] = { ...mockData.products[index], ...req.body }; res.json({ success: true, data: mockData.products[index] }); }
  else res.json({ success: false, message: '商品不存在' });
});
app.delete('/api/admin/products/:id', (req, res) => {
  const index = mockData.products.findIndex(p => p.id == req.params.id);
  if (index > -1) { mockData.products.splice(index, 1); res.json({ success: true }); }
  else res.json({ success: false, message: '商品不存在' });
});

app.get('/api/admin/users', (req, res) => res.json({ success: true, data: { list: mockData.users, total: mockData.users.length } }));
app.post('/api/admin/users', (req, res) => {
  const newUser = { id: mockData.users.length + 1, ...req.body, created_at: new Date().toISOString(), orders: 0, spend: 0 };
  mockData.users.push(newUser);
  res.json({ success: true, data: newUser });
});
app.put('/api/admin/users/:id', (req, res) => {
  const index = mockData.users.findIndex(u => u.id == req.params.id);
  if (index > -1) { mockData.users[index] = { ...mockData.users[index], ...req.body }; res.json({ success: true, data: mockData.users[index] }); }
  else res.json({ success: false, message: '用户不存在' });
});
app.delete('/api/admin/users/:id', (req, res) => {
  const index = mockData.users.findIndex(u => u.id == req.params.id);
  if (index > -1) { mockData.users.splice(index, 1); res.json({ success: true }); }
  else res.json({ success: false, message: '用户不存在' });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 旅游达人种草小程序后端服务已启动');
  console.log('📍 服务地址: http://localhost:' + PORT);
  console.log('📊 健康检查: http://localhost:' + PORT + '/health');
  console.log('📦 API示例: http://localhost:' + PORT + '/api/products');
  console.log('========================================');
});
