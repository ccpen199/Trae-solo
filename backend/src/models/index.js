const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/app.sqlite'),
  logging: false
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalFocusTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  treesPlanted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  currentTree: {
    type: DataTypes.STRING,
    defaultValue: 'oak'
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: '🌲'
  }
});

const PlantingRecord = sequelize.define('PlantingRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  treeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isWithered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  coinsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const TreeType = sequelize.define('TreeType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBush: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4CAF50'
  },
  totalTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  friendId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  }
});

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '🏆'
  },
  requirement: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requirementType: {
    type: DataTypes.ENUM('trees', 'time', 'days', 'friends', 'coins'),
    allowNull: false
  },
  coinReward: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const UserAchievement = sequelize.define('UserAchievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  achievementId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unlockedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
});

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  hostId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  treeType: {
    type: DataTypes.STRING,
    defaultValue: 'oak'
  },
  status: {
    type: DataTypes.ENUM('waiting', 'planting', 'completed'),
    defaultValue: 'waiting'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
});

const RoomParticipant = sequelize.define('RoomParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isWithered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('system', 'friend_request', 'achievement'),
    allowNull: false
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
});

const Music = sequelize.define('Music', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const UserMusic = sequelize.define('UserMusic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  musicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

User.hasMany(PlantingRecord, { foreignKey: 'userId' });
PlantingRecord.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Tag, { foreignKey: 'userId' });
Tag.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Friendship, { foreignKey: 'userId' });
Friendship.belongsTo(User, { foreignKey: 'userId' });
Friendship.belongsTo(User, { foreignKey: 'friendId', as: 'friend' });

User.hasMany(UserAchievement, { foreignKey: 'userId' });
UserAchievement.belongsTo(User, { foreignKey: 'userId' });
Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId' });

User.hasMany(Room, { foreignKey: 'hostId' });
Room.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

Room.hasMany(RoomParticipant, { foreignKey: 'roomId' });
RoomParticipant.belongsTo(Room, { foreignKey: 'roomId' });
RoomParticipant.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Message, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserMusic, { foreignKey: 'userId' });
UserMusic.belongsTo(User, { foreignKey: 'userId' });
Music.hasMany(UserMusic, { foreignKey: 'musicId' });
UserMusic.belongsTo(Music, { foreignKey: 'musicId' });

module.exports = {
  sequelize,
  User,
  PlantingRecord,
  TreeType,
  Tag,
  Friendship,
  Achievement,
  UserAchievement,
  Room,
  RoomParticipant,
  Message,
  Music,
  UserMusic
};
