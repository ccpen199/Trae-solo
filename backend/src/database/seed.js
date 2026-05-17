const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

async function seedDatabase() {
  console.log('开始填充数据库种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = [
    { username: 'admin', email: 'admin@maoe.fm', nickname: '管理员', bio: '平台官方账号', level: 99, is_vip: 1, fish_dried: 10000 },
    { username: 'anchor1', email: 'anchor1@maoe.fm', nickname: '声优小A', bio: '专业配音演员，代表作《星际恋歌》', level: 25, is_vip: 1, is_anchor: 1, fish_dried: 5000 },
    { username: 'anchor2', email: 'anchor2@maoe.fm', nickname: '配音达人B', bio: '热爱二次元，专注广播剧配音', level: 20, is_vip: 1, is_anchor: 1, fish_dried: 3000 },
    { username: 'user1', email: 'user1@maoe.fm', nickname: '听友小明', bio: '有声剧爱好者', level: 12, fish_dried: 500 },
    { username: 'user2', email: 'user2@maoe.fm', nickname: '二次元少女', bio: '沉迷广播剧无法自拔~', level: 8, fish_dried: 200 }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, nickname, avatar, bio, gender, level, exp, coins, fish_dried, is_vip, is_anchor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  users.forEach((user, index) => {
    insertUser.run(
      user.username,
      user.email,
      hashedPassword,
      user.nickname,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      user.bio,
      index % 2 === 0 ? 'male' : 'female',
      user.level,
      user.level * 100,
      100,
      user.fish_dried,
      user.is_vip || 0,
      user.is_anchor || 0
    );
  });
  console.log('✓ 用户数据已插入');

  const albums = [
    { title: '星际恋歌', category_id: 1, author_id: 2, author_name: '声优小A', description: '一段跨越星际的浪漫爱情故事，讲述宇航员与外星公主的感人邂逅。', is_free: 0, is_recommend: 1, tags: '浪漫,科幻,爱情' },
    { title: '魔道祖师同人剧', category_id: 1, author_id: 3, author_name: '配音达人B', description: '热门IP同人广播剧，还原原著经典场景，带你重温那段仙侠岁月。', is_free: 1, is_recommend: 1, tags: '仙侠,同人,热门' },
    { title: '深夜助眠系列', category_id: 5, author_id: 2, author_name: '声优小A', description: '温柔耳语，自然音效，伴你安然入梦。每晚10点更新~', is_free: 1, is_recommend: 1, tags: '助眠,放松,ASMR' },
    { title: '恐怖鬼故事合集', category_id: 3, author_id: 3, author_name: '配音达人B', description: '精选经典恐怖故事，胆小慎入！建议佩戴耳机收听。', is_free: 0, is_recommend: 0, tags: '恐怖,悬疑,惊悚' },
    { title: '二次元音乐精选', category_id: 4, author_id: 2, author_name: '声优小A', description: '精选热门动漫歌曲，翻唱合集，听觉盛宴！', is_free: 1, is_recommend: 1, tags: '音乐,动漫,翻唱' },
    { title: '职场进阶指南', category_id: 8, author_id: 3, author_name: '配音达人B', description: '职场经验分享，助你升职加薪。', is_free: 0, is_recommend: 0, tags: '职场,教育,实用' },
    { title: '古风悬疑探案集', category_id: 1, author_id: 2, author_name: '声优小A', description: '古代背景下的悬疑探案故事，环环相扣，扣人心弦。', is_free: 1, is_recommend: 1, tags: '古风,悬疑,探案' },
    { title: '轻松搞笑日常', category_id: 6, author_id: 3, author_name: '配音达人B', description: '爆笑日常，让你笑到肚子疼的轻松喜剧。', is_free: 1, is_recommend: 0, tags: '搞笑,日常,喜剧' }
  ];

  const insertAlbum = db.prepare(`
    INSERT OR IGNORE INTO albums (title, cover, description, category_id, author_id, author_name, is_free, price, play_count, favorite_count, like_count, comment_count, subscribe_count, is_published, is_recommend, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  albums.forEach((album, index) => {
    insertAlbum.run(
      album.title,
      `https://picsum.photos/400/400?random=${index + 100}`,
      album.description,
      album.category_id,
      album.author_id,
      album.author_name,
      album.is_free,
      album.is_free ? 0 : 99,
      Math.floor(Math.random() * 100000) + 1000,
      Math.floor(Math.random() * 5000) + 100,
      Math.floor(Math.random() * 3000) + 50,
      Math.floor(Math.random() * 500) + 10,
      Math.floor(Math.random() * 2000) + 50,
      1,
      album.is_recommend,
      album.tags
    );
  });
  console.log('✓ 专辑数据已插入');

  const episodesData = [
    { albumIndex: 0, count: 12, prefix: '第' },
    { albumIndex: 1, count: 8, prefix: '第' },
    { albumIndex: 2, count: 30, prefix: '第' },
    { albumIndex: 3, count: 15, prefix: '第' },
    { albumIndex: 4, count: 20, prefix: '' },
    { albumIndex: 5, count: 10, prefix: '第' },
    { albumIndex: 6, count: 18, prefix: '第' },
    { albumIndex: 7, count: 25, prefix: '第' }
  ];

  const insertEpisode = db.prepare(`
    INSERT OR IGNORE INTO episodes (album_id, title, cover, duration, audio_url, is_free, price, play_count, sort_order, is_published, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  `);

  episodesData.forEach(({ albumIndex, count, prefix }) => {
    for (let i = 1; i <= count; i++) {
      const episodeNames = ['预告', '小剧场', '花絮', '采访', '特别篇'];
      const title = i <= count - 2 
        ? `${prefix}${i}集` + (i === 1 ? ' 精彩开篇' : '')
        : episodeNames[i - (count - 2)] || `${prefix}${i}集`;
      
      insertEpisode.run(
        albumIndex + 1,
        title,
        `https://picsum.photos/400/400?random=${albumIndex * 100 + i + 200}`,
        Math.floor(Math.random() * 1800) + 300,
        `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(i % 17) + 1}.mp3`,
        i <= 3 ? 1 : 0,
        i <= 3 ? 0 : 19,
        Math.floor(Math.random() * 50000) + 500,
        i
      );
    }
  });
  console.log('✓ 剧集数据已插入');

  const liveRooms = [
    { anchor_id: 2, title: '声优小A的配音直播间', category_id: 1, viewer_count: 1256, like_count: 8934, is_live: 1 },
    { anchor_id: 3, title: '晚安电台 - 轻声细语陪你入眠', category_id: 5, viewer_count: 892, like_count: 5621, is_live: 1 }
  ];

  const insertLiveRoom = db.prepare(`
    INSERT OR IGNORE INTO live_rooms (anchor_id, title, cover, description, category_id, viewer_count, like_count, is_live, start_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  liveRooms.forEach((room, index) => {
    insertLiveRoom.run(
      room.anchor_id,
      room.title,
      `https://picsum.photos/800/450?random=${index + 500}`,
      '欢迎来到我的直播间，一起聊聊声音的世界~',
      room.category_id,
      room.viewer_count,
      room.like_count,
      room.is_live
    );
  });
  console.log('✓ 直播间数据已插入');

  const comments = [
    { album_id: 1, user_id: 4, content: '太好听了！声优大大们的声音都超有感染力！' },
    { album_id: 1, user_id: 5, content: '剧情真的很感人，听到最后都哭了QAQ' },
    { album_id: 2, user_id: 4, content: '还原度超高，仿佛又回到了看小说的时候' },
    { album_id: 3, user_id: 5, content: '每晚必听，真的很助眠，谢谢大大！' },
    { album_id: 7, user_id: 4, content: '推理情节设计得很巧妙，声音也超有代入感' }
  ];

  const insertComment = db.prepare(`
    INSERT OR IGNORE INTO comments (user_id, album_id, content, like_count, dislike_count, created_at)
    VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `);

  comments.forEach((comment, index) => {
    insertComment.run(
      comment.user_id,
      comment.album_id,
      comment.content,
      Math.floor(Math.random() * 100) + 10
    );
  });
  console.log('✓ 评论数据已插入');

  db.close();
  console.log('\n数据库种子数据填充完成！');
  console.log('测试账号: admin / 123456');
  console.log('测试主播: anchor1 / 123456, anchor2 / 123456');
}

seedDatabase().catch(err => {
  console.error('填充数据失败:', err);
  process.exit(1);
});
