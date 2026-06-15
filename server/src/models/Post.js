import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  address: String,
  district: String,
}, { _id: false });

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'] },
  url: String,
  thumbnail: String,
}, { _id: false });

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['traffic', 'environment', 'safety', 'life', 'culture', 'other'],
    required: true,
  },
  location: locationSchema,
  media: [mediaSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: String,
}, { timestamps: true });

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ 'location.district': 1, status: 1 });

export default mongoose.model('Post', postSchema);
