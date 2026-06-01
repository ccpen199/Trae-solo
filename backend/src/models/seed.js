const { db } = require('./database');

const seedDatabase = () => {
  const banners = [
    { title: '新店开业大酬宾', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20hotel%20lobby%20with%20warm%20lighting&image_size=landscape_16_9', link: '/theme/1', sort: 1 },
    { title: '周末特惠', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20hotel%20room%20with%20city%20view&image_size=landscape_16_9', link: '/theme/2', sort: 2 },
    { title: '会员专享', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spa%20and%20wellness%20area%20in%20hotel&image_size=landscape_16_9', link: '/theme/3', sort: 3 }
  ];
  
  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get().count;
  if (bannerCount === 0) {
    const insertBanner = db.prepare('INSERT INTO banners (title, image, link, sort) VALUES (?, ?, ?, ?)');
    banners.forEach(b => insertBanner.run(b.title, b.image, b.link, b.sort));
  }

  const categories = [
    { name: '精品民宿', icon: '🏠', sort: 1 },
    { name: '特色套房', icon: '🛏️', sort: 2 },
    { name: '钟点房', icon: '⏰', sort: 3 },
    { name: '长租房', icon: '📅', sort: 4 },
    { name: '团建场地', icon: '👥', sort: 5 }
  ];
  
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (categoryCount === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)');
    categories.forEach(c => insertCategory.run(c.name, c.icon, c.sort));
  }

  const products = [
    {
      category_id: 1,
      name: '温馨阳光大床房',
      description: '市中心位置，落地窗，阳光充足，独立卫浴',
      price: 299,
      original_price: 399,
      stock: 20,
      sales: 156,
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bright%20hotel%20room%20with%20king%20bed%20sunlight&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bathroom%20with%20rain%20shower&image_size=square_hd'
      ]),
      content: '房间位于5楼，朝南，采光极佳。配备1.8米大床、空调、电视、免费WiFi、独立卫浴。提供24小时热水、洗漱用品。',
      specs: JSON.stringify([{ name: '床型', value: '1.8米大床' }, { name: '面积', value: '35㎡' }, { name: '窗户', value: '落地窗' }]),
      after_sale: '入住前一天可免费取消，入住当天18:00前取消收取50%费用',
      is_new: 1,
      is_recommend: 1
    },
    {
      category_id: 1,
      name: '日式禅意榻榻米',
      description: '传统日式风格，静谧舒适，体验禅意生活',
      price: 259,
      original_price: 329,
      stock: 15,
      sales: 89,
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20style%20tatami%20room%20zen&image_size=square_hd'
      ]),
      content: '日式榻榻米房间，配备茶具、蒲团，营造宁静的禅意氛围。',
      specs: JSON.stringify([{ name: '床型', value: '榻榻米' }, { name: '面积', value: '30㎡' }, { name: '风格', value: '日式' }]),
      after_sale: '入住前一天可免费取消',
      is_new: 0,
      is_recommend: 1
    },
    {
      category_id: 2,
      name: '豪华江景套房',
      description: '一线江景，超大空间，尊享奢华体验',
      price: 599,
      original_price: 799,
      stock: 8,
      sales: 45,
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20suite%20with%20river%20view%20balcony&image_size=square_hd'
      ]),
      content: '位于顶层，270度江景，独立客厅、卧室，配备高端设施。',
      specs: JSON.stringify([{ name: '床型', value: '2米大床' }, { name: '面积', value: '65㎡' }, { name: '景观', value: '江景' }]),
      after_sale: '入住前二天可免费取消',
      is_new: 1,
      is_recommend: 1
    },
    {
      category_id: 2,
      name: '家庭亲子套房',
      description: '适合家庭入住，儿童设施齐全，温馨舒适',
      price: 459,
      original_price: 559,
      stock: 10,
      sales: 72,
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family%20hotel%20room%20with%20kids%20play%20area&image_size=square_hd'
      ]),
      content: '双床设计，配备儿童玩具、帐篷、防滑设施，适合带孩子出行。',
      specs: JSON.stringify([{ name: '床型', value: '双床1.5米' }, { name: '面积', value: '45㎡' }, { name: '适用', value: '2-4人' }]),
      after_sale: '入住前一天可免费取消',
      is_new: 0,
      is_recommend: 0
    },
    {
      category_id: 3,
      name: '钟点房-4小时',
      description: '灵活入住，短暂休憩，经济实惠',
      price: 99,
      original_price: 129,
      stock: 30,
      sales: 234,
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20cozy%20day%20use%20hotel%20room&image_size=square_hd'
      ]),
      content: '白天可用，4小时时长，适合临时休息、办公。',
      specs: JSON.stringify([{ name: '时长', value: '4小时' }, { name: '可用时间', value: '09:00-18:00' }]),
      after_sale: '预订后不可取消',
      is_new: 0,
      is_recommend: 0
    },
    {
      category_id: 4,
      name: '月租特惠房',
      description: '长租优惠，拎包入住，适合出差、过渡',
      price: 4999,
      original_price: 6999,
      stock: 5,
      sales: 12,
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=long%20stay%20apartment%20full%20furnished&image_size=square_hd'
      ]),
      content: '一室一厅，家电齐全，可做饭，独立卫浴，适合长期居住。',
      specs: JSON.stringify([{ name: '时长', value: '30天' }, { name: '面积', value: '40㎡' }, { name: '配套', value: '家电齐全' }]),
      after_sale: '起租后不可退，可转租',
      is_new: 1,
      is_recommend: 0
    }
  ];
  
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare('INSERT INTO products (category_id, name, description, price, original_price, stock, sales, images, content, specs, after_sale, is_new, is_recommend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    products.forEach(p => insertProduct.run(p.category_id, p.name, p.description, p.price, p.original_price, p.stock, p.sales, p.images, p.content, p.specs, p.after_sale, p.is_new, p.is_recommend));
  }

  const themes = [
    {
      name: '浪漫蜜月',
      description: '精选浪漫主题房间，给你难忘回忆',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20honeymoon%20hotel%20room%20rose%20petals&image_size=square_hd',
      product_ids: '[1,3]',
      sort: 1
    },
    {
      name: '周末出逃',
      description: '周末特惠，短暂逃离城市喧嚣',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=weekend%20getaway%20cabin%20nature&image_size=square_hd',
      product_ids: '[1,2,5]',
      sort: 2
    },
    {
      name: '商务差旅',
      description: '安静舒适，高效办公休息两不误',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20hotel%20room%20work%20desk&image_size=square_hd',
      product_ids: '[1,4,6]',
      sort: 3
    }
  ];
  
  const themeCount = db.prepare('SELECT COUNT(*) as count FROM themes').get().count;
  if (themeCount === 0) {
    const insertTheme = db.prepare('INSERT INTO themes (name, description, image, product_ids, sort) VALUES (?, ?, ?, ?, ?)');
    themes.forEach(t => insertTheme.run(t.name, t.description, t.image, t.product_ids, t.sort));
  }

  const coupons = [
    { name: '新人专享券', type: 1, value: 50, min_amount: 200 },
    { name: '满减优惠券', type: 1, value: 30, min_amount: 300 },
    { name: '周末特惠券', type: 2, value: 0.85, min_amount: 0 }
  ];
  
  const couponCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
  if (couponCount === 0) {
    const insertCoupon = db.prepare('INSERT INTO coupons (name, type, value, min_amount) VALUES (?, ?, ?, ?)');
    coupons.forEach(c => insertCoupon.run(c.name, c.type, c.value, c.min_amount));
  }
};

module.exports = { seedDatabase };
