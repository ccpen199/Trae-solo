import db from '../database.js';
import { v4 as uuidv4 } from 'uuid';

class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.avatar = data.avatar;
    this.tier = data.tier || 1;
    this.tier_name = data.tier_name || '青铜';
    this.score = data.score || 1000;
    this.win_count = data.win_count || 0;
    this.lose_count = data.lose_count || 0;
    this.power = data.power || 1000;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  get winRate() {
    const total = this.win_count + this.lose_count;
    if (total === 0) return 50.0;
    return (this.win_count / total) * 100;
  }

  static create(name, avatar = null) {
    const id = uuidv4();
    const initialScore = 1000;
    const initialPower = 1000;
    const tierData = Player.calculateTier(initialScore);

    const stmt = db.prepare(`
      INSERT INTO players (id, name, avatar, tier, tier_name, score, win_count, lose_count, power) 
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)
    `);
    
    stmt.run(id, name, avatar, tierData.tier, tierData.tierName, initialScore, initialPower);
    
    return Player.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
    const row = stmt.get(id);
    return row ? new Player(row) : null;
  }

  static findByName(name) {
    const stmt = db.prepare('SELECT * FROM players WHERE name = ?');
    const row = stmt.get(name);
    return row ? new Player(row) : null;
  }

  static list(limit = 100, offset = 0) {
    const stmt = db.prepare('SELECT * FROM players ORDER BY score DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(limit, offset);
    return rows.map((row) => new Player(row));
  }

  static getTierConfig() {
    const stmt = db.prepare("SELECT value FROM configs WHERE key = 'tier_config'");
    const row = stmt.get();
    return row ? JSON.parse(row.value) : [];
  }

  static calculateTier(score) {
    const tiers = [
      { name: '青铜', min: 0, max: 1199, tier: 1, bonus: 0 },
      { name: '白银', min: 1200, max: 1399, tier: 2, bonus: 50 },
      { name: '黄金', min: 1400, max: 1599, tier: 3, bonus: 100 },
      { name: '铂金', min: 1600, max: 1799, tier: 4, bonus: 150 },
      { name: '钻石', min: 1800, max: 1999, tier: 5, bonus: 200 },
      { name: '大师', min: 2000, max: 999999, tier: 6, bonus: 250 },
    ];

    for (const tier of tiers) {
      if (score >= tier.min && score <= tier.max) {
        return {
          tier: tier.tier,
          tierName: tier.name,
          powerBonus: tier.bonus,
        };
      }
    }
    return { tier: 1, tierName: '青铜', powerBonus: 0 };
  }

  static calculatePower(score, winCount, loseCount) {
    const tierData = Player.calculateTier(score);
    const totalGames = winCount + loseCount;
    
    let winRateBonus = 0;
    if (totalGames > 0) {
      const winRate = (winCount / totalGames) * 100;
      winRateBonus = Math.round((winRate - 50) * 2);
    }

    const basePower = score;
    const power = basePower + tierData.powerBonus + winRateBonus;
    
    return Math.max(500, power);
  }

  updateScore(delta) {
    this.score += delta;
    const tierData = Player.calculateTier(this.score);
    this.tier = tierData.tier;
    this.tier_name = tierData.tierName;
    this.power = Player.calculatePower(this.score, this.win_count, this.lose_count);

    const stmt = db.prepare(`
      UPDATE players 
      SET score = ?, tier = ?, tier_name = ?, power = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(this.score, this.tier, this.tier_name, this.power, this.id);
    
    return this;
  }

  addWin() {
    this.win_count += 1;
    this.power = Player.calculatePower(this.score, this.win_count, this.lose_count);

    const stmt = db.prepare(`
      UPDATE players 
      SET win_count = ?, power = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(this.win_count, this.power, this.id);
    
    return this;
  }

  addLoss() {
    this.lose_count += 1;
    this.power = Player.calculatePower(this.score, this.win_count, this.lose_count);

    const stmt = db.prepare(`
      UPDATE players 
      SET lose_count = ?, power = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(this.lose_count, this.power, this.id);
    
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      tier: this.tier,
      tier_name: this.tier_name,
      score: this.score,
      win_count: this.win_count,
      lose_count: this.lose_count,
      win_rate: this.winRate.toFixed(2),
      power: this.power,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default Player;