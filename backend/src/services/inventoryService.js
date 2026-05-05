const { db } = require('../database/init');

class InventoryService {
  
  static initDatabase() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT NOT NULL UNIQUE,
        business_line_code TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 10,
        max_stock INTEGER NOT NULL DEFAULT 10,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_product_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_code TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price_at_purchase INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE INDEX IF NOT EXISTS idx_products_business_code ON products(business_line_code);
      CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
    `);

    this.initProducts();
  }

  static initProducts() {
    const checkProducts = db.prepare('SELECT COUNT(*) as count FROM products');
    const productCount = checkProducts.get().count;

    if (productCount > 0) {
      return;
    }

    const products = {
      HOTEL: [
        { code: 'H001', name: '北京王府半岛酒店', price: 288000, description: '豪华大床房，含双早', stock: 5, maxStock: 5 },
        { code: 'H002', name: '上海外滩华尔道夫', price: 358000, description: '江景套房，行政礼遇', stock: 3, maxStock: 3 },
        { code: 'H003', name: '三亚亚特兰蒂斯', price: 428000, description: '海景房，含水世界', stock: 8, maxStock: 8 },
        { code: 'H004', name: '丽江古城悦榕庄', price: 198000, description: '花园别墅，含下午茶', stock: 2, maxStock: 2 }
      ],
      FLIGHT: [
        { code: 'F001', name: '北京→上海 经济舱', price: 128000, description: '国航 CA1501，08:00-10:15', stock: 10, maxStock: 10 },
        { code: 'F002', name: '北京→三亚 商务舱', price: 368000, description: '海航 HU7379，14:00-18:15', stock: 2, maxStock: 2 },
        { code: 'F003', name: '上海→成都 经济舱', price: 98000, description: '东航 MU5401，09:30-13:00', stock: 15, maxStock: 15 },
        { code: 'F004', name: '广州→北京 头等舱', price: 588000, description: '南航 CZ3101，16:00-19:00', stock: 1, maxStock: 1 }
      ],
      TICKET: [
        { code: 'T001', name: '故宫博物院门票', price: 6000, description: '旺季成人票，含珍宝馆', stock: 100, maxStock: 100 },
        { code: 'T002', name: '迪士尼度假区一日票', price: 59900, description: '成人票，高峰期', stock: 50, maxStock: 50 },
        { code: 'T003', name: '八达岭长城门票', price: 4000, description: '成人票，含缆车', stock: 80, maxStock: 80 },
        { code: 'T004', name: '西湖游船票', price: 15000, description: '豪华画舫，环湖游', stock: 30, maxStock: 30 }
      ],
      TRAIN: [
        { code: 'R001', name: '北京→上海 高铁二等座', price: 55300, description: 'G1，07:00-11:28', stock: 20, maxStock: 20 },
        { code: 'R002', name: '北京→广州 高铁一等座', price: 138000, description: 'G65，10:00-18:00', stock: 5, maxStock: 5 },
        { code: 'R003', name: '上海→杭州 高铁二等座', price: 7300, description: 'G7351，08:30-09:45', stock: 30, maxStock: 30 },
        { code: 'R004', name: '广州→深圳 高铁商务座', price: 19900, description: 'G6501，09:00-09:30', stock: 3, maxStock: 3 }
      ],
      CAR: [
        { code: 'C001', name: '机场接送-经济型', price: 15000, description: '大众朗逸或同级', stock: 20, maxStock: 20 },
        { code: 'C002', name: '机场接送-商务型', price: 28000, description: '别克GL8或同级', stock: 10, maxStock: 10 },
        { code: 'C003', name: '日租包车-经济型', price: 45000, description: '8小时/100公里', stock: 15, maxStock: 15 },
        { code: 'C004', name: '日租包车-豪华型', price: 128000, description: '奔驰E级或同级', stock: 5, maxStock: 5 }
      ],
      VACATION: [
        { code: 'V001', name: '马尔代夫5日游', price: 2580000, description: '一价全包，水上别墅', stock: 2, maxStock: 2 },
        { code: 'V002', name: '泰国普吉岛7日游', price: 688000, description: '含机票酒店，出海浮潜', stock: 5, maxStock: 5 },
        { code: 'V003', name: '云南大理丽江6日游', price: 358000, description: '纯玩团，含玉龙雪山', stock: 10, maxStock: 10 },
        { code: 'V004', name: '日本东京大阪7日游', price: 1280000, description: '含签证机票，环球影城', stock: 3, maxStock: 3 }
      ],
      GROUP_BUY: [
        { code: 'G001', name: '双人牛排套餐', price: 29800, description: '原切菲力+红酒，门市价598', stock: 50, maxStock: 50 },
        { code: 'G002', name: '4人火锅套餐', price: 39800, description: '含锅底调料，门市价698', stock: 30, maxStock: 30 },
        { code: 'G003', name: '影院通兑票2张', price: 6800, description: '2D/3D通兑，门市价160', stock: 100, maxStock: 100 },
        { code: 'G004', name: 'KTV黄金时段3小时', price: 19800, description: '含果盘饮料，门市价398', stock: 20, maxStock: 20 }
      ],
      INSURANCE: [
        { code: 'I001', name: '境内旅游意外险', price: 2000, description: '保额50万，保期7天', stock: 999, maxStock: 999 },
        { code: 'I002', name: '境外旅游意外险', price: 8000, description: '保额100万，保期15天', stock: 999, maxStock: 999 },
        { code: 'I003', name: '航班延误险', price: 3000, description: '延误4小时赔付200元', stock: 999, maxStock: 999 },
        { code: 'I004', name: '酒店取消险', price: 5000, description: '赔付订单金额80%', stock: 999, maxStock: 999 }
      ]
    };

    const insertProduct = db.prepare(`
      INSERT INTO products (product_code, business_line_code, name, description, price, stock, max_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    Object.entries(products).forEach(([businessCode, productList]) => {
      productList.forEach(product => {
        insertProduct.run(
          product.code,
          businessCode,
          product.name,
          product.description,
          product.price,
          product.stock,
          product.maxStock
        );
      });
    });
  }

  static getProductsByBusinessLine(businessLineCode) {
    return db.prepare(`
      SELECT * FROM products 
      WHERE business_line_code = ? AND is_active = 1
      ORDER BY product_code
    `).all(businessLineCode);
  }

  static getProductByCode(productCode) {
    return db.prepare(`
      SELECT * FROM products WHERE product_code = ? AND is_active = 1
    `).get(productCode);
  }

  static checkStock(productCode, quantity = 1) {
    const product = this.getProductByCode(productCode);
    if (!product) {
      return { available: false, message: '产品不存在' };
    }

    if (product.stock < quantity) {
      return { 
        available: false, 
        message: `库存不足，当前库存: ${product.stock}`,
        currentStock: product.stock,
        requested: quantity
      };
    }

    return {
      available: true,
      currentStock: product.stock,
      maxStock: product.max_stock
    };
  }

  static deductStock(productCode, orderId, quantity = 1) {
    const product = this.getProductByCode(productCode);
    if (!product) {
      throw new Error('产品不存在');
    }

    if (product.stock < quantity) {
      throw new Error(`库存不足，当前库存: ${product.stock}`);
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE products 
        SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_code = ?
      `).run(quantity, productCode);

      db.prepare(`
        INSERT INTO order_product_links (order_id, product_code, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?)
      `).run(orderId, productCode, quantity, product.price);
    });

    transaction();

    return {
      success: true,
      productCode,
      orderId,
      quantity,
      stockBefore: product.stock,
      stockAfter: product.stock - quantity
    };
  }

  static restoreStock(productCode, orderId, quantity = 1) {
    const product = this.getProductByCode(productCode);
    if (!product) {
      throw new Error('产品不存在');
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE products 
        SET stock = MIN(stock + ?, max_stock), updated_at = CURRENT_TIMESTAMP
        WHERE product_code = ?
      `).run(quantity, productCode);

      db.prepare(`
        DELETE FROM order_product_links 
        WHERE order_id = ? AND product_code = ?
      `).run(orderId, productCode);
    });

    transaction();

    return {
      success: true,
      productCode,
      orderId,
      quantity,
      stockBefore: product.stock,
      stockAfter: Math.min(product.stock + quantity, product.max_stock)
    };
  }

  static getProductByOrderId(orderId) {
    return db.prepare(`
      SELECT opl.*, p.name as product_name, p.description, p.price as original_price
      FROM order_product_links opl
      JOIN products p ON opl.product_code = p.product_code
      WHERE opl.order_id = ?
    `).get(orderId);
  }
}

module.exports = InventoryService;
