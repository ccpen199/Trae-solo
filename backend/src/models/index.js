const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const moment = require('moment');

class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async findAll(options = {}) {
    const db = await getDb();
    let items = [...db.data[this.collectionName]];
    
    if (options.where) {
      items = items.filter(item => {
        for (const [key, value] of Object.entries(options.where)) {
          if (item[key] !== value) return false;
        }
        return true;
      });
    }
    
    if (options.order) {
      const [field, direction] = options.order;
      items.sort((a, b) => {
        if (direction === 'DESC') {
          return a[field] < b[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });
    }
    
    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      items = items.slice(offset, offset + options.limit);
    }
    
    return items;
  }

  async findById(id) {
    const db = await getDb();
    return db.data[this.collectionName].find(item => item.id === id);
  }

  async findOne(options = {}) {
    const db = await getDb();
    const items = db.data[this.collectionName];
    
    if (options.where) {
      return items.find(item => {
        for (const [key, value] of Object.entries(options.where)) {
          if (item[key] !== value) return false;
        }
        return true;
      });
    }
    
    return items[0] || null;
  }

  async create(data) {
    const db = await getDb();
    const now = new Date().toISOString();
    const item = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    db.data[this.collectionName].push(item);
    await db.write();
    
    return item;
  }

  async update(id, data) {
    const db = await getDb();
    const index = db.data[this.collectionName].findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    db.data[this.collectionName][index] = {
      ...db.data[this.collectionName][index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    return db.data[this.collectionName][index];
  }

  async delete(id) {
    const db = await getDb();
    const index = db.data[this.collectionName].findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    db.data[this.collectionName].splice(index, 1);
    await db.write();
    return true;
  }

  async count(options = {}) {
    const db = await getDb();
    let items = db.data[this.collectionName];
    
    if (options.where) {
      items = items.filter(item => {
        for (const [key, value] of Object.entries(options.where)) {
          if (item[key] !== value) return false;
        }
        return true;
      });
    }
    
    return items.length;
  }
}

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByUsername(username) {
    const db = await getDb();
    return db.data.users.find(u => u.username === username);
  }

  async create(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return super.create(data);
  }

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  async findByCode(code) {
    const db = await getDb();
    return db.data.categories.find(c => c.code === code);
  }
}

class ContentRepository extends BaseRepository {
  constructor() {
    super('contents');
  }

  async findByDeduplicationHash(hash) {
    const db = await getDb();
    return db.data.contents.find(c => c.deduplicationHash === hash);
  }
}

class WeightTagRepository extends BaseRepository {
  constructor() {
    super('weightTags');
  }
}

class UserProfileRepository extends BaseRepository {
  constructor() {
    super('userProfiles');
  }

  async findByUserId(userId) {
    const db = await getDb();
    return db.data.userProfiles.find(p => p.userId === userId);
  }
}

class RecommendationRecordRepository extends BaseRepository {
  constructor() {
    super('recommendationRecords');
  }
}

class CampaignRepository extends BaseRepository {
  constructor() {
    super('campaigns');
  }
}

class AdMaterialRepository extends BaseRepository {
  constructor() {
    super('adMaterials');
  }
}

class AdDeliveryRepository extends BaseRepository {
  constructor() {
    super('adDeliveries');
  }
}

class InteractionRepository extends BaseRepository {
  constructor() {
    super('interactions');
  }
}

class CommentRepository extends BaseRepository {
  constructor() {
    super('comments');
  }
}

class ContentLikeRepository extends BaseRepository {
  constructor() {
    super('contentLikes');
  }
}

class ContentCollectRepository extends BaseRepository {
  constructor() {
    super('contentCollects');
  }
}

class NegativeFeedbackRepository extends BaseRepository {
  constructor() {
    super('negativeFeedbacks');
  }
}

class DailyStatRepository extends BaseRepository {
  constructor() {
    super('dailyStats');
  }
}

class RetentionStatRepository extends BaseRepository {
  constructor() {
    super('retentionStats');
  }
}

class AuditLogRepository extends BaseRepository {
  constructor() {
    super('auditLogs');
  }
}

class AdReconciliationRepository extends BaseRepository {
  constructor() {
    super('adReconciliations');
  }
}

module.exports = {
  User: new UserRepository(),
  Category: new CategoryRepository(),
  WeightTag: new WeightTagRepository(),
  Content: new ContentRepository(),
  UserProfile: new UserProfileRepository(),
  RecommendationRecord: new RecommendationRecordRepository(),
  Campaign: new CampaignRepository(),
  AdMaterial: new AdMaterialRepository(),
  AdDelivery: new AdDeliveryRepository(),
  Interaction: new InteractionRepository(),
  Comment: new CommentRepository(),
  ContentLike: new ContentLikeRepository(),
  ContentCollect: new ContentCollectRepository(),
  NegativeFeedback: new NegativeFeedbackRepository(),
  DailyStat: new DailyStatRepository(),
  RetentionStat: new RetentionStatRepository(),
  AuditLog: new AuditLogRepository(),
  AdReconciliation: new AdReconciliationRepository()
};
