const db = require('./db');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      password TEXT NOT NULL,
      coins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      description TEXT,
      followers INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER,
      album TEXT,
      cover TEXT,
      audio_url TEXT,
      duration INTEGER DEFAULT 180,
      lyrics TEXT,
      plays INTEGER DEFAULT 0,
      complete_plays INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      release_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (artist_id) REFERENCES artists (id)
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      description TEXT,
      user_id INTEGER,
      plays INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      is_public BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER,
      song_id INTEGER,
      order_index INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlist_id) REFERENCES playlists (id),
      FOREIGN KEY (song_id) REFERENCES songs (id),
      UNIQUE (playlist_id, song_id)
    );

    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      song_id INTEGER,
      play_duration INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (song_id) REFERENCES songs (id)
    );

    CREATE TABLE IF NOT EXISTS coin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      song_id INTEGER,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (song_id) REFERENCES songs (id)
    );

    CREATE TABLE IF NOT EXISTS advertisements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      link TEXT,
      description TEXT,
      position TEXT,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      song_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (song_id) REFERENCES songs (id),
      UNIQUE (user_id, song_id)
    );

    CREATE TABLE IF NOT EXISTS disliked_songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      song_id INTEGER,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (song_id) REFERENCES songs (id),
      UNIQUE (user_id, song_id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('数据库表创建完成');
};

const seedData = () => {
  const artistCount = db.prepare('SELECT COUNT(*) as count FROM artists').get().count;
  if (artistCount > 0) {
    console.log('种子数据已存在，跳过');
    return;
  }

  const artists = [
    { name: '周杰伦', avatar: 'https://picsum.photos/seed/zhoujielun/200/200', description: '华语流行天王' },
    { name: '林俊杰', avatar: 'https://picsum.photos/seed/linjunjie/200/200', description: '新加坡创作歌手' },
    { name: '邓紫棋', avatar: 'https://picsum.photos/seed/dengziqi/200/200', description: '实力派女歌手' },
    { name: '薛之谦', avatar: 'https://picsum.photos/seed/xuezhiqian/200/200', description: '创作型歌手' },
    { name: '毛不易', avatar: 'https://picsum.photos/seed/maobuyi/200/200', description: '民谣歌手' },
    { name: '华晨宇', avatar: 'https://picsum.photos/seed/huachenyu/200/200', description: '音乐鬼才' },
  ];

  const insertArtist = db.prepare('INSERT INTO artists (name, avatar, description, followers) VALUES (?, ?, ?, ?)');
  const artistIds = [];
  artists.forEach((artist, index) => {
    const result = insertArtist.run(artist.name, artist.avatar, artist.description, 100000 + index * 10000);
    artistIds.push(result.lastInsertRowid);
  });

  const songs = [
    { title: '晴天', artist_id: artistIds[0], album: '叶惠美', cover: 'https://picsum.photos/seed/song1/300/300', duration: 269, plays: 999999, complete_plays: 888888, likes: 66666 },
    { title: '七里香', artist_id: artistIds[0], album: '七里香', cover: 'https://picsum.photos/seed/song2/300/300', duration: 299, plays: 888888, complete_plays: 777777, likes: 55555 },
    { title: '稻香', artist_id: artistIds[0], album: '魔杰座', cover: 'https://picsum.photos/seed/song3/300/300', duration: 223, plays: 777777, complete_plays: 666666, likes: 44444 },
    { title: '江南', artist_id: artistIds[1], album: '第二天堂', cover: 'https://picsum.photos/seed/song4/300/300', duration: 248, plays: 666666, complete_plays: 555555, likes: 33333 },
    { title: '修炼爱情', artist_id: artistIds[1], album: '因你而在', cover: 'https://picsum.photos/seed/song5/300/300', duration: 295, plays: 555555, complete_plays: 444444, likes: 22222 },
    { title: '光年之外', artist_id: artistIds[2], album: '太空旅客', cover: 'https://picsum.photos/seed/song6/300/300', duration: 235, plays: 444444, complete_plays: 333333, likes: 11111 },
    { title: '泡沫', artist_id: artistIds[2], album: 'Xposed', cover: 'https://picsum.photos/seed/song7/300/300', duration: 258, plays: 333333, complete_plays: 222222, likes: 9999 },
    { title: '演员', artist_id: artistIds[3], album: '绅士', cover: 'https://picsum.photos/seed/song8/300/300', duration: 270, plays: 222222, complete_plays: 111111, likes: 8888 },
    { title: '丑八怪', artist_id: artistIds[3], album: '意外', cover: 'https://picsum.photos/seed/song9/300/300', duration: 256, plays: 111111, complete_plays: 99999, likes: 7777 },
    { title: '消愁', artist_id: artistIds[4], album: '平凡的一天', cover: 'https://picsum.photos/seed/song10/300/300', duration: 285, plays: 99999, complete_plays: 88888, likes: 6666 },
    { title: '像我这样的人', artist_id: artistIds[4], album: '平凡的一天', cover: 'https://picsum.photos/seed/song11/300/300', duration: 268, plays: 88888, complete_plays: 77777, likes: 5555 },
    { title: '烟火里的尘埃', artist_id: artistIds[5], album: '卡西莫多的礼物', cover: 'https://picsum.photos/seed/song12/300/300', duration: 245, plays: 77777, complete_plays: 66666, likes: 4444 },
  ];

  const lyrics = `[00:00.00]歌曲名 - 歌手名
[00:05.00]作词：作词者 作曲：作曲者
[00:15.00]这是第一段歌词
[00:25.00]描述着美好的时光
[00:35.00]阳光洒落在大地上
[00:45.00]温暖着人们的心房
[00:55.00]这是第二段歌词
[01:05.00]唱着我们的梦想
[01:15.00]无论前方有多艰难
[01:25.00]我们都要勇敢去闯
[01:35.00]副歌部分开始了
[01:45.00]让我们一起唱响
[01:55.00]这首属于我们的歌
[02:05.00]永远不会忘记
[02:15.00]这是第三段歌词
[02:25.00]回忆着美好过往
[02:35.00]那些珍贵的瞬间
[02:45.00]永远在心中流淌`;

  const insertSong = db.prepare('INSERT INTO songs (title, artist_id, album, cover, audio_url, duration, lyrics, plays, complete_plays, likes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  songs.forEach(song => {
    insertSong.run(
      song.title,
      song.artist_id,
      song.album,
      song.cover,
      `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 16) + 1}.mp3`,
      song.duration,
      lyrics,
      song.plays,
      song.complete_plays,
      song.likes
    );
  });

  const playlists = [
    { title: '华语流行精选', cover: 'https://picsum.photos/seed/playlist1/300/300', description: '精选华语流行金曲', songs: [1, 2, 3, 4, 5] },
    { title: '治愈系音乐', cover: 'https://picsum.photos/seed/playlist2/300/300', description: '舒缓心情的好歌', songs: [1, 6, 10, 11] },
    { title: '运动健身必备', cover: 'https://picsum.photos/seed/playlist3/300/300', description: '运动时的最佳陪伴', songs: [2, 4, 7, 12] },
    { title: '深夜电台', cover: 'https://picsum.photos/seed/playlist4/300/300', description: '适合夜晚聆听的歌曲', songs: [3, 5, 8, 9, 10] },
  ];

  const insertPlaylist = db.prepare('INSERT INTO playlists (title, cover, description, plays, likes) VALUES (?, ?, ?, ?, ?)');
  const insertPlaylistSong = db.prepare('INSERT INTO playlist_songs (playlist_id, song_id, order_index) VALUES (?, ?, ?)');
  
  playlists.forEach((playlist, index) => {
    const result = insertPlaylist.run(playlist.title, playlist.cover, playlist.description, 50000 + index * 10000, 10000 + index * 2000);
    const playlistId = result.lastInsertRowid;
    playlist.songs.forEach((songId, songIndex) => {
      insertPlaylistSong.run(playlistId, songId, songIndex);
    });
  });

  const ads = [
    { title: '新专辑首发', cover: 'https://picsum.photos/seed/ad1/600/300', link: '#', description: '周杰伦最新专辑震撼上线', position: 'home_banner' },
    { title: '会员专享', cover: 'https://picsum.photos/seed/ad2/300/300', link: '#', description: '开通会员畅享无损音质', position: 'home_card' },
  ];

  const insertAd = db.prepare('INSERT INTO advertisements (title, cover, link, description, position) VALUES (?, ?, ?, ?, ?)');
  ads.forEach(ad => {
    insertAd.run(ad.title, ad.cover, ad.link, ad.description, ad.position);
  });

  const categories = [
    { name: '流行', icon: '🎵', sort_order: 1 },
    { name: '摇滚', icon: '🎸', sort_order: 2 },
    { name: '民谣', icon: '🎤', sort_order: 3 },
    { name: '电子', icon: '🎧', sort_order: 4 },
    { name: '古典', icon: '🎻', sort_order: 5 },
    { name: '说唱', icon: '🎹', sort_order: 6 },
  ];

  const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
  categories.forEach(cat => {
    insertCategory.run(cat.name, cat.icon, cat.sort_order);
  });

  console.log('种子数据插入完成');
};

if (require.main === module) {
  initDatabase();
  seedData();
  console.log('数据库初始化完成！');
  db.close();
}

module.exports = { initDatabase, seedData };
