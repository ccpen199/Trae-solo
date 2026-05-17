const { db } = require('../database');

function initSampleData() {
  const sampleUsers = [
    { phone: '13800138001', nickname: '旅行达人小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', bio: '用镜头记录每一次旅行', followers_count: 15680, following_count: 256, works_count: 128 },
    { phone: '13800138002', nickname: '美食博主大胃王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', bio: '吃遍天下美食', followers_count: 28960, following_count: 189, works_count: 256 },
    { phone: '13800138003', nickname: '萌宠铲屎官', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', bio: '家有三只猫主子', followers_count: 56890, following_count: 128, works_count: 356 },
    { phone: '13800138004', nickname: '健身教练Tony', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', bio: '带你科学健身', followers_count: 32560, following_count: 89, works_count: 189 },
    { phone: '13800138005', nickname: '摄影师小白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', bio: '用相机记录美好瞬间', followers_count: 18950, following_count: 256, works_count: 156 },
    { phone: '13800138006', nickname: '音乐人阿杰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', bio: '用音乐治愈心灵', followers_count: 42580, following_count: 156, works_count: 289 },
    { phone: '13800138007', nickname: '舞蹈老师Lisa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', bio: '热爱舞蹈，分享快乐', followers_count: 68950, following_count: 89, works_count: 328 },
    { phone: '13800138008', nickname: '穿搭博主小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', bio: '每天分享穿搭小技巧', followers_count: 35680, following_count: 198, works_count: 256 }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (phone, nickname, avatar, bio, followers_count, following_count, works_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  sampleUsers.forEach(user => {
    insertUser.run(user.phone, user.nickname, user.avatar, user.bio, user.followers_count, user.following_count, user.works_count);
  });

  const sampleVideos = [
    {
      user_id: 1,
      title: '美好的一天从日出开始',
      description: '清晨5点起床，记录下这美丽的日出时刻。生活就是要多看看这些美好的风景～',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=1',
      duration: 30,
      likes_count: 12580,
      comments_count: 328,
      shares_count: 156,
      views_count: 89560
    },
    {
      user_id: 2,
      title: '今日份美食打卡',
      description: '终于吃到了心心念念的寿喜烧！太满足了！强烈推荐这家店～',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=2',
      duration: 45,
      likes_count: 8920,
      comments_count: 256,
      shares_count: 89,
      views_count: 56890
    },
    {
      user_id: 3,
      title: '猫咪的日常',
      description: '我家主子的日常卖萌，谁能拒绝这么可爱的小猫咪呢～',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=3',
      duration: 25,
      likes_count: 25680,
      comments_count: 589,
      shares_count: 326,
      views_count: 156890
    },
    {
      user_id: 4,
      title: '健身第100天打卡',
      description: '坚持健身100天，变化真的太大了！想知道我是怎么做到的吗？',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=4',
      duration: 60,
      likes_count: 15680,
      comments_count: 423,
      shares_count: 198,
      views_count: 98560
    },
    {
      user_id: 5,
      title: '周末旅行vlog',
      description: '周末去了一个超美的小众景点，人少景美，太适合拍照了！',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=5',
      duration: 55,
      likes_count: 11250,
      comments_count: 289,
      shares_count: 156,
      views_count: 78960
    },
    {
      user_id: 6,
      title: '吉他弹唱-晴天',
      description: '经典永不过时，一首《晴天》送给大家～',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=6',
      duration: 45,
      likes_count: 18960,
      comments_count: 456,
      shares_count: 236,
      views_count: 125680
    },
    {
      user_id: 7,
      title: '舞蹈练习室版',
      description: '新学的舞蹈，还不太熟练，大家多多包涵～',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=7',
      duration: 50,
      likes_count: 22580,
      comments_count: 568,
      shares_count: 289,
      views_count: 168560
    },
    {
      user_id: 8,
      title: '初秋穿搭分享',
      description: '初秋第一件卫衣穿搭来啦！舒适又好看，赶紧get起来～',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      cover_url: 'https://picsum.photos/400/700?random=8',
      duration: 35,
      likes_count: 9850,
      comments_count: 236,
      shares_count: 125,
      views_count: 68950
    }
  ];

  const insertVideo = db.prepare(`
    INSERT OR IGNORE INTO videos (user_id, title, description, video_url, cover_url, duration, likes_count, comments_count, shares_count, views_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const existingVideos = db.prepare('SELECT COUNT(*) as count FROM videos').get();
  if (existingVideos.count === 0) {
    sampleVideos.forEach(video => {
      insertVideo.run(
        video.user_id,
        video.title,
        video.description,
        video.video_url,
        video.cover_url,
        video.duration,
        video.likes_count,
        video.comments_count,
        video.shares_count,
        video.views_count
      );
    });
    console.log('Sample videos inserted successfully');
  }

  const sampleLiveRooms = [
    { user_id: 3, title: '猫咪吃播时间～', cover_url: 'https://picsum.photos/400/300?random=11', viewers_count: 1258, is_live: 1 },
    { user_id: 6, title: '深夜歌房，点歌请留言', cover_url: 'https://picsum.photos/400/300?random=12', viewers_count: 896, is_live: 1 },
    { user_id: 7, title: '新舞教学，进来学！', cover_url: 'https://picsum.photos/400/300?random=13', viewers_count: 2560, is_live: 1 }
  ];

  const insertLiveRoom = db.prepare(`
    INSERT OR IGNORE INTO live_rooms (user_id, title, cover_url, viewers_count, is_live)
    VALUES (?, ?, ?, ?, ?)
  `);

  sampleLiveRooms.forEach(room => {
    insertLiveRoom.run(room.user_id, room.title, room.cover_url, room.viewers_count, room.is_live);
  });

  console.log('Sample data initialization completed');
}

module.exports = { initSampleData };
