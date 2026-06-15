import mongoose from 'mongoose';

const circleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['photography', 'parenting', 'food', 'outdoor', 'fitness', 'tech', 'art'],
    required: true,
  },
  description: String,
  avatar: String,
  coverImage: String,
  memberCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model('Circle', circleSchema);
