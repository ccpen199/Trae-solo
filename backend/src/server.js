require('dotenv').config();
const app = require('./app');
const { sequelize, User, Channel, Book, Comment, Library, Activity } = require('./models');

const PORT = process.env.PORT || 12266;

const seedDatabase = async () => {
  console.log('Seeding initial data...');

  const users = await User.bulkCreate([
    {
      username: 'admin',
      email: 'admin@reader.com',
      password: 'admin123',
      nickname: '管理员',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20chinese%20administrator%20in%20office&image_size=square_hd',
      bio: '读书人频道管理员',
      role: 'admin'
    },
    {
      username: 'reader1',
      email: 'reader1@reader.com',
      password: 'reader123',
      nickname: '读书爱好者',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20chinese%20woman%20reading%20book%20in%20sunlight&image_size=square_hd',
      bio: '热爱阅读，喜欢分享'
    },
    {
      username: 'booklover',
      email: 'booklover@reader.com',
      password: 'lover123',
      nickname: '书虫一枚',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20man%20with%20glasses%20surrounded%20by%20books&image_size=square_hd',
      bio: '藏书千卷，阅读一生'
    }
  ], { returning: true });

  const channels = await Channel.bulkCreate([
    {
      name: '经典文学',
      slug: 'classic-literature',
      description: '探索中外经典文学作品，品味文学巨匠的文字魅力',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20literature%20books%20arrangement%20with%20old%20library%20background&image_size=square_hd',
      type: 'original',
      isFeatured: true,
      isHot: true,
      tags: ['经典', '文学', '名著'],
      sortOrder: 1,
      creatorId: users[0].id
    },
    {
      name: '科幻世界',
      slug: 'sci-fi-world',
      description: '探索未来世界，体验科幻小说的无限想象',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20space%20exploration%20with%20stars%20and%20spaceships&image_size=square_hd',
      type: 'original',
      isFeatured: true,
      isHot: true,
      tags: ['科幻', '未来', '想象'],
      sortOrder: 2,
      creatorId: users[0].id
    },
    {
      name: '历史探秘',
      slug: 'history-explore',
      description: '穿越时空，了解历史人物与事件的真实故事',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20history%20scroll%20with%20ink%20painting%20style&image_size=square_hd',
      type: 'original',
      isFeatured: false,
      isHot: true,
      tags: ['历史', '人文', '传记'],
      sortOrder: 3,
      creatorId: users[1].id
    },
    {
      name: '推理悬疑',
      slug: 'mystery-thriller',
      description: '跟随侦探们一起解开层层迷雾，探寻真相',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mysterious%20dark%20library%20with%20secret%20books%20and%20candlelight&image_size=square_hd',
      type: 'original',
      isFeatured: true,
      isHot: false,
      tags: ['推理', '悬疑', '侦探'],
      sortOrder: 4,
      creatorId: users[2].id
    },
    {
      name: '推荐书单',
      slug: 'recommended-books',
      description: '精选优质书单，发现你的下一本好书',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20book%20collection%20arrangement%20in%20cozy%20reading%20nook&image_size=square_hd',
      type: 'recommend',
      isFeatured: true,
      isHot: true,
      tags: ['推荐', '书单', '精选'],
      sortOrder: 5,
      creatorId: users[0].id
    }
  ], { returning: true });

  const books = await Book.bulkCreate([
    {
      title: '百年孤独',
      slug: 'one-hundred-years-of-solitude',
      subtitle: '加西亚·马尔克斯代表作',
      author: '加西亚·马尔克斯',
      translator: '范晔',
      publisher: '南海出版公司',
      publishDate: '2011-06-01',
      isbn: '9787544253994',
      pages: 360,
      price: 39.50,
      binding: 'hardcover',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20design%20for%20one%20hundred%20years%20of%20solitude%20with%20yellow%20butterflies&image_size=square_hd',
      description: '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
      authorInfo: '加夫列尔·加西亚·马尔克斯，哥伦比亚作家，1982年诺贝尔文学奖得主。',
      tags: ['魔幻现实主义', '经典', '拉美文学'],
      category: '外国文学',
      rating: 4.8,
      ratingCount: 1256,
      reviewCount: 345,
      likeCount: 2156,
      collectCount: 3456,
      readCount: 8956,
      isFeatured: true,
      isHot: true,
      isNew: false,
      creatorId: users[0].id
    },
    {
      title: '三体',
      slug: 'the-three-body-problem',
      subtitle: '刘慈欣科幻巨作',
      author: '刘慈欣',
      publisher: '重庆出版社',
      publishDate: '2008-01-01',
      isbn: '9787536692930',
      pages: 302,
      price: 23.00,
      binding: 'paperback',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20book%20cover%20with%20three%20glowing%20suns%20and%20space%20nebula&image_size=square_hd',
      description: '《三体》是刘慈欣创作的系列长篇科幻小说，是中国科幻文学的里程碑之作。',
      authorInfo: '刘慈欣，中国当代科幻作家，被誉为"中国当代科幻第一人"。',
      tags: ['科幻', '硬科幻', '宇宙'],
      category: '科幻小说',
      rating: 4.9,
      ratingCount: 2345,
      reviewCount: 567,
      likeCount: 4567,
      collectCount: 6789,
      readCount: 15678,
      isFeatured: true,
      isHot: true,
      isNew: false,
      creatorId: users[1].id
    },
    {
      title: '人类简史',
      slug: 'sapiens-a-brief-history-of-humankind',
      subtitle: '从动物到上帝',
      author: '尤瓦尔·赫拉利',
      translator: '林俊宏',
      publisher: '中信出版社',
      publishDate: '2014-11-01',
      isbn: '9787508647357',
      pages: 440,
      price: 68.00,
      binding: 'hardcover',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=historical%20book%20cover%20with%20human%20evolution%20timeline%20and%20ancient%20civilizations&image_size=square_hd',
      description: '《人类简史》以独特的视角审视人类历史，讲述智人如何登上食物链顶端。',
      authorInfo: '尤瓦尔·赫拉利，以色列青年历史学家，牛津大学历史学博士。',
      tags: ['历史', '人类学', '哲学'],
      category: '历史科普',
      rating: 4.7,
      ratingCount: 1876,
      reviewCount: 432,
      likeCount: 3456,
      collectCount: 5432,
      readCount: 12345,
      isFeatured: true,
      isHot: true,
      isNew: false,
      creatorId: users[0].id
    },
    {
      title: '活着',
      slug: 'to-live',
      author: '余华',
      publisher: '作家出版社',
      publishDate: '2012-08-01',
      isbn: '9787506365437',
      pages: 191,
      price: 20.00,
      binding: 'paperback',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literature%20book%20cover%20with%20old%20man%20and%20ox%20in%20rural%20landscape&image_size=square_hd',
      description: '《活着》讲述了农村人福贵悲惨的人生遭遇，展现了一个人和他命运之间的友情。',
      authorInfo: '余华，中国当代作家，其作品已被翻译成20多种语言。',
      tags: ['当代文学', '现实', '人生'],
      category: '中国当代',
      rating: 4.8,
      ratingCount: 1567,
      reviewCount: 398,
      likeCount: 2876,
      collectCount: 4321,
      readCount: 9876,
      isFeatured: true,
      isHot: false,
      isNew: false,
      creatorId: users[2].id
    },
    {
      title: '解忧杂货店',
      slug: 'mirai-ya',
      author: '东野圭吾',
      translator: '李盈春',
      publisher: '南海出版公司',
      publishDate: '2014-05-01',
      isbn: '9787544270878',
      pages: 291,
      price: 39.50,
      binding: 'hardcover',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20mystery%20book%20cover%20with%20cozy%20grocery%20store%20and%20warm%20lights&image_size=square_hd',
      description: '《解忧杂货店》讲述了在僻静街道旁的一家杂货店，只要写下烦恼投进店前门卷帘门的投信口，第二天就会在店后的牛奶箱里得到回答。',
      authorInfo: '东野圭吾，日本推理小说作家，其作品多被影视化。',
      tags: ['温情', '治愈', '日本文学'],
      category: '日本文学',
      rating: 4.6,
      ratingCount: 1432,
      reviewCount: 321,
      likeCount: 2543,
      collectCount: 3876,
      readCount: 8765,
      isFeatured: false,
      isHot: true,
      isNew: false,
      creatorId: users[1].id
    },
    {
      title: '小王子',
      slug: 'the-little-prince',
      subtitle: '献给所有曾经是孩子的大人',
      author: '安托万·德·圣埃克苏佩里',
      translator: '李继宏',
      publisher: '天津人民出版社',
      publishDate: '2013-01-01',
      isbn: '9787201077642',
      pages: 97,
      price: 32.00,
      binding: 'hardcover',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=childrens%20book%20cover%20with%20little%20prince%20and%20fox%20on%20small%20planet%20among%20stars&image_size=square_hd',
      description: '《小王子》是法国作家安托万·德·圣埃克苏佩里于1942年写成的著名儿童文学短篇小说。',
      authorInfo: '安托万·德·圣埃克苏佩里，法国作家、飞行员。',
      tags: ['童话', '哲理', '经典'],
      category: '外国文学',
      rating: 4.7,
      ratingCount: 1987,
      reviewCount: 456,
      likeCount: 3210,
      collectCount: 5678,
      readCount: 13456,
      isFeatured: true,
      isHot: false,
      isNew: false,
      creatorId: users[0].id
    }
  ], { returning: true });

  await Channel.bulkCreate([
    {
      name: '热门话题',
      slug: 'hot-topics',
      description: '分享热门阅读话题，参与读书讨论',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=people%20discussing%20books%20in%20cozy%20cafe%20with%20warm%20lighting&image_size=square_hd',
      type: 'topic',
      isFeatured: true,
      isHot: true,
      tags: ['话题', '讨论', '分享'],
      sortOrder: 6,
      creatorId: users[0].id
    }
  ]);

  const libraries = await Library.bulkCreate([
    {
      name: '国家图书馆',
      slug: 'national-library',
      type: 'public',
      description: '中国国家图书馆是国家总书库，国家古籍保护中心。',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=magnificent%20national%20library%20building%20with%20grand%20architecture%20and%20modern%20design&image_size=square_hd',
      address: '北京市海淀区中关村南大街33号',
      city: '北京',
      province: '北京市',
      country: '中国',
      phone: '010-88545426',
      website: 'https://www.nlc.cn',
      facilities: ['WiFi', '免费茶水', '自习室', '电子阅览室', '残障设施'],
      tags: ['国家图书馆', '公共图书馆', '北京'],
      bookCount: 50000,
      followerCount: 1256,
      rating: 4.8,
      ratingCount: 345,
      reviewCount: 89,
      isFeatured: true,
      isHot: true,
      creatorId: users[0].id
    },
    {
      name: '北京大学图书馆',
      slug: 'pku-library',
      type: 'university',
      description: '北京大学图书馆是中国最早的现代图书馆之一。',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=prestigious%20university%20library%20with%20classic%20architecture%20and%20beautiful%20study%20halls&image_size=square_hd',
      address: '北京市海淀区颐和园路5号',
      city: '北京',
      province: '北京市',
      country: '中国',
      phone: '010-62751052',
      website: 'https://www.lib.pku.edu.cn',
      facilities: ['WiFi', '自习室', '电子阅览室', '咖啡厅', '研讨室'],
      tags: ['高校图书馆', '北京大学', '211工程'],
      bookCount: 30000,
      followerCount: 876,
      rating: 4.7,
      ratingCount: 234,
      reviewCount: 56,
      isFeatured: true,
      isHot: true,
      creatorId: users[0].id
    },
    {
      name: '上海图书馆',
      slug: 'shanghai-library',
      type: 'public',
      description: '上海图书馆是大型研究型公共图书馆，馆藏丰富。',
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20shanghai%20public%20library%20building%20with%20stunning%20interior%20and%20city%20view&image_size=square_hd',
      address: '上海市徐汇区淮海中路1555号',
      city: '上海',
      province: '上海市',
      country: '中国',
      phone: '021-64455555',
      website: 'https://www.library.sh.cn',
      facilities: ['WiFi', '免费茶水', '自习室', '电子阅览室', '展览厅'],
      tags: ['公共图书馆', '上海', '研究型'],
      bookCount: 45000,
      followerCount: 987,
      rating: 4.6,
      ratingCount: 198,
      reviewCount: 67,
      isFeatured: false,
      isHot: true,
      creatorId: users[0].id
    }
  ], { returning: true });

  await Comment.bulkCreate([
    {
      content: '《百年孤独》真是一部震撼人心的作品，马尔克斯用魔幻现实主义的手法，展现了一个家族七代人的宿命。布恩迪亚家族的每个人都有着独特的性格，但又似乎被某种无形的力量牵引着。',
      sourceType: 'book',
      sourceId: books[0].id,
      userId: users[1].id,
      rating: 5,
      likeCount: 156,
      replyCount: 23,
      isFeatured: true,
      tags: ['深刻', '魔幻', '家族史诗']
    },
    {
      content: '初读时觉得晦涩难懂，但坚持下来后发现这是一部需要慢慢品味的作品。马尔克斯的文字充满了诗意，每一句话都值得细细咀嚼。',
      sourceType: 'book',
      sourceId: books[0].id,
      userId: users[2].id,
      rating: 4,
      likeCount: 89,
      replyCount: 12,
      isFeatured: false,
      tags: ['需要耐心', '文学经典']
    },
    {
      content: '《三体》让我对科幻小说有了全新的认识。刘慈欣的想象力真的太惊人了，从三体问题到黑暗森林法则，每一个设定都让人深思。',
      sourceType: 'book',
      sourceId: books[1].id,
      userId: users[1].id,
      rating: 5,
      likeCount: 234,
      replyCount: 45,
      isFeatured: true,
      tags: ['硬科幻', '震撼', '宇宙观']
    },
    {
      content: '作为一个科幻迷，这本书让我大开眼界。黑暗森林法则的设定真的太妙了，让人对宇宙文明产生了全新的思考。',
      sourceType: 'book',
      sourceId: books[1].id,
      userId: users[0].id,
      rating: 5,
      likeCount: 178,
      replyCount: 28,
      isFeatured: false,
      tags: ['科幻经典', '硬科幻']
    },
    {
      content: '《人类简史》彻底改变了我对人类历史的认知。赫拉利用独特的视角，让我们看到智人如何通过想象的能力统治这个世界。',
      sourceType: 'book',
      sourceId: books[2].id,
      userId: users[2].id,
      rating: 5,
      likeCount: 145,
      replyCount: 32,
      isFeatured: true,
      tags: ['历史', '人类学', '启迪']
    },
    {
      content: '余华的文字总是那么朴实却又直击人心。《活着》让我在阅读过程中多次落泪，福贵的一生让人心疼但也让人思考活着的意义。',
      sourceType: 'book',
      sourceId: books[3].id,
      userId: users[1].id,
      rating: 5,
      likeCount: 167,
      replyCount: 38,
      isFeatured: true,
      tags: ['深刻', '人生', '感动']
    },
    {
      content: '东野圭吾的这本书不像他其他的推理小说那样充满悬疑，但却充满了温情。杂货店的故事让我相信，善意真的可以改变一个人的人生。',
      sourceType: 'book',
      sourceId: books[4].id,
      userId: users[2].id,
      rating: 4,
      likeCount: 98,
      replyCount: 19,
      isFeatured: false,
      tags: ['温情', '治愈', '非推理']
    }
  ], { returning: true });

  console.log('Seed data created successfully!');
  console.log('Created:', {
    users: users.length,
    channels: channels.length + 1,
    books: books.length,
    libraries: libraries.length,
    comments: 7
  });
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ force: false });
    console.log('Database synchronized.');

    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await seedDatabase();
    } else {
      console.log('Database already has data, skipping seed.');
    }

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  读书人频道后端服务已启动`);
      console.log(`  端口: ${PORT}`);
      console.log(`  环境: ${process.env.NODE_ENV}`);
      console.log(`========================================`);
      console.log(`  API地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
