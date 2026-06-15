import PointRecord from '../models/PointRecord.js';
import Coupon from '../models/Coupon.js';
import Donation from '../models/Donation.js';
import { spendPoints, addPoints } from '../services/pointService.js';

export const getPointRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;
    
    const records = await PointRecord.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    const total = await PointRecord.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        data: records.map(r => ({ ...r.toObject(), id: r._id })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ stock: { $gt: 0 }, validUntil: { $gt: new Date() } })
      .sort({ pointsRequired: 1 });
    
    res.json({
      success: true,
      data: coupons.map(c => ({ ...c.toObject(), id: c._id })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const redeemCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: '优惠券不存在' });
    }
    
    if (coupon.stock <= 0) {
      return res.status(400).json({ success: false, error: '优惠券已兑换完' });
    }
    
    if (new Date(coupon.validUntil) < new Date()) {
      return res.status(400).json({ success: false, error: '优惠券已过期' });
    }
    
    await spendPoints(req.user._id, coupon.pointsRequired, `兑换优惠券: ${coupon.title}`, coupon._id, 'coupon');
    
    coupon.stock--;
    coupon.redeemedCount++;
    await coupon.save();
    
    res.json({ success: true, message: '兑换成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: donations.map(d => ({ ...d.toObject(), id: d._id })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const donate = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, error: '公益项目不存在' });
    }
    
    await spendPoints(req.user._id, donation.pointsRequired, `公益捐赠: ${donation.title}`, donation._id, 'donation');
    
    donation.currentAmount += donation.pointsRequired;
    donation.donorCount++;
    await donation.save();
    
    await addPoints(req.user._id, 10, '公益捐赠荣誉积分', donation._id, 'donation_bonus');
    
    res.json({ success: true, message: '捐赠成功，感谢您的爱心！' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
