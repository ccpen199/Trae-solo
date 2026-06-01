import { db } from '../config/database.js';
import crypto from 'crypto';

function generateId(): string {
  return crypto.randomUUID();
}

const moviesData = [
  {
    id: generateId(),
    title: '星际探索',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sci-fi%20space%20movie%20poster%20with%20astronaut&image_size=portrait_4_3',
    description: '人类探索未知宇宙的史诗巨作，讲述宇航员穿越虫洞寻找新家园的故事。',
    duration: 169,
    release_date: '2025-06-15',
    genre: '科幻/冒险'
  },
  {
    id: generateId(),
    title: '城市迷雾',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Film%20noir%20detective%20movie%20poster%20foggy%20city&image_size=portrait_4_3',
    description: '一座被迷雾笼罩的城市，一名侦探追查连环案件，揭开惊人真相。',
    duration: 128,
    release_date: '2025-05-20',
    genre: '悬疑/犯罪'
  },
  {
    id: generateId(),
    title: '夏日恋曲',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Romantic%20summer%20beach%20movie%20poster%20couple&image_size=portrait_4_3',
    description: '海边小镇的青春爱情故事，两个年轻人在夏天相遇相知。',
    duration: 115,
    release_date: '2025-07-01',
    genre: '爱情/青春'
  },
  {
    id: generateId(),
    title: '武侠传说',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20wuxia%20martial%20arts%20movie%20poster&image_size=portrait_4_3',
    description: '江湖恩怨，侠骨柔情，一代宗师的成长之路。',
    duration: 142,
    release_date: '2025-04-10',
    genre: '武侠/动作'
  },
  {
    id: generateId(),
    title: '梦境解码',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Psychological%20thriller%20dream%20movie%20poster&image_size=portrait_4_3',
    description: '进入梦境的心理医生，发现患者记忆中隐藏的秘密。',
    duration: 135,
    release_date: '2025-06-28',
    genre: '科幻/惊悚'
  },
  {
    id: generateId(),
    title: '山野人家',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Rural%20Chinese%20countryside%20family%20drama%20poster&image_size=portrait_4_3',
    description: '展现中国乡村的变迁与普通家庭的喜怒哀乐。',
    duration: 118,
    release_date: '2025-03-15',
    genre: '剧情/文艺'
  },
  {
    id: generateId(),
    title: '极速狂飙',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Racing%20car%20action%20movie%20poster%20high%20speed&image_size=portrait_4_3',
    description: '街头赛车手挑战职业赛事，速度与激情的终极对决。',
    duration: 122,
    release_date: '2025-05-05',
    genre: '动作/运动'
  },
  {
    id: generateId(),
    title: '古镇谜案',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Ancient%20Chinese%20town%20mystery%20detective%20poster&image_size=portrait_4_3',
    description: '千年古镇发生离奇案件，年轻官员抽丝剥茧揭开真相。',
    duration: 130,
    release_date: '2025-04-22',
    genre: '悬疑/古装'
  },
  {
    id: generateId(),
    title: '光年之外',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Space%20adventure%20alien%20planet%20movie%20poster&image_size=portrait_4_3',
    description: '外星文明接触，人类命运何去何从的科幻巨制。',
    duration: 155,
    release_date: '2025-07-10',
    genre: '科幻/冒险'
  },
  {
    id: generateId(),
    title: '城市守护者',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Superhero%20city%20protector%20action%20movie%20poster&image_size=portrait_4_3',
    description: '普通人成为城市英雄，守护正义与家人的故事。',
    duration: 125,
    release_date: '2025-06-01',
    genre: '动作/超级英雄'
  }
];

const scoreSources = ['douban', 'imdb', 'rottentomatoes', 'maoyan', 'taopiaopiao'];

function generateScores(movieId: string): Array<{id: string, movie_id: string, source: string, score: number, vote_count: number}> {
  return scoreSources.map(source => ({
    id: generateId(),
    movie_id: movieId,
    source,
    score: Math.round((6.5 + Math.random() * 3) * 10) / 10,
    vote_count: Math.floor(10000 + Math.random() * 500000)
  }));
}

function generateHeatTrends(movieId: string): Array<{id: string, movie_id: string, trend_date: string, value: number}> {
  const trends = [];
  const baseValue = 50 + Math.random() * 50;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      id: generateId(),
      movie_id: movieId,
      trend_date: date.toISOString().split('T')[0],
      value: Math.round((baseValue + Math.sin(i) * 10 + Math.random() * 5) * 10) / 10
    });
  }
  return trends;
}

const castData = [
  { name: '张伟', role: '导演', influence: 0.9 },
  { name: '李明', role: '主演', influence: 0.85 },
  { name: '王芳', role: '主演', influence: 0.8 },
  { name: '刘洋', role: '编剧', influence: 0.75 },
  { name: '陈静', role: '配角', influence: 0.6 }
];

function generateCast(movieId: string): Array<{id: string, movie_id: string, name: string, role: string, avatar: string, influence_weight: number}> {
  return castData.map(cast => ({
    id: generateId(),
    movie_id: movieId,
    name: cast.name,
    role: cast.role,
    avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Portrait%20of%20${encodeURIComponent(cast.name)}%20celebrity&image_size=square`,
    influence_weight: cast.influence
  }));
}

const cinemas = ['万达影城', 'CGV影城', '百丽宫影城', '金逸影城', '耀莱成龙影城'];
const hallTypes = ['2D厅', '3D厅', 'IMAX厅', '杜比全景声厅', 'VIP厅'];

function generateSessions(movies: typeof moviesData): Array<{id: string, movie_id: string, cinema_name: string, start_time: string, hall_type: string}> {
  const sessions = [];
  for (let i = 0; i < 20; i++) {
    const movie = movies[i % movies.length];
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(i / 4));
    const hour = 10 + (i % 4) * 3;
    date.setHours(hour, 0, 0, 0);
    sessions.push({
      id: generateId(),
      movie_id: movie.id,
      cinema_name: cinemas[i % cinemas.length],
      start_time: date.toISOString().slice(0, 19).replace('T', ' '),
      hall_type: hallTypes[i % hallTypes.length]
    });
  }
  return sessions;
}

function generateSeats(sessionId: string): Array<{id: string, session_id: string, row_num: number, col_num: number, status: string, seat_type: string, view_angle: number, price: number}> {
  const seats = [];
  const rows = 10;
  const cols = 12;
  const basePrice = 35 + Math.random() * 30;
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const random = Math.random();
      let status = 'available';
      if (random < 0.15) status = 'sold';
      else if (random < 0.25) status = 'locked';
      
      let seatType = 'normal';
      if (row === 5 && col <= 2) seatType = 'accessible';
      else if (row >= 8 && row <= 9 && col >= 5 && col <= 8) seatType = 'vip';
      else if (col % 2 === 1 && col < cols && row >= 4 && row <= 6) seatType = 'couple';
      
      const centerRow = rows / 2;
      const centerCol = cols / 2;
      const rowDist = Math.abs(row - centerRow) / centerRow;
      const colDist = Math.abs(col - centerCol) / centerCol;
      const viewAngle = 90 - (rowDist + colDist) * 30;
      
      let price = basePrice;
      if (seatType === 'vip') price *= 1.5;
      else if (seatType === 'couple') price *= 1.2;
      if (row >= 4 && row <= 7) price *= 1.1;
      
      seats.push({
        id: generateId(),
        session_id: sessionId,
        row_num: row,
        col_num: col,
        status,
        seat_type: seatType,
        view_angle: Math.round(viewAngle * 10) / 10,
        price: Math.round(price * 100) / 100
      });
    }
  }
  return seats;
}

const usersData = [
  {
    id: generateId(),
    phone: '13800138001',
    nickname: '电影迷小王',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Avatar%20young%20man%20casual%20style&image_size=square',
    is_vip: 1,
    vip_level: 3,
    view_history_vector: JSON.stringify([1, 0, 1, 0, 1, 1, 0, 1, 1, 0]),
    content_quality_score: 85.5
  },
  {
    id: generateId(),
    phone: '13800138002',
    nickname: '文艺青年小李',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Avatar%20young%20woman%20artistic%20style&image_size=square',
    is_vip: 1,
    vip_level: 2,
    view_history_vector: JSON.stringify([0, 1, 1, 1, 0, 1, 0, 1, 0, 1]),
    content_quality_score: 92.0
  },
  {
    id: generateId(),
    phone: '13800138003',
    nickname: '科幻迷老张',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Avatar%20middle%20aged%20man%20professional&image_size=square',
    is_vip: 0,
    vip_level: 0,
    view_history_vector: JSON.stringify([1, 1, 0, 0, 1, 0, 1, 0, 1, 1]),
    content_quality_score: 78.0
  }
];

function generateVipPoints(users: typeof usersData): Array<{id: string, user_id: string, points: number, source: string, expired_at: string}> {
  const pointsData = [];
  const sources = ['购票奖励', '评价奖励', '签到奖励', '分享奖励', '活动赠送'];
  for (const user of users) {
    if (user.is_vip) {
      for (let i = 0; i < 5; i++) {
        const expiredAt = new Date();
        expiredAt.setMonth(expiredAt.getMonth() + 3);
        pointsData.push({
          id: generateId(),
          user_id: user.id,
          points: Math.floor(50 + Math.random() * 200),
          source: sources[i % sources.length],
          expired_at: expiredAt.toISOString().slice(0, 19).replace('T', ' ')
        });
      }
    }
  }
  return pointsData;
}

function generateCoupons(users: typeof usersData): Array<{id: string, user_id: string, type: string, value: number, is_used: number, expired_at: string}> {
  const coupons = [];
  for (const user of users) {
    if (user.is_vip) {
      const expiredAt = new Date();
      expiredAt.setMonth(expiredAt.getMonth() + 1);
      coupons.push({
        id: generateId(),
        user_id: user.id,
        type: 'buy1get1',
        value: 1,
        is_used: 0,
        expired_at: expiredAt.toISOString().slice(0, 19).replace('T', ' ')
      });
      coupons.push({
        id: generateId(),
        user_id: user.id,
        type: 'discount',
        value: 20,
        is_used: Math.random() > 0.5 ? 1 : 0,
        expired_at: expiredAt.toISOString().slice(0, 19).replace('T', ' ')
      });
    }
  }
  return coupons;
}

function generatePosts(users: typeof usersData, movies: typeof moviesData): Array<{id: string, user_id: string, movie_id: string, title: string, content: string, quality_score: number, likes_count: number, comments_count: number}> {
  const postTemplates = [
    { title: '年度最佳科幻片！', content: '特效震撼，剧情精彩，强烈推荐大家去看！', quality: 88 },
    { title: '这部电影的镜头语言太美了', content: '每一帧都是壁纸级别，导演的构图能力太强了。', quality: 92 },
    { title: '看完久久不能平静', content: '深入探讨了人性的复杂，值得反复品味。', quality: 85 },
    { title: '配乐太加分了', content: '音乐与画面完美融合，情感渲染到位。', quality: 80 },
    { title: '演技炸裂', content: '主演的表现太精彩了，完全代入角色。', quality: 87 },
    { title: '剧本扎实，节奏紧凑', content: '全程无尿点，剧情反转出人意料。', quality: 83 }
  ];
  
  const posts = [];
  for (let i = 0; i < 12; i++) {
    const template = postTemplates[i % postTemplates.length];
    const user = users[i % users.length];
    const movie = movies[i % movies.length];
    posts.push({
      id: generateId(),
      user_id: user.id,
      movie_id: movie.id,
      title: template.title,
      content: template.content,
      quality_score: template.quality + Math.random() * 10,
      likes_count: Math.floor(Math.random() * 500),
      comments_count: Math.floor(Math.random() * 50)
    });
  }
  return posts;
}

function generateVideos(movies: typeof moviesData): Array<{id: string, title: string, description: string, video_url: string, thumbnail_url: string, movie_id: string, tags: string, completion_rate: number, views: number, likes: number, comments: number, shares: number}> {
  const videos = [];
  for (let i = 0; i < 15; i++) {
    const movie = movies[i % movies.length];
    const type = i % 3 === 0 ? '预告片' : i % 3 === 1 ? '精彩片段' : '幕后花絮';
    videos.push({
      id: generateId(),
      title: `${movie.title} - ${type}${Math.floor(i / 3) + 1}`,
      description: `${movie.title}的${type}内容，不容错过！`,
      video_url: `https://example.com/videos/${generateId()}.mp4`,
      thumbnail_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(movie.title)}%20video%20thumbnail&image_size=landscape_16_9`,
      movie_id: movie.id,
      tags: JSON.stringify([movie.genre.split('/')[0], type, movie.title]),
      completion_rate: 45 + Math.random() * 40,
      views: Math.floor(1000 + Math.random() * 50000),
      likes: Math.floor(Math.random() * 2000),
      comments: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 500)
    });
  }
  return videos;
}

const festivalsData = [
  {
    id: generateId(),
    name: '夏季国际电影节',
    description: '汇聚全球优秀影片的年度盛事，展映来自50多个国家的200多部影片。',
    start_date: '2025-06-15',
    end_date: '2025-06-25',
    location: '上海文化中心'
  },
  {
    id: generateId(),
    name: '青年导演影展',
    description: '发掘新锐导演，展示创新影像表达的平台。',
    start_date: '2025-07-10',
    end_date: '2025-07-20',
    location: '北京国际影城'
  }
];

function generateFestivalSchedules(festivals: typeof festivalsData, movies: typeof moviesData): Array<{id: string, festival_id: string, movie_id: string, screening_time: string, venue: string}> {
  const schedules = [];
  const venues = ['主会场1号厅', '主会场2号厅', '分会场A厅', '分会场B厅'];
  
  for (const festival of festivals) {
    for (let i = 0; i < 8; i++) {
      const movie = movies[i % movies.length];
      const date = new Date(festival.start_date);
      date.setDate(date.getDate() + Math.floor(i / 4));
      date.setHours(10 + (i % 4) * 3, 0, 0);
      schedules.push({
        id: generateId(),
        festival_id: festival.id,
        movie_id: movie.id,
        screening_time: date.toISOString().slice(0, 19).replace('T', ' '),
        venue: venues[i % venues.length]
      });
    }
  }
  return schedules;
}

const interviewsData = [
  {
    id: generateId(),
    title: '《星际探索》导演专访：探索人类的未来',
    content: '导演张伟分享了创作《星际探索》的心路历程，以及对科幻电影未来的思考。',
    director_name: '张伟',
    video_url: 'https://example.com/interviews/1.mp4',
    publish_date: '2025-06-10'
  },
  {
    id: generateId(),
    title: '导演李明谈《城市迷雾》的创作灵感',
    content: '李明导演讲述了《城市迷雾》背后的故事创作灵感来源。',
    director_name: '李明',
    video_url: 'https://example.com/interviews/2.mp4',
    publish_date: '2025-05-15'
  },
  {
    id: generateId(),
    title: '独立电影的生存之道',
    content: '资深导演王芳分享独立电影的创作和发行经验。',
    director_name: '王芳',
    video_url: 'https://example.com/interviews/3.mp4',
    publish_date: '2025-06-20'
  }
];

function generateFollows(users: typeof usersData): Array<{id: string, follower_id: string, following_id: string}> {
  const follows = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        follows.push({
          id: generateId(),
          follower_id: users[i].id,
          following_id: users[j].id
        });
      }
    }
  }
  return follows;
}

export function seedDatabase(): void {
  const checkStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movies'");
  const tableExists = checkStmt.get();
  
  if (!tableExists) {
    console.log('Database tables not created yet, skipping seed');
    return;
  }
  
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM movies");
  const result = countStmt.get() as { count: number };
  
  if (result.count > 0) {
    console.log('Database already seeded, skipping');
    return;
  }
  
  const insertMovie = db.prepare(`
    INSERT INTO movies (id, title, poster, description, duration, release_date, genre)
    VALUES (@id, @title, @poster, @description, @duration, @release_date, @genre)
  `);
  
  const insertScore = db.prepare(`
    INSERT INTO scores (id, movie_id, source, score, vote_count)
    VALUES (@id, @movie_id, @source, @score, @vote_count)
  `);
  
  const insertHeatTrend = db.prepare(`
    INSERT INTO heat_trends (id, movie_id, trend_date, value)
    VALUES (@id, @movie_id, @trend_date, @value)
  `);
  
  const insertCast = db.prepare(`
    INSERT INTO cast_members (id, movie_id, name, role, avatar, influence_weight)
    VALUES (@id, @movie_id, @name, @role, @avatar, @influence_weight)
  `);
  
  const insertSession = db.prepare(`
    INSERT INTO sessions (id, movie_id, cinema_name, start_time, hall_type)
    VALUES (@id, @movie_id, @cinema_name, @start_time, @hall_type)
  `);
  
  const insertSeat = db.prepare(`
    INSERT INTO seats (id, session_id, row_num, col_num, status, seat_type, view_angle, price)
    VALUES (@id, @session_id, @row_num, @col_num, @status, @seat_type, @view_angle, @price)
  `);
  
  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, nickname, avatar, is_vip, vip_level, view_history_vector, content_quality_score)
    VALUES (@id, @phone, @nickname, @avatar, @is_vip, @vip_level, @view_history_vector, @content_quality_score)
  `);
  
  const insertPoints = db.prepare(`
    INSERT INTO vip_points (id, user_id, points, source, expired_at)
    VALUES (@id, @user_id, @points, @source, @expired_at)
  `);
  
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, user_id, type, value, is_used, expired_at)
    VALUES (@id, @user_id, @type, @value, @is_used, @expired_at)
  `);
  
  const insertPost = db.prepare(`
    INSERT INTO ugc_posts (id, user_id, movie_id, title, content, quality_score, likes_count, comments_count)
    VALUES (@id, @user_id, @movie_id, @title, @content, @quality_score, @likes_count, @comments_count)
  `);
  
  const insertVideo = db.prepare(`
    INSERT INTO videos (id, title, description, video_url, thumbnail_url, movie_id, tags, completion_rate, views, likes, comments, shares)
    VALUES (@id, @title, @description, @video_url, @thumbnail_url, @movie_id, @tags, @completion_rate, @views, @likes, @comments, @shares)
  `);
  
  const insertFestival = db.prepare(`
    INSERT INTO film_festivals (id, name, description, start_date, end_date, location)
    VALUES (@id, @name, @description, @start_date, @end_date, @location)
  `);
  
  const insertSchedule = db.prepare(`
    INSERT INTO festival_schedules (id, festival_id, movie_id, screening_time, venue)
    VALUES (@id, @festival_id, @movie_id, @screening_time, @venue)
  `);
  
  const insertInterview = db.prepare(`
    INSERT INTO director_interviews (id, title, content, director_name, video_url, publish_date)
    VALUES (@id, @title, @content, @director_name, @video_url, @publish_date)
  `);
  
  const insertFollow = db.prepare(`
    INSERT INTO follows (id, follower_id, following_id)
    VALUES (@id, @follower_id, @following_id)
  `);
  
  const transaction = db.transaction(() => {
    for (const movie of moviesData) {
      insertMovie.run(movie);
      
      const scores = generateScores(movie.id);
      for (const score of scores) {
        insertScore.run(score);
      }
      
      const trends = generateHeatTrends(movie.id);
      for (const trend of trends) {
        insertHeatTrend.run(trend);
      }
      
      const casts = generateCast(movie.id);
      for (const cast of casts) {
        insertCast.run(cast);
      }
    }
    
    const sessions = generateSessions(moviesData);
    for (const session of sessions) {
      insertSession.run(session);
      
      const seats = generateSeats(session.id);
      for (const seat of seats) {
        insertSeat.run(seat);
      }
    }
    
    for (const user of usersData) {
      insertUser.run(user);
    }
    
    const points = generateVipPoints(usersData);
    for (const point of points) {
      insertPoints.run(point);
    }
    
    const coupons = generateCoupons(usersData);
    for (const coupon of coupons) {
      insertCoupon.run(coupon);
    }
    
    const posts = generatePosts(usersData, moviesData);
    for (const post of posts) {
      insertPost.run(post);
    }
    
    const videos = generateVideos(moviesData);
    for (const video of videos) {
      insertVideo.run(video);
    }
    
    for (const festival of festivalsData) {
      insertFestival.run(festival);
    }
    
    const schedules = generateFestivalSchedules(festivalsData, moviesData);
    for (const schedule of schedules) {
      insertSchedule.run(schedule);
    }
    
    for (const interview of interviewsData) {
      insertInterview.run(interview);
    }
    
    const follows = generateFollows(usersData);
    for (const follow of follows) {
      insertFollow.run(follow);
    }
  });
  
  transaction();
  
  console.log('Database seeded successfully!');
  console.log(`- ${moviesData.length} movies`);
  console.log(`- ${20} sessions`);
  console.log(`- ${20 * 120} seats`);
  console.log(`- ${usersData.length} users`);
  console.log(`- ${interviewsData.length} director interviews`);
}

export default seedDatabase;
