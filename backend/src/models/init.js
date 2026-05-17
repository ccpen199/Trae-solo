const bcrypt = require('bcryptjs');
const { exec, run, get } = require('../utils/db');
const path = require('path');
const fs = require('fs');

const initDB = async () => {
  try {
    console.log('开始初始化数据库...');

    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    await exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE,
        password TEXT NOT NULL,
        nickname TEXT,
        avatar TEXT,
        is_vip INTEGER DEFAULT 0,
        vip_expire_at TEXT,
        third_party_platform TEXT,
        third_party_openid TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT,
        cover TEXT,
        description TEXT,
        category_id INTEGER,
        is_free INTEGER DEFAULT 1,
        status INTEGER DEFAULT 1,
        borrow_count INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        publisher TEXT,
        publish_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        chapter_order INTEGER NOT NULL,
        word_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS borrow_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        borrow_date TEXT DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT,
        return_date TEXT,
        status INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS reading_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        chapter_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        last_read_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        chapter_id INTEGER NOT NULL,
        chapter_title TEXT,
        progress INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        chapter_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        highlight_text TEXT,
        progress INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      );

      CREATE TABLE IF NOT EXISTS cloud_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        added_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        keyword TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        cover TEXT,
        book_count INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image TEXT,
        link TEXT,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        reward TEXT,
        progress INTEGER DEFAULT 0,
        target INTEGER DEFAULT 1,
        status INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const existingUser = await get('SELECT id FROM users WHERE username = ?', ['testuser']);
    if (!existingUser) {
      const hashedPassword = bcrypt.hashSync('123456', 10);
      await run(
        'INSERT INTO users (username, phone, password, nickname, is_vip) VALUES (?, ?, ?, ?, ?)',
        ['testuser', '13800138000', hashedPassword, '测试用户', 1]
      );
      console.log('测试用户创建成功: testuser / 123456');
    }

    const categoryCount = await get('SELECT COUNT(*) as count FROM categories');
    if (categoryCount.count === 0) {
      const categories = [
        { name: '小说' },
        { name: '文学' },
        { name: '历史' },
        { name: '哲学' },
        { name: '科技' },
        { name: '经济' },
        { name: '艺术' },
        { name: '教育' }
      ];

      for (const cat of categories) {
        await run('INSERT INTO categories (name, sort_order) VALUES (?, ?)', 
          [cat.name, categories.indexOf(cat)]);
      }
      console.log('分类数据初始化成功');
    }

    const bookCount = await get('SELECT COUNT(*) as count FROM books');
    if (bookCount.count === 0) {
      const books = [
        {
          title: '红楼梦',
          author: '曹雪芹',
          description: '中国古代章回体长篇小说，中国古典四大名著之一，以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线，展现了封建社会的全景图。',
          category_id: 1,
          is_free: 1,
          chapters: [
            { title: '第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀', content: '此开卷第一回也。作者自云：因曾历过一番梦幻之后，故将真事隐去，而借"通灵"之说，撰此《石头记》一书也。故曰"甄士隐"云云。但书中所记何事何人？自又云："今风尘碌碌，一事无成，忽念及当日所有之女子，一一细考较去，觉其行止见识，皆出于我之上。何我堂堂须眉，诚不若彼裙钗哉？实愧则有余，悔又无益之大无可如何之日也！"' },
            { title: '第二回 贾夫人仙逝扬州城 冷子兴演说荣国府', content: '且说封氏闻听此言，忙劝解道："既有这等事，且不必悲伤。如今可作速料理要紧。"因此起身，与士隐料理丧事。一面打发人四处寻访女儿下落，俱无音信。士隐只得将就。荣府中上下安好，合家欢乐，自不必说。' },
            { title: '第三回 贾雨村夤缘复旧职 林黛玉抛父进京都', content: '却说雨村忙回头看时，不是别人，乃是当日同僚一案参革的号张如圭者。他本系此地人，革后家居，今打听得都中奏准起复旧员之信，他便四下里寻情找门路，忽遇见雨村，故忙道喜。' }
          ]
        },
        {
          title: '西游记',
          author: '吴承恩',
          description: '中国古代第一部浪漫主义章回体长篇神魔小说，主要描写了孙悟空出世及大闹天宫后，遇见了唐僧、猪八戒、沙僧和白龙马，西行取经，一路上历经艰险、降妖伏魔，经历了九九八十一难，终于到达西天见到如来佛祖，最终五圣成真的故事。',
          category_id: 1,
          is_free: 1,
          chapters: [
            { title: '第一回 灵根育孕源流出 心性修持大道生', content: '诗曰：混沌未分天地乱，茫茫渺渺无人见。自从盘古破鸿蒙，开辟从兹清浊辨。覆载群生仰至仁，发明万物皆成善。欲知造化会元功，须看西游释厄传。' },
            { title: '第二回 悟彻菩提真妙理 断魔归本合元神', content: '话表美猴王得了姓名，怡然踊跃，对菩提前作礼启谢。那祖师即命大众引孙悟空出二门外，教他洒扫应对，进退周旋之节。众仙奉行而出。悟空到门外，又拜了大众师兄，就于廊庑之间，安排寝处。' },
            { title: '第三回 四海千山皆拱伏 九幽十类尽除名', content: '话表美猴王荣归故里，自剿了混世魔王，夺了一口大刀，逐日操演武艺，教小猴砍竹为标，削木为刀，治旗幡，打哨子，一进一退，安营下寨。顽耍多时。' }
          ]
        },
        {
          title: '三国演义',
          author: '罗贯中',
          description: '中国古典四大名著之一，是中国第一部长篇章回体历史演义小说，描写了从东汉末年到西晋初年之间近百年的历史风云，以描写战争为主，讲述了东汉末年的群雄割据混战及魏、蜀、吴三国之间的政治和军事斗争。',
          category_id: 3,
          is_free: 1,
          chapters: [
            { title: '第一回 宴桃园豪杰三结义 斩黄巾英雄首立功', content: '话说天下大势，分久必合，合久必分。周末七国分争，并入于秦。及秦灭之后，楚汉分争，又并入于汉。汉朝自高祖斩白蛇而起义，一统天下，后来光武中兴，传至献帝，遂分为三国。' },
            { title: '第二回 张翼德怒鞭督邮 何国舅谋诛宦竖', content: '且说董卓字仲颖，陇西临洮人也，官拜河东太守，自来骄傲。当日怠慢了玄德，张飞性发，便欲杀之。玄德与关公急止之曰："他是朝廷命官，岂可擅杀？"飞曰："若不杀这厮，反要在他部下听令，其实不甘！"' },
            { title: '第三回 议温明董卓叱丁原 馈金珠李肃说吕布', content: '且说曹操当日对何进曰："宦官之祸，古今皆有；但世主不当假之权宠，使至于此。若欲治罪，当除元恶，但付一狱吏足矣，何必纷纷召外兵乎？欲尽诛之，事必宣露。吾料其必败也。"' }
          ]
        },
        {
          title: '水浒传',
          author: '施耐庵',
          description: '中国古典四大名著之一，全书通过描写梁山好汉反抗欺压、水泊梁山壮大和受招安，以及受招安后为宋朝征战，最终消亡的宏大故事，艺术地反映了中国历史上宋江起义从发生、发展直至失败的全过程。',
          category_id: 3,
          is_free: 1,
          chapters: [
            { title: '第一回 张天师祈禳瘟疫 洪太尉误走妖魔', content: '话说大宋仁宗天子在位，嘉祐三年三月三日五更三点，天子驾坐紫宸殿，受百官朝贺。但见：祥云迷凤阁，瑞气罩龙楼。含烟御柳拂旌旗，带露宫花迎剑戟。' },
            { title: '第二回 王教头私走延安府 九纹龙大闹史家村', content: '话说当时史进道："却怎生是好？"朱武等三个头领，跪在地下，那个开口道："小人等年幼时，也曾读过书来，为因科举不第，遂绝了功名之念。"' },
            { title: '第三回 史大郎夜走华阴县 鲁提辖拳打镇关西', content: '且说三人饮了数杯，正说些闲话，较量些枪法，说得入港，只听得隔壁阁子里有人哽哽咽咽啼哭。鲁达焦躁，便把碟儿盏儿都丢在楼板上。' }
          ]
        },
        {
          title: '活着',
          author: '余华',
          description: '讲述了农村人福贵悲惨的人生遭遇。福贵本是个阔少爷，可他嗜赌如命，终于赌光了家业。他的父亲被他活活气死，母亲则在穷困中患了重病，福贵前去求药，却在途中被国民党抓去当壮丁。',
          category_id: 2,
          is_free: 1,
          chapters: [
            { title: '第一章', content: '我比现在年轻十岁的时候，获得了一个游手好闲的职业，去乡间收集民间歌谣。那一年的整个夏天，我如同一只乱飞的麻雀，游荡在知了和阳光充斥的农村。' },
            { title: '第二章', content: '福贵是我遇到的第一个人，那时候我还没有现在这么老，我那时候刚刚四十出头，头发还没有白，眼睛还能看得很远。' },
            { title: '第三章', content: '福贵年轻时是个地主少爷，喜欢往城里跑，常常十天半个月不回家。他娘说他是被狐狸精迷住了，他爹说他是个败家子。' }
          ]
        },
        {
          title: '平凡的世界',
          author: '路遥',
          description: '以中国70年代中期到80年代中期十年间为背景，以孙少安和孙少平两兄弟为中心，通过复杂的矛盾纠葛，刻画了当时社会各阶层众多普通人的形象，展示了普通人在大时代历史进程中所走过的艰难曲折的道路。',
          category_id: 2,
          is_free: 1,
          chapters: [
            { title: '第一部 第一章', content: '一九七五年二三月间，一个平平常常的日子，细濛濛的雨丝夹着一星半点的雪花，正纷纷淋淋地向大地飘洒着。' },
            { title: '第一部 第二章', content: '时令已快到惊蛰，雪当然再不会存留，往往还没等落地，就已经消失得无踪无影了。' },
            { title: '第一部 第三章', content: '黄土高原严寒而漫长的冬天看来就要过去，但那真正温暖的春天还远远地没有到来。' }
          ]
        },
        {
          title: '三体',
          author: '刘慈欣',
          description: '作品讲述了地球人类文明和三体文明的信息交流、生死搏杀及两个文明在宇宙中的兴衰历程。',
          category_id: 5,
          is_free: 1,
          chapters: [
            { title: '第一章 科学边界', content: '汪淼没有想到自己会被卷入这样一个巨大的阴谋之中，一切都始于那个普通的下午。' },
            { title: '第二章 台球', content: '这是汪淼第一次见到丁仪，也是他人生的转折点。两位物理学家在台球桌前进行了一场改变命运的对话。' },
            { title: '第三章 射手和农场主', content: '"射手"假说：有一名神枪手，在一个靶子上每隔十厘米打一个洞。设想这个靶子的平面上生活着一种二维智能生物。' }
          ]
        },
        {
          title: '百年孤独',
          author: '加西亚·马尔克斯',
          description: '描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰，反映了拉丁美洲一个世纪以来风云变幻的历史。',
          category_id: 2,
          is_free: 1,
          chapters: [
            { title: '第一章', content: '多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。' },
            { title: '第二章', content: '那时的马孔多是一个有二十户人家的村落，用泥巴和芦苇盖的房屋就排列在一条河边。' },
            { title: '第三章', content: '世界新生伊始，许多事物还没有名字，提到的时候尚需用手指指点点。' }
          ]
        }
      ];

      for (const book of books) {
        const result = await run(
          'INSERT INTO books (title, author, description, category_id, is_free, borrow_count, word_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [book.title, book.author, book.description, book.category_id, book.is_free, 0, 0]
        );
        
        const bookId = result.lastID;
        
        if (book.chapters && book.chapters.length > 0) {
          for (let i = 0; i < book.chapters.length; i++) {
            const chapter = book.chapters[i];
            await run(
              'INSERT INTO chapters (book_id, title, content, chapter_order, word_count) VALUES (?, ?, ?, ?, ?)',
              [bookId, chapter.title, chapter.content, i + 1, chapter.content?.length || 0]
            );
          }
        }
      }
      console.log('书籍数据初始化成功，共添加 ' + books.length + ' 本书');
    }

    console.log('数据库初始化完成！');
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
};

module.exports = initDB;
