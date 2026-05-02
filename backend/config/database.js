import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'ecommerce.json');
const dataDir = join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const defaultData = {
  users: [],
  shops: [],
  products: [],
  skus: [],
  orders: [],
  shipments: [],
  after_sales: [],
  costs: [],
  alerts: [],
  logs: []
};

let db = null;

export const initDatabase = async () => {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(content);
    } else {
      db = { ...defaultData };
      await saveDatabase();
      await seedInitialData();
    }
    console.log('Database initialized successfully.');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    db = { ...defaultData };
    await seedInitialData();
    return db;
  }
};

const saveDatabase = async () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const getDatabase = () => db;

export const save = async () => {
  await saveDatabase();
};

const seedInitialData = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);

  db.users = [
    {
      id: 1,
      username: 'operation',
      password: hashedPassword,
      role: 'operation',
      name: '运营主管',
      email: 'operation@example.com',
      phone: '13800138001',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'purchase',
      password: hashedPassword,
      role: 'purchase',
      name: '采购专员',
      email: 'purchase@example.com',
      phone: '13800138002',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      username: 'warehouse',
      password: hashedPassword,
      role: 'warehouse',
      name: '仓库管理员',
      email: 'warehouse@example.com',
      phone: '13800138003',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      username: 'customer_service',
      password: hashedPassword,
      role: 'customer_service',
      name: '客服专员',
      email: 'customer_service@example.com',
      phone: '13800138004',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.shops = [
    {
      id: 1,
      name: 'Amazon美国站',
      platform: 'amazon',
      status: 'active',
      auth_token: 'mock_token_amazon',
      refresh_token: 'mock_refresh',
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      shop_config: { processing_chain: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'eBay英国站',
      platform: 'ebay',
      status: 'active',
      auth_token: 'mock_token_ebay',
      refresh_token: 'mock_refresh',
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      shop_config: { processing_chain: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.products = [
    {
      id: 1,
      name: '无线蓝牙耳机',
      description: '高品质无线蓝牙耳机，支持降噪功能',
      category: '电子产品',
      brand: 'AudioTech',
      images: [],
      attributes: { color: '黑色', noise_cancellation: true },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: '智能手表',
      description: '多功能智能手表，支持心率监测',
      category: '电子产品',
      brand: 'SmartWatch',
      images: [],
      attributes: { color: '银色', size: '42mm' },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.skus = [
    {
      id: 1,
      product_id: 1,
      sku_code: 'SKU-BT-HP-001',
      attributes: { color: '黑色' },
      price: 79.99,
      cost: 35.00,
      stock: 150,
      min_stock: 20,
      platform_skus: { amazon: 'AMZ-BT-HP-001', ebay: 'EBY-BT-HP-001' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      product_id: 1,
      sku_code: 'SKU-BT-HP-002',
      attributes: { color: '白色' },
      price: 79.99,
      cost: 35.00,
      stock: 8,
      min_stock: 20,
      platform_skus: { amazon: 'AMZ-BT-HP-002', ebay: 'EBY-BT-HP-002' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      product_id: 2,
      sku_code: 'SKU-SW-001',
      attributes: { color: '银色', size: '42mm' },
      price: 199.99,
      cost: 85.00,
      stock: 45,
      min_stock: 10,
      platform_skus: { amazon: 'AMZ-SW-001', ebay: 'EBY-SW-001' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.orders = [
    {
      id: 1,
      shop_id: 1,
      platform_order_id: 'AMZN-2024-001234',
      platform: 'amazon',
      customer_info: {
        name: 'John Smith',
        email: 'john.smith@email.com',
        address: { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'US' }
      },
      items: [
        { sku_id: 1, sku_code: 'SKU-BT-HP-001', name: '无线蓝牙耳机', price: 79.99, quantity: 1 }
      ],
      total_amount: 79.99,
      currency: 'USD',
      status: 'processing',
      payment_status: 'paid',
      shipping_status: 'unshipped',
      sync_status: 'synced',
      merge_order_id: null,
      processing_chain: [
        { action: 'sync', message: 'Order synced from Amazon', timestamp: new Date().toISOString() },
        { action: 'auto_review', message: 'Order auto-reviewed and confirmed', timestamp: new Date().toISOString() }
      ],
      platform_created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      shop_id: 2,
      platform_order_id: 'EBY-2024-005678',
      platform: 'ebay',
      customer_info: {
        name: 'Emma Johnson',
        email: 'emma.j@email.com',
        address: { street: '456 Oak Ave', city: 'London', state: 'England', zip: 'SW1A', country: 'UK' }
      },
      items: [
        { sku_id: 3, sku_code: 'SKU-SW-001', name: '智能手表', price: 199.99, quantity: 1 }
      ],
      total_amount: 199.99,
      currency: 'USD',
      status: 'pending',
      payment_status: 'paid',
      shipping_status: 'unshipped',
      sync_status: 'synced',
      merge_order_id: null,
      processing_chain: [
        { action: 'sync', message: 'Order synced from eBay', timestamp: new Date().toISOString() }
      ],
      platform_created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.alerts = [
    {
      id: 1,
      type: 'inventory',
      message: 'Low stock alert for SKU-BT-HP-002: 8 (min: 20)',
      level: 'warning',
      status: 'pending',
      related_type: 'sku',
      related_id: 2,
      assigned_to: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.costs = [
    { id: 1, type: 'purchase', amount: 35.00, currency: 'USD', related_type: 'sku', related_id: 1, description: 'Purchase cost for SKU-BT-HP-001', cost_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
    { id: 2, type: 'shipping', amount: 5.00, currency: 'USD', related_type: 'order', related_id: 1, description: 'Shipping cost', cost_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
    { id: 3, type: 'platform_fee', amount: 12.00, currency: 'USD', related_type: 'order', related_id: 1, description: 'Amazon platform fee', cost_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() }
  ];

  await saveDatabase();
  console.log('Initial data seeded successfully.');
};

export default { initDatabase, getDatabase, save };