const mongoose = require('mongoose');

const studentAccountSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'] },
  grade: { type: String, required: true },
  major: { type: String },
  department: { type: String },
  phone: { type: String, unique: true },
  email: { type: String },
  idCardNumber: { type: String },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'DormitoryBuilding' },
  roomNumber: { type: String },
  balance: { type: Number, default: 0, min: 0 },
  frozenBalance: { type: Number, default: 0 },
  overdraftThreshold: { type: Number, default: -10 },
  totalRecharge: { type: Number, default: 0 },
  totalConsumption: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'frozen', 'lost', 'cancelled'], default: 'active' },
  cards: [{
    cardNumber: { type: String, required: true, unique: true },
    cardType: { type: String, enum: ['physical', 'virtual', 'temporary'], default: 'physical' },
    status: { type: String, enum: ['active', 'frozen', 'lost', 'expired'], default: 'active' },
    bindDate: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false }
  }],
  wechatOpenId: { type: String },
  alipayUserId: { type: String },
  avatarUrl: { type: String },
  registrationDate: { type: Date, default: Date.now },
  lastLoginTime: { type: Date },
  lostDate: { type: Date },
  loseReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

studentAccountSchema.index({ status: 1 });
studentAccountSchema.index({ grade: 1 });
studentAccountSchema.index({ buildingId: 1 });

module.exports = mongoose.model('StudentAccount', studentAccountSchema);
