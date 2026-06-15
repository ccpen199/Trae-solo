import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  address: String,
  district: String,
}, { _id: false });

const activitySchema = new mongoose.Schema({
  circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
  title: { type: String, required: true },
  description: String,
  coverImage: String,
  location: locationSchema,
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  maxParticipants: { type: Number, default: 50 },
  participantCount: { type: Number, default: 0 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  fee: { type: Number, default: 0 },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    default: 'upcoming',
  },
  results: [String],
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
