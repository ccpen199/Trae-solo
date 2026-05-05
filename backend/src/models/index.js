const sequelize = require('../config/database');

const User = require('./User');
const House = require('./House');
const Order = require('./Order');
const Favorite = require('./Favorite');
const Message = require('./Message');
const Conversation = require('./Conversation');
const HouseCalendar = require('./HouseCalendar');
const Review = require('./Review');
const Demand = require('./Demand');
const Coupon = require('./Coupon');
const UserCoupon = require('./UserCoupon');
const BrowseHistory = require('./BrowseHistory');
const Notification = require('./Notification');

User.hasMany(House, { foreignKey: 'landlordId', as: 'houses' });
House.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });

User.hasMany(Order, { foreignKey: 'userId', as: 'userOrders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'landlordId', as: 'landlordOrders' });
Order.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });

House.hasMany(Order, { foreignKey: 'houseId', as: 'orders' });
Order.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

House.hasMany(Favorite, { foreignKey: 'houseId', as: 'favorites' });
Favorite.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

User.hasMany(Conversation, { foreignKey: 'participantA', as: 'conversationsA' });
User.hasMany(Conversation, { foreignKey: 'participantB', as: 'conversationsB' });

Conversation.belongsTo(User, { foreignKey: 'participantA', as: 'participantAUser' });
Conversation.belongsTo(User, { foreignKey: 'participantB', as: 'participantBUser' });
Conversation.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

House.hasMany(HouseCalendar, { foreignKey: 'houseId', as: 'calendars' });
HouseCalendar.belongsTo(House, { foreignKey: 'houseId', as: 'house' });
HouseCalendar.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasOne(Review, { foreignKey: 'orderId', as: 'review' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
House.hasMany(Review, { foreignKey: 'houseId', as: 'reviews' });
Review.belongsTo(House, { foreignKey: 'houseId', as: 'house' });
User.hasMany(Review, { foreignKey: 'userId', as: 'userReviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Review, { foreignKey: 'landlordId', as: 'landlordReviews' });
Review.belongsTo(User, { foreignKey: 'landlordId', as: 'landlord' });

User.hasMany(Demand, { foreignKey: 'userId', as: 'demands' });
Demand.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsToMany(Coupon, { through: UserCoupon, foreignKey: 'userId', as: 'coupons' });
Coupon.belongsToMany(User, { through: UserCoupon, foreignKey: 'couponId', as: 'users' });

User.hasMany(UserCoupon, { foreignKey: 'userId', as: 'userCoupons' });
UserCoupon.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Coupon.hasMany(UserCoupon, { foreignKey: 'couponId', as: 'userCoupons' });
UserCoupon.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });
UserCoupon.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(BrowseHistory, { foreignKey: 'userId', as: 'browseHistories' });
BrowseHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
House.hasMany(BrowseHistory, { foreignKey: 'houseId', as: 'browseHistories' });
BrowseHistory.belongsTo(House, { foreignKey: 'houseId', as: 'house' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  House,
  Order,
  Favorite,
  Message,
  Conversation,
  HouseCalendar,
  Review,
  Demand,
  Coupon,
  UserCoupon,
  BrowseHistory,
  Notification
};
