import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  pointsRequired: { type: Number, required: true },
  image: String,
  donorCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);
