const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

let db = {};
let nextIds = {};

const initDatabase = () => {
  return new Promise((resolve) => {
    db.users = [
      { id: 1, nickname: '才艺小姐姐', avatar: 'https://picsum.photos/seed/user1/100/100', vip_level: 1, location: '北京', followers: 12580, following: 36, coins: 1000 },
      { id: 2, nickname: '游戏达人', avatar: 'https://picsum.photos/seed/user2/100/100', vip_level: 0, location: '上海', followers: 8960, following: 128, coins: 500 },
      { id: 3, nickname: '唱歌主播', avatar: 'https://picsum.photos/seed/user3/100/100', vip_level: 2, location: '广州', followers: 25680, following: 88, coins: 2000 },
      { id: 4, nickname: '户外探险', avatar: 'https://picsum.photos/seed/user4/100/100', vip_level: 0, location: '深圳', followers: 6780, following: 56, coins: 300 },
      { id: 5, nickname: '聊天达人', avatar: 'https://picsum.photos/seed/user5/100/100', vip_level: 1, location: '杭州', followers: 15890, following: 120, coins: 1500 },
    ];

    db.live_rooms = [
      { id: 1, user_id: 1, title: '精彩舞蹈表演', category: '才艺', location: '北京', viewers: 1560, likes: 8900, status: 1 },
      { id: 2, user_id: 2, title: '王者农药上分啦', category: '游戏', location: '上海', viewers: 2380, likes: 12500, status: 1 },
      { id: 3, user_id: 3, title: '经典老歌专场', category: '才艺', location: '广州', viewers: 3200, likes: 18600, status: 1 },
      { id: 4, user_id: 4, title: '户外探险直播', category: '其他', location: '深圳', viewers: 890, likes: 4500, status: 1 },
      { id: 5, user_id: 5, title: '深夜情感聊天', category: '聊天', location: '杭州', viewers: 4500, likes: 28000, status: 1 },
    ];

    db.gifts = [
      { id: 1, name: '爱心', icon: '❤️', price: 1, type: 'normal', is_vip: 0 },
      { id: 2, name: '鲜花', icon: '🌹', price: 5, type: 'normal', is_vip: 0 },
      { id: 3, name: '钻戒', icon: '💍', price: 50, type: 'normal', is_vip: 0 },
      { id: 4, name: '火箭', icon: '🚀', price: 100, type: 'normal', is_vip: 0 },
      { id: 5, name: '城堡', icon: '🏰', price: 500, type: 'vip', is_vip: 1 },
      { id: 6, name: '皇冠', icon: '👑', price: 1000, type: 'vip', is_vip: 1 },
    ];

    db.banners = [
      { id: 1, title: '新人礼包', image: 'https://picsum.photos/800/300?random=1', sort: 1, status: 1 },
      { id: 2, title: 'VIP特权', image: 'https://picsum.photos/800/300?random=2', sort: 2, status: 1 },
      { id: 3, title: '热门活动', image: 'https://picsum.photos/800/300?random=3', sort: 3, status: 1 },
    ];

    db.channels = [
      { id: 1, name: '推荐', sort: 1, status: 1 },
      { id: 2, name: '附近', sort: 2, status: 1 },
      { id: 3, name: '热门', sort: 3, status: 1 },
      { id: 4, name: '才艺', sort: 4, status: 1 },
      { id: 5, name: '游戏', sort: 5, status: 1 },
      { id: 6, name: '聊天', sort: 6, status: 1 },
    ];

    db.comments = [];
    db.moments = [];
    db.check_ins = [];
    db.follows = [];

    nextIds = {
      users: 6,
      live_rooms: 6,
      comments: 1,
      moments: 1,
    };

    console.log('数据库初始化完成');
    resolve();
  });
};

const get = (table, where, params) => {
  let results = db[table] || [];
  if (where) {
    const keys = where.match(/\?/g) ? where.match(/\?/g).length : 0;
    const condition = where.split('WHERE ')[1] || where;
    results = results.filter(item => {
      let match = true;
      const conditions = condition.split(' AND ');
      conditions.forEach((cond, idx) => {
        const [key, op, val] = cond.trim().split(' ');
        if (op === '=') {
          if (idx < params.length && item[key.replace(/"/g, '')] != params[idx]) {
            match = false;
          }
        }
      });
      return match;
    });
  }
  return results[0] || null;
};

const all = (table, where, params) => {
  let results = db[table] || [];
  if (where && where.includes('WHERE')) {
    if (where.includes('category = ?')) {
      const category = params[0];
      results = results.filter(item => item.category === category);
    }
  }
  if (where && where.includes('ORDER BY')) {
    const orderMatch = where.match(/ORDER BY (\w+)/);
    if (orderMatch) {
      const orderKey = orderMatch[1];
      results = [...results].sort((a, b) => b[orderKey] - a[orderKey]);
    }
  }
  if (where && where.includes('LIMIT')) {
    const limitMatch = where.match(/LIMIT (\d+)( OFFSET (\d+))?/);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      const offset = limitMatch[3] ? parseInt(limitMatch[3]) : 0;
      results = results.slice(offset, offset + limit);
    }
  }
  return results;
};

const run = (table, values, callback) => {
  if (values.includes('INSERT INTO')) {
    const match = values.match(/INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\)/);
    if (match) {
      const tableName = match[1];
      const cols = match[2].split(',').map(c => c.trim());
      const newItem = {};
      cols.forEach((col, idx) => {
        newItem[col] = db[tableName].length > idx ? db[tableName][0][col] : null;
      });
      newItem.id = nextIds[tableName]++;
      db[tableName].push(newItem);
      if (callback) callback.call({ lastID: newItem.id, changes: 1 }, null);
    }
  } else if (values.includes('UPDATE')) {
    const match = values.match(/UPDATE (\w+) SET (.+) WHERE (.+)/);
    if (match) {
      const tableName = match[1];
      if (callback) callback.call({ changes: 1 }, null);
    }
  }
  return { changes: 1 };
};

module.exports = { db, initDatabase, get, all, run };
