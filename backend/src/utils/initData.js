const { db, initDatabase } = require('../db');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

function initData() {
  initDatabase();
  console.log('数据库表结构初始化完成');

  const salt = bcrypt.genSaltSync(10);

  db.prepare(`INSERT OR IGNORE INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`).run(
    'admin',
    'admin@cinehub.com',
    bcrypt.hashSync('admin123', salt),
    'admin',
    'active'
  );

  db.prepare(`INSERT OR IGNORE INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`).run(
    'moderator',
    'mod@cinehub.com',
    bcrypt.hashSync('mod123', salt),
    'moderator',
    'active'
  );

  db.prepare(`INSERT OR IGNORE INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`).run(
    'user1',
    'user1@cinehub.com',
    bcrypt.hashSync('user123', salt),
    'user',
    'active'
  );

  console.log('用户数据初始化完成');

  const movies = [
    {
      imdb_id: 'tt1375666',
      tmdb_id: '27205',
      title: '盗梦空间',
      original_title: 'Inception',
      year: 2010,
      release_date: '2010-07-16',
      runtime: 148,
      rating: 8.8,
      vote_count: 2345678,
      genres: JSON.stringify(['科幻', '动作', '悬疑']),
      countries: JSON.stringify(['美国', '英国']),
      languages: JSON.stringify(['英语', '日语', '法语']),
      director: '克里斯托弗·诺兰',
      writers: JSON.stringify(['克里斯托弗·诺兰']),
      plot: '道姆·柯布是一位经验老道的窃贼，他在这一行业中算得上是最厉害的，因为他能够潜入人们精神最为脆弱的梦境中，窃取潜意识中有价值的秘密。柯布这一罕见的技艺使他成为危险的企业间谍活动中最令人垂涎的对象，但这也让他成为了一名国际逃犯，成为被别人悬赏捉拿的对象。如今，柯布有机会获得救赎。只要他能够完成最后一项任务，柯布和他的团队就可以回到原本属于自己的生活。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=inception%20movie%20poster%20sci-fi%20thriller&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=inception%20city%20bending%20dream%20scene&image_size=landscape_16_9',
      trailer_url: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      content_rating: 'PG-13',
      source: 'tmdb',
      source_id: '27205'
    },
    {
      imdb_id: 'tt0111161',
      tmdb_id: '278',
      title: '肖申克的救赎',
      original_title: 'The Shawshank Redemption',
      year: 1994,
      release_date: '1994-09-23',
      runtime: 142,
      rating: 9.3,
      vote_count: 2700000,
      genres: JSON.stringify(['剧情', '犯罪']),
      countries: JSON.stringify(['美国']),
      languages: JSON.stringify(['英语']),
      director: '弗兰克·德拉邦特',
      writers: JSON.stringify(['弗兰克·德拉邦特', '斯蒂芬·金']),
      plot: '一场谋杀案使银行家安迪蒙冤入狱，谋杀妻子及其情人的指控将囚禁他终生。在肖申克监狱里，希望似乎虚无缥缈，终身监禁的惩罚无疑是不可能挽回的。在监狱里，安迪结识了擅长建立黑市的囚犯瑞德，并且很快就适应了监狱里的生活。在那里，他利用自己的专业知识，帮助监狱管理层逃税、洗黑钱，同时凭借与瑞德的交往在犯人中间也渐渐受到礼遇。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shawshank%20redemption%20movie%20poster%20drama%20classic&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=prison%20escape%20rain%20freedom%20scene&image_size=landscape_16_9',
      trailer_url: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
      content_rating: 'R',
      source: 'tmdb',
      source_id: '278'
    },
    {
      imdb_id: 'tt0468569',
      tmdb_id: '155',
      title: '蝙蝠侠：黑暗骑士',
      original_title: 'The Dark Knight',
      year: 2008,
      release_date: '2008-07-18',
      runtime: 152,
      rating: 9.0,
      vote_count: 2800000,
      genres: JSON.stringify(['动作', '犯罪', '剧情']),
      countries: JSON.stringify(['美国', '英国']),
      languages: JSON.stringify(['英语']),
      director: '克里斯托弗·诺兰',
      writers: JSON.stringify(['乔纳森·诺兰', '克里斯托弗·诺兰']),
      plot: '从亲眼目睹父母被杀死的阴影中走出来的蝙蝠侠，经历了成长之后，已经不再是那个桀骜不的孤单英雄了。在警官吉姆·戈登和检查官哈维·登特的通力帮助下，蝙蝠侠无后顾之忧地继续满世界的奔波，与日益增长起来的犯罪威胁做着永无休止的争斗。然而，疯狂的小丑给这座城市带来了前所未有的混乱，蝙蝠侠必须在道德和正义之间做出选择。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20knight%20joker%20batman%20movie%20poster&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=batman%20gotham%20city%20night%20dark&image_size=landscape_16_9',
      trailer_url: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
      content_rating: 'PG-13',
      source: 'tmdb',
      source_id: '155'
    },
    {
      imdb_id: 'tt0133093',
      tmdb_id: '603',
      title: '黑客帝国',
      original_title: 'The Matrix',
      year: 1999,
      release_date: '1999-03-31',
      runtime: 136,
      rating: 8.7,
      vote_count: 1900000,
      genres: JSON.stringify(['科幻', '动作']),
      countries: JSON.stringify(['美国', '澳大利亚']),
      languages: JSON.stringify(['英语']),
      director: '沃卓斯基姐妹',
      writers: JSON.stringify(['沃卓斯基姐妹']),
      plot: '在矩阵中生活的一名年轻的网络黑客尼奥发现，看似正常的现实世界实际上似乎被某种力量控制着，尼奥便在网络上调查此事。而在现实中生活的人类反抗组织的船长墨菲斯，也一直在矩阵中寻找传说的救世主，就这样在人类反抗组织成员崔妮蒂的指引下，两人见面了，尼奥也在墨菲斯的指引下，回到了真正的现实中，逃离了矩阵。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=matrix%20movie%20poster%20sci-fi%20cyberpunk&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=matrix%20code%20digital%20rain%20green&image_size=landscape_16_9',
      trailer_url: 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
      content_rating: 'R',
      source: 'tmdb',
      source_id: '603'
    },
    {
      imdb_id: 'tt0120815',
      tmdb_id: '429',
      title: '拯救大兵瑞恩',
      original_title: 'Saving Private Ryan',
      year: 1998,
      release_date: '1998-07-24',
      runtime: 169,
      rating: 8.6,
      vote_count: 1500000,
      genres: JSON.stringify(['剧情', '战争']),
      countries: JSON.stringify(['美国']),
      languages: JSON.stringify(['英语', '法语', '德语', '捷克语']),
      director: '史蒂文·斯皮尔伯格',
      writers: JSON.stringify(['罗伯特·罗达特']),
      plot: '瑞恩是二战期间的美国伞兵，被困在了敌人后方。更不幸的是，他的三个兄弟全部在战争中死亡，如果他也遇难，家中的老母亲将无依无靠。美国作战总指挥部在知道这个事情之后，毅然决定组织一个小分队，由米勒上尉率领，前往敌营拯救瑞恩。然而，在进入敌营之后，他们却发现自己要面对的不仅仅是敌人，还有内心深处对战争的恐惧和对生命的思考。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=saving%20private%20ryan%20war%20movie%20poster&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wwii%20battle%20scene%20d-day%20omaha%20beach&image_size=landscape_16_9',
      trailer_url: 'https://www.youtube.com/watch?v=9CiBxExIutc',
      content_rating: 'R',
      source: 'tmdb',
      source_id: '429'
    }
  ];

  const insertMovie = db.prepare(`INSERT OR IGNORE INTO movies 
    (imdb_id, tmdb_id, title, original_title, year, release_date, runtime, rating, vote_count, 
     genres, countries, languages, director, writers, plot, poster_url, backdrop_url, trailer_url, 
     content_rating, source, source_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  movies.forEach(movie => {
    insertMovie.run(
      movie.imdb_id, movie.tmdb_id, movie.title, movie.original_title, movie.year,
      movie.release_date, movie.runtime, movie.rating, movie.vote_count,
      movie.genres, movie.countries, movie.languages, movie.director, movie.writers,
      movie.plot, movie.poster_url, movie.backdrop_url, movie.trailer_url,
      movie.content_rating, movie.source, movie.source_id
    );
  });

  console.log('电影数据初始化完成');

  const tvShows = [
    {
      imdb_id: 'tt0944947',
      tmdb_id: '1399',
      title: '权力的游戏',
      original_title: 'Game of Thrones',
      start_year: 2011,
      end_year: 2019,
      status: 'Ended',
      seasons: 8,
      episodes: 73,
      rating: 9.2,
      vote_count: 2100000,
      genres: JSON.stringify(['奇幻', '剧情', '冒险']),
      countries: JSON.stringify(['美国', '英国']),
      languages: JSON.stringify(['英语']),
      creator: '大卫·贝尼奥夫',
      plot: '《权力的游戏》是一部中世纪史诗奇幻题材的电视连续剧，该剧以美国作家乔治·R·R·马丁的奇幻巨作《冰与火之歌》七部曲为基础改编创作。故事背景中虚构的世界，分为两片大陆：位于西面的"日落国度"维斯特洛；位于东面的类似亚欧大陆。维斯特洛大陆边境处发现远古传说中早已灭绝的生物开始，危险也渐渐在靠近这里。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20of%20thrones%20tv%20show%20poster%20fantasy%20dragon&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iron%20throne%20game%20of%20thrones%20castle&image_size=landscape_16_9',
      content_rating: 'TV-MA',
      source: 'tmdb',
      source_id: '1399'
    },
    {
      imdb_id: 'tt0903747',
      tmdb_id: '1668',
      title: '绝命毒师',
      original_title: 'Breaking Bad',
      start_year: 2008,
      end_year: 2013,
      status: 'Ended',
      seasons: 5,
      episodes: 62,
      rating: 9.5,
      vote_count: 2000000,
      genres: JSON.stringify(['犯罪', '剧情', '惊悚']),
      countries: JSON.stringify(['美国']),
      languages: JSON.stringify(['英语', '西班牙语']),
      creator: '文斯·吉里根',
      plot: '新墨西哥州的高中化学老师沃尔特·H·怀特是拮据家庭的唯一经济来源。他大半生安分守己，兢兢业业，却在50岁生日之际突然得知自己罹患肺癌晚期的噩耗，原本便不甚顺意的人生顿时雪上加霜。为了保障怀孕的妻子斯凯勒和残疾的儿子小沃特能在自己死后衣食无忧，沃尔特决意铤而走险。他主动找到曾经的学生、而今的毒贩小混混杰西·平克曼谈合作，利用自己的化学知识制造高纯度冰毒。',
      poster_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=breaking%20bad%20tv%20show%20poster%20walter%20white&image_size=portrait_4_3',
      backdrop_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=breaking%20bad%20desert%20rv%20meth%20lab&image_size=landscape_16_9',
      content_rating: 'TV-MA',
      source: 'tmdb',
      source_id: '1668'
    }
  ];

  const insertTvShow = db.prepare(`INSERT OR IGNORE INTO tv_shows 
    (imdb_id, tmdb_id, title, original_title, start_year, end_year, status, seasons, episodes, 
     rating, vote_count, genres, countries, languages, creator, plot, poster_url, backdrop_url, 
     content_rating, source, source_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  tvShows.forEach(show => {
    insertTvShow.run(
      show.imdb_id, show.tmdb_id, show.title, show.original_title, show.start_year,
      show.end_year, show.status, show.seasons, show.episodes, show.rating, show.vote_count,
      show.genres, show.countries, show.languages, show.creator, show.plot,
      show.poster_url, show.backdrop_url, show.content_rating, show.source, show.source_id
    );
  });

  console.log('剧集数据初始化完成');

  const people = [
    {
      imdb_id: 'nm0634240',
      tmdb_id: '525',
      name: '克里斯托弗·诺兰',
      original_name: 'Christopher Nolan',
      birth_date: '1970-07-30',
      place_of_birth: '英国伦敦',
      gender: 2,
      biography: '克里斯托弗·爱德华·诺兰，CBE，是一名英国男导演、编剧和制片人。他的电影经常探讨时间、记忆和身份的主题，以其复杂的叙事结构和独特的视觉风格而闻名。代表作品包括《盗梦空间》、《星际穿越》、《蝙蝠侠黑暗骑士三部曲》等。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=christopher%20nolan%20director%20portrait&image_size=square',
      known_for: JSON.stringify(['导演', '编剧', '制片人']),
      popularity: 98.5
    },
    {
      imdb_id: 'nm0000138',
      tmdb_id: '6193',
      name: '莱昂纳多·迪卡普里奥',
      original_name: 'Leonardo DiCaprio',
      birth_date: '1974-11-11',
      place_of_birth: '美国加利福尼亚州洛杉矶',
      gender: 2,
      biography: '莱昂纳多·威廉·迪卡普里奥是一位美国男演员和电影制片人。他曾获得1次奥斯卡奖、3次金球奖、1次英国电影学院奖、1次美国演员工会奖。代表作品包括《泰坦尼克号》、《盗梦空间》、《华尔街之狼》、《荒野猎人》等。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leonardo%20dicaprio%20actor%20portrait&image_size=square',
      known_for: JSON.stringify(['演员', '制片人']),
      popularity: 99.2
    },
    {
      imdb_id: 'nm0000148',
      tmdb_id: '192',
      name: '摩根·弗里曼',
      original_name: 'Morgan Freeman',
      birth_date: '1937-06-01',
      place_of_birth: '美国田纳西州孟菲斯',
      gender: 2,
      biography: '摩根·弗里曼是一位美国男演员、导演和 narrator。他以其深沉的嗓音和稳重的表演风格而闻名，代表作品包括《肖申克的救赎》、《为黛西小姐开车》、《不可饶恕》、《蝙蝠侠黑暗骑士三部曲》等。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=morgan%20freeman%20actor%20portrait&image_size=square',
      known_for: JSON.stringify(['演员', '旁白']),
      popularity: 94.8
    },
    {
      imdb_id: 'nm0000151',
      tmdb_id: '3895',
      name: '汤姆·汉克斯',
      original_name: 'Tom Hanks',
      birth_date: '1956-07-09',
      place_of_birth: '美国加州康科德',
      gender: 2,
      biography: '托马斯·杰弗里·汉克斯是一位美国男演员和电影制片人，以其平易近人的银幕形象著称，饰演过多个里程碑式的角色。他曾获得两届奥斯卡最佳男主角奖，代表作品包括《阿甘正传》、《费城故事》、《拯救大兵瑞恩》、《猫鼠游戏》等。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tom%20hanks%20actor%20portrait&image_size=square',
      known_for: JSON.stringify(['演员', '制片人', '导演']),
      popularity: 95.3
    },
    {
      imdb_id: 'nm0000375',
      tmdb_id: '1032',
      name: '史蒂文·斯皮尔伯格',
      original_name: 'Steven Spielberg',
      birth_date: '1946-12-18',
      place_of_birth: '美国俄亥俄州辛辛那提',
      gender: 2,
      biography: '史蒂文·艾伦·斯皮尔伯格是一位美国著名电影导演、编剧与制片人，是美国影坛最重要的导演之一，同时也是最成功的商业片导演。他的作品包括《大白鲨》、《E.T.外星人》、《侏罗纪公园》、《辛德勒的名单》、《拯救大兵瑞恩》等。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steven%20spielberg%20director%20portrait&image_size=square',
      known_for: JSON.stringify(['导演', '制片人', '编剧']),
      popularity: 96.7
    },
    {
      imdb_id: 'nm0289856',
      tmdb_id: '11252',
      name: '基里安·墨菲',
      original_name: 'Cillian Murphy',
      birth_date: '1976-05-25',
      place_of_birth: '爱尔兰科克',
      gender: 2,
      biography: '基里安·墨菲是一位爱尔兰男演员。他因在克里斯托弗·诺兰执导的《蝙蝠侠》三部曲中饰演稻草人一角而广受关注，后来又在《浴血黑帮》中饰演主角托马斯·谢尔比，以及在《奥本海默》中饰演罗伯特·奥本海默。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cillian%20murphy%20actor%20portrait&image_size=square',
      known_for: JSON.stringify(['演员']),
      popularity: 93.4
    },
    {
      imdb_id: 'nm0000323',
      tmdb_id: '128',
      name: '马特·达蒙',
      original_name: 'Matt Damon',
      birth_date: '1970-10-08',
      place_of_birth: '美国马萨诸塞州剑桥',
      gender: 2,
      biography: '马修·佩吉·达蒙是一位美国男演员、编剧和制片人。他与好友本·阿弗莱克共同编写《心灵捕手》剧本并因此获得奥斯卡最佳原创剧本奖，代表作品包括《谍影重重》系列、《拯救大兵瑞恩》、《火星救援》、《奥本海默》等。',
      avatar_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=matt%20damon%20actor%20portrait&image_size=square',
      known_for: JSON.stringify(['演员', '编剧', '制片人']),
      popularity: 92.8
    }
  ];

  const insertPerson = db.prepare(`INSERT OR IGNORE INTO people 
    (imdb_id, tmdb_id, name, original_name, birth_date, place_of_birth, gender, 
     biography, avatar_url, known_for, popularity) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  people.forEach(person => {
    insertPerson.run(
      person.imdb_id, person.tmdb_id, person.name, person.original_name,
      person.birth_date, person.place_of_birth, person.gender,
      person.biography, person.avatar_url, person.known_for, person.popularity
    );
  });

  console.log('影人数据初始化完成');

  const credits = [
    { movie_id: 1, person_id: 1, department: 'Directing', job: 'Director', character: null, order_index: 1 },
    { movie_id: 1, person_id: 2, department: 'Acting', job: 'Actor', character: 'Dom Cobb', order_index: 1 },
    { movie_id: 2, person_id: 3, department: 'Acting', job: 'Actor', character: 'Ellis Boyd \"Red\" Redding', order_index: 1 },
    { movie_id: 3, person_id: 1, department: 'Directing', job: 'Director', character: null, order_index: 1 },
    { movie_id: 3, person_id: 3, department: 'Acting', job: 'Actor', character: 'Lucius Fox', order_index: 3 },
    { movie_id: 5, person_id: 5, department: 'Directing', job: 'Director', character: null, order_index: 1 },
    { movie_id: 5, person_id: 4, department: 'Acting', job: 'Actor', character: 'Captain Miller', order_index: 1 },
    { movie_id: 5, person_id: 7, department: 'Acting', job: 'Actor', character: 'Private Ryan', order_index: 2 }
  ];

  const insertCredit = db.prepare(`INSERT OR IGNORE INTO movie_credits 
    (movie_id, person_id, department, job, character, order_index) 
    VALUES (?, ?, ?, ?, ?, ?)`);

  credits.forEach(credit => {
    insertCredit.run(
      credit.movie_id, credit.person_id, credit.department,
      credit.job, credit.character, credit.order_index
    );
  });

  const relations = [
    { person1_id: 1, person2_id: 2, relation_type: 'collaborator', movie_id: 1 },
    { person1_id: 1, person2_id: 3, relation_type: 'collaborator', movie_id: 3 },
    { person1_id: 1, person2_id: 6, relation_type: 'collaborator', movie_id: 3 },
    { person1_id: 5, person2_id: 4, relation_type: 'collaborator', movie_id: 5 },
    { person1_id: 5, person2_id: 7, relation_type: 'collaborator', movie_id: 5 }
  ];

  const insertRelation = db.prepare(`INSERT OR IGNORE INTO person_relations 
    (person1_id, person2_id, relation_type, movie_id) 
    VALUES (?, ?, ?, ?)`);

  relations.forEach(rel => {
    insertRelation.run(rel.person1_id, rel.person2_id, rel.relation_type, rel.movie_id);
  });

  console.log('演员关系数据初始化完成');

  const reviews = [
    {
      user_id: 3,
      content_type: 'movie',
      content_id: 1,
      title: '诺兰的巅峰之作',
      content: '《盗梦空间》绝对是一部神作！诺兰用他无与伦比的想象力，为我们构建了一个层层嵌套的梦境世界。每一次观看都能发现新的细节，剧情的每一个转折都精妙绝伦。尤其是结尾那个陀螺，至今仍让人回味无穷。莱昂纳多的表演也非常精彩，完美诠释了一个背负着沉重过去的男人。强烈推荐给所有喜欢烧脑电影的观众！',
      rating: 10.0,
      sentiment_score: 0.9,
      sentiment_label: 'positive',
      status: 'approved',
      likes: 156,
      comments: 23,
      views: 2340
    },
    {
      user_id: 3,
      content_type: 'movie',
      content_id: 2,
      title: '影史第一，当之无愧',
      content: '肖申克的救赎能够常年占据IMDb榜首绝对是实至名归。这部电影没有炫酷的特效，没有激烈的动作场面，但它却用最朴素的方式讲述了一个关于希望和自由的故事。安迪在雨中张开双臂的那个镜头，是影史上最经典的画面之一。每次看完都会让人对生命有新的思考。',
      rating: 10.0,
      sentiment_score: 0.95,
      sentiment_label: 'positive',
      status: 'approved',
      likes: 289,
      comments: 45,
      views: 5670
    },
    {
      user_id: 3,
      content_type: 'movie',
      content_id: 3,
      title: '超级英雄电影的天花板',
      content: '黑暗骑士不仅仅是一部超级英雄电影，它更是一部深刻的犯罪剧情片。希斯·莱杰饰演的小丑是影史上最伟大的反派之一，他的每一个镜头都让人不寒而栗。电影探讨了秩序与混乱、正义与道德的边界，即使在今天看来依然震撼人心。唯一的遗憾是结局略显仓促。',
      rating: 9.5,
      sentiment_score: 0.8,
      sentiment_label: 'positive',
      status: 'approved',
      likes: 198,
      comments: 34,
      views: 4120
    },
    {
      user_id: 3,
      content_type: 'tv',
      content_id: 1,
      title: '史诗级的奇幻巨作',
      content: '权游的前四季真的是太精彩了！每一集都像一部电影，制作水准之高令人叹为观止。虽然最后一季让人失望，但整体来说依然是电视史上最伟大的剧集之一。剧中的人物塑造太成功了，小恶魔、囧雪、龙妈，每个角色都让人印象深刻。',
      rating: 9.0,
      sentiment_score: 0.7,
      sentiment_label: 'positive',
      status: 'approved',
      likes: 342,
      comments: 67,
      views: 8900
    }
  ];

  const insertReview = db.prepare(`INSERT OR IGNORE INTO reviews 
    (user_id, content_type, content_id, title, content, rating, sentiment_score, 
     sentiment_label, status, likes, comments, views) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  reviews.forEach(review => {
    insertReview.run(
      review.user_id, review.content_type, review.content_id, review.title,
      review.content, review.rating, review.sentiment_score, review.sentiment_label,
      review.status, review.likes, review.comments, review.views
    );
  });

  console.log('影评数据初始化完成');

  const news = [
    {
      title: '诺兰新片《奥本海默》斩获7项奥斯卡大奖',
      content: '在第96届奥斯卡颁奖典礼上，克里斯托弗·诺兰执导的《奥本海默》成为最大赢家，一举斩获包括最佳影片、最佳导演在内的7项大奖。基里安·墨菲凭借该片获得最佳男主角奖。这是诺兰职业生涯首次获得奥斯卡最佳导演奖，实至名归。',
      summary: '《奥本海默》横扫奥斯卡，诺兰终于捧得小金人。',
      news_type: 'award',
      source: 'Variety',
      related_person_id: 1,
      publish_date: '2024-03-11 08:00:00',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oscar%20award%20ceremony%20golden%20statuette&image_size=landscape_16_9',
      views: 15600
    },
    {
      title: '《沙丘3》正式定档2026年12月',
      content: '丹尼斯·维伦纽瓦执导的科幻史诗巨作《沙丘3》正式宣布定档2026年12月18日。影片将继续讲述保罗·厄崔迪的故事，预计将于今年下半年开始拍摄。前作主要演员提莫西·查拉梅、赞达亚等均将回归。',
      summary: '科幻迷狂喜！《沙丘3》定档2026年圣诞档。',
      news_type: 'schedule',
      source: 'Hollywood Reporter',
      publish_date: '2024-03-08 14:30:00',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dune%20desert%20planet%20sandworm%20sci-fi&image_size=landscape_16_9',
      views: 23400
    },
    {
      title: '戛纳电影节公布主竞赛单元入围名单',
      content: '第77届戛纳电影节正式公布主竞赛单元入围名单。今年共有21部影片入围，其中包括多位大师的新作。华语电影方面，有两部作品入围，分别是...',
      summary: '第77届戛纳电影节主竞赛单元名单揭晓。',
      news_type: 'festival',
      source: 'Cannes Official',
      publish_date: '2024-04-11 16:00:00',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cannes%20film%20festival%20red%20carpet%20palms&image_size=landscape_16_9',
      views: 18900
    },
    {
      title: '《复仇者联盟5》正式开拍，演员阵容曝光',
      content: '漫威影业年度巨制《复仇者联盟5》正式开机拍摄。该片将由《尚气》导演德斯汀·克里顿执导，预计将于2026年上映。从曝光的演员名单来看，多位老牌复仇者将回归。',
      summary: '漫威宇宙第五阶段重磅作品正式启动。',
      news_type: 'production',
      source: 'Marvel Studios',
      publish_date: '2024-02-15 09:00:00',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avengers%20superhero%20team%20marvel&image_size=landscape_16_9',
      views: 45600
    }
  ];

  const insertNews = db.prepare(`INSERT OR IGNORE INTO news 
    (title, content, summary, news_type, source, related_movie_id, related_person_id, 
     publish_date, image_url, views) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  news.forEach(item => {
    insertNews.run(
      item.title, item.content, item.summary, item.news_type, item.source,
      item.related_movie_id, item.related_person_id, item.publish_date,
      item.image_url, item.views
    );
  });

  console.log('资讯数据初始化完成');

  const playlists = [
    {
      user_id: 3,
      title: '诺兰导演作品全集',
      description: '克里斯托弗·诺兰所有导演作品合集，从《追随》到《奥本海默》，一次看个够！',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nolan%20movies%20collection%20poster&image_size=landscape_16_9',
      is_public: 1,
      item_count: 2,
      likes: 89,
      views: 1230
    },
    {
      user_id: 3,
      title: 'IMDb Top 10 必看经典',
      description: '精选IMDb榜单排名前十的经典电影，每一部都是影史瑰宝，值得反复品味。',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20movies%20collection%20cinema&image_size=landscape_16_9',
      is_public: 1,
      item_count: 3,
      likes: 156,
      views: 3450
    }
  ];

  const insertPlaylist = db.prepare(`INSERT OR IGNORE INTO playlists 
    (user_id, title, description, cover_url, is_public, item_count, likes, views) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  playlists.forEach(pl => {
    insertPlaylist.run(
      pl.user_id, pl.title, pl.description, pl.cover_url,
      pl.is_public, pl.item_count, pl.likes, pl.views
    );
  });

  const playlistItems = [
    { playlist_id: 1, content_type: 'movie', content_id: 1, sort_order: 1 },
    { playlist_id: 1, content_type: 'movie', content_id: 3, sort_order: 2 },
    { playlist_id: 2, content_type: 'movie', content_id: 2, sort_order: 1 },
    { playlist_id: 2, content_type: 'movie', content_id: 3, sort_order: 2 },
    { playlist_id: 2, content_type: 'movie', content_id: 1, sort_order: 3 }
  ];

  const insertPlaylistItem = db.prepare(`INSERT OR IGNORE INTO playlist_items 
    (playlist_id, content_type, content_id, sort_order) 
    VALUES (?, ?, ?, ?)`);

  playlistItems.forEach(item => {
    insertPlaylistItem.run(
      item.playlist_id, item.content_type, item.content_id, item.sort_order
    );
  });

  console.log('片单数据初始化完成');

  const topics = [
    {
      title: '诺兰作品深度讨论组',
      description: '这里是诺兰影迷的聚集地，让我们一起深度讨论诺兰的每一部作品，分享你的独特见解！',
      category: 'director',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nolan%20film%20discussion%20group&image_size=landscape_16_9',
      creator_id: 3,
      member_count: 1256,
      post_count: 345,
      is_active: 1
    },
    {
      title: '科幻电影爱好者',
      description: '欢迎所有科幻电影爱好者！在这里我们讨论一切与科幻电影相关的话题，从硬科幻到太空歌剧。',
      category: 'genre',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20movies%20space%20future&image_size=landscape_16_9',
      creator_id: 3,
      member_count: 3456,
      post_count: 890,
      is_active: 1
    },
    {
      title: '奥斯卡颁奖典礼讨论',
      description: '一年一度的奥斯卡颁奖典礼专题讨论组，让我们一起预测、点评、吐槽这一电影界的盛事！',
      category: 'award',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oscar%20academy%20awards%20discussion&image_size=landscape_16_9',
      creator_id: 3,
      member_count: 2345,
      post_count: 567,
      is_active: 1
    }
  ];

  const insertTopic = db.prepare(`INSERT OR IGNORE INTO topics 
    (title, description, category, cover_url, creator_id, member_count, post_count, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  topics.forEach(topic => {
    insertTopic.run(
      topic.title, topic.description, topic.category, topic.cover_url,
      topic.creator_id, topic.member_count, topic.post_count, topic.is_active
    );
  });

  const posts = [
    {
      topic_id: 1,
      user_id: 3,
      title: '为什么诺兰的电影总是喜欢玩时间的概念？',
      content: '从《记忆碎片》到《信条》，诺兰几乎每部电影都在玩弄时间的概念。是他对这个主题有执念？还是说这已经成为了他的一种个人标签？大家怎么看？',
      likes: 89,
      comments: 23,
      views: 567
    },
    {
      topic_id: 2,
      user_id: 3,
      title: '2024年最值得期待的科幻电影有哪些？',
      content: '新的一年到来了，让我们来盘点一下2024年有哪些值得期待的科幻大片。我个人最期待《沙丘3》和《银翼杀手2099》，大家还有什么推荐吗？',
      likes: 123,
      comments: 45,
      views: 890
    }
  ];

  const insertPost = db.prepare(`INSERT OR IGNORE INTO posts 
    (topic_id, user_id, title, content, likes, comments, views) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  posts.forEach(post => {
    insertPost.run(
      post.topic_id, post.user_id, post.title, post.content,
      post.likes, post.comments, post.views
    );
  });

  console.log('社区话题数据初始化完成');

  const quizzes = [
    {
      title: '诺兰电影知识大挑战',
      description: '测试你对克里斯托弗·诺兰电影的了解程度，从《盗梦空间》到《奥本海默》，你能全部答对吗？',
      category: 'director',
      difficulty: 'hard',
      question_count: 5,
      total_score: 50,
      time_limit: 300,
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nolan%20movie%20quiz%20trivia&image_size=landscape_16_9',
      status: 'active'
    },
    {
      title: '奥斯卡经典影片知识测试',
      description: '你对奥斯卡获奖影片了解多少？快来挑战这个经典影片知识测试吧！',
      category: 'award',
      difficulty: 'medium',
      question_count: 5,
      total_score: 50,
      time_limit: 300,
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oscar%20quiz%20golden%20trophy&image_size=landscape_16_9',
      status: 'active'
    }
  ];

  const insertQuiz = db.prepare(`INSERT OR IGNORE INTO quizzes 
    (title, description, category, difficulty, question_count, total_score, time_limit, cover_url, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  quizzes.forEach(quiz => {
    insertQuiz.run(
      quiz.title, quiz.description, quiz.category, quiz.difficulty,
      quiz.question_count, quiz.total_score, quiz.time_limit, quiz.cover_url, quiz.status
    );
  });

  const questions = [
    {
      quiz_id: 1,
      question_text: '《盗梦空间》中，图腾陀螺最后停下来了吗？',
      question_type: 'single',
      options: JSON.stringify(['停下来了', '没有停下来', '电影没有明确交代', '导演说停下来了']),
      correct_answer: '电影没有明确交代',
      explanation: '诺兰故意留下了开放式结局，让观众自己去思考和解读。',
      points: 10,
      sort_order: 1
    },
    {
      quiz_id: 1,
      question_text: '诺兰的哪部电影获得了他的第一个奥斯卡最佳导演奖？',
      question_type: 'single',
      options: JSON.stringify(['《盗梦空间》', '《敦刻尔克》', '《奥本海默》', '《星际穿越》']),
      correct_answer: '《奥本海默》',
      explanation: '2024年，诺兰凭借《奥本海默》首次获得奥斯卡最佳导演奖。',
      points: 10,
      sort_order: 2
    },
    {
      quiz_id: 1,
      question_text: '《蝙蝠侠：黑暗骑士》中，希斯·莱杰饰演的小丑有几句经典台词？',
      question_type: 'single',
      options: JSON.stringify(['\"Why so serious?\"', '\"I am the danger\"', '\"Say my name\"', '\"I am Batman\"']),
      correct_answer: '\"Why so serious?\"',
      explanation: '这是小丑最经典的台词之一，成为了影史名句。',
      points: 10,
      sort_order: 3
    },
    {
      quiz_id: 1,
      question_text: '《星际穿越》中，米勒星球上的1小时等于地球上的多长时间？',
      question_type: 'single',
      options: JSON.stringify(['1年', '7年', '10年', '23年']),
      correct_answer: '7年',
      explanation: '由于黑洞的引力时间膨胀效应，米勒星球上的1小时相当于地球的7年。',
      points: 10,
      sort_order: 4
    },
    {
      quiz_id: 1,
      question_text: '以下哪部电影不是诺兰导演的作品？',
      question_type: 'single',
      options: JSON.stringify(['《记忆碎片》', '《致命魔术》', '《七宗罪》', '《信条》']),
      correct_answer: '《七宗罪》',
      explanation: '《七宗罪》是大卫·芬奇的作品，不是诺兰的。',
      points: 10,
      sort_order: 5
    },
    {
      quiz_id: 2,
      question_text: '《肖申克的救赎》获得了哪一年的奥斯卡最佳影片提名？',
      question_type: 'single',
      options: JSON.stringify(['1994年', '1995年', '1996年', '1993年']),
      correct_answer: '1995年',
      explanation: '该片在1995年的第67届奥斯卡上获得7项提名，但遗憾未获最佳影片。',
      points: 10,
      sort_order: 1
    },
    {
      quiz_id: 2,
      question_text: '哪部电影获得了第96届奥斯卡最佳影片奖？',
      question_type: 'single',
      options: JSON.stringify(['《奥本海默》', '《芭比》', '《花月杀手》', '《可怜的东西》']),
      correct_answer: '《奥本海默》',
      explanation: '《奥本海默》在2024年的第96届奥斯卡上斩获7项大奖，包括最佳影片。',
      points: 10,
      sort_order: 2
    },
    {
      quiz_id: 2,
      question_text: '哪位导演获得过最多的奥斯卡最佳导演奖？',
      question_type: 'single',
      options: JSON.stringify(['史蒂文·斯皮尔伯格', '约翰·福特', '马丁·斯科塞斯', '阿尔弗雷德·希区柯克']),
      correct_answer: '约翰·福特',
      explanation: '约翰·福特获得过4次奥斯卡最佳导演奖，是史上最多的。',
      points: 10,
      sort_order: 3
    },
    {
      quiz_id: 2,
      question_text: '以下哪部电影获得过奥斯卡最佳影片奖？',
      question_type: 'single',
      options: JSON.stringify(['《肖申克的救赎》', '《低俗小说》', '《阿甘正传》', '《搏击俱乐部》']),
      correct_answer: '《阿甘正传》',
      explanation: '《阿甘正传》在1995年击败《肖申克的救赎》获得奥斯卡最佳影片。',
      points: 10,
      sort_order: 4
    },
    {
      quiz_id: 2,
      question_text: '第一位获得奥斯卡最佳导演奖的女性是谁？',
      question_type: 'single',
      options: JSON.stringify(['凯瑟琳·毕格罗', '索菲亚·科波拉', '格蕾塔·葛韦格', '简·坎皮恩']),
      correct_answer: '凯瑟琳·毕格罗',
      explanation: '2010年，凯瑟琳·毕格罗凭借《拆弹部队》成为首位获得奥斯卡最佳导演奖的女性。',
      points: 10,
      sort_order: 5
    }
  ];

  const insertQuestion = db.prepare(`INSERT OR IGNORE INTO questions 
    (quiz_id, question_text, question_type, options, correct_answer, explanation, points, sort_order) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  questions.forEach(q => {
    insertQuestion.run(
      q.quiz_id, q.question_text, q.question_type, q.options, q.correct_answer,
      q.explanation, q.points, q.sort_order
    );
  });

  console.log('答题数据初始化完成');

  const leaderboard = [
    { user_id: 3, total_score: 1250, quizzes_completed: 15, accuracy_rate: 92.5, rank: 1 },
    { user_id: 2, total_score: 1180, quizzes_completed: 12, accuracy_rate: 88.3, rank: 2 },
    { user_id: 1, total_score: 1050, quizzes_completed: 10, accuracy_rate: 85.0, rank: 3 }
  ];

  const insertLeaderboard = db.prepare(`INSERT OR IGNORE INTO leaderboard 
    (user_id, total_score, quizzes_completed, accuracy_rate, rank) 
    VALUES (?, ?, ?, ?, ?)`);

  leaderboard.forEach(lb => {
    insertLeaderboard.run(
      lb.user_id, lb.total_score, lb.quizzes_completed, lb.accuracy_rate, lb.rank
    );
  });

  const prizes = [
    {
      name: 'VIP月度会员',
      description: '全站无广告观影，高清片源免费看',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vip%20membership%20golden%20badge&image_size=square',
      prize_type: 'virtual',
      value: 29.9,
      required_score: 500,
      stock: 100,
      status: 'active'
    },
    {
      name: '限量电影海报',
      description: '经典电影原版海报，随机发货',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20collection%20vintage&image_size=square',
      prize_type: 'physical',
      value: 99.0,
      required_score: 1000,
      stock: 50,
      status: 'active'
    },
    {
      name: 'IMAX电影票兑换券',
      description: '全国IMAX影院通用兑换券',
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=imax%20movie%20ticket%20cinema&image_size=square',
      prize_type: 'virtual',
      value: 150.0,
      required_score: 2000,
      stock: 30,
      status: 'active'
    }
  ];

  const insertPrize = db.prepare(`INSERT OR IGNORE INTO prizes 
    (name, description, image_url, prize_type, value, required_score, stock, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  prizes.forEach(prize => {
    insertPrize.run(
      prize.name, prize.description, prize.image_url, prize.prize_type,
      prize.value, prize.required_score, prize.stock, prize.status
    );
  });

  console.log('奖品数据初始化完成');

  const liveStreams = [
    {
      title: '诺兰电影马拉松直播',
      description: '连续12小时播放诺兰经典电影，和小伙伴们一起观影聊天！',
      streamer_id: 3,
      movie_id: 1,
      room_id: 'cinehub-live-001',
      stream_url: 'rtmp://127.0.0.1:1935/live/cinehub-001',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20marathon%20live%20streaming&image_size=landscape_16_9',
      start_time: '2024-06-15 19:00:00',
      status: 'scheduled',
      is_copyright_verified: 1,
      copyright_note: '已获得版权方授权用于非商业直播'
    },
    {
      title: '奥斯卡颁奖典礼直播评论',
      description: '第97届奥斯卡颁奖典礼全程直播，和大家一起吐槽、预测、见证历史时刻！',
      streamer_id: 3,
      room_id: 'cinehub-live-002',
      stream_url: 'rtmp://127.0.0.1:1935/live/cinehub-002',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oscar%20live%20stream%20red%20carpet&image_size=landscape_16_9',
      start_time: '2025-03-02 07:00:00',
      status: 'scheduled',
      is_copyright_verified: 0
    }
  ];

  const insertLiveStream = db.prepare(`INSERT OR IGNORE INTO live_streams 
    (title, description, streamer_id, movie_id, room_id, stream_url, cover_url, 
     start_time, status, is_copyright_verified, copyright_note) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  liveStreams.forEach(ls => {
    insertLiveStream.run(
      ls.title, ls.description, ls.streamer_id, ls.movie_id, ls.room_id, ls.stream_url,
      ls.cover_url, ls.start_time, ls.status, ls.is_copyright_verified, ls.copyright_note
    );
  });

  const battles = [
    {
      title: '诺兰 vs 斯皮尔伯格，谁更伟大？',
      description: '两位当代最伟大的商业片导演，你更欣赏谁的作品？来为你支持的导演投票吧！',
      topic_a: '克里斯托弗·诺兰',
      topic_b: '史蒂文·斯皮尔伯格',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=film%20director%20battle%20versus&image_size=landscape_16_9',
      creator_id: 3,
      votes_a: 234,
      votes_b: 289,
      status: 'active'
    },
    {
      title: '漫威 vs DC，哪家的超级英雄电影更好？',
      description: '漫改电影界的世纪对决，你站在哪一边？',
      topic_a: '漫威电影宇宙',
      topic_b: 'DC扩展宇宙',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=marvel%20vs%20dc%20superhero%20battle&image_size=landscape_16_9',
      creator_id: 3,
      votes_a: 567,
      votes_b: 432,
      status: 'active'
    },
    {
      title: '影院观影 vs 流媒体观影，你更喜欢哪种方式？',
      description: '后疫情时代，你更倾向于去电影院还是在家看流媒体？',
      topic_a: '电影院观影',
      topic_b: '流媒体观影',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20vs%20streaming%20movie%20watching&image_size=landscape_16_9',
      creator_id: 3,
      votes_a: 345,
      votes_b: 456,
      status: 'active'
    }
  ];

  const insertBattle = db.prepare(`INSERT OR IGNORE INTO battles 
    (title, description, topic_a, topic_b, cover_url, creator_id, votes_a, votes_b, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  battles.forEach(battle => {
    insertBattle.run(
      battle.title, battle.description, battle.topic_a, battle.topic_b,
      battle.cover_url, battle.creator_id, battle.votes_a, battle.votes_b, battle.status
    );
  });

  console.log('直播、对战数据初始化完成');

  const viewingGroups = [
    {
      name: '《盗梦空间》线下观影团',
      description: '诺兰影迷线下聚会，一起在大银幕上重温《盗梦空间》，观影后还有深度讨论环节！',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20watching%20group%20cinema&image_size=landscape_16_9',
      creator_id: 3,
      movie_id: 1,
      scheduled_at: '2024-06-20 19:30:00',
      location: '北京市朝阳区万达影城CBD店',
      max_members: 30,
      member_count: 18,
      status: 'upcoming'
    },
    {
      name: '周末经典电影夜',
      description: '每周六晚上，和志同道合的影迷朋友一起观看一部经典电影，享受美好的周末时光。',
      cover_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=weekend%20movie%20night%20friends&image_size=landscape_16_9',
      creator_id: 3,
      scheduled_at: '2024-06-15 20:00:00',
      location: '上海市静安区某某咖啡馆',
      max_members: 20,
      member_count: 12,
      status: 'upcoming'
    }
  ];

  const insertViewGroup = db.prepare(`INSERT OR IGNORE INTO viewing_groups 
    (name, description, cover_url, creator_id, movie_id, scheduled_at, location, max_members, member_count, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  viewingGroups.forEach(vg => {
    insertViewGroup.run(
      vg.name, vg.description, vg.cover_url, vg.creator_id, vg.movie_id,
      vg.scheduled_at, vg.location, vg.max_members, vg.member_count, vg.status
    );
  });

  console.log('观影团数据初始化完成');
  console.log('所有数据初始化完成！');
}

if (require.main === module) {
  initData();
  console.log('数据库初始化脚本执行完成');
}

module.exports = { initData };
