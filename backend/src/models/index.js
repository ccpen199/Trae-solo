const sequelize = require('../config/database');

const User = require('./User');
const Channel = require('./Channel');
const Book = require('./Book');
const Comment = require('./Comment');
const Library = require('./Library');

const UserFavorite = sequelize.define('UserFavorite', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  targetType: {
    type: require('sequelize').DataTypes.ENUM('book', 'channel', 'library', 'comment'),
    allowNull: false
  },
  targetId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'user_favorites',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'targetType', 'targetId'], unique: true },
    { fields: ['userId'] },
    { fields: ['targetType', 'targetId'] }
  ]
});

const UserFollow = sequelize.define('UserFollow', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  followerId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  followingId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'user_follows',
  timestamps: true,
  indexes: [
    { fields: ['followerId', 'followingId'], unique: true },
    { fields: ['followerId'] },
    { fields: ['followingId'] }
  ]
});

const ChannelFollow = sequelize.define('ChannelFollow', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channelId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'channels',
      key: 'id'
    }
  }
}, {
  tableName: 'channel_follows',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'channelId'], unique: true },
    { fields: ['userId'] },
    { fields: ['channelId'] }
  ]
});

const LibraryFollow = sequelize.define('LibraryFollow', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  libraryId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'libraries',
      key: 'id'
    }
  }
}, {
  tableName: 'library_follows',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'libraryId'], unique: true },
    { fields: ['userId'] },
    { fields: ['libraryId'] }
  ]
});

const ChannelBook = sequelize.define('ChannelBook', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  channelId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'channels',
      key: 'id'
    }
  },
  bookId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  sortOrder: {
    type: require('sequelize').DataTypes.INTEGER,
    defaultValue: 0
  },
  isFeatured: {
    type: require('sequelize').DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'channel_books',
  timestamps: true,
  indexes: [
    { fields: ['channelId', 'bookId'], unique: true },
    { fields: ['channelId'] },
    { fields: ['bookId'] }
  ]
});

const LibraryBook = sequelize.define('LibraryBook', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  libraryId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'libraries',
      key: 'id'
    }
  },
  bookId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  shelfLocation: {
    type: require('sequelize').DataTypes.STRING(100),
    allowNull: true
  },
  availableCount: {
    type: require('sequelize').DataTypes.INTEGER,
    defaultValue: 1
  },
  totalCount: {
    type: require('sequelize').DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'library_books',
  timestamps: true,
  indexes: [
    { fields: ['libraryId', 'bookId'], unique: true },
    { fields: ['libraryId'] },
    { fields: ['bookId'] }
  ]
});

const Activity = sequelize.define('Activity', {
  id: {
    type: require('sequelize').DataTypes.UUID,
    defaultValue: require('sequelize').DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: require('sequelize').DataTypes.ENUM('create', 'update', 'comment', 'like', 'favorite', 'follow', 'rate', 'read'),
    allowNull: false
  },
  targetType: {
    type: require('sequelize').DataTypes.ENUM('book', 'channel', 'library', 'comment', 'user'),
    allowNull: false
  },
  targetId: {
    type: require('sequelize').DataTypes.UUID,
    allowNull: false
  },
  content: {
    type: require('sequelize').DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: require('sequelize').DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'activities',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['targetType', 'targetId'] },
    { fields: ['action'] },
    { fields: ['createdAt'] }
  ]
});

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Book, { foreignKey: 'creatorId', as: 'createdBooks' });
Book.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(Channel, { foreignKey: 'creatorId', as: 'createdChannels' });
Channel.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(Library, { foreignKey: 'creatorId', as: 'createdLibraries' });
Library.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

Comment.belongsTo(User, { foreignKey: 'replyToId', as: 'replyToUser' });

User.belongsToMany(User, {
  through: UserFollow,
  as: 'followers',
  foreignKey: 'followingId',
  otherKey: 'followerId'
});

User.belongsToMany(User, {
  through: UserFollow,
  as: 'following',
  foreignKey: 'followerId',
  otherKey: 'followingId'
});

User.belongsToMany(Channel, {
  through: ChannelFollow,
  as: 'followedChannels',
  foreignKey: 'userId'
});

Channel.belongsToMany(User, {
  through: ChannelFollow,
  as: 'followers',
  foreignKey: 'channelId'
});

User.belongsToMany(Library, {
  through: LibraryFollow,
  as: 'followedLibraries',
  foreignKey: 'userId'
});

Library.belongsToMany(User, {
  through: LibraryFollow,
  as: 'followers',
  foreignKey: 'libraryId'
});

Channel.belongsToMany(Book, {
  through: ChannelBook,
  as: 'books',
  foreignKey: 'channelId'
});

Book.belongsToMany(Channel, {
  through: ChannelBook,
  as: 'channels',
  foreignKey: 'bookId'
});

Library.belongsToMany(Book, {
  through: LibraryBook,
  as: 'books',
  foreignKey: 'libraryId'
});

Book.belongsToMany(Library, {
  through: LibraryBook,
  as: 'libraries',
  foreignKey: 'bookId'
});

User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Channel,
  Book,
  Comment,
  Library,
  UserFavorite,
  UserFollow,
  ChannelFollow,
  LibraryFollow,
  ChannelBook,
  LibraryBook,
  Activity
};
