const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('follow', 'like', 'comment', 'answer', 'favorite', 'mention', 'system'),
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('data');
      return raw ? JSON.parse(raw) : null;
    },
    set(value) {
      this.setDataValue('data', value ? JSON.stringify(value) : null);
    }
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
});

module.exports = Notification;
