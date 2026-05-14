const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'db.json');

let db = {
  users: [],
  ads: [],
  ad_favorites: [],
  categories: [],
  products: [],
  carts: [],
  orders: [],
  order_items: [],
  search_history: [],
  hot_searches: []
};

let nextId = {
  users: 1,
  ads: 1,
  ad_favorites: 1,
  categories: 1,
  products: 1,
  carts: 1,
  orders: 1,
  order_items: 1,
  search_history: 1,
  hot_searches: 1
};

function loadDB() {
  if (fs.existsSync(dbFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      db = data.db || db;
      nextId = data.nextId || nextId;
    } catch (e) {
      console.log('DB load error, using default');
    }
  } else {
    initSampleData();
  }
}

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify({ db, nextId }, null, 2));
}

function initSampleData() {
  db.categories = [
    { id: 1, name: '推荐', icon: '🎁', sort_order: 0 },
    { id: 2, name: '新品', icon: '🆕', sort_order: 1 },
    { id: 3, name: '众筹', icon: '💰', sort_order: 2 },
    { id: 4, name: '福利社', icon: '🎉', sort_order: 3 },
    { id: 5, name: '限时购', icon: '⏰', sort_order: 4 },
    { id: 6, name: '居家', icon: '🏠', sort_order: 5 },
    { id: 7, name: '服装', icon: '👔', sort_order: 6 },
    { id: 8, name: '电器', icon: '📺', sort_order: 7 },
    { id: 9, name: '饮食', icon: '🍱', sort_order: 8 },
    { id: 10, name: '洗护', icon: '🧴', sort_order: 9 },
    { id: 11, name: '母婴', icon: '👶', sort_order: 10 },
    { id: 12, name: '运动', icon: '⚽', sort_order: 11 }
  ];
  nextId.categories = 13;

  db.products = [
    { id: 1, name: '纯棉毛巾三件套', description: '优质新疆长绒棉，柔软亲肤', price: 39.9, original_price: 59.9, image: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400', category_id: 6, is_new: 1, is_hot: 1, stock: 100, created_at: new Date().toISOString() },
    { id: 2, name: '智能台灯', description: '护眼LED，无级调光', price: 129.0, original_price: 199.0, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', category_id: 8, is_new: 1, is_hot: 0, stock: 100, created_at: new Date().toISOString() },
    { id: 3, name: '纯棉T恤', description: '经典简约，百搭舒适', price: 79.0, original_price: 129.0, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', category_id: 7, is_new: 0, is_hot: 1, stock: 100, created_at: new Date().toISOString() },
    { id: 4, name: '有机坚果礼盒', description: '精选五种坚果，健康美味', price: 89.0, original_price: 128.0, image: 'https://images.unsplash.com/photo-1536816850451-59e1720e5932?w=400', category_id: 9, is_new: 1, is_hot: 1, stock: 100, created_at: new Date().toISOString() },
    { id: 5, name: '洗衣液套装', description: '天然酵素，低泡易漂', price: 49.9, original_price: 79.9, image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400', category_id: 10, is_new: 0, is_hot: 0, stock: 100, created_at: new Date().toISOString() },
    { id: 6, name: '婴儿爬行垫', description: '环保EVA，安全无味', price: 199.0, original_price: 299.0, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', category_id: 11, is_new: 0, is_hot: 1, stock: 100, created_at: new Date().toISOString() },
    { id: 7, name: '瑜伽垫', description: 'TPE环保材质，防滑耐磨', price: 89.0, original_price: 149.0, image: 'https://images.unsplash.com/photo-1599447292189-552ec24e8976?w=400', category_id: 12, is_new: 0, is_hot: 0, stock: 100, created_at: new Date().toISOString() },
    { id: 8, name: '保温杯', description: '304不锈钢，12小时保温', price: 59.0, original_price: 99.0, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', category_id: 6, is_new: 1, is_hot: 1, stock: 100, created_at: new Date().toISOString() }
  ];
  nextId.products = 9;

  db.ads = [
    { id: 1, title: '好的生活，没那么贵', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', content: '精选全球好物，品质生活从这里开始', duration: 3, is_active: 1, created_at: new Date().toISOString() },
    { id: 2, title: '新品上市', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200', content: '探索最新潮流单品', duration: 3, is_active: 1, created_at: new Date().toISOString() }
  ];
  nextId.ads = 3;

  db.hot_searches = [
    { id: 1, keyword: '毛巾', sort_order: 0 },
    { id: 2, keyword: '台灯', sort_order: 1 },
    { id: 3, keyword: 'T恤', sort_order: 2 },
    { id: 4, keyword: '坚果', sort_order: 3 },
    { id: 5, keyword: '保温杯', sort_order: 4 },
    { id: 6, keyword: '洗衣液', sort_order: 5 },
    { id: 7, keyword: '瑜伽垫', sort_order: 6 },
    { id: 8, keyword: '婴儿用品', sort_order: 7 }
  ];
  nextId.hot_searches = 9;

  saveDB();
}

loadDB();

function generateId(collection) {
  return nextId[collection]++;
}

module.exports = {
  db,
  saveDB,
  generateId
};
