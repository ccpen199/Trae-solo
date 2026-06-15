import mongoose from 'mongoose';

const pointRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['earn', 'spend'], required: true },
  reason: { type: String, required: true },
  relatedId: String,
  relatedType: String,
}, { timestamps: true });

pointRecordSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('PointRecord', pointRecordSchema);
