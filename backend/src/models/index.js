module.exports = {
  User: require('./User'),
  Device: require('./Device'),
  Booking: require('./Booking'),
  Order: require('./Order'),
  Community: require('./Community'),
  Grid: require('./Grid'),
  WorkOrder: require('./WorkOrder'),
  Package: require('./Package'),
  ...require('./Voucher'),
  DeviceUsage: require('./DeviceUsage'),
  ...require('./Analytics'),
};
