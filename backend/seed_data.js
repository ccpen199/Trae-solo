const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('./data/app.sqlite');

console.log('开始补充数据...');

// 更新商品图片 - 使用真实可访问的占位图片
const updateProductStmt = db.prepare(`
  UPDATE products SET cover_image = ? WHERE id = ?
`);

const productImages = [
  'https://picsum.photos/seed/iphone/400/400.jpg',
  'https://picsum.photos/seed/dyson/400/400.jpg',
  'https://picsum.photos/seed/sony/400/400.jpg'
];

const products = db.prepare('SELECT id FROM products ORDER BY id').all();
products.forEach((product, index) => {
  if (productImages[index]) {
    updateProductStmt.run(productImages[index], product.id);
    console.log(`已更新商品 ${product.id} 的图片`);
  }
});

// 确保有一个产品吧
let barId = null;
const bar = db.prepare('SELECT id FROM product_bars LIMIT 1').get();
if (!bar) {
  const seller = db.prepare('SELECT id FROM users WHERE username = ?').get('seller');
  if (seller) {
    const product = db.prepare('SELECT id FROM products LIMIT 1').get();
    const barResult = db.prepare(`
      INSERT INTO product_bars (name, description, product_id, creator_id, owner_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('iPhone 15 用户社区', '苹果 iPhone 15 系列手机用户交流讨论区', product.id, seller.id, seller.id, 'active');
    barId = barResult.lastInsertRowid;
    console.log(`已创建产品吧: ${barId}`);
    
    // 添加内容分栏
    db.prepare(`
      INSERT INTO content_columns (bar_id, name, description, content_type)
      VALUES (?, ?, ?, ?)
    `).run(barId, '产品资讯', '最新产品动态和行业资讯', 'news');
    db.prepare(`
      INSERT INTO content_columns (bar_id, name, description, content_type)
      VALUES (?, ?, ?, ?)
    `).run(barId, '用户论坛', '用户交流讨论区', 'forum');
    db.prepare(`
      INSERT INTO content_columns (bar_id, name, description, content_type)
      VALUES (?, ?, ?, ?)
    `).run(barId, '体验博客', '深度使用心得分享', 'blog');
    db.prepare(`
      INSERT INTO content_columns (bar_id, name, description, content_type)
      VALUES (?, ?, ?, ?)
    `).run(barId, '问答专区', '使用问题解答', 'qa');
    console.log('已创建内容分栏');
  }
} else {
  barId = bar.id;
  console.log(`使用现有产品吧: ${barId}`);
}

// 获取用户ID
const buyer = db.prepare('SELECT id FROM users WHERE username = ?').get('buyer');
const authorId = buyer ? buyer.id : 1;

// 先获取已存在帖子的内容类型分布
const existingTypes = db.prepare('SELECT content_type, COUNT(*) as cnt FROM posts GROUP BY content_type').all();
console.log('现有帖子类型分布:', existingTypes);

// 获取一个分栏ID
const column = db.prepare('SELECT id FROM content_columns WHERE bar_id = ? LIMIT 1').get(barId);
const columnId = column ? column.id : null;

// 添加不同类型的测试帖子
const postData = [
  {
    type: 'news',
    title: 'iPhone 15 Pro 最新评测：钛金属边框带来的质变',
    content: '苹果在今年的iPhone 15 Pro系列中首次采用了钛金属边框设计，这不仅让手机更加轻盈，也带来了前所未有的质感提升。从实际使用体验来看，钛金属材质不仅更耐刮擦，而且长时间握持也不会像不锈钢那样留下明显的指纹痕迹。'
  },
  {
    type: 'news',
    title: 'iOS 18 正式版下月发布，这些新功能值得期待',
    content: '苹果公司确认iOS 18正式版将于下月发布，本次更新包含了多项重要功能改进：全新的控制中心设计、更智能的Siri、增强的隐私保护功能等。'
  },
  {
    type: 'forum',
    title: '大家来聊聊：iPhone 15的续航怎么样？',
    content: '入手iPhone 15已经两周了，感觉续航似乎没有想象中那么好。中度使用的话，一天大概需要充两次。想问问大家的使用情况如何？有没有什么省电技巧可以分享一下？'
  },
  {
    type: 'forum',
    title: '讨论：大家都用的什么手机壳？求推荐',
    content: '刚入手iPhone 15 Pro Max，想选个好用的手机壳。官方的硅胶壳太贵了，第三方的又怕质量不好。大家都在用什么壳呢？求推荐！'
  },
  {
    type: 'blog',
    title: '【深度体验】iPhone 15 Pro Max 使用一个月有感',
    content: '从安卓阵营转回iPhone，这一个月的体验让我感触良多。iOS系统的流畅度依然是标杆，但也有一些地方让我不太适应。比如通知系统的逻辑，还有文件管理的方式。不过总体来说，这是一款让我满意的旗舰手机。'
  },
  {
    type: 'blog',
    title: '摄影爱好者的iPhone 15 Pro相机体验报告',
    content: '作为一个业余摄影爱好者，我对iPhone 15 Pro的相机系统进行了全面测试。从人像模式到夜景拍摄，从视频录制到色彩表现，这篇文章将为你详细解读。'
  },
  {
    type: 'qa',
    title: '新手求助：如何开启iPhone的电池健康优化？',
    content: '刚从安卓转到iPhone，听说苹果有电池健康优化功能，可以延长电池寿命。请问这个功能在哪里开启？需要注意什么吗？'
  },
  {
    type: 'qa',
    title: '请问iPhone 15支持无线充电吗？需要买什么充电器？',
    content: '准备入手iPhone 15，想问问它支持无线充电吗？如果支持的话，需要买什么样的充电器？有没有推荐的品牌？'
  }
];

const insertPost = db.prepare(`
  INSERT INTO posts (bar_id, column_id, author_id, title, content, content_type, status, view_count, like_count, comment_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

postData.forEach(post => {
  insertPost.run(
    barId,
    columnId,
    authorId,
    post.title,
    post.content,
    post.type,
    'published',
    Math.floor(Math.random() * 500) + 50,
    Math.floor(Math.random() * 50),
    Math.floor(Math.random() * 10)
  );
  console.log(`已添加${post.type}类型帖子: ${post.title}`);
});

console.log('\n数据补充完成！');
console.log('现在帖子类型分布:');
console.log(db.prepare('SELECT content_type, COUNT(*) as count FROM posts GROUP BY content_type').all());

db.close();
