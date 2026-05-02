const { db } = require('../database/init');

class LeaderboardEngine {
  constructor() {
    this.rankStrategies = {
      points: this.rankByPoints.bind(this),
      win_rate: this.rankByWinRate.bind(this),
      matches_played: this.rankByMatchesPlayed.bind(this)
    };
  }

  getActiveLeaderboards(seasonId = null) {
    let query = `
      SELECT * FROM leaderboards 
      WHERE status = 'active'
    `;
    const params = [];
    
    if (seasonId) {
      query += ' AND season_id = ?';
      params.push(seasonId);
    }

    return db.prepare(query).all(...params);
  }

  rankByPoints(leaderboard, seasonId) {
    const config = leaderboard.config ? JSON.parse(leaderboard.config) : {};
    const limit = config.limit || 100;

    let query = `
      SELECT 
        usp.user_id,
        usp.total_points as score,
        usp.wins,
        usp.losses,
        usp.matches_played,
        usp.win_rate,
        usp.rank,
        u.nickname
      FROM user_season_points usp
      JOIN users u ON usp.user_id = u.id
      WHERE usp.season_id = ?
    `;
    
    const params = [seasonId];

    if (leaderboard.game_mode && leaderboard.game_mode !== 'default') {
      query += `
        AND EXISTS (
          SELECT 1 FROM player_match_stats pms
          JOIN match_records mr ON pms.match_record_id = mr.id
          WHERE pms.user_id = usp.user_id 
            AND mr.game_mode = ?
            AND mr.status = 'completed'
        )
      `;
      params.push(leaderboard.game_mode);
    }

    if (leaderboard.match_type && leaderboard.match_type !== 'any') {
      query += `
        AND EXISTS (
          SELECT 1 FROM player_match_stats pms
          JOIN match_records mr ON pms.match_record_id = mr.id
          WHERE pms.user_id = usp.user_id 
            AND mr.match_type = ?
            AND mr.status = 'completed'
        )
      `;
      params.push(leaderboard.match_type);
    }

    query += ' ORDER BY usp.total_points DESC, usp.win_rate DESC LIMIT ?';
    params.push(limit);

    return db.prepare(query).all(...params);
  }

  rankByWinRate(leaderboard, seasonId) {
    const config = leaderboard.config ? JSON.parse(leaderboard.config) : {};
    const limit = config.limit || 100;
    const minMatches = config.minMatches || 10;

    let query = `
      SELECT 
        usp.user_id,
        usp.win_rate as score,
        usp.total_points,
        usp.wins,
        usp.losses,
        usp.matches_played,
        usp.rank,
        u.nickname
      FROM user_season_points usp
      JOIN users u ON usp.user_id = u.id
      WHERE usp.season_id = ? AND usp.matches_played >= ?
    `;
    
    const params = [seasonId, minMatches];

    query += ' ORDER BY usp.win_rate DESC, usp.total_points DESC LIMIT ?';
    params.push(limit);

    return db.prepare(query).all(...params);
  }

  rankByMatchesPlayed(leaderboard, seasonId) {
    const config = leaderboard.config ? JSON.parse(leaderboard.config) : {};
    const limit = config.limit || 100;

    let query = `
      SELECT 
        usp.user_id,
        usp.matches_played as score,
        usp.total_points,
        usp.wins,
        usp.losses,
        usp.win_rate,
        usp.rank,
        u.nickname
      FROM user_season_points usp
      JOIN users u ON usp.user_id = u.id
      WHERE usp.season_id = ?
      ORDER BY usp.matches_played DESC, usp.total_points DESC
      LIMIT ?
    `;
    
    return db.prepare(query).all(seasonId, limit);
  }

  refreshLeaderboard(leaderboardId) {
    const leaderboard = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(leaderboardId);
    if (!leaderboard) {
      throw new Error('排行榜不存在');
    }

    const activeSeason = db.prepare('SELECT id, config FROM seasons WHERE status = ?').get('active');
    const seasonId = leaderboard.season_id || activeSeason?.id;
    
    if (!seasonId) {
      throw new Error('没有活动的赛季');
    }

    const rankStrategy = this.rankStrategies[leaderboard.rank_type] || this.rankStrategies.points;
    const rankings = rankStrategy(leaderboard, seasonId);

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM leaderboard_entries WHERE leaderboard_id = ?').run(leaderboardId);

      const insertEntry = db.prepare(`
        INSERT INTO leaderboard_entries 
          (leaderboard_id, user_id, rank, previous_rank, score, previous_score, metadata, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      for (let i = 0; i < rankings.length; i++) {
        const ranking = rankings[i];
        const currentRank = i + 1;
        
        const previousEntry = db.prepare(`
          SELECT rank, score FROM leaderboard_entries 
          WHERE leaderboard_id = ? AND user_id = ?
        `).get(leaderboardId, ranking.user_id);

        insertEntry.run(
          leaderboardId,
          ranking.user_id,
          currentRank,
          previousEntry?.rank || null,
          ranking.score,
          previousEntry?.score || null,
          JSON.stringify({
            wins: ranking.wins,
            losses: ranking.losses,
            matches_played: ranking.matches_played,
            win_rate: ranking.win_rate,
            rank_name: ranking.rank
          })
        );
      }

      db.prepare(`
        UPDATE leaderboards 
        SET last_refreshed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(leaderboardId);
    });

    transaction();

    return {
      leaderboardId,
      refreshedAt: new Date().toISOString(),
      entryCount: rankings.length
    };
  }

  getLeaderboard(leaderboardId, options = {}) {
    const { limit = 50, offset = 0, includeUser = null } = options;
    
    const leaderboard = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(leaderboardId);
    if (!leaderboard) {
      throw new Error('排行榜不存在');
    }

    const entries = db.prepare(`
      SELECT 
        le.*,
        u.nickname,
        u.username
      FROM leaderboard_entries le
      JOIN users u ON le.user_id = u.id
      WHERE le.leaderboard_id = ?
      ORDER BY le.rank ASC
      LIMIT ? OFFSET ?
    `).all(leaderboardId, limit, offset);

    const totalEntries = db.prepare(`
      SELECT COUNT(*) as count FROM leaderboard_entries WHERE leaderboard_id = ?
    `).get(leaderboardId);

    let userEntry = null;
    if (includeUser) {
      userEntry = db.prepare(`
        SELECT 
          le.*,
          u.nickname,
          u.username
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        WHERE le.leaderboard_id = ? AND le.user_id = ?
      `).get(leaderboardId, includeUser);
    }

    return {
      leaderboard,
      entries: entries.map(e => ({
        ...e,
        metadata: e.metadata ? JSON.parse(e.metadata) : null
      })),
      pagination: {
        total: totalEntries.count,
        limit,
        offset
      },
      userEntry: userEntry ? {
        ...userEntry,
        metadata: userEntry.metadata ? JSON.parse(userEntry.metadata) : null
      } : null
    };
  }

  refreshAllLeaderboards() {
    const leaderboards = this.getActiveLeaderboards();
    const results = [];

    for (const leaderboard of leaderboards) {
      try {
        const result = this.refreshLeaderboard(leaderboard.id);
        results.push({ ...result, name: leaderboard.name, success: true });
      } catch (error) {
        results.push({ 
          leaderboardId: leaderboard.id, 
          name: leaderboard.name, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }
}

module.exports = new LeaderboardEngine();
