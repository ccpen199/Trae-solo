const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'competitor_monitor.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS competitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,
    platform TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competitor_id INTEGER,
    product_name TEXT NOT NULL,
    product_url TEXT,
    current_price REAL,
    original_price REAL,
    currency TEXT DEFAULT 'USD',
    stock_status TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competitor_id) REFERENCES competitors(id)
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_price_id INTEGER,
    price REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_price_id) REFERENCES product_prices(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competitor_id INTEGER,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competitor_id) REFERENCES competitors(id)
  );

  CREATE TABLE IF NOT EXISTS hot_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    brand TEXT,
    avg_price_min REAL,
    avg_price_max REAL,
    description TEXT,
    tags TEXT,
    popularity_score INTEGER DEFAULT 50,
    is_imported INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const initData = db.prepare("SELECT COUNT(*) as count FROM competitors").get();
if (initData.count === 0) {
  const insertCompetitor = db.prepare(`
    INSERT INTO competitors (name, url, category, platform) VALUES (?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO product_prices (competitor_id, product_name, product_url, current_price, original_price, currency, stock_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const competitors = [
    { name: 'Amazon US', url: 'https://www.amazon.com', category: 'Electronics', platform: 'Amazon' },
    { name: 'AliExpress', url: 'https://www.aliexpress.com', category: 'General', platform: 'AliExpress' },
    { name: 'eBay', url: 'https://www.ebay.com', category: 'Electronics', platform: 'eBay' },
    { name: 'Walmart', url: 'https://www.walmart.com', category: 'Electronics', platform: 'Walmart' }
  ];

  const competitorIds = [];
  competitors.forEach(comp => {
    const result = insertCompetitor.run(comp.name, comp.url, comp.category, comp.platform);
    competitorIds.push(result.lastInsertRowid);
  });

  const products = [
    { competitorId: competitorIds[0], name: 'iPhone 15 Pro Max', url: 'https://www.amazon.com/iphone-15', price: 1199.99, originalPrice: 1299.99, stock: 'In Stock' },
    { competitorId: competitorIds[0], name: 'Samsung Galaxy S24 Ultra', url: 'https://www.amazon.com/samsung-s24', price: 1099.99, originalPrice: 1199.99, stock: 'In Stock' },
    { competitorId: competitorIds[1], name: 'iPhone 15 Pro Max', url: 'https://www.aliexpress.com/iphone-15', price: 1099.99, originalPrice: 1199.99, stock: 'In Stock' },
    { competitorId: competitorIds[2], name: 'iPhone 15 Pro Max', url: 'https://www.ebay.com/iphone-15', price: 1149.99, originalPrice: 1249.99, stock: 'Limited Stock' },
    { competitorId: competitorIds[3], name: 'iPhone 15 Pro Max', url: 'https://www.walmart.com/iphone-15', price: 1189.99, originalPrice: 1299.99, stock: 'In Stock' }
  ];

  products.forEach(product => {
    insertProduct.run(
      product.competitorId,
      product.name,
      product.url,
      product.price,
      product.originalPrice,
      'USD',
      product.stock
    );
  });
}

const initHotProducts = db.prepare("SELECT COUNT(*) as count FROM hot_products").get();
if (initHotProducts.count === 0) {
  const insertHotProduct = db.prepare(`
    INSERT INTO hot_products (name, category, sub_category, brand, avg_price_min, avg_price_max, description, tags, popularity_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hotProducts = [
    { name: 'iPhone 15 Pro Max', category: 'Electronics', sub_category: 'Smartphones', brand: 'Apple', min: 1099.99, max: 1299.99, desc: '苹果最新旗舰手机，钛金属设计，A17 Pro芯片', tags: '手机,苹果,旗舰', score: 100 },
    { name: 'iPhone 15 Pro', category: 'Electronics', sub_category: 'Smartphones', brand: 'Apple', min: 899.99, max: 999.99, desc: '苹果专业级手机，钛金属边框，A17 Pro芯片', tags: '手机,苹果,专业', score: 98 },
    { name: 'iPhone 15', category: 'Electronics', sub_category: 'Smartphones', brand: 'Apple', min: 749.99, max: 799.99, desc: '苹果标准版手机，灵动岛设计，A16芯片', tags: '手机,苹果,标准版', score: 96 },
    { name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', sub_category: 'Smartphones', brand: 'Samsung', min: 999.99, max: 1199.99, desc: '三星旗舰手机，AI智能，S Pen手写笔', tags: '手机,三星,旗舰', score: 95 },
    { name: 'Samsung Galaxy S24+', category: 'Electronics', sub_category: 'Smartphones', brand: 'Samsung', min: 849.99, max: 999.99, desc: '三星大屏手机，AI智能，大屏体验', tags: '手机,三星,大屏', score: 90 },
    { name: 'Samsung Galaxy S24', category: 'Electronics', sub_category: 'Smartphones', brand: 'Samsung', min: 699.99, max: 799.99, desc: '三星标准手机，AI智能，便携设计', tags: '手机,三星,标准版', score: 88 },
    { name: 'Google Pixel 8 Pro', category: 'Electronics', sub_category: 'Smartphones', brand: 'Google', min: 849.99, max: 999.99, desc: '谷歌旗舰手机，AI摄影，纯净安卓', tags: '手机,谷歌,AI', score: 85 },
    { name: 'Google Pixel 8', category: 'Electronics', sub_category: 'Smartphones', brand: 'Google', min: 599.99, max: 699.99, desc: '谷歌标准手机，AI摄影，纯净安卓', tags: '手机,谷歌,标准版', score: 82 },
    { name: 'OnePlus 12', category: 'Electronics', sub_category: 'Smartphones', brand: 'OnePlus', min: 699.99, max: 799.99, desc: '一加旗舰手机，哈苏影像，流畅体验', tags: '手机,一加,旗舰', score: 80 },
    { name: 'Xiaomi 14 Ultra', category: 'Electronics', sub_category: 'Smartphones', brand: 'Xiaomi', min: 599.99, max: 799.99, desc: '小米旗舰手机，徕卡影像，专业摄影', tags: '手机,小米,徕卡', score: 78 },
    { name: 'MacBook Pro 14-inch (M3 Pro)', category: 'Electronics', sub_category: 'Laptops', brand: 'Apple', min: 1599.99, max: 1999.99, desc: '苹果专业笔记本，M3 Pro芯片，超长续航', tags: '笔记本,苹果,专业', score: 97 },
    { name: 'MacBook Pro 16-inch (M3 Max)', category: 'Electronics', sub_category: 'Laptops', brand: 'Apple', min: 2499.99, max: 3499.99, desc: '苹果顶级笔记本，M3 Max芯片，性能怪兽', tags: '笔记本,苹果,顶级', score: 94 },
    { name: 'MacBook Air 15-inch (M3)', category: 'Electronics', sub_category: 'Laptops', brand: 'Apple', min: 1099.99, max: 1299.99, desc: '苹果轻薄笔记本，M3芯片，便携办公', tags: '笔记本,苹果,轻薄', score: 92 },
    { name: 'MacBook Air 13-inch (M3)', category: 'Electronics', sub_category: 'Laptops', brand: 'Apple', min: 899.99, max: 1099.99, desc: '苹果超轻薄笔记本，M3芯片，随身便携', tags: '笔记本,苹果,超轻薄', score: 90 },
    { name: 'Dell XPS 15', category: 'Electronics', sub_category: 'Laptops', brand: 'Dell', min: 1299.99, max: 1899.99, desc: '戴尔旗舰笔记本，4K屏幕，创作利器', tags: '笔记本,戴尔,旗舰', score: 85 },
    { name: 'Dell XPS 13', category: 'Electronics', sub_category: 'Laptops', brand: 'Dell', min: 899.99, max: 1299.99, desc: '戴尔轻薄笔记本，极致边框，便携办公', tags: '笔记本,戴尔,轻薄', score: 82 },
    { name: 'HP Spectre x360 14', category: 'Electronics', sub_category: 'Laptops', brand: 'HP', min: 1099.99, max: 1499.99, desc: '惠普变形笔记本，360翻转，触控笔', tags: '笔记本,惠普,变形', score: 80 },
    { name: 'Lenovo ThinkPad X1 Carbon', category: 'Electronics', sub_category: 'Laptops', brand: 'Lenovo', min: 1199.99, max: 1599.99, desc: '联想商务笔记本，经典键盘，商务首选', tags: '笔记本,联想,商务', score: 78 },
    { name: 'ASUS ROG Zephyrus G14', category: 'Electronics', sub_category: 'Laptops', brand: 'ASUS', min: 1299.99, max: 1799.99, desc: '华硕游戏笔记本，轻薄性能，游戏利器', tags: '笔记本,华硕,游戏', score: 75 },
    { name: 'Microsoft Surface Laptop Studio 2', category: 'Electronics', sub_category: 'Laptops', brand: 'Microsoft', min: 1999.99, max: 2999.99, desc: '微软创意笔记本，灵活变形，创作工作站', tags: '笔记本,微软,创意', score: 73 },
    { name: 'iPad Pro 12.9-inch (M2)', category: 'Electronics', sub_category: 'Tablets', brand: 'Apple', min: 999.99, max: 1499.99, desc: '苹果专业平板，M2芯片，Liquid Retina XDR', tags: '平板,苹果,专业', score: 96 },
    { name: 'iPad Pro 11-inch (M2)', category: 'Electronics', sub_category: 'Tablets', brand: 'Apple', min: 749.99, max: 1099.99, desc: '苹果专业平板，M2芯片，便携专业', tags: '平板,苹果,便携专业', score: 93 },
    { name: 'iPad Air (M2)', category: 'Electronics', sub_category: 'Tablets', brand: 'Apple', min: 549.99, max: 699.99, desc: '苹果轻薄平板，M2芯片，性能均衡', tags: '平板,苹果,轻薄', score: 90 },
    { name: 'iPad (10th Gen)', category: 'Electronics', sub_category: 'Tablets', brand: 'Apple', min: 399.99, max: 499.99, desc: '苹果入门平板，彩色设计，娱乐学习', tags: '平板,苹果,入门', score: 88 },
    { name: 'iPad mini (6th Gen)', category: 'Electronics', sub_category: 'Tablets', brand: 'Apple', min: 399.99, max: 549.99, desc: '苹果迷你平板，小巧便携，随身阅读', tags: '平板,苹果,迷你', score: 85 },
    { name: 'Samsung Galaxy Tab S9 Ultra', category: 'Electronics', sub_category: 'Tablets', brand: 'Samsung', min: 999.99, max: 1299.99, desc: '三星旗舰平板，14.6英寸大屏，S Pen', tags: '平板,三星,旗舰', score: 82 },
    { name: 'Samsung Galaxy Tab S9+', category: 'Electronics', sub_category: 'Tablets', brand: 'Samsung', min: 799.99, max: 999.99, desc: '三星大屏平板，12.4英寸，S Pen', tags: '平板,三星,大屏', score: 79 },
    { name: 'Samsung Galaxy Tab S9', category: 'Electronics', sub_category: 'Tablets', brand: 'Samsung', min: 599.99, max: 749.99, desc: '三星标准平板，11英寸，便携好用', tags: '平板,三星,标准版', score: 76 },
    { name: 'Microsoft Surface Pro 9', category: 'Electronics', sub_category: 'Tablets', brand: 'Microsoft', min: 899.99, max: 1599.99, desc: '微软二合一平板，Windows系统，办公利器', tags: '平板,微软,二合一', score: 74 },
    { name: 'Amazon Fire HD 10', category: 'Electronics', sub_category: 'Tablets', brand: 'Amazon', min: 129.99, max: 199.99, desc: '亚马逊影音平板，10英寸，娱乐首选', tags: '平板,亚马逊,影音', score: 70 },
    { name: 'AirPods Pro (2nd Gen)', category: 'Electronics', sub_category: 'Headphones', brand: 'Apple', min: 199.99, max: 249.99, desc: '苹果降噪耳机，主动降噪，空间音频', tags: '耳机,苹果,降噪', score: 99 },
    { name: 'AirPods (3rd Gen)', category: 'Electronics', sub_category: 'Headphones', brand: 'Apple', min: 149.99, max: 169.99, desc: '苹果无线耳机，空间音频，舒适佩戴', tags: '耳机,苹果,无线', score: 95 },
    { name: 'AirPods Max', category: 'Electronics', sub_category: 'Headphones', brand: 'Apple', min: 449.99, max: 549.99, desc: '苹果头戴耳机，主动降噪，Hi-Fi音质', tags: '耳机,苹果,头戴', score: 88 },
    { name: 'Sony WH-1000XM5', category: 'Electronics', sub_category: 'Headphones', brand: 'Sony', min: 329.99, max: 399.99, desc: '索尼降噪旗舰，顶级降噪，30小时续航', tags: '耳机,索尼,降噪旗舰', score: 92 },
    { name: 'Sony WF-1000XM5', category: 'Electronics', sub_category: 'Headphones', brand: 'Sony', min: 249.99, max: 299.99, desc: '索尼真无线降噪，小巧设计，8小时续航', tags: '耳机,索尼,真无线', score: 90 },
    { name: 'Bose QuietComfort Ultra', category: 'Electronics', sub_category: 'Headphones', brand: 'Bose', min: 399.99, max: 449.99, desc: 'Bose降噪旗舰，空间音频，舒适佩戴', tags: '耳机,Bose,旗舰', score: 87 },
    { name: 'Bose QuietComfort Earbuds II', category: 'Electronics', sub_category: 'Headphones', brand: 'Bose', min: 249.99, max: 299.99, desc: 'Bose真无线降噪，CustomTune技术', tags: '耳机,Bose,真无线', score: 85 },
    { name: 'Beats Studio Buds+', category: 'Electronics', sub_category: 'Headphones', brand: 'Beats', min: 149.99, max: 169.99, desc: 'Beats真无线，主动降噪，苹果芯片', tags: '耳机,Beats,真无线', score: 82 },
    { name: 'Beats Fit Pro', category: 'Electronics', sub_category: 'Headphones', brand: 'Beats', min: 179.99, max: 199.99, desc: 'Beats运动耳机，翼尖设计，运动稳固', tags: '耳机,Beats,运动', score: 80 },
    { name: 'JBL Flip 6', category: 'Electronics', sub_category: 'Speakers', brand: 'JBL', min: 119.99, max: 149.99, desc: 'JBL便携音箱，IP67防水，12小时续航', tags: '音箱,JBL,便携', score: 88 },
    { name: 'JBL Charge 5', category: 'Electronics', sub_category: 'Speakers', brand: 'JBL', min: 159.99, max: 179.99, desc: 'JBL续航音箱，20小时续航，移动电源', tags: '音箱,JBL,续航', score: 86 },
    { name: 'Sonos One (Gen 2)', category: 'Electronics', sub_category: 'Speakers', brand: 'Sonos', min: 199.99, max: 219.99, desc: 'Sonos智能音箱，语音控制，多房间', tags: '音箱,Sonos,智能', score: 84 },
    { name: 'Sonos Roam', category: 'Electronics', sub_category: 'Speakers', brand: 'Sonos', min: 159.99, max: 179.99, desc: 'Sonos便携智能，WiFi蓝牙切换，IP67', tags: '音箱,Sonos,便携智能', score: 82 },
    { name: 'Amazon Echo Dot (5th Gen)', category: 'Electronics', sub_category: 'Smart Home', brand: 'Amazon', min: 39.99, max: 59.99, desc: '亚马逊智能音箱，Alexa语音，智能家居', tags: '音箱,亚马逊,智能', score: 90 },
    { name: 'Amazon Echo (4th Gen)', category: 'Electronics', sub_category: 'Smart Home', brand: 'Amazon', min: 79.99, max: 99.99, desc: '亚马逊旗舰智能，球形设计，优质音效', tags: '音箱,亚马逊,旗舰智能', score: 88 },
    { name: 'Google Nest Audio', category: 'Electronics', sub_category: 'Smart Home', brand: 'Google', min: 79.99, max: 99.99, desc: '谷歌智能音箱，Google Assistant，清晰音效', tags: '音箱,谷歌,智能', score: 85 },
    { name: 'Google Nest Hub (2nd Gen)', category: 'Electronics', sub_category: 'Smart Home', brand: 'Google', min: 79.99, max: 99.99, desc: '谷歌智能屏，7英寸屏幕，可视化控制', tags: '智能屏,谷歌,可视化', score: 83 },
    { name: 'Apple HomePod mini', category: 'Electronics', sub_category: 'Smart Home', brand: 'Apple', min: 89.99, max: 99.99, desc: '苹果智能音箱，Siri语音，HomeKit生态', tags: '音箱,苹果,智能', score: 80 },
    { name: 'Apple HomePod (2nd Gen)', category: 'Electronics', sub_category: 'Smart Home', brand: 'Apple', min: 279.99, max: 299.99, desc: '苹果旗舰智能，空间音频，家庭影院', tags: '音箱,苹果,旗舰智能', score: 78 },
    { name: 'Nintendo Switch OLED', category: 'Electronics', sub_category: 'Gaming', brand: 'Nintendo', min: 329.99, max: 349.99, desc: '任天堂游戏机，OLED屏幕，红蓝配色', tags: '游戏,任天堂,Switch', score: 96 },
    { name: 'Nintendo Switch Lite', category: 'Electronics', sub_category: 'Gaming', brand: 'Nintendo', min: 179.99, max: 199.99, desc: '任天堂掌机，纯掌机模式，轻便便携', tags: '游戏,任天堂,掌机', score: 90 },
    { name: 'PlayStation 5', category: 'Electronics', sub_category: 'Gaming', brand: 'Sony', min: 449.99, max: 499.99, desc: '索尼游戏主机，4K光追，极速加载', tags: '游戏,索尼,PS5', score: 94 },
    { name: 'PlayStation 5 Digital Edition', category: 'Electronics', sub_category: 'Gaming', brand: 'Sony', min: 399.99, max: 449.99, desc: '索尼数字版主机，无光驱，数字游戏', tags: '游戏,索尼,数字版', score: 91 },
    { name: 'Xbox Series X', category: 'Electronics', sub_category: 'Gaming', brand: 'Microsoft', min: 449.99, max: 499.99, desc: '微软旗舰主机，4K光追，游戏通行证', tags: '游戏,微软,旗舰', score: 92 },
    { name: 'Xbox Series S', category: 'Electronics', sub_category: 'Gaming', brand: 'Microsoft', min: 279.99, max: 299.99, desc: '微软入门主机，数字版，性价比高', tags: '游戏,微软,入门', score: 88 },
    { name: 'Steam Deck', category: 'Electronics', sub_category: 'Gaming', brand: 'Valve', min: 379.99, max: 649.99, desc: 'Valve掌机，Steam游戏库，PC级体验', tags: '游戏,Valve,掌机', score: 87 },
    { name: 'Logitech G Pro X Superlight', category: 'Electronics', sub_category: 'Gaming', brand: 'Logitech', min: 129.99, max: 149.99, desc: '罗技游戏鼠标，超轻设计，专业电竞', tags: '鼠标,罗技,电竞', score: 85 },
    { name: 'Razer BlackWidow V3', category: 'Electronics', sub_category: 'Gaming', brand: 'Razer', min: 129.99, max: 169.99, desc: '雷蛇机械键盘，绿轴黄轴，RGB灯效', tags: '键盘,雷蛇,机械', score: 83 },
    { name: 'Sony PlayStation DualSense', category: 'Electronics', sub_category: 'Gaming', brand: 'Sony', min: 59.99, max: 69.99, desc: 'PS5手柄，自适应扳机，触觉反馈', tags: '手柄,索尼,PS5', score: 86 },
    { name: 'La Mer Moisturizing Cream', category: 'Beauty', sub_category: 'Skincare', brand: 'La Mer', min: 199.99, max: 349.99, desc: '海蓝之谜面霜，经典修护，奢华护肤', tags: '面霜,海蓝之谜,奢华', score: 95 },
    { name: 'SK-II Facial Treatment Essence', category: 'Beauty', sub_category: 'Skincare', brand: 'SK-II', min: 149.99, max: 249.99, desc: 'SK-II神仙水，PITERA精华，焕亮肌肤', tags: '精华,SK-II,神仙水', score: 93 },
    { name: 'Estée Lauder Advanced Night Repair', category: 'Beauty', sub_category: 'Skincare', brand: 'Estée Lauder', min: 99.99, max: 159.99, desc: '雅诗兰黛小棕瓶，夜间修护，抗老精华', tags: '精华,雅诗兰黛,抗老', score: 91 },
    { name: 'Lancôme Advanced Génifique', category: 'Beauty', sub_category: 'Skincare', brand: 'Lancôme', min: 89.99, max: 139.99, desc: '兰蔻小黑瓶，肌底精华，修护肌肤', tags: '精华,兰蔻,肌底', score: 89 },
    { name: 'Shiseido Elixir Superior', category: 'Beauty', sub_category: 'Skincare', brand: 'Shiseido', min: 79.99, max: 129.99, desc: '资生堂怡丽丝尔，弹力紧致，抗老系列', tags: '护肤,资生堂,抗老', score: 87 },
    { name: 'Dior Capture Totale', category: 'Beauty', sub_category: 'Skincare', brand: 'Dior', min: 119.99, max: 189.99, desc: '迪奥修护系列，多重修护，焕活年轻', tags: '护肤,迪奥,修护', score: 85 },
    { name: 'Chanel Sérum N°1 de Chanel', category: 'Beauty', sub_category: 'Skincare', brand: 'Chanel', min: 149.99, max: 219.99, desc: '香奈儿一号，红山茶花，焕活修护', tags: '精华,香奈儿,红山茶花', score: 88 },
    { name: 'La Prairie Skin Caviar', category: 'Beauty', sub_category: 'Skincare', brand: 'La Prairie', min: 299.99, max: 549.99, desc: '莱珀妮鱼子精华，奢华抗老，紧致提升', tags: '精华,莱珀妮,奢华', score: 90 },
    { name: 'Helena Rubinstein Powercell', category: 'Beauty', sub_category: 'Skincare', brand: 'Helena Rubinstein', min: 199.99, max: 349.99, desc: '赫莲娜绿宝瓶，修护精华，强韧肌肤', tags: '精华,赫莲娜,绿宝瓶', score: 86 },
    { name: 'Guerlain Abeille Royale', category: 'Beauty', sub_category: 'Skincare', brand: 'Guerlain', min: 129.99, max: 219.99, desc: '娇兰帝皇蜂姿，蜂蜜修护，紧致抗老', tags: '护肤,娇兰,蜂蜜', score: 84 },
    { name: 'Dior Addict Lip Glow', category: 'Beauty', sub_category: 'Makeup', brand: 'Dior', min: 34.99, max: 39.99, desc: '迪奥变色唇膏，温感变色，滋润双唇', tags: '唇膏,迪奥,变色', score: 94 },
    { name: 'YSL Rouge Pur Couture', category: 'Beauty', sub_category: 'Makeup', brand: 'YSL', min: 39.99, max: 45.99, desc: 'YSL方管口红，经典正红，显色持久', tags: '口红,YSL,经典', score: 92 },
    { name: 'Chanel Rouge Allure', category: 'Beauty', sub_category: 'Makeup', brand: 'Chanel', min: 42.99, max: 48.99, desc: '香奈儿炫亮唇膏，丝缎质地，优雅显色', tags: '口红,香奈儿,炫亮', score: 90 },
    { name: 'Armani Beauty Lip Maestro', category: 'Beauty', sub_category: 'Makeup', brand: 'Armani', min: 39.99, max: 45.99, desc: '阿玛尼红管唇釉，丝绒质地，持久显色', tags: '唇釉,阿玛尼,红管', score: 89 },
    { name: 'MAC Matte Lipstick', category: 'Beauty', sub_category: 'Makeup', brand: 'MAC', min: 21.99, max: 25.99, desc: 'MAC哑光口红，经典色号，持久显色', tags: '口红,MAC,哑光', score: 88 },
    { name: 'NARS Blush Orgasm', category: 'Beauty', sub_category: 'Makeup', brand: 'NARS', min: 32.99, max: 36.99, desc: 'NARS腮红Orgasm，经典高潮色，自然红晕', tags: '腮红,NARS,经典', score: 87 },
    { name: 'Urban Decay Naked Palette', category: 'Beauty', sub_category: 'Makeup', brand: 'Urban Decay', min: 39.99, max: 49.99, desc: 'Urban Decay眼影盘，大地色系，日常实用', tags: '眼影,Urban Decay,大地色', score: 86 },
    { name: 'Too Faced Better Than Sex Mascara', category: 'Beauty', sub_category: 'Makeup', brand: 'Too Faced', min: 25.99, max: 29.99, desc: 'Too Faced睫毛膏，浓密卷翘，纤长分明', tags: '睫毛膏,Too Faced,浓密', score: 85 },
    { name: 'Benefit Hoola Bronzer', category: 'Beauty', sub_category: 'Makeup', brand: 'Benefit', min: 29.99, max: 34.99, desc: 'Benefit修容粉，哑光古铜，自然立体', tags: '修容,Benefit,古铜', score: 84 },
    { name: 'Charlotte Tilbury Pillow Talk', category: 'Beauty', sub_category: 'Makeup', brand: 'Charlotte Tilbury', min: 32.99, max: 38.99, desc: 'CT枕边话系列，温柔裸粉，日常百搭', tags: '口红,CT,裸粉', score: 88 },
    { name: 'Nike Air Force 1', category: 'Fashion', sub_category: 'Shoes', brand: 'Nike', min: 89.99, max: 119.99, desc: '耐克空军一号，经典板鞋，百搭时尚', tags: '鞋,耐克,经典', score: 97 },
    { name: 'Nike Dunk Low', category: 'Fashion', sub_category: 'Shoes', brand: 'Nike', min: 109.99, max: 149.99, desc: '耐克Dunk板鞋，复古风潮，街头时尚', tags: '鞋,耐克,复古', score: 95 },
    { name: 'Air Jordan 1 Retro High', category: 'Fashion', sub_category: 'Shoes', brand: 'Nike', min: 179.99, max: 249.99, desc: 'AJ1高帮，经典篮球鞋，潮流必备', tags: '鞋,Nike,AJ', score: 93 },
    { name: 'Adidas Ultraboost', category: 'Fashion', sub_category: 'Shoes', brand: 'Adidas', min: 149.99, max: 189.99, desc: '阿迪达斯boost跑鞋，舒适缓震，运动时尚', tags: '鞋,阿迪达斯,跑鞋', score: 91 },
    { name: 'Adidas Samba OG', category: 'Fashion', sub_category: 'Shoes', brand: 'Adidas', min: 99.99, max: 129.99, desc: '阿迪达斯Samba，德训鞋款，复古休闲', tags: '鞋,阿迪达斯,德训', score: 89 },
    { name: 'New Balance 550', category: 'Fashion', sub_category: 'Shoes', brand: 'New Balance', min: 109.99, max: 139.99, desc: '新百伦550，复古篮球鞋，学院风', tags: '鞋,新百伦,复古', score: 87 },
    { name: 'New Balance 2002R', category: 'Fashion', sub_category: 'Shoes', brand: 'New Balance', min: 139.99, max: 169.99, desc: '新百伦2002R，复古跑鞋，舒适百搭', tags: '鞋,新百伦,跑鞋', score: 86 },
    { name: 'Converse Chuck 70', category: 'Fashion', sub_category: 'Shoes', brand: 'Converse', min: 79.99, max: 99.99, desc: '匡威1970s，经典帆布鞋，复古时尚', tags: '鞋,匡威,帆布', score: 88 },
    { name: 'Vans Old Skool', category: 'Fashion', sub_category: 'Shoes', brand: 'Vans', min: 59.99, max: 79.99, desc: 'Vans经典板鞋，滑板文化，街头潮流', tags: '鞋,Vans,滑板', score: 85 },
    { name: 'UGG Classic Mini', category: 'Fashion', sub_category: 'Shoes', brand: 'UGG', min: 139.99, max: 159.99, desc: 'UGG短靴，羊毛保暖，秋冬必备', tags: '鞋,UGG,保暖', score: 84 },
    { name: 'Lululemon Align Leggings', category: 'Fashion', sub_category: 'Activewear', brand: 'Lululemon', min: 89.99, max: 119.99, desc: 'Lululemon裸感裤，Nulu面料，舒适塑形', tags: '瑜伽裤,Lululemon,裸感', score: 92 },
    { name: 'Lululemon Define Jacket', category: 'Fashion', sub_category: 'Activewear', brand: 'Lululemon', min: 119.99, max: 149.99, desc: 'Lululemon运动外套，Define系列，修身显瘦', tags: '外套,Lululemon,修身', score: 90 },
    { name: 'Patagonia Better Sweater', category: 'Fashion', sub_category: 'Outdoor', brand: 'Patagonia', min: 119.99, max: 149.99, desc: 'Patagonia抓绒衣，保暖舒适，户外必备', tags: '抓绒,Patagonia,户外', score: 88 },
    { name: 'The North Face Nuptse Jacket', category: 'Fashion', sub_category: 'Outdoor', brand: 'The North Face', min: 199.99, max: 299.99, desc: '北面羽绒服，1996经典，保暖抗寒', tags: '羽绒服,北面,经典', score: 94 },
    { name: 'Canada Goose Parka', category: 'Fashion', sub_category: 'Outdoor', brand: 'Canada Goose', min: 899.99, max: 1499.99, desc: '加拿大鹅羽绒服，极地保暖，奢华户外', tags: '羽绒服,加拿大鹅,奢华', score: 86 },
    { name: 'Arc\'teryx Beta AR Jacket', category: 'Fashion', sub_category: 'Outdoor', brand: 'Arc\'teryx', min: 449.99, max: 599.99, desc: '始祖鸟冲锋衣，GORE-TEX，专业户外', tags: '冲锋衣,始祖鸟,专业', score: 84 },
    { name: 'Tory Burch Lee Radziwill', category: 'Fashion', sub_category: 'Bags', brand: 'Tory Burch', min: 499.99, max: 699.99, desc: 'Tory Burch经典包，优雅通勤，时尚百搭', tags: '包,Tory Burch,经典', score: 89 },
    { name: 'Coach Tabby Shoulder Bag', category: 'Fashion', sub_category: 'Bags', brand: 'Coach', min: 299.99, max: 449.99, desc: 'Coach Tabby系列，复古腋下包，时尚单品', tags: '包,Coach,复古', score: 87 },
    { name: 'Michael Kors Jet Set', category: 'Fashion', sub_category: 'Bags', brand: 'Michael Kors', min: 199.99, max: 299.99, desc: 'MK通勤包，经典设计，实用百搭', tags: '包,MK,通勤', score: 85 },
    { name: 'Longchamp Le Pliage', category: 'Fashion', sub_category: 'Bags', brand: 'Longchamp', min: 89.99, max: 139.99, desc: '珑骧饺子包，轻便实用，折叠便携', tags: '包,珑骧,轻便', score: 88 },
    { name: 'Instant Pot Duo 7-in-1', category: 'Home', sub_category: 'Kitchen', brand: 'Instant Pot', min: 79.99, max: 99.99, desc: 'Instant Pot电压力锅，7合1功能，智能烹饪', tags: '厨房,电压力锅,智能', score: 92 },
    { name: 'Ninja Foodi Air Fryer', category: 'Home', sub_category: 'Kitchen', brand: 'Ninja', min: 149.99, max: 199.99, desc: 'Ninja空气炸锅，大容量，多功能料理', tags: '厨房,空气炸锅,大容量', score: 90 },
    { name: 'KitchenAid Stand Mixer', category: 'Home', sub_category: 'Kitchen', brand: 'KitchenAid', min: 329.99, max: 449.99, desc: 'KitchenAid厨师机，经典设计，烘焙必备', tags: '厨房,厨师机,烘焙', score: 89 },
    { name: 'Dyson V15 Detect', category: 'Home', sub_category: 'Appliances', brand: 'Dyson', min: 699.99, max: 749.99, desc: '戴森吸尘器，激光检测，强劲吸力', tags: '家电,戴森,吸尘器', score: 94 },
    { name: 'Dyson Airwrap', category: 'Home', sub_category: 'Beauty Appliances', brand: 'Dyson', min: 549.99, max: 599.99, desc: '戴森卷发棒，康达效应，造型不伤发', tags: '家电,戴森,造型', score: 91 },
    { name: 'iRobot Roomba i7+', category: 'Home', sub_category: 'Appliances', brand: 'iRobot', min: 599.99, max: 799.99, desc: 'iRobot扫地机器人，自动集尘，智能导航', tags: '家电,扫地机器人,智能', score: 88 },
    { name: 'Philips Sonicare DiamondClean', category: 'Home', sub_category: 'Personal Care', brand: 'Philips', min: 129.99, max: 179.99, desc: '飞利浦电动牙刷，声波震动，深度清洁', tags: '个护,电动牙刷,声波', score: 87 },
    { name: 'Braun Series 9 Pro', category: 'Home', sub_category: 'Personal Care', brand: 'Braun', min: 179.99, max: 249.99, desc: '博朗剃须刀，9系Pro，极致剃须', tags: '个护,剃须刀,博朗', score: 86 },
    { name: 'Oral-B iO Series', category: 'Home', sub_category: 'Personal Care', brand: 'Oral-B', min: 149.99, max: 199.99, desc: 'Oral-B电动牙刷，iO系列，智能压力感应', tags: '个护,电动牙刷,智能', score: 85 },
    { name: 'Theragun Pro', category: 'Home', sub_category: 'Fitness', brand: 'Theragun', min: 299.99, max: 399.99, desc: 'Theragun筋膜枪，深层按摩，肌肉恢复', tags: '健身,筋膜枪,按摩', score: 84 },
    { name: 'LEGO Star Wars Millennium Falcon', category: 'Toys', sub_category: 'Building', brand: 'LEGO', min: 149.99, max: 169.99, desc: '乐高星战千年隼，经典收藏，拼搭乐趣', tags: '玩具,乐高,星战', score: 91 },
    { name: 'LEGO Harry Potter Hogwarts', category: 'Toys', sub_category: 'Building', brand: 'LEGO', min: 129.99, max: 149.99, desc: '乐高哈利波特霍格沃茨，魔法世界，经典场景', tags: '玩具,乐高,哈利波特', score: 89 },
    { name: 'Funko Pop! Collection', category: 'Toys', sub_category: 'Collectibles', brand: 'Funko', min: 9.99, max: 14.99, desc: 'Funko Pop公仔，Q版形象，收藏热门', tags: '玩具,Funko,收藏', score: 88 },
    { name: 'Melissa & Doug Wooden Toys', category: 'Toys', sub_category: 'Educational', brand: 'Melissa & Doug', min: 19.99, max: 49.99, desc: 'Melissa & Doug木质玩具，益智早教，安全环保', tags: '玩具,木质,益智', score: 86 },
    { name: 'Crayola Ultimate Crayon Case', category: 'Toys', sub_category: 'Art', brand: 'Crayola', min: 19.99, max: 29.99, desc: '绘儿乐蜡笔套装，152色，艺术创作', tags: '玩具,蜡笔,艺术', score: 85 },
    { name: 'Barbie Dreamhouse', category: 'Toys', sub_category: 'Dolls', brand: 'Mattel', min: 149.99, max: 199.99, desc: '芭比梦幻屋，三层别墅，女孩梦想', tags: '玩具,芭比,娃娃', score: 84 },
    { name: 'Hot Wheels Track Builder', category: 'Toys', sub_category: 'Vehicles', brand: 'Hot Wheels', min: 29.99, max: 59.99, desc: '风火轮轨道套装，竞速赛道，男孩最爱', tags: '玩具,风火轮,轨道', score: 83 },
    { name: 'Play-Doh Ultimate Collection', category: 'Toys', sub_category: 'Creative', brand: 'Play-Doh', min: 14.99, max: 24.99, desc: '培乐多彩泥套装，创意无限，安全无毒', tags: '玩具,彩泥,创意', score: 82 },
    { name: 'Pokémon Trading Cards', category: 'Toys', sub_category: 'Collectibles', brand: 'Pokémon', min: 19.99, max: 49.99, desc: '宝可梦卡牌，收藏对战，童年回忆', tags: '玩具,卡牌,宝可梦', score: 87 },
    { name: 'Transformers Studio Series', category: 'Toys', sub_category: 'Action Figures', brand: 'Hasbro', min: 29.99, max: 49.99, desc: '变形金刚电影版，可动玩具，经典角色', tags: '玩具,变形金刚,可动', score: 86 }
  ];

  hotProducts.forEach(product => {
    insertHotProduct.run(
      product.name,
      product.category,
      product.sub_category,
      product.brand,
      product.min,
      product.max,
      product.desc,
      product.tags,
      product.score
    );
  });
}

module.exports = db;
