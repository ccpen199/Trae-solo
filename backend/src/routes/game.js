const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/items', authenticateToken, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT 
        gi.*,
        ui.count as user_count
      FROM game_items gi
      LEFT JOIN user_items ui ON gi.id = ui.item_id AND ui.user_id = ?
      ORDER BY gi.level, gi.rarity
    `).all(req.user.id);
    
    res.json(items);
  } catch (error) {
    console.error('获取物品列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/inventory', authenticateToken, (req, res) => {
  try {
    const inventory = db.prepare(`
      SELECT 
        gi.id,
        gi.name,
        gi.description,
        gi.category,
        gi.level,
        gi.image,
        gi.rarity,
        gi.value,
        ui.count
      FROM user_items ui
      JOIN game_items gi ON ui.item_id = gi.id
      WHERE ui.user_id = ? AND ui.count > 0
      ORDER BY gi.level, gi.rarity
    `).all(req.user.id);
    
    res.json(inventory);
  } catch (error) {
    console.error('获取背包错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/recipes', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT level FROM users WHERE id = ?').get(req.user.id);
    
    const recipes = db.prepare(`
      SELECT 
        r.*,
        gi.name as result_item_name,
        gi.description as result_item_description,
        gi.rarity as result_item_rarity,
        gi.level as result_item_level,
        CASE WHEN r.unlocked_level <= ? THEN 1 ELSE 0 END as is_unlocked
      FROM recipes r
      JOIN game_items gi ON r.result_item_id = gi.id
      ORDER BY r.unlocked_level
    `).all(user.level);

    const recipesWithIngredients = recipes.map(recipe => {
      const ingredients = db.prepare(`
        SELECT 
          ri.item_id,
          gi.name as item_name,
          ri.count as required_count,
          COALESCE(ui.count, 0) as user_count
        FROM recipe_ingredients ri
        JOIN game_items gi ON ri.item_id = gi.id
        LEFT JOIN user_items ui ON ri.item_id = ui.item_id AND ui.user_id = ?
        WHERE ri.recipe_id = ?
      `).all(req.user.id, recipe.id);

      const canCraft = recipe.is_unlocked && ingredients.every(ing => ing.user_count >= ing.required_count);

      return {
        ...recipe,
        ingredients,
        can_craft: canCraft
      };
    });

    res.json(recipesWithIngredients);
  } catch (error) {
    console.error('获取配方列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/craft/:recipeId', authenticateToken, (req, res) => {
  const { recipeId } = req.params;

  try {
    const recipe = db.prepare(`
      SELECT r.*, gi.name as result_name
      FROM recipes r
      JOIN game_items gi ON r.result_item_id = gi.id
      WHERE r.id = ?
    `).get(recipeId);

    if (!recipe) {
      return res.status(404).json({ error: '配方不存在' });
    }

    const user = db.prepare('SELECT level FROM users WHERE id = ?').get(req.user.id);
    if (recipe.unlocked_level > user.level) {
      return res.status(400).json({ error: '等级不足，无法合成' });
    }

    const ingredients = db.prepare(`
      SELECT 
        ri.item_id,
        gi.name,
        ri.count as required_count,
        COALESCE(ui.count, 0) as user_count
      FROM recipe_ingredients ri
      JOIN game_items gi ON ri.item_id = gi.id
      LEFT JOIN user_items ui ON ri.item_id = ui.item_id AND ui.user_id = ?
      WHERE ri.recipe_id = ?
    `).all(req.user.id, recipeId);

    const canCraft = ingredients.every(ing => ing.user_count >= ing.required_count);
    if (!canCraft) {
      return res.status(400).json({ error: '材料不足' });
    }

    const transaction = db.transaction(() => {
      ingredients.forEach(ing => {
        db.prepare(`
          UPDATE user_items 
          SET count = count - ? 
          WHERE user_id = ? AND item_id = ?
        `).run(ing.required_count, req.user.id, ing.item_id);
      });

      const existingItem = db.prepare(`
        SELECT id FROM user_items WHERE user_id = ? AND item_id = ?
      `).get(req.user.id, recipe.result_item_id);

      if (existingItem) {
        db.prepare(`
          UPDATE user_items 
          SET count = count + ? 
          WHERE user_id = ? AND item_id = ?
        `).run(recipe.result_count, req.user.id, recipe.result_item_id);
      } else {
        db.prepare(`
          INSERT INTO user_items (user_id, item_id, count) 
          VALUES (?, ?, ?)
        `).run(req.user.id, recipe.result_item_id, recipe.result_count);
      }

      const resultItem = db.prepare('SELECT value FROM game_items WHERE id = ?').get(recipe.result_item_id);
      const expGain = resultItem.value * 2;
      const coinsGain = Math.floor(resultItem.value / 2);

      db.prepare(`
        UPDATE users 
        SET exp = exp + ?, coins = coins + ? 
        WHERE id = ?
      `).run(expGain, coinsGain, req.user.id);

      const currentUser = db.prepare('SELECT level, exp FROM users WHERE id = ?').get(req.user.id);
      const expNeeded = currentUser.level * 100;
      
      if (currentUser.exp >= expNeeded) {
        db.prepare(`
          UPDATE users 
          SET level = level + 1, exp = exp - ? 
          WHERE id = ?
        `).run(expNeeded, req.user.id);
      }
    });

    transaction();

    const updatedUser = db.prepare(`
      SELECT id, username, nickname, avatar, coins, level, exp 
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({
      message: `合成成功，获得 ${recipe.result_name} x${recipe.result_count}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('合成错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/daily-reward', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const existingReward = db.prepare(`
      SELECT * FROM user_achievements 
      WHERE user_id = ? AND achievement_name = '每日奖励' AND date(unlocked_at) = ?
    `).get(req.user.id, today);

    if (existingReward) {
      return res.status(400).json({ error: '今日已领取每日奖励' });
    }

    const coinsReward = 50;
    const expReward = 20;

    db.prepare(`
      UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?
    `).run(coinsReward, expReward, req.user.id);

    db.prepare(`
      INSERT INTO user_achievements (user_id, achievement_name, description)
      VALUES (?, '每日奖励', ?)
    `).run(req.user.id, `获得 ${coinsReward} 金币和 ${expReward} 经验`);

    const basicItems = ['木柴', '石头', '水', '泥土', '种子'];
    const randomItem = basicItems[Math.floor(Math.random() * basicItems.length)];
    const item = db.prepare('SELECT id FROM game_items WHERE name = ?').get(randomItem);
    
    if (item) {
      const existingItem = db.prepare(`
        SELECT id FROM user_items WHERE user_id = ? AND item_id = ?
      `).get(req.user.id, item.id);

      if (existingItem) {
        db.prepare(`
          UPDATE user_items SET count = count + 3 WHERE user_id = ? AND item_id = ?
        `).run(req.user.id, item.id);
      } else {
        db.prepare(`
          INSERT INTO user_items (user_id, item_id, count) VALUES (?, ?, 3)
        `).run(req.user.id, item.id);
      }
    }

    const updatedUser = db.prepare(`
      SELECT id, username, nickname, avatar, coins, level, exp 
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({
      message: '领取每日奖励成功',
      reward: {
        coins: coinsReward,
        exp: expReward,
        item: randomItem,
        item_count: 3
      },
      user: updatedUser
    });
  } catch (error) {
    console.error('领取每日奖励错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
