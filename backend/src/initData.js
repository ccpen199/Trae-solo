const { run, get } = require('./models/database');
const bcrypt = require('bcryptjs');

async function initSampleData() {
  try {
    console.log('Creating sample users...');
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    for (let i = 1; i <= 10; i++) {
      try {
        await run(
          'INSERT INTO users (phone, password, nickname, avatar, bio) VALUES (?, ?, ?, ?, ?)',
          [
            `1380000${String(i).padStart(4, '0')}`,
            hashedPassword,
            `用户${i}`,
            `https://picsum.photos/200/200?random=${i}`,
            `这是用户${i}的个人简介`
          ]
        );
      } catch (e) {}
    }

    console.log('Creating sample categories...');
    const categories = [
      { name: '美妆护肤', children: ['面部护肤', '彩妆', '香水', '个护'] },
      { name: '服饰鞋包', children: ['女装', '男装', '鞋靴', '箱包'] },
      { name: '食品生鲜', children: ['零食', '饮料', '生鲜', '粮油'] },
      { name: '家居生活', children: ['家具', '家纺', '厨具', '收纳'] },
      { name: '数码家电', children: ['手机', '电脑', '家电', '配件'] }
    ];

    for (const cat of categories) {
      const result = await run('INSERT INTO product_categories (name) VALUES (?)', [cat.name]);
      for (const child of cat.children) {
        await run('INSERT INTO product_categories (name, parent_id) VALUES (?, ?)', [child, result.id]);
      }
    }

    console.log('Creating sample products...');
    const products = [
      { name: '精华液 30ml', price: 299, originalPrice: 399, categoryId: 2 },
      { name: '保湿面霜 50ml', price: 199, originalPrice: 259, categoryId: 2 },
      { name: '口红礼盒套装', price: 399, originalPrice: 499, categoryId: 3 },
      { name: '夏季连衣裙', price: 259, originalPrice: 359, categoryId: 6 },
      { name: '休闲运动鞋', price: 399, originalPrice: 599, categoryId: 8 },
      { name: '进口零食大礼包', price: 128, originalPrice: 168, categoryId: 11 },
      { name: '坚果混合装 500g', price: 68, originalPrice: 88, categoryId: 11 },
      { name: '简约北欧台灯', price: 159, originalPrice: 199, categoryId: 15 },
      { name: '无线蓝牙耳机', price: 299, originalPrice: 399, categoryId: 19 },
      { name: '智能手表', price: 1299, originalPrice: 1599, categoryId: 19 }
    ];

    for (const product of products) {
      const images = JSON.stringify([
        `https://picsum.photos/400/400?random=${Math.random()}`,
        `https://picsum.photos/400/400?random=${Math.random()}`,
        `https://picsum.photos/400/400?random=${Math.random()}`
      ]);
      
      await run(
        'INSERT INTO products (name, description, price, original_price, images, category_id, stock, sales_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          product.name,
          `这是${product.name}的详细描述，品质保证，正品行货。`,
          product.price,
          product.originalPrice,
          images,
          product.categoryId,
          100,
          Math.floor(Math.random() * 1000)
        ]
      );
    }

    console.log('Creating sample notes...');
    const noteContents = [
      { title: '今日穿搭分享', content: '今天穿了这套超级好看的连衣裙，材质舒适，版型显瘦，强烈推荐！', topics: ['穿搭', '时尚'] },
      { title: '美食探店｜这家店太好吃了', content: '今天去了这家新开的餐厅，菜品真的太棒了，环境也很有氛围感！', topics: ['美食', '探店'] },
      { title: '旅行日记｜云南太美了', content: '终于来到了心心念念的云南，蓝天白云，风景如画，太治愈了！', topics: ['旅行', '云南'] },
      { title: '护肤心得分享', content: '用了这款精华液一个月，皮肤真的有明显改善，分享给大家！', topics: ['护肤', '美妆'] },
      { title: '居家好物推荐', content: '最近入手了几件家居好物，提升生活幸福感，性价比超高！', topics: ['家居', '好物推荐'] },
      { title: '健身打卡第30天', content: '坚持健身一个月了，体型变化明显，继续加油！', topics: ['健身', '打卡'] },
      { title: '宠物日常｜我家狗狗太可爱了', content: '分享我家狗狗的日常，真的是个小天使！', topics: ['宠物', '萌宠'] },
      { title: '学习笔记｜高效学习方法', content: '总结了一些高效学习的方法，希望对大家有帮助！', topics: ['学习', '职场'] }
    ];

    for (let i = 0; i < noteContents.length; i++) {
      const note = noteContents[i];
      const images = JSON.stringify([
        `https://picsum.photos/600/800?random=${Math.random()}`,
        `https://picsum.photos/600/800?random=${Math.random()}`
      ]);
      
      await run(
        'INSERT INTO notes (user_id, title, content, images, likes_count, comments_count, collects_count, views_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          (i % 10) + 1,
          note.title,
          note.content,
          images,
          Math.floor(Math.random() * 500),
          Math.floor(Math.random() * 50),
          Math.floor(Math.random() * 200),
          Math.floor(Math.random() * 2000)
        ]
      );
    }

    console.log('Creating sample topics...');
    const topics = ['穿搭', '美食', '旅行', '护肤', '彩妆', '健身', '家居', '宠物', '学习', '职场'];
    for (const topic of topics) {
      try {
        await run('INSERT INTO topics (name, notes_count) VALUES (?, ?)', [topic, Math.floor(Math.random() * 1000)]);
      } catch (e) {}
    }

    console.log('Sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

module.exports = { initSampleData };
