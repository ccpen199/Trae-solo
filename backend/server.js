const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 19881;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');

initDatabase();

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      phone TEXT,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      table_number TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      status TEXT DEFAULT 'available',
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS menu_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT,
      is_set_meal INTEGER DEFAULT 0,
      available INTEGER DEFAULT 1,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (category_id) REFERENCES menu_categories(id)
    );

    CREATE TABLE IF NOT EXISTS queues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      ticket_number TEXT NOT NULL,
      people_count INTEGER NOT NULL,
      status TEXT DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      table_id INTEGER,
      queue_id INTEGER,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (table_id) REFERENCES tables(id),
      FOREIGN KEY (queue_id) REFERENCES queues(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      menu_item_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS service_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      table_id INTEGER,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      order_id INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  const restaurantCount = db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count;
  if (restaurantCount === 0) {
    const insertRestaurant = db.prepare('INSERT INTO restaurants (name, description, address, phone) VALUES (?, ?, ?, ?)');
    const restaurantId = insertRestaurant.run('美味餐厅', '一家提供地道美食的特色餐厅', '美食街123号', '13800138000').lastInsertRowid;

    const insertTable = db.prepare('INSERT INTO tables (restaurant_id, table_number, capacity) VALUES (?, ?, ?)');
    for (let i = 1; i <= 10; i++) {
      insertTable.run(restaurantId, `${i}号桌`, i % 2 === 0 ? 4 : 2);
    }

    const insertCategory = db.prepare('INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)');
    const hotPotId = insertCategory.run(restaurantId, '热菜', 1).lastInsertRowid;
    const coldDishId = insertCategory.run(restaurantId, '凉菜', 2).lastInsertRowid;
    const drinkId = insertCategory.run(restaurantId, '饮品', 3).lastInsertRowid;

    const insertMenuItem = db.prepare('INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_set_meal) VALUES (?, ?, ?, ?, ?, ?)');
    insertMenuItem.run(restaurantId, hotPotId, '宫保鸡丁', '经典川菜，麻辣鲜香', 38.00, 0);
    insertMenuItem.run(restaurantId, hotPotId, '鱼香肉丝', '酸甜可口，下饭神器', 32.00, 0);
    insertMenuItem.run(restaurantId, hotPotId, '红烧肉', '肥而不腻，入口即化', 45.00, 0);
    insertMenuItem.run(restaurantId, coldDishId, '凉拌黄瓜', '清爽开胃', 18.00, 0);
    insertMenuItem.run(restaurantId, coldDishId, '夫妻肺片', '麻辣鲜香', 42.00, 0);
    insertMenuItem.run(restaurantId, drinkId, '酸梅汤', '解腻爽口', 12.00, 0);
    insertMenuItem.run(restaurantId, drinkId, '橙汁', '鲜榨橙汁', 18.00, 0);
    insertMenuItem.run(restaurantId, hotPotId, '双人套餐', '宫保鸡丁+鱼香肉丝+酸梅汤*2', 88.00, 1);
  }
}

app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: '餐厅不存在' });
  }
  res.json(restaurant);
});

app.get('/api/restaurants/:id/tables', (req, res) => {
  const tables = db.prepare('SELECT * FROM tables WHERE restaurant_id = ?').all(req.params.id);
  res.json(tables);
});

app.get('/api/restaurants/:id/menu', (req, res) => {
  const categories = db.prepare('SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order').all(req.params.id);
  const items = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? AND available = 1').all(req.params.id);
  
  const menu = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id)
  }));
  
  res.json(menu);
});

app.post('/api/queues', (req, res) => {
  const { restaurant_id, people_count } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const count = db.prepare('SELECT COUNT(*) as count FROM queues WHERE restaurant_id = ? AND DATE(created_at) = ?').get(restaurant_id, today).count;
  const ticketNumber = `A${String(count + 1).padStart(3, '0')}`;
  
  const result = db.prepare('INSERT INTO queues (restaurant_id, ticket_number, people_count) VALUES (?, ?, ?)').run(restaurant_id, ticketNumber, people_count);
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(result.lastInsertRowid);
  res.json(queue);
});

app.get('/api/queues/:id', (req, res) => {
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: '排队记录不存在' });
  }
  
  const waitCount = db.prepare(
    'SELECT COUNT(*) as count FROM queues WHERE restaurant_id = ? AND status = ? AND id < ?'
  ).get(queue.restaurant_id, 'waiting', queue.id).count;
  
  res.json({ ...queue, wait_count: waitCount });
});

app.get('/api/queues/:id/status', (req, res) => {
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: '排队记录不存在' });
  }
  
  const waitCount = db.prepare(
    'SELECT COUNT(*) as count FROM queues WHERE restaurant_id = ? AND status = ? AND id < ?'
  ).get(queue.restaurant_id, 'waiting', queue.id).count;
  
  res.json({
    id: queue.id,
    ticket_number: queue.ticket_number,
    people_count: queue.people_count,
    status: queue.status,
    wait_count: waitCount,
    created_at: queue.created_at
  });
});

app.put('/api/queues/:id/call', (req, res) => {
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: '排队记录不存在' });
  }
  if (queue.status !== 'waiting') {
    return res.status(400).json({ error: '当前排队状态不允许叫号' });
  }
  
  db.prepare('UPDATE queues SET status = ? WHERE id = ?').run('called', req.params.id);
  const updated = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  res.json({ ...updated, wait_count: 0 });
});

app.put('/api/queues/:id/cancel', (req, res) => {
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: '排队记录不存在' });
  }
  if (queue.status !== 'waiting') {
    return res.status(400).json({ error: '当前排队状态不允许取消' });
  }
  
  db.prepare('UPDATE queues SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  const updated = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.put('/api/queues/:id/confirm', (req, res) => {
  const { table_id } = req.body;
  const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  if (!queue) {
    return res.status(404).json({ error: '排队记录不存在' });
  }
  if (queue.status !== 'called') {
    return res.status(400).json({ error: '需要先叫号才能确认' });
  }
  
  db.prepare('UPDATE queues SET status = ? WHERE id = ?').run('served', req.params.id);
  if (table_id) {
    db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('occupied', table_id);
  }
  const updated = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.get('/api/restaurants/:id/queues/waiting', (req, res) => {
  const queues = db.prepare(
    'SELECT * FROM queues WHERE restaurant_id = ? AND status = ? ORDER BY id ASC'
  ).all(req.params.id, 'waiting');
  res.json(queues);
});

app.post('/api/orders', (req, res) => {
  const { restaurant_id, table_id, queue_id, items } = req.body;
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const orderResult = db.prepare('INSERT INTO orders (restaurant_id, table_id, queue_id, total_amount) VALUES (?, ?, ?, ?)').run(restaurant_id, table_id, queue_id, totalAmount);
  const orderId = orderResult.lastInsertRowid;
  
  const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)');
  items.forEach(item => {
    insertOrderItem.run(orderId, item.menu_item_id, item.quantity, item.price, item.notes || '');
  });
  
  if (table_id) {
    db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('occupied', table_id);
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  
  res.json({ ...order, items: orderItems });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  res.json({ ...order, items });
});

app.post('/api/orders/:id/items', (req, res) => {
  const { items } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)');
  let addedAmount = 0;
  items.forEach(item => {
    insertOrderItem.run(req.params.id, item.menu_item_id, item.quantity, item.price, item.notes || '');
    addedAmount += item.price * item.quantity;
  });
  
  db.prepare('UPDATE orders SET total_amount = total_amount + ? WHERE id = ?').run(addedAmount, req.params.id);
  
  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const allItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  
  res.json({ ...updatedOrder, items: allItems });
});

app.post('/api/service-calls', (req, res) => {
  const { restaurant_id, table_id, type } = req.body;
  const result = db.prepare('INSERT INTO service_calls (restaurant_id, table_id, type) VALUES (?, ?, ?)').run(restaurant_id, table_id, type);
  const call = db.prepare('SELECT * FROM service_calls WHERE id = ?').get(result.lastInsertRowid);
  res.json(call);
});

app.post('/api/orders/:id/settle', (req, res) => {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('settled', req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(order);
});

app.post('/api/reviews', (req, res) => {
  const { restaurant_id, order_id, rating, comment } = req.body;
  const result = db.prepare('INSERT INTO reviews (restaurant_id, order_id, rating, comment) VALUES (?, ?, ?, ?)').run(restaurant_id, order_id, rating, comment);
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  res.json(review);
});

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
  console.log(`默认餐厅ID: 1`);
});
