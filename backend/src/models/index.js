const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Registration = require('./Registration');
const Bid = require('./Bid');
const AuditLog = require('./AuditLog');

Project.belongsTo(User, { foreignKey: 'tendererId', as: 'tenderer' });
User.hasMany(Project, { foreignKey: 'tendererId', as: 'projects' });

Registration.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Registration, { foreignKey: 'projectId', as: 'registrations' });

Registration.belongsTo(User, { foreignKey: 'bidderId', as: 'bidder' });
User.hasMany(Registration, { foreignKey: 'bidderId', as: 'bidderRegistrations' });

Registration.belongsTo(User, { foreignKey: 'qualificationApprovedBy', as: 'approver' });

Bid.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Bid, { foreignKey: 'projectId', as: 'bids' });

Bid.belongsTo(User, { foreignKey: 'bidderId', as: 'bidder' });
User.hasMany(Bid, { foreignKey: 'bidderId', as: 'bids' });

Bid.belongsTo(Registration, { foreignKey: 'registrationId', as: 'registration' });
Registration.hasMany(Bid, { foreignKey: 'registrationId', as: 'bids' });

Bid.belongsTo(Bid, { foreignKey: 'previousBidId', as: 'previousBid' });

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

AuditLog.belongsTo(AuditLog, { foreignKey: 'previousLogId', as: 'previousLog' });

Project.belongsTo(User, { foreignKey: 'winningBidderId', as: 'winningBidder' });

module.exports = {
  sequelize,
  User,
  Project,
  Registration,
  Bid,
  AuditLog
};
