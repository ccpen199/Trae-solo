import PointRecord from '../models/PointRecord.js';
import User from '../models/User.js';

export const addPoints = async (userId, amount, reason, relatedId, relatedType) => {
  const record = new PointRecord({
    userId,
    amount,
    type: 'earn',
    reason,
    relatedId,
    relatedType,
  });
  await record.save();
  await User.findByIdAndUpdate(userId, { $inc: { points: amount } });
  return record;
};

export const spendPoints = async (userId, amount, reason, relatedId, relatedType) => {
  const user = await User.findById(userId);
  if (!user || user.points < amount) {
    throw new Error('积分不足');
  }
  const record = new PointRecord({
    userId,
    amount,
    type: 'spend',
    reason,
    relatedId,
    relatedType,
  });
  await record.save();
  await User.findByIdAndUpdate(userId, { $inc: { points: -amount } });
  return record;
};
