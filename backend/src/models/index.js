const sequelize = require('../config/database');
const Engineer = require('./Engineer');
const Fault = require('./Fault');
const Order = require('./Order');
const EngineerSkill = require('./EngineerSkill');
const Part = require('./Part');
const UsedDevice = require('./UsedDevice');

Engineer.hasMany(Order, { foreignKey: 'engineer_id' });
Order.belongsTo(Engineer, { foreignKey: 'engineer_id' });

Engineer.hasMany(EngineerSkill, { foreignKey: 'engineer_id' });
EngineerSkill.belongsTo(Engineer, { foreignKey: 'engineer_id' });

module.exports = {
  sequelize,
  Engineer,
  Fault,
  Order,
  EngineerSkill,
  Part,
  UsedDevice
};
