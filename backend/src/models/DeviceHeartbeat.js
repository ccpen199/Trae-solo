const mongoose = require('mongoose');

const deviceHeartbeatSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  firmwareVersion: { type: String },
  signalStrength: { type: Number },
  networkType: { type: String, enum: ['NB-IoT', '4G', 'WiFi'] },
  cellId: { type: String },
  temperature: { type: Number },
  humidity: { type: Number },
  batteryLevel: { type: Number },
  powerVoltage: { type: Number },
  valveStatus: { type: String, enum: ['open', 'closed', 'fault'] },
  flowRate: { type: Number, default: 0 },
  totalWaterUsage: { type: Number },
  status: { type: String, enum: ['normal', 'warning', 'error'] },
  faultCode: { type: String },
  faultMessage: { type: String },
  upstreamData: { type: mongoose.Schema.Types.Mixed },
  responseCode: { type: Number, default: 200 },
  serverReceivedAt: { type: Date, default: Date.now }
});

deviceHeartbeatSchema.index({ deviceId: 1, timestamp: -1 });
deviceHeartbeatSchema.index({ timestamp: -1 });

deviceHeartbeatSchema.set('timeseries', {
  timeField: 'timestamp',
  metaField: 'deviceId',
  granularity: 'minutes'
});

module.exports = mongoose.model('DeviceHeartbeat', deviceHeartbeatSchema);
