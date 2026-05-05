const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  subtitle: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  author: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  translator: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  publisher: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  publishDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  isbn: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  pages: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  binding: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['hardcover', 'paperback', 'ebook']]
    }
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  authorInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  directory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  collectCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  readCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']]
    }
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isNew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  source: {
    type: DataTypes.STRING(20),
    defaultValue: 'system',
    validate: {
      isIn: [['system', 'user']]
    }
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'books',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['title'] },
    { fields: ['author'] },
    { fields: ['isbn'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['isFeatured'] },
    { fields: ['isHot'] },
    { fields: ['rating'] }
  ]
});

module.exports = Book;
