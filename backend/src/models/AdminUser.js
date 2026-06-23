const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'operator', 'maintenance', 'finance', 'viewer'],
    default: 'operator',
    required: true 
  },
  permissions: [{ type: String }],
  avatar: { type: String },
  department: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLoginTime: { type: Date },
  lastLoginIp: { type: String },
  loginCount: { type: Number, default: 0 },
  passwordChangedAt: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now();
  next();
});

adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminUserSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions.includes(permission);
};

adminUserSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);
