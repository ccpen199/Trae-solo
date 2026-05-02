const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { TaskStateService, TASK_STATES, TASK_EVENTS } = require('./stateMachine');

const stateService = new TaskStateService();

class RewardService {
  async createReward(rewardData, operatorUuid) {
    const rewardUuid = uuidv4();
    const rewardCode = rewardData.reward_code || `REWARD_${Date.now()}`;

    await run(
      `INSERT INTO rewards 
       (reward_uuid, reward_code, reward_name, reward_type, reward_value, description, icon, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rewardUuid, rewardCode, rewardData.reward_name,
        rewardData.reward_type, rewardData.reward_value,
        rewardData.description, rewardData.icon, 'active'
      ]
    );

    await stateService.createAuditLog(
      operatorUuid, 'create', 'reward', rewardUuid,
      rewardData, '创建新奖励'
    );

    return { rewardUuid, rewardCode };
  }

  async grantTaskRewards(taskUuid, userUuid, operatorUuid) {
    const taskRewards = await all(
      'SELECT * FROM task_rewards WHERE task_uuid = ?',
      [taskUuid]
    );

    const results = [];
    for (const tr of taskRewards) {
      const userRewardUuid = uuidv4();
      
      await run(
        `INSERT INTO user_rewards 
         (user_reward_uuid, user_uuid, reward_uuid, source_type, source_uuid, quantity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userRewardUuid, userUuid, tr.reward_uuid, 'task', taskUuid, tr.reward_quantity, 'pending']
      );

      const reward = await get(
        'SELECT * FROM rewards WHERE reward_uuid = ?',
        [tr.reward_uuid]
      );

      results.push({
        userRewardUuid,
        rewardUuid: tr.reward_uuid,
        rewardName: reward.reward_name,
        rewardType: reward.reward_type,
        rewardValue: reward.reward_value,
        quantity: tr.reward_quantity
      });
    }

    await stateService.transitionTask(
      taskUuid, TASK_EVENTS.GRANT_REWARD, operatorUuid || userUuid,
      '奖励已发放，等待数据分析'
    );

    await stateService.createAuditLog(
      operatorUuid || userUuid, 'grant_reward', 'task', taskUuid,
      { userUuid, rewards: results },
      `为玩家发放任务奖励，共 ${results.length} 项`
    );

    return results;
  }

  async deliverReward(userRewardUuid, operatorUuid) {
    const userReward = await get(
      `SELECT ur.*, r.reward_name, r.reward_type, r.reward_value
       FROM user_rewards ur
       JOIN rewards r ON ur.reward_uuid = r.reward_uuid
       WHERE ur.user_reward_uuid = ?`,
      [userRewardUuid]
    );

    if (!userReward) {
      throw new Error('用户奖励记录不存在');
    }

    if (userReward.status === 'granted') {
      throw new Error('奖励已发放');
    }

    await run(
      `UPDATE user_rewards 
       SET status = ?, granted_at = CURRENT_TIMESTAMP
       WHERE user_reward_uuid = ?`,
      ['granted', userRewardUuid]
    );

    await stateService.createAuditLog(
      operatorUuid, 'deliver_reward', 'user_reward', userRewardUuid,
      { userReward },
      `奖励已实际发放: ${userReward.reward_name} x ${userReward.quantity}`
    );

    return {
      userRewardUuid,
      status: 'granted',
      grantedAt: new Date().toISOString()
    };
  }

  async getUserRewards(userUuid, filters = {}) {
    let sql = `SELECT ur.*, r.reward_name, r.reward_type, r.reward_value, r.icon
               FROM user_rewards ur
               JOIN rewards r ON ur.reward_uuid = r.reward_uuid
               WHERE ur.user_uuid = ?`;
    const params = [userUuid];

    if (filters.status) {
      sql += ' AND ur.status = ?';
      params.push(filters.status);
    }

    if (filters.source_type) {
      sql += ' AND ur.source_type = ?';
      params.push(filters.source_type);
    }

    sql += ' ORDER BY ur.created_at DESC';

    return await all(sql, params);
  }

  async getRewards(filters = {}) {
    let sql = 'SELECT * FROM rewards WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.reward_type) {
      sql += ' AND reward_type = ?';
      params.push(filters.reward_type);
    }

    sql += ' ORDER BY created_at DESC';

    return await all(sql, params);
  }
}

class AchievementService {
  async createAchievement(achievementData, operatorUuid) {
    const achievementUuid = uuidv4();
    const achievementCode = achievementData.achievement_code || `ACHIEVE_${Date.now()}`;

    await run(
      `INSERT INTO achievements 
       (achievement_uuid, achievement_code, achievement_name, description, 
        icon, rarity, required_task_uuids, is_hidden, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        achievementUuid, achievementCode, achievementData.achievement_name,
        achievementData.description, achievementData.icon,
        achievementData.rarity || 'common',
        JSON.stringify(achievementData.required_task_uuids || []),
        achievementData.is_hidden ? 1 : 0,
        TASK_STATES.DRAFT, operatorUuid
      ]
    );

    await stateService.createAuditLog(
      operatorUuid, 'create', 'achievement', achievementUuid,
      achievementData, '创建新成就'
    );

    return { achievementUuid, achievementCode };
  }

  async addAchievementReward(achievementUuid, rewardUuid, quantity = 1, operatorUuid) {
    const achievementRewardUuid = uuidv4();

    await run(
      `INSERT INTO achievement_rewards 
       (achievement_reward_uuid, achievement_uuid, reward_uuid, reward_quantity)
       VALUES (?, ?, ?, ?)`,
      [achievementRewardUuid, achievementUuid, rewardUuid, quantity]
    );

    await stateService.createAuditLog(
      operatorUuid, 'add_reward', 'achievement', achievementUuid,
      { rewardUuid, quantity }, '为成就添加奖励'
    );

    return { achievementRewardUuid };
  }

  async checkAchievementUnlock(userUuid, taskUuid) {
    const achievements = await all(
      `SELECT * FROM achievements 
       WHERE status = ? 
       AND is_hidden = 0`,
      [TASK_STATES.PENDING_TRIGGER]
    );

    const results = [];
    for (const achievement of achievements) {
      const requiredTasks = JSON.parse(achievement.required_task_uuids || '[]');
      
      if (!requiredTasks.includes(taskUuid)) continue;

      const completedTasks = await all(
        `SELECT DISTINCT p.task_uuid 
         FROM progresses p
         WHERE p.user_uuid = ? 
         AND p.status = 'completed'
         AND p.task_uuid IN (${requiredTasks.map(() => '?').join(',')})`,
        [userUuid, ...requiredTasks]
      );

      const completedUuids = completedTasks.map(t => t.task_uuid);
      const allCompleted = requiredTasks.every(rt => completedUuids.includes(rt));

      if (allCompleted) {
        const existingUnlock = await get(
          `SELECT * FROM user_achievements 
           WHERE user_uuid = ? AND achievement_uuid = ?`,
          [userUuid, achievement.achievement_uuid]
        );

        if (!existingUnlock) {
          const userAchievementUuid = uuidv4();
          
          await run(
            `INSERT INTO user_achievements 
             (user_achievement_uuid, user_uuid, achievement_uuid, unlocked_at, status)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
            [userAchievementUuid, userUuid, achievement.achievement_uuid, 'unlocked']
          );

          const achievementRewards = await all(
            'SELECT * FROM achievement_rewards WHERE achievement_uuid = ?',
            [achievement.achievement_uuid]
          );

          for (const ar of achievementRewards) {
            const userRewardUuid = uuidv4();
            await run(
              `INSERT INTO user_rewards 
               (user_reward_uuid, user_uuid, reward_uuid, source_type, source_uuid, quantity, status)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [userRewardUuid, userUuid, ar.reward_uuid, 'achievement', achievement.achievement_uuid, ar.reward_quantity, 'pending']
            );
          }

          results.push({
            achievementUuid: achievement.achievement_uuid,
            achievementName: achievement.achievement_name,
            unlockedAt: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  async getUserAchievements(userUuid, filters = {}) {
    let sql = `SELECT ua.*, a.achievement_name, a.description, a.icon, a.rarity
               FROM user_achievements ua
               JOIN achievements a ON ua.achievement_uuid = a.achievement_uuid
               WHERE ua.user_uuid = ?`;
    const params = [userUuid];

    if (filters.status) {
      sql += ' AND ua.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY ua.unlocked_at DESC';

    return await all(sql, params);
  }

  async getAchievements(filters = {}) {
    let sql = 'SELECT * FROM achievements WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.rarity) {
      sql += ' AND rarity = ?';
      params.push(filters.rarity);
    }

    sql += ' ORDER BY created_at DESC';

    return await all(sql, params);
  }
}

module.exports = { RewardService, AchievementService };
