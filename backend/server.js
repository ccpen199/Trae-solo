import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDatabase, getDatabase, save } from './config/database.js';

dotenv.config();

const BACKEND_PORT = parseInt(process.env.PORT) || 7013;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:7014';

const CORS_ORIGINS = [
  FRONTEND_URL,
  'http://localhost:7014',
  'http://127.0.0.1:7014'
];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));
app.use(express.json());

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-7013');
    const db = getDatabase();
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

const ROLES = {
  OPERATION: 'operation',
  PURCHASE: 'purchase',
  WAREHOUSE: 'warehouse',
  CUSTOMER_SERVICE: 'customer_service'
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDatabase();
    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-7013',
      { expiresIn: '24h' }
    );
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: BACKEND_PORT });
});

app.get('/api/shops', authMiddleware, (req, res) => {
  const db = getDatabase();
  res.json({ shops: db.shops });
});

app.post('/api/shops', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const { name, platform } = req.body;
    const newShop = {
      id: db.shops.length > 0 ? Math.max(...db.shops.map(s => s.id)) + 1 : 1,
      name,
      platform,
      status: 'pending',
      auth_token: null,
      refresh_token: null,
      token_expires_at: null,
      shop_config: { processing_chain: [{ action: 'create', message: `Shop created by ${req.user.username}`, timestamp: new Date().toISOString() }] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.shops.push(newShop);
    await save();
    res.status(201).json({ shop: newShop });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

app.get('/api/shops/:id', authMiddleware, (req, res) => {
  const db = getDatabase();
  const shop = db.shops.find(s => s.id === parseInt(req.params.id));
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json({ shop });
});

app.post('/api/shops/:id/authorize', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const shop = db.shops.find(s => s.id === parseInt(req.params.id));
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    
    shop.status = 'active';
    shop.auth_token = `token_${uuidv4()}`;
    shop.refresh_token = `refresh_${uuidv4()}`;
    shop.token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    shop.shop_config.processing_chain.push({
      action: 'authorize',
      message: `Shop authorized by ${req.user.username}`,
      timestamp: new Date().toISOString()
    });
    shop.updated_at = new Date().toISOString();
    
    await save();
    res.json({ shop, message: 'Shop authorized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authorize shop' });
  }
});

app.post('/api/shops/:id/sync', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const shop = db.shops.find(s => s.id === parseInt(req.params.id));
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    
    const orderId = `${shop.platform.toUpperCase()}-${Date.now()}-${uuidv4().split('-')[0]}`;
    const newOrder = {
      id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
      shop_id: shop.id,
      platform_order_id: orderId,
      platform: shop.platform,
      customer_info: {
        name: `Customer ${Math.floor(Math.random() * 1000)}`,
        email: `customer_${Date.now()}@example.com`,
        address: { street: '123 Main St', city: 'City', state: 'State', zip: '12345', country: 'US' }
      },
      items: db.skus.length > 0 ? [{ 
        sku_id: db.skus[0].id, 
        sku_code: db.skus[0].sku_code, 
        name: db.skus[0].price > 100 ? '智能手表' : '无线蓝牙耳机', 
        price: db.skus[0].price, 
        quantity: 1 
      }] : [],
      total_amount: db.skus.length > 0 ? db.skus[0].price : 79.99,
      currency: 'USD',
      status: 'pending',
      payment_status: 'paid',
      shipping_status: 'unshipped',
      sync_status: 'synced',
      merge_order_id: null,
      processing_chain: [{ 
        action: 'sync', 
        message: `Order synced from ${shop.platform}`, 
        timestamp: new Date().toISOString() 
      }],
      platform_created_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.orders.push(newOrder);
    shop.updated_at = new Date().toISOString();
    
    await save();
    res.json({ order: newOrder, message: 'Shop data synced successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync shop data' });
  }
});

app.get('/api/products', authMiddleware, (req, res) => {
  const db = getDatabase();
  const productsWithSKUs = db.products.map(product => ({
    ...product,
    skus: db.skus.filter(s => s.product_id === product.id)
  }));
  res.json({ products: productsWithSKUs });
});

app.post('/api/products', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, category, brand } = req.body;
    const newProduct = {
      id: db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1,
      name,
      description: description || '',
      category: category || '',
      brand: brand || '',
      images: [],
      attributes: {},
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.products.push(newProduct);
    await save();
    res.status(201).json({ product: newProduct });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.post('/api/products/:id/publish', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const product = db.products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const { platforms } = req.body;
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'No platforms specified' });
    }
    
    const skus = db.skus.filter(s => s.product_id === product.id);
    if (skus.length === 0) {
      return res.status(400).json({ error: 'Product has no SKUs' });
    }
    
    skus.forEach(sku => {
      if (!sku.platform_skus) sku.platform_skus = {};
      platforms.forEach(platform => {
        sku.platform_skus[platform] = `${platform.toUpperCase()}-${sku.sku_code}`;
      });
    });
    
    product.status = 'active';
    product.updated_at = new Date().toISOString();
    
    await save();
    res.json({ product, skus, message: `Product published to ${platforms.join(', ')}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish product' });
  }
});

app.get('/api/skus', authMiddleware, (req, res) => {
  const db = getDatabase();
  res.json({ skus: db.skus });
});

app.post('/api/skus', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const { product_id, sku_code, attributes, price, cost, stock, min_stock } = req.body;
    
    if (db.skus.find(s => s.sku_code === sku_code)) {
      return res.status(400).json({ error: 'SKU code already exists' });
    }
    
    const newSKU = {
      id: db.skus.length > 0 ? Math.max(...db.skus.map(s => s.id)) + 1 : 1,
      product_id: product_id || null,
      sku_code,
      attributes: attributes || {},
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      stock: parseInt(stock) || 0,
      min_stock: parseInt(min_stock) || 10,
      platform_skus: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.skus.push(newSKU);
    
    if (newSKU.stock < newSKU.min_stock) {
      const newAlert = {
        id: db.alerts.length > 0 ? Math.max(...db.alerts.map(a => a.id)) + 1 : 1,
        type: 'inventory',
        message: `Low stock alert for ${sku_code}: ${newSKU.stock} (min: ${newSKU.min_stock})`,
        level: 'warning',
        status: 'pending',
        related_type: 'sku',
        related_id: newSKU.id,
        assigned_to: null,
        resolved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.alerts.push(newAlert);
    }
    
    await save();
    res.status(201).json({ sku: newSKU });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create SKU' });
  }
});

app.put('/api/skus/:id/stock', authMiddleware, roleMiddleware([ROLES.OPERATION, ROLES.WAREHOUSE]), async (req, res) => {
  try {
    const db = getDatabase();
    const sku = db.skus.find(s => s.id === parseInt(req.params.id));
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    
    const { delta, reason } = req.body;
    sku.stock = Math.max(0, sku.stock + parseInt(delta));
    sku.updated_at = new Date().toISOString();
    
    if (sku.stock < sku.min_stock) {
      const existingAlert = db.alerts.find(a => a.related_id === sku.id && a.type === 'inventory' && a.status !== 'resolved');
      if (!existingAlert) {
        const newAlert = {
          id: db.alerts.length > 0 ? Math.max(...db.alerts.map(a => a.id)) + 1 : 1,
          type: 'inventory',
          message: `Low stock alert for ${sku.sku_code}: ${sku.stock} (min: ${sku.min_stock})`,
          level: 'warning',
          status: 'pending',
          related_type: 'sku',
          related_id: sku.id,
          assigned_to: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.alerts.push(newAlert);
      }
    }
    
    await save();
    res.json({ sku, message: `Stock updated. Reason: ${reason || 'Manual adjustment'}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const db = getDatabase();
  const { status, platform } = req.query;
  let orders = db.orders;
  if (status) orders = orders.filter(o => o.status === status);
  if (platform) orders = orders.filter(o => o.platform === platform);
  orders = orders.map(order => ({
    ...order,
    shop: db.shops.find(s => s.id === order.shop_id)
  }));
  res.json({ orders });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const db = getDatabase();
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const orderWithShop = {
    ...order,
    shop: db.shops.find(s => s.id === order.shop_id),
    shipment: db.shipments.find(s => s.order_id === order.id),
    afterSales: db.after_sales.filter(a => a.order_id === order.id)
  };
  
  res.json({ order: orderWithShop });
});

app.post('/api/orders/sync', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const shops = db.shops.filter(s => s.status === 'active');
    const newOrders = [];
    
    for (const shop of shops) {
      const orderId = `${shop.platform.toUpperCase()}-${Date.now()}-${uuidv4().split('-')[0]}`;
      const randomSku = db.skus[Math.floor(Math.random() * db.skus.length)] || { sku_code: 'UNKNOWN', price: 79.99, id: 1 };
      const newOrder = {
        id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
        shop_id: shop.id,
        platform_order_id: orderId,
        platform: shop.platform,
        customer_info: {
          name: `Customer ${Math.floor(Math.random() * 1000)}`,
          email: `customer_${Date.now()}@example.com`,
          address: { street: '123 Main St', city: 'City', state: 'State', zip: '12345', country: 'US' }
        },
        items: [{ 
          sku_id: randomSku.id, 
          sku_code: randomSku.sku_code, 
          name: randomSku.price > 100 ? '智能手表' : '无线蓝牙耳机', 
          price: randomSku.price, 
          quantity: 1 
        }],
        total_amount: randomSku.price,
        currency: 'USD',
        status: 'pending',
        payment_status: 'paid',
        shipping_status: 'unshipped',
        sync_status: 'synced',
        merge_order_id: null,
        processing_chain: [{ 
          action: 'sync', 
          message: `Order synced from ${shop.platform}`, 
          timestamp: new Date().toISOString() 
        }],
        platform_created_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.orders.push(newOrder);
      newOrders.push(newOrder);
    }
    
    await save();
    res.json({ message: 'Orders synced', count: newOrders.length, orders: newOrders });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.post('/api/orders/:id/confirm', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const order = db.orders.find(o => o.id === parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order cannot be confirmed in current status' });
    }
    
    order.status = 'confirmed';
    order.processing_chain.push({ 
      action: 'confirm', 
      message: `Order confirmed by ${req.user.username}`, 
      timestamp: new Date().toISOString() 
    });
    order.updated_at = new Date().toISOString();
    
    await save();
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

app.post('/api/orders/:id/process', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const order = db.orders.find(o => o.id === parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: 'Order must be confirmed before processing' });
    }
    
    let stockAvailable = true;
    for (const item of order.items) {
      const sku = db.skus.find(s => s.id === item.sku_id);
      if (sku && sku.stock < item.quantity) {
        stockAvailable = false;
        const newAlert = {
          id: db.alerts.length > 0 ? Math.max(...db.alerts.map(a => a.id)) + 1 : 1,
          type: 'order',
          message: `Insufficient stock for order ${order.platform_order_id}: ${sku.sku_code} needs ${item.quantity}, has ${sku.stock}`,
          level: 'error',
          status: 'pending',
          related_type: 'order',
          related_id: order.id,
          assigned_to: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.alerts.push(newAlert);
        break;
      }
    }
    
    if (!stockAvailable) {
      await save();
      return res.status(400).json({ error: 'Insufficient stock for one or more items' });
    }
    
    for (const item of order.items) {
      const sku = db.skus.find(s => s.id === item.sku_id);
      if (sku) {
        sku.stock -= item.quantity;
        sku.updated_at = new Date().toISOString();
        
        if (sku.stock < sku.min_stock) {
          const existingAlert = db.alerts.find(a => a.related_id === sku.id && a.type === 'inventory' && a.status !== 'resolved');
          if (!existingAlert) {
            const newAlert = {
              id: db.alerts.length > 0 ? Math.max(...db.alerts.map(a => a.id)) + 1 : 1,
              type: 'inventory',
              message: `Low stock alert for ${sku.sku_code}: ${sku.stock} (min: ${sku.min_stock})`,
              level: 'warning',
              status: 'pending',
              related_type: 'sku',
              related_id: sku.id,
              assigned_to: null,
              resolved_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            db.alerts.push(newAlert);
          }
        }
      }
    }
    
    order.status = 'processing';
    order.processing_chain.push({ 
      action: 'process', 
      message: `Order processed by ${req.user.username}, stock deducted`, 
      timestamp: new Date().toISOString() 
    });
    order.updated_at = new Date().toISOString();
    
    await save();
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process order' });
  }
});

app.post('/api/orders/:id/cancel', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const order = db.orders.find(o => o.id === parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (order.status === 'completed' || order.status === 'shipped') {
      return res.status(400).json({ error: 'Cannot cancel order in current status' });
    }
    
    if (order.status === 'processing') {
      for (const item of order.items) {
        const sku = db.skus.find(s => s.id === item.sku_id);
        if (sku) {
          sku.stock += item.quantity;
          sku.updated_at = new Date().toISOString();
        }
      }
    }
    
    order.status = 'cancelled';
    order.processing_chain.push({ 
      action: 'cancel', 
      message: `Order cancelled by ${req.user.username}`, 
      timestamp: new Date().toISOString() 
    });
    order.updated_at = new Date().toISOString();
    
    await save();
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

app.post('/api/orders/merge', authMiddleware, roleMiddleware([ROLES.OPERATION]), async (req, res) => {
  try {
    const db = getDatabase();
    const { order_ids } = req.body;
    
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length < 2) {
      return res.status(400).json({ error: 'At least 2 order IDs required for merging' });
    }
    
    const orders = db.orders.filter(o => order_ids.includes(o.id));
    if (orders.length !== order_ids.length) {
      return res.status(404).json({ error: 'One or more orders not found' });
    }
    
    const customerInfo = orders[0].customer_info;
    const canMerge = orders.every(o => 
      o.customer_info.name === customerInfo.name &&
      o.customer_info.email === customerInfo.email &&
      o.status === 'pending'
    );
    
    if (!canMerge) {
      return res.status(400).json({ error: 'Orders cannot be merged (different customers or status)' });
    }
    
    const mergedItems = [];
    const itemMap = new Map();
    
    for (const order of orders) {
      for (const item of order.items) {
        if (itemMap.has(item.sku_id)) {
          const existing = itemMap.get(item.sku_id);
          existing.quantity += item.quantity;
        } else {
          itemMap.set(item.sku_id, { ...item });
        }
      }
    }
    
    const mergedOrder = {
      id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
      shop_id: orders[0].shop_id,
      platform_order_id: `MERGED-${Date.now()}`,
      platform: orders[0].platform,
      customer_info: customerInfo,
      items: Array.from(itemMap.values()),
      total_amount: Array.from(itemMap.values()).reduce((sum, item) => sum + item.price * item.quantity, 0),
      currency: orders[0].currency,
      status: 'pending',
      payment_status: 'paid',
      shipping_status: 'unshipped',
      sync_status: 'synced',
      merge_order_id: null,
      merged_from_orders: order_ids,
      processing_chain: [{ 
        action: 'merge', 
        message: `Order merged from ${order_ids.length} orders by ${req.user.username}`, 
        timestamp: new Date().toISOString() 
      }],
      platform_created_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    for (const order of orders) {
      order.status = 'merged';
      order.merge_order_id = mergedOrder.id;
      order.processing_chain.push({ 
        action: 'merged_into', 
        message: `Merged into order ${mergedOrder.platform_order_id}`, 
        timestamp: new Date().toISOString() 
      });
      order.updated_at = new Date().toISOString();
    }
    
    db.orders.push(mergedOrder);
    
    await save();
    res.json({ mergedOrder, message: `${order_ids.length} orders merged successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to merge orders' });
  }
});

app.get('/api/orders/:id/processing-chain', authMiddleware, (req, res) => {
  const db = getDatabase();
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ processingChain: order.processing_chain || [] });
});

app.get('/api/warehouses/pending', authMiddleware, roleMiddleware([ROLES.WAREHOUSE, ROLES.OPERATION]), (req, res) => {
  const db = getDatabase();
  const pendingOrders = db.orders.filter(o => o.status === 'processing' && o.shipping_status === 'unshipped');
  const ordersWithDetails = pendingOrders.map(order => ({
    ...order,
    shop: db.shops.find(s => s.id === order.shop_id)
  }));
  res.json({ orders: ordersWithDetails });
});

app.post('/api/warehouses/:orderId/ship', authMiddleware, roleMiddleware([ROLES.WAREHOUSE]), async (req, res) => {
  try {
    const db = getDatabase();
    const order = db.orders.find(o => o.id === parseInt(req.params.orderId));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (order.status !== 'processing') {
      return res.status(400).json({ error: 'Order is not in processing status' });
    }
    
    const { carrier, tracking_number } = req.body;
    
    order.status = 'shipped';
    order.shipping_status = 'shipped';
    order.processing_chain.push({ 
      action: 'ship', 
      message: `Order shipped via ${carrier} by ${req.user.username}`, 
      timestamp: new Date().toISOString() 
    });
    order.updated_at = new Date().toISOString();
    
    const shipment = {
      id: db.shipments.length > 0 ? Math.max(...db.shipments.map(s => s.id)) + 1 : 1,
      order_id: order.id,
      tracking_number,
      carrier,
      status: 'picked',
      shipping_address: order.customer_info.address,
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      actual_delivery: null,
      package_info: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.shipments.push(shipment);
    
    const shippingCost = {
      id: db.costs.length > 0 ? Math.max(...db.costs.map(c => c.id)) + 1 : 1,
      type: 'shipping',
      amount: 5.00,
      currency: 'USD',
      related_type: 'order',
      related_id: order.id,
      description: `Shipping cost via ${carrier}`,
      cost_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    db.costs.push(shippingCost);
    
    await save();
    res.json({ message: 'Shipment created', shipment, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

app.post('/api/shipments/:id/deliver', authMiddleware, roleMiddleware([ROLES.WAREHOUSE]), async (req, res) => {
  try {
    const db = getDatabase();
    const shipment = db.shipments.find(s => s.id === parseInt(req.params.id));
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    
    shipment.status = 'delivered';
    shipment.actual_delivery = new Date().toISOString();
    shipment.updated_at = new Date().toISOString();
    
    const order = db.orders.find(o => o.id === shipment.order_id);
    if (order) {
      order.status = 'completed';
      order.processing_chain.push({ 
        action: 'complete', 
        message: 'Order delivered and completed', 
        timestamp: new Date().toISOString() 
      });
      order.updated_at = new Date().toISOString();
    }
    
    await save();
    res.json({ shipment, order, message: 'Delivery confirmed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

app.get('/api/warehouses/shipments', authMiddleware, (req, res) => {
  const db = getDatabase();
  const shipments = db.shipments.map(shipment => ({
    ...shipment,
    order: db.orders.find(o => o.id === shipment.order_id)
  }));
  res.json({ shipments });
});

app.get('/api/customers/after-sales', authMiddleware, (req, res) => {
  const db = getDatabase();
  const afterSalesWithOrders = db.after_sales.map(afterSale => ({
    ...afterSale,
    order: db.orders.find(o => o.id === afterSale.order_id)
  }));
  res.json({ afterSales: afterSalesWithOrders });
});

app.post('/api/customers/after-sales', authMiddleware, roleMiddleware([ROLES.CUSTOMER_SERVICE]), async (req, res) => {
  try {
    const db = getDatabase();
    const { order_id, type, reason, description, amount } = req.body;
    
    const order = db.orders.find(o => o.id === parseInt(order_id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const newAfterSale = {
      id: db.after_sales.length > 0 ? Math.max(...db.after_sales.map(a => a.id)) + 1 : 1,
      order_id: parseInt(order_id),
      type: type || 'refund',
      reason: reason || '',
      description: description || '',
      status: 'pending',
      amount: parseFloat(amount) || 0,
      images: [],
      platform_after_sale_id: null,
      processing_chain: [{ 
        action: 'create', 
        message: `After-sale created by ${req.user.username}`, 
        timestamp: new Date().toISOString() 
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.after_sales.push(newAfterSale);
    
    await save();
    res.status(201).json({ afterSale: newAfterSale });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create after-sale' });
  }
});

app.put('/api/customers/after-sales/:id', authMiddleware, roleMiddleware([ROLES.CUSTOMER_SERVICE]), async (req, res) => {
  try {
    const db = getDatabase();
    const afterSale = db.after_sales.find(a => a.id === parseInt(req.params.id));
    if (!afterSale) return res.status(404).json({ error: 'After-sale not found' });
    
    const { status, amount, reason } = req.body;
    
    if (status) {
      afterSale.status = status;
      afterSale.processing_chain.push({ 
        action: `status_${status}`, 
        message: `After-sale status changed to ${status} by ${req.user.username}`, 
        timestamp: new Date().toISOString() 
      });
    }
    
    if (amount !== undefined) afterSale.amount = parseFloat(amount);
    if (reason) afterSale.reason = reason;
    
    afterSale.updated_at = new Date().toISOString();
    
    if (afterSale.type === 'refund' && afterSale.status === 'completed') {
      const refundCost = {
        id: db.costs.length > 0 ? Math.max(...db.costs.map(c => c.id)) + 1 : 1,
        type: 'refund',
        amount: afterSale.amount,
        currency: 'USD',
        related_type: 'after_sale',
        related_id: afterSale.id,
        description: `Refund for after-sale #${afterSale.id}`,
        cost_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      db.costs.push(refundCost);
    }
    
    await save();
    res.json({ afterSale });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update after-sale' });
  }
});

app.get('/api/customers/after-sales/:id/processing-chain', authMiddleware, (req, res) => {
  const db = getDatabase();
  const afterSale = db.after_sales.find(a => a.id === parseInt(req.params.id));
  if (!afterSale) return res.status(404).json({ error: 'After-sale not found' });
  res.json({ processingChain: afterSale.processing_chain || [] });
});

app.get('/api/analytics/dashboard', authMiddleware, (req, res) => {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  const todayOrders = db.orders.filter(o => o.created_at.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const pendingShipments = db.orders.filter(o => o.status === 'processing' && o.shipping_status === 'unshipped').length;
  const pendingAfterSales = db.after_sales.filter(a => a.status === 'pending' || a.status === 'processing').length;
  const lowStockSKUs = db.skus.filter(s => s.stock < s.min_stock).length;
  
  res.json({
    todayOrders: todayOrders.length,
    todayRevenue,
    pendingShipments,
    pendingAfterSales,
    lowStockSKUs,
    lowStockItems: db.skus.filter(s => s.stock < s.min_stock).slice(0, 10),
    recentAlerts: db.alerts.filter(a => a.status !== 'resolved').slice(0, 5),
    totalShops: db.shops.filter(s => s.status === 'active').length,
    totalOrders: db.orders.length,
    totalProducts: db.products.length,
    statusBreakdown: {
      pending: db.orders.filter(o => o.status === 'pending').length,
      confirmed: db.orders.filter(o => o.status === 'confirmed').length,
      processing: db.orders.filter(o => o.status === 'processing').length,
      shipped: db.orders.filter(o => o.status === 'shipped').length,
      completed: db.orders.filter(o => o.status === 'completed').length,
      cancelled: db.orders.filter(o => o.status === 'cancelled').length
    }
  });
});

app.get('/api/analytics/sales', authMiddleware, (req, res) => {
  const db = getDatabase();
  const { period = 'daily' } = req.query;
  const completedOrders = db.orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending');
  
  const groupedData = {};
  completedOrders.forEach(order => {
    let key;
    const date = new Date(order.created_at);
    if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0] + '_week';
    } else if (period === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = order.created_at.split('T')[0];
    }
    
    if (!groupedData[key]) {
      groupedData[key] = { period: key, order_count: 0, revenue: 0, avg_order_value: 0 };
    }
    groupedData[key].order_count++;
    groupedData[key].revenue += parseFloat(order.total_amount || 0);
  });
  
  const sortedSales = Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
  sortedSales.forEach(item => {
    item.avg_order_value = item.order_count > 0 ? (item.revenue / item.order_count).toFixed(2) : 0;
  });
  
  res.json({
    sales: sortedSales,
    summary: {
      totalOrders: completedOrders.length,
      totalRevenue: completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      avgOrderValue: completedOrders.length > 0 ? completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) / completedOrders.length : 0
    }
  });
});

app.get('/api/analytics/profit', authMiddleware, (req, res) => {
  const db = getDatabase();
  const { start_date, end_date, group_by = 'overall' } = req.query;
  
  let filteredOrders = db.orders.filter(o => o.status !== 'cancelled');
  let filteredCosts = db.costs;
  
  if (start_date) {
    filteredOrders = filteredOrders.filter(o => o.created_at >= start_date);
    filteredCosts = filteredCosts.filter(c => c.created_at >= start_date);
  }
  if (end_date) {
    filteredOrders = filteredOrders.filter(o => o.created_at <= end_date + 'T23:59:59');
    filteredCosts = filteredCosts.filter(c => c.created_at <= end_date + 'T23:59:59');
  }
  
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const totalCost = filteredCosts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  
  const costByType = {};
  filteredCosts.forEach(c => {
    const type = c.type || 'other';
    costByType[type] = (costByType[type] || 0) + parseFloat(c.amount || 0);
  });
  
  let groupedRevenue = [];
  if (group_by === 'platform') {
    const platformMap = {};
    filteredOrders.forEach(o => {
      const platform = o.platform || 'unknown';
      if (!platformMap[platform]) {
        platformMap[platform] = { platform, revenue: 0, order_count: 0 };
      }
      platformMap[platform].revenue += parseFloat(o.total_amount || 0);
      platformMap[platform].order_count++;
    });
    groupedRevenue = Object.values(platformMap);
  } else if (group_by === 'shop') {
    const shopMap = {};
    filteredOrders.forEach(o => {
      const shop = db.shops.find(s => s.id === o.shop_id);
      const shopName = shop ? shop.name : `Shop ${o.shop_id}`;
      if (!shopMap[o.shop_id]) {
        shopMap[o.shop_id] = { shop_id: o.shop_id, shop_name: shopName, revenue: 0, order_count: 0 };
      }
      shopMap[o.shop_id].revenue += parseFloat(o.total_amount || 0);
      shopMap[o.shop_id].order_count++;
    });
    groupedRevenue = Object.values(shopMap);
  }
  
  res.json({
    summary: { 
      totalRevenue, 
      totalCost, 
      totalProfit, 
      overallMargin: totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(2) : 0, 
      orderCount: filteredOrders.length 
    },
    costBreakdown: costByType,
    groupedRevenue
  });
});

app.get('/api/analytics/inventory', authMiddleware, (req, res) => {
  const db = getDatabase();
  
  const totalStock = db.skus.reduce((sum, s) => sum + (s.stock || 0), 0);
  const lowStockCount = db.skus.filter(s => s.stock < s.min_stock).length;
  const outOfStockCount = db.skus.filter(s => s.stock <= 0).length;
  
  const inventoryByProduct = db.products.map(product => {
    const productSkus = db.skus.filter(s => s.product_id === product.id);
    const totalProductStock = productSkus.reduce((sum, s) => sum + (s.stock || 0), 0);
    const avgStockValue = productSkus.reduce((sum, s) => sum + (s.stock || 0) * (s.cost || 0), 0);
    return {
      product_id: product.id,
      product_name: product.name,
      sku_count: productSkus.length,
      total_stock: totalProductStock,
      stock_value: avgStockValue,
      low_stock: productSkus.some(s => s.stock < s.min_stock)
    };
  });
  
  res.json({
    summary: {
      totalSkus: db.skus.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      totalStockValue: db.skus.reduce((sum, s) => sum + (s.stock || 0) * (s.cost || 0), 0)
    },
    inventoryByProduct,
    lowStockItems: db.skus.filter(s => s.stock < s.min_stock).map(sku => ({
      ...sku,
      product: db.products.find(p => p.id === sku.product_id)
    }))
  });
});

app.get('/api/analytics/after-sales', authMiddleware, (req, res) => {
  const db = getDatabase();
  
  const totalAfterSales = db.after_sales.length;
  const pendingAfterSales = db.after_sales.filter(a => a.status === 'pending').length;
  const completedAfterSales = db.after_sales.filter(a => a.status === 'completed').length;
  const totalRefundAmount = db.after_sales
    .filter(a => a.type === 'refund' && a.status === 'completed')
    .reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
  
  const reasonDistribution = {};
  db.after_sales.forEach(a => {
    const reason = a.reason || 'Unknown';
    reasonDistribution[reason] = (reasonDistribution[reason] || 0) + 1;
  });
  
  const typeDistribution = {};
  db.after_sales.forEach(a => {
    const type = a.type || 'other';
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
  });
  
  res.json({
    summary: {
      totalAfterSales,
      pendingAfterSales,
      completedAfterSales,
      totalRefundAmount,
      resolutionRate: totalAfterSales > 0 ? (completedAfterSales / totalAfterSales * 100).toFixed(2) : 0
    },
    reasonDistribution,
    typeDistribution,
    recentAfterSales: db.after_sales
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(a => ({
        ...a,
        order: db.orders.find(o => o.id === a.order_id)
      }))
  });
});

app.get('/api/alerts', authMiddleware, (req, res) => {
  const db = getDatabase();
  const { status, type } = req.query;
  let alerts = db.alerts;
  if (status) alerts = alerts.filter(a => a.status === status);
  if (type) alerts = alerts.filter(a => a.type === type);
  res.json({ alerts });
});

app.post('/api/alerts/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const alert = db.alerts.find(a => a.id === parseInt(req.params.id));
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    alert.status = 'resolved';
    alert.resolved_at = new Date().toISOString();
    alert.updated_at = new Date().toISOString();
    
    await save();
    res.json({ alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

app.post('/api/alerts/:id/acknowledge', authMiddleware, async (req, res) => {
  try {
    const db = getDatabase();
    const alert = db.alerts.find(a => a.id === parseInt(req.params.id));
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    alert.status = 'processing';
    alert.assigned_to = req.user.id;
    alert.updated_at = new Date().toISOString();
    
    await save();
    res.json({ alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room`);
  });
});

const broadcastAlert = (alert) => {
  io.to('alerts').emit('new-alert', alert);
};

const startServer = async () => {
  try {
    await initDatabase();
    httpServer.listen(BACKEND_PORT, () => {
      console.log(`\n🚀 跨境电商店铺管理系统后端服务启动成功`);
      console.log(`========================================`);
      console.log(`   后端端口: ${BACKEND_PORT}`);
      console.log(`   API地址: http://localhost:${BACKEND_PORT}/api`);
      console.log(`   健康检查: http://localhost:${BACKEND_PORT}/api/health`);
      console.log(`   前端地址: ${FRONTEND_URL}`);
      console.log(`========================================`);
      console.log('\n📋 Demo账号:');
      console.log('  - 运营: operation / password123');
      console.log('  - 采购: purchase / password123');
      console.log('  - 仓库: warehouse / password123');
      console.log('  - 客服: customer_service / password123');
      console.log('\n🔗 核心业务流程:');
      console.log('  1. 选品上架 → 2. 订单同步 → 3. 仓库发货 → 4. 客服售后 → 5. 利润核算');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io, broadcastAlert };
