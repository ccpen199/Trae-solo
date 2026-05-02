const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '..', 'data', 'app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    coins INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    image TEXT,
    rarity TEXT DEFAULT 'common',
    value INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES game_items(id)
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    result_item_id INTEGER NOT NULL,
    result_count INTEGER DEFAULT 1,
    unlocked_level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_item_id) REFERENCES game_items(id)
  );

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (item_id) REFERENCES game_items(id)
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const initGameData = () => {
  const itemsCount = db.prepare('SELECT COUNT(*) as count FROM game_items').get();
  if (itemsCount.count > 0) return;

  const items = [
    { name: '木柴', description: '基础材料，可用于合成', category: 'material', level: 1, rarity: 'common', value: 5 },
    { name: '石头', description: '坚硬的石头', category: 'material', level: 1, rarity: 'common', value: 5 },
    { name: '水', description: '清澈的水', category: 'material', level: 1, rarity: 'common', value: 3 },
    { name: '泥土', description: '肥沃的泥土', category: 'material', level: 1, rarity: 'common', value: 2 },
    { name: '种子', description: '神奇的种子', category: 'material', level: 1, rarity: 'common', value: 4 },
    { name: '木板', description: '由木柴合成的木板', category: 'material', level: 2, rarity: 'uncommon', value: 15 },
    { name: '砖块', description: '烧制的砖块', category: 'material', level: 2, rarity: 'uncommon', value: 15 },
    { name: '花园', description: '美丽的小花园', category: 'decoration', level: 3, rarity: 'rare', value: 100 },
    { name: '喷泉', description: '优雅的喷泉', category: 'decoration', level: 4, rarity: 'rare', value: 200 },
    { name: '小屋', description: '温馨的小屋', category: 'building', level: 5, rarity: 'epic', value: 500 },
  ];

  const insertItem = db.prepare('INSERT INTO game_items (name, description, category, level, rarity, value) VALUES (?, ?, ?, ?, ?, ?)');
  const itemIds = {};

  items.forEach(item => {
    const result = insertItem.run(item.name, item.description, item.category, item.level, item.rarity, item.value);
    itemIds[item.name] = result.lastInsertRowid;
  });

  const recipes = [
    { name: '合成木板', description: '用木柴合成木板', result_item: '木板', result_count: 1, unlocked_level: 2, ingredients: [{ item: '木柴', count: 3 }] },
    { name: '合成砖块', description: '用石头和水合成砖块', result_item: '砖块', result_count: 1, unlocked_level: 2, ingredients: [{ item: '石头', count: 2 }, { item: '水', count: 1 }] },
    { name: '建造花园', description: '用泥土、种子和水建造花园', result_item: '花园', result_count: 1, unlocked_level: 3, ingredients: [{ item: '泥土', count: 3 }, { item: '种子', count: 2 }, { item: '水', count: 2 }] },
    { name: '建造喷泉', description: '用砖块、木板和水建造喷泉', result_item: '喷泉', result_count: 1, unlocked_level: 4, ingredients: [{ item: '砖块', count: 2 }, { item: '木板', count: 2 }, { item: '水', count: 3 }] },
    { name: '建造小屋', description: '用木板、砖块和花园建造小屋', result_item: '小屋', result_count: 1, unlocked_level: 5, ingredients: [{ item: '木板', count: 5 }, { item: '砖块', count: 5 }, { item: '花园', count: 2 }] },
  ];

  const insertRecipe = db.prepare('INSERT INTO recipes (name, description, result_item_id, result_count, unlocked_level) VALUES (?, ?, ?, ?, ?)');
  const insertIngredient = db.prepare('INSERT INTO recipe_ingredients (recipe_id, item_id, count) VALUES (?, ?, ?)');

  recipes.forEach(recipe => {
    const resultItemId = itemIds[recipe.result_item];
    const result = insertRecipe.run(recipe.name, recipe.description, resultItemId, recipe.result_count, recipe.unlocked_level);
    const recipeId = result.lastInsertRowid;

    recipe.ingredients.forEach(ing => {
      insertIngredient.run(recipeId, itemIds[ing.item], ing.count);
    });
  });
};

const initBuiltinAccounts = () => {
  const bcrypt = require('bcryptjs');
  
  const builtinAccounts = [
    { username: 'admin', password: '123456', nickname: '管理员', coins: 1000, level: 5 },
    { username: 'player1', password: '123456', nickname: '玩家一号', coins: 500, level: 3 },
    { username: 'test', password: '123456', nickname: '测试账号', coins: 200, level: 2 },
  ];

  const starterItems = ['木柴', '石头', '水', '泥土', '种子'];

  builtinAccounts.forEach(account => {
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(account.username);
    if (existingUser) return;

    const hashedPassword = bcrypt.hashSync(account.password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, coins, level)
      VALUES (?, ?, ?, ?, ?)
    `).run(account.username, hashedPassword, account.nickname, account.coins, account.level);

    const userId = result.lastInsertRowid;

    starterItems.forEach(itemName => {
      const item = db.prepare('SELECT id FROM game_items WHERE name = ?').get(itemName);
      if (item) {
        const count = account.level >= 3 ? 20 : 10;
        db.prepare('INSERT INTO user_items (user_id, item_id, count) VALUES (?, ?, ?)').run(userId, item.id, count);
      }
    });

    if (account.level >= 3) {
      const advancedItems = ['木板', '砖块'];
      advancedItems.forEach(itemName => {
        const item = db.prepare('SELECT id FROM game_items WHERE name = ?').get(itemName);
        if (item) {
          db.prepare('INSERT INTO user_items (user_id, item_id, count) VALUES (?, ?, ?)').run(userId, item.id, 5);
        }
      });
    }

    console.log(`内置账号已创建: ${account.username} / ${account.password}`);
  });
};

initGameData();
initBuiltinAccounts();

module.exports = db;
