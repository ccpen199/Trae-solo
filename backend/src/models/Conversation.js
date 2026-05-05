const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('user_landlord', 'system'),
    defaultValue: 'user_landlord'
  },
  participantA: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  participantB: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  houseId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'houses',
      key: 'id'
    }
  },
  lastMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unreadCountA: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unreadCountB: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  indexes: [
    { fields: ['participantA', 'participantB', 'houseId'], unique: true },
    { fields: ['participantA'] },
    { fields: ['participantB'] }
  ]
});

module.exports = Conversation;
