import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  merchantName: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  discount: String,
  pointsRequired: { type: Number, required: true },
  image: String,
  validUntil: { type: Date, required: true },
  stock: { type: Number, default: 100 },
  redeemedCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
