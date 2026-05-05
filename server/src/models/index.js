const sequelize = require('../config/database');

const User = require('./User');
const Department = require('./Department');
const TimeSlot = require('./TimeSlot');
const Barcode = require('./Barcode');
const HandheldDevice = require('./HandheldDevice');
const EntryRecord = require('./EntryRecord');
const CateringRecord = require('./CateringRecord');
const BookletRecord = require('./BookletRecord');
const SystemConfig = require('./SystemConfig');
const OperationLog = require('./OperationLog');

Barcode.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(Barcode, { foreignKey: 'departmentId', as: 'barcodes' });

HandheldDevice.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(HandheldDevice, { foreignKey: 'departmentId', as: 'devices' });

HandheldDevice.belongsTo(User, { foreignKey: 'assignedUserId', as: 'assignedUser' });
User.hasMany(HandheldDevice, { foreignKey: 'assignedUserId', as: 'assignedDevices' });

EntryRecord.belongsTo(Barcode, { foreignKey: 'barcodeId', as: 'barcode' });
Barcode.hasMany(EntryRecord, { foreignKey: 'barcodeId', as: 'entryRecords' });

EntryRecord.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(EntryRecord, { foreignKey: 'departmentId', as: 'entryRecords' });

EntryRecord.belongsTo(TimeSlot, { foreignKey: 'timeSlotId', as: 'timeSlot' });
TimeSlot.hasMany(EntryRecord, { foreignKey: 'timeSlotId', as: 'entryRecords' });

EntryRecord.belongsTo(HandheldDevice, { foreignKey: 'deviceId', as: 'device' });
HandheldDevice.hasMany(EntryRecord, { foreignKey: 'deviceId', as: 'entryRecords' });

EntryRecord.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
User.hasMany(EntryRecord, { foreignKey: 'operatorId', as: 'operatorEntryRecords' });

CateringRecord.belongsTo(Barcode, { foreignKey: 'barcodeId', as: 'barcode' });
Barcode.hasMany(CateringRecord, { foreignKey: 'barcodeId', as: 'cateringRecords' });

CateringRecord.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(CateringRecord, { foreignKey: 'departmentId', as: 'cateringRecords' });

CateringRecord.belongsTo(TimeSlot, { foreignKey: 'timeSlotId', as: 'timeSlot' });
TimeSlot.hasMany(CateringRecord, { foreignKey: 'timeSlotId', as: 'cateringRecords' });

CateringRecord.belongsTo(HandheldDevice, { foreignKey: 'deviceId', as: 'device' });
HandheldDevice.hasMany(CateringRecord, { foreignKey: 'deviceId', as: 'cateringRecords' });

CateringRecord.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
User.hasMany(CateringRecord, { foreignKey: 'operatorId', as: 'operatorCateringRecords' });

BookletRecord.belongsTo(Barcode, { foreignKey: 'barcodeId', as: 'barcode' });
Barcode.hasMany(BookletRecord, { foreignKey: 'barcodeId', as: 'bookletRecords' });

BookletRecord.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(BookletRecord, { foreignKey: 'departmentId', as: 'bookletRecords' });

BookletRecord.belongsTo(TimeSlot, { foreignKey: 'timeSlotId', as: 'timeSlot' });
TimeSlot.hasMany(BookletRecord, { foreignKey: 'timeSlotId', as: 'bookletRecords' });

BookletRecord.belongsTo(HandheldDevice, { foreignKey: 'deviceId', as: 'device' });
HandheldDevice.hasMany(BookletRecord, { foreignKey: 'deviceId', as: 'bookletRecords' });

BookletRecord.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
User.hasMany(BookletRecord, { foreignKey: 'operatorId', as: 'operatorBookletRecords' });

OperationLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(OperationLog, { foreignKey: 'userId', as: 'operationLogs' });

OperationLog.belongsTo(HandheldDevice, { foreignKey: 'deviceId', as: 'device' });
HandheldDevice.hasMany(OperationLog, { foreignKey: 'deviceId', as: 'operationLogs' });

module.exports = {
  sequelize,
  User,
  Department,
  TimeSlot,
  Barcode,
  HandheldDevice,
  EntryRecord,
  CateringRecord,
  BookletRecord,
  SystemConfig,
  OperationLog
};
