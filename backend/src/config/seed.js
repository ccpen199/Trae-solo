const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = () => {
  console.log('开始填充示例数据...');

  const hashedPassword = bcrypt.hashSync('123456', 10);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (phone, email, username, password, avatar, role)
      VALUES 
        ('13800138001', 'designer1@example.com', '设计师小王', ?, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20interior%20designer%20portrait%20headshot&image_size=square', 'designer'),
        ('13800138002', 'seller1@example.com', '家具商家A', ?, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20furniture%20seller%20portrait%20headshot&image_size=square', 'seller'),
        ('13800138003', 'user1@example.com', '装修业主小李', ?, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20couple%20homeowner%20portrait%20friendly&image_size=square', 'user')
    `).run(hashedPassword, hashedPassword, hashedPassword);

    const furnitureData = [
      {
        name: '北欧简约布艺沙发',
        description: '精选优质面料，高密度海绵填充，人体工学设计，坐感舒适。可拆卸外套，易于清洁保养。适合北欧、简约、现代等多种家居风格。',
        price: 3999,
        original_price: 5999,
        category: '沙发',
        style: '北欧',
        space_type: '客厅',
        material: '布艺',
        color: '浅灰色',
        dimensions: '220cm x 95cm x 85cm',
        weight: 85,
        brand: '宜家家居',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=light%20gray%20nordic%20fabric%20sofa%20modern%20minimalist%20living%20room&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20sofa%20detail%20fabric%20texture%20close%20up&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20living%20room%20with%20gray%20sofa%20and%20coffee%20table&image_size=landscape_4_3'
        ]),
        rating: 4.8,
        review_count: 256,
        favorite_count: 1203
      },
      {
        name: '现代简约实木餐桌',
        description: '进口北美黑胡桃木，天然木纹美观大方。圆角设计，安全贴心。可容纳6-8人同时用餐，适合家庭聚会。',
        price: 6888,
        original_price: 8888,
        category: '餐桌',
        style: '现代简约',
        space_type: '餐厅',
        material: '实木',
        color: '胡桃木色',
        dimensions: '160cm x 90cm x 75cm',
        weight: 120,
        brand: '源氏木语',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20solid%20wood%20dining%20table%20walnut%20finish%20minimalist&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wood%20grain%20texture%20detail%20furniture%20close%20up&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20dining%20room%20with%20wooden%20table%20and%20chairs&image_size=landscape_4_3'
        ]),
        rating: 4.9,
        review_count: 189,
        favorite_count: 876
      },
      {
        name: '日式榻榻米床架',
        description: '传统日式设计，低矮床架，储物空间大。采用环保板材，无异味，安全健康。适合小户型和喜欢日式风格的家庭。',
        price: 2999,
        original_price: 3999,
        category: '床',
        style: '日式',
        space_type: '卧室',
        material: '板式',
        color: '原木色',
        dimensions: '180cm x 200cm x 35cm',
        weight: 95,
        brand: '无印良品',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20tatami%20bed%20frame%20low%20platform%20minimalist&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tatami%20bed%20storage%20drawers%20under%20bed%20detail&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=zen%20style%20japanese%20bedroom%20minimalist%20peaceful&image_size=landscape_4_3'
        ]),
        rating: 4.7,
        review_count: 312,
        favorite_count: 1543
      },
      {
        name: '美式乡村真皮单人沙发',
        description: '头层牛皮，质感细腻。复古铆钉装饰，美式乡村风情。高靠背设计，支撑性好，适合阅读放松。',
        price: 5888,
        original_price: 7888,
        category: '沙发',
        style: '美式乡村',
        space_type: '客厅',
        material: '真皮',
        color: '深棕色',
        dimensions: '95cm x 105cm x 110cm',
        weight: 68,
        brand: 'Harbor House',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=american%20country%20style%20genuine%20leather%20armchair%20dark%20brown&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20armchair%20rivet%20details%20craftsmanship&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20reading%20corner%20with%20leather%20armchair%20and%20floor%20lamp&image_size=landscape_4_3'
        ]),
        rating: 4.6,
        review_count: 98,
        favorite_count: 432
      },
      {
        name: '意式轻奢大理石茶几',
        description: '天然大理石台面，纹理独特。不锈钢镀金支架，轻奢质感。圆润边角设计，美观安全。',
        price: 4588,
        original_price: 5988,
        category: '茶几',
        style: '意式轻奢',
        space_type: '客厅',
        material: '大理石',
        color: '白色',
        dimensions: '120cm x 60cm x 45cm',
        weight: 75,
        brand: '美克美家',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=italian%20luxury%20marble%20coffee%20table%20gold%20stainless%20steel%20legs&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20marble%20table%20top%20natural%20veins%20texture&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20modern%20living%20room%20marble%20coffee%20table%20elegant&image_size=landscape_4_3'
        ]),
        rating: 4.9,
        review_count: 67,
        favorite_count: 321
      },
      {
        name: '北欧简约书柜组合',
        description: '模块化设计，可自由组合。开放式与封闭式结合，满足不同收纳需求。环保板材，无异味。',
        price: 3288,
        original_price: 4288,
        category: '柜子',
        style: '北欧',
        space_type: '书房',
        material: '板式',
        color: '白色',
        dimensions: '240cm x 30cm x 200cm',
        weight: 150,
        brand: '宜家家居',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20minimalist%20white%20bookshelf%20combination%20modular&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bookshelf%20with%20books%20and%20decorations%20stylish&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20home%20office%20with%20white%20bookshelf%20and%20desk&image_size=landscape_4_3'
        ]),
        rating: 4.8,
        review_count: 145,
        favorite_count: 654
      }
    ];

    const furnitureStmt = db.prepare(`
      INSERT OR IGNORE INTO furniture 
      (name, description, price, original_price, category, style, space_type, material, color, dimensions, weight, brand, images, rating, review_count, favorite_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    furnitureData.forEach(item => {
      furnitureStmt.run(
        item.name, item.description, item.price, item.original_price,
        item.category, item.style, item.space_type, item.material,
        item.color, item.dimensions, item.weight, item.brand,
        item.images, item.rating, item.review_count, item.favorite_count
      );
    });

    const articleData = [
      {
        title: '2024年家居装修趋势分析：从极简主义到自然回归',
        content: '随着人们对生活品质的不断追求，2024年的家居装修风格正在发生显著变化。本文将从以下几个方面深入分析今年的装修趋势：\n\n## 一、自然元素的大量运用\n\n木材、石材、绿植等自然元素正在成为装修的主流选择。这些元素不仅能够营造出温馨舒适的氛围，还能有效改善室内空气质量。\n\n## 二、色彩搭配的新变化\n\n今年的色彩趋势更加偏向于柔和的大地色系和莫兰迪色系。这些色彩能够给人带来宁静放松的感觉，非常适合现代都市人的生活节奏。\n\n## 三、功能性与美观性的完美结合\n\n现代家居不再只追求美观，功能性同样重要。多功能家具、智能收纳系统正在越来越多地出现在家庭中。\n\n## 四、可持续发展理念的融入\n\n环保材料、可回收家具正在成为消费者的首选。这不仅是一种时尚，更是一种对未来负责的生活态度。',
        cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20home%20interior%20design%20trends%202024%20natural%20elements&image_size=landscape_16_9',
        author_id: 1,
        category: '装修攻略',
        tags: JSON.stringify(['装修趋势', '自然风格', '环保材料']),
        views: 12580,
        likes: 892,
        comment_count: 156
      },
      {
        title: '小户型装修必备：10个让空间显大的实用技巧',
        content: '对于很多居住在城市的年轻人来说，小户型是他们的首选。如何在有限的空间里创造出无限的可能？这里有10个实用技巧分享给大家：\n\n## 1. 选用浅色调\n\n浅色调能够让空间看起来更加明亮宽敞。建议墙面选择白色、米色或浅灰色。\n\n## 2. 利用镜子\n\n镜子是小户型装修的神器。一面大镜子可以让空间视觉上扩大一倍。\n\n## 3. 选择多功能家具\n\n沙发床、折叠桌、带储物功能的床架都是不错的选择。\n\n## 4. 墙面收纳\n\n充分利用墙面空间，安装书架、置物架等。\n\n## 5. 保持整洁\n\n杂乱会让空间显得更小。养成及时整理的好习惯。\n\n## 6. 通透的隔断\n\n如果需要隔断，选择玻璃或通透的材质，不要用实体墙。\n\n## 7. 统一的色彩\n\n整个空间色彩要统一，避免过多的颜色造成视觉混乱。\n\n## 8. 适当的留白\n\n不要把空间塞得太满，适当的留白也是一种美。\n\n## 9. 利用光线\n\n充足的光线能让空间显得更大。尽量不要遮挡窗户。\n\n## 10. 定制家具\n\n根据空间尺寸定制家具，能够最大限度地利用每一寸空间。',
        cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20apartment%20interior%20design%20space%20saving%20ideas%20minimalist&image_size=landscape_16_9',
        author_id: 1,
        category: '装修攻略',
        tags: JSON.stringify(['小户型', '空间利用', '装修技巧']),
        views: 28950,
        likes: 2341,
        comment_count: 428
      },
      {
        title: '如何选择适合自己的沙发：材质、尺寸、风格全攻略',
        content: '沙发是客厅的核心家具，选择一款合适的沙发能够大大提升生活品质。本文将从材质、尺寸、风格三个方面详细介绍如何选购沙发。\n\n## 一、材质选择\n\n### 布艺沙发\n优点：舒适、款式多、价格适中、可拆洗\n缺点：容易脏、需要定期清洁\n适合：有小孩、宠物的家庭\n\n### 真皮沙发\n优点：高档、耐用、易清洁\n缺点：价格高、需要保养\n适合：追求品质的家庭\n\n### 科技布沙发\n优点：易清洁、耐磨、价格适中\n缺点：透气性一般\n适合：年轻家庭\n\n## 二、尺寸选择\n\n根据客厅面积选择合适的尺寸：\n- 小户型（15-25㎡）：三人位或两人位+贵妃\n- 中等户型（25-40㎡）：L型或组合式\n- 大户型（40㎡以上）：U型或多组沙发\n\n## 三、风格搭配\n\n- 北欧风格：浅色布艺、线条简洁\n- 现代简约：造型简单、色彩明快\n- 美式风格：宽大舒适、真皮或布艺\n- 中式风格：实木框架、布艺坐垫',
        cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=various%20sofa%20styles%20fabric%20leather%20modern%20living%20room&image_size=landscape_16_9',
        author_id: 2,
        category: '家具选购',
        tags: JSON.stringify(['沙发选购', '家具知识', '材质对比']),
        views: 8670,
        likes: 523,
        comment_count: 89
      }
    ];

    const articleStmt = db.prepare(`
      INSERT OR IGNORE INTO articles 
      (title, content, cover_image, author_id, category, tags, views, likes, comment_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    articleData.forEach(item => {
      articleStmt.run(
        item.title, item.content, item.cover_image, item.author_id,
        item.category, item.tags, item.views, item.likes, item.comment_count
      );
    });

    const spaceData = [
      {
        name: '北欧风格客厅空间搭配',
        description: '简洁明快的北欧风格客厅，以白色和浅木色为主色调，搭配绿色植物点缀，营造出温馨舒适的居家氛围。',
        space_type: '客厅',
        style: '北欧',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20style%20living%20room%20white%20light%20wood%20green%20plants%20cozy&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20living%20room%20detail%20cushions%20plants%20natural%20light&image_size=landscape_4_3'
        ]),
        designer_id: 1,
        views: 5680,
        favorite_count: 234
      },
      {
        name: '现代简约主卧设计',
        description: '简约不简单的主卧空间，以功能性为核心，兼顾美观与实用。低饱和度色彩搭配，营造宁静睡眠环境。',
        space_type: '卧室',
        style: '现代简约',
        images: JSON.stringify([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20master%20bedroom%20calm%20colors%20serene%20sleeping%20space&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bedroom%20nightstand%20lamp%20detail%20warm%20lighting%20cozy&image_size=landscape_4_3'
        ]),
        designer_id: 1,
        views: 4230,
        favorite_count: 187
      }
    ];

    const spaceStmt = db.prepare(`
      INSERT OR IGNORE INTO spaces 
      (name, description, space_type, style, images, designer_id, views, favorite_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    spaceData.forEach(item => {
      spaceStmt.run(
        item.name, item.description, item.space_type, item.style,
        item.images, item.designer_id, item.views, item.favorite_count
      );
    });

    const questionData = [
      {
        title: '新房装修先买家具还是先装修？',
        content: '最近准备装修新房，很纠结是先确定家具风格再装修，还是先装修再买家具？有没有过来人给点经验分享？',
        user_id: 3,
        category: '装修咨询',
        tags: JSON.stringify(['装修顺序', '家具选购']),
        views: 3450,
        answer_count: 23
      },
      {
        title: '真皮沙发和布艺沙发哪个更适合有小孩的家庭？',
        content: '家里有个3岁的宝宝，经常会在沙发上吃东西、画画。想问问大家，真皮沙发和布艺沙发哪个更耐脏、更好打理？',
        user_id: 3,
        category: '家具选购',
        tags: JSON.stringify(['沙发', '儿童家庭', '清洁维护']),
        views: 2890,
        answer_count: 45
      }
    ];

    const questionStmt = db.prepare(`
      INSERT OR IGNORE INTO questions 
      (title, content, user_id, category, tags, views, answer_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    questionData.forEach(item => {
      questionStmt.run(
        item.title, item.content, item.user_id, item.category,
        item.tags, item.views, item.answer_count
      );
    });

    console.log('示例数据填充完成！');
    console.log('');
    console.log('测试账号信息：');
    console.log('设计师：手机号 13800138001，密码 123456');
    console.log('商家：手机号 13800138002，密码 123456');
    console.log('用户：手机号 13800138003，密码 123456');
  } catch (error) {
    console.error('填充数据时出错:', error);
  }
};

module.exports = seedDatabase;
