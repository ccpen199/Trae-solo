import Post from '../models/Post.js';
import User from '../models/User.js';
import Circle from '../models/Circle.js';
import Activity from '../models/Activity.js';
import Coupon from '../models/Coupon.js';
import Donation from '../models/Donation.js';
import PointRecord from '../models/PointRecord.js';

const districtCenters = {
  '惠城区': { lat: 23.0837, lng: 114.4122 },
  '惠阳区': { lat: 22.7938, lng: 114.4628 },
  '惠东县': { lat: 22.9968, lng: 114.9386 },
  '博罗县': { lat: 23.1816, lng: 114.2878 },
  '龙门县': { lat: 23.7513, lng: 114.2639 },
  '大亚湾区': { lat: 22.7036, lng: 114.5639 },
  '仲恺高新区': { lat: 22.9961, lng: 114.3286 },
};

export const getStats = async (req, res) => {
  try {
    const [userCount, postCount, pendingPostCount, circleCount, activityCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ status: 'pending' }),
      Circle.countDocuments(),
      Activity.countDocuments(),
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayPosts, todayUsers, todayActivities] = await Promise.all([
      Post.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      Activity.countDocuments({ createdAt: { $gte: today } }),
    ]);
    
    res.json({
      success: true,
      data: {
        userCount,
        postCount,
        pendingPostCount,
        circleCount,
        activityCount,
        todayPosts,
        todayUsers,
        todayActivities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getHeatmapData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'approved' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const posts = await Post.find(query);
    
    const districtData = {};
    
    Object.keys(districtCenters).forEach(district => {
      districtData[district] = {
        district,
        count: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        center: districtCenters[district],
      };
    });
    
    posts.forEach(post => {
      const district = post.location?.district;
      if (district && districtData[district]) {
        districtData[district].count++;
        const sentiment = post.sentiment || 'neutral';
        districtData[district].sentiment[sentiment]++;
      }
    });
    
    res.json({
      success: true,
      data: Object.values(districtData),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPendingPosts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const posts = await Post.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .populate('userId', 'nickname avatar');
    
    const total = await Post.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: {
        data: posts.map(p => ({
          ...p.toObject(),
          id: p._id,
          user: {
            id: p.userId._id,
            nickname: p.userId.nickname,
            avatar: p.userId.avatar,
          },
        })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reviewPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: '无效的审核状态' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, error: '帖子不存在' });
    }
    
    post.status = status;
    post.reviewedBy = req.user._id;
    post.reviewNote = reviewNote;
    await post.save();
    
    if (status === 'approved') {
      const PointRecord = await import('../models/PointRecord.js').then(m => m.default);
      const User = await import('../models/User.js').then(m => m.default);
      const pointRecord = new PointRecord({
        userId: post.userId,
        amount: 5,
        type: 'earn',
        reason: '爆料通过审核',
        relatedId: post._id,
        relatedType: 'post_approved',
      });
      await pointRecord.save();
      await User.findByIdAndUpdate(post.userId, { $inc: { points: 5 } });
    }
    
    res.json({ success: true, message: `审核${status === 'approved' ? '通过' : '拒绝'}成功` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const query = {};
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .select('-password');
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        data: users.map(u => ({ ...u.toObject(), id: u._id })),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.json({ success: true, data: { ...coupon.toObject(), id: coupon._id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDonation = async (req, res) => {
  try {
    const donation = new Donation(req.body);
    await donation.save();
    res.json({ success: true, data: { ...donation.toObject(), id: donation._id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const initSeedData = async (req, res) => {
  try {
    const circleCount = await Circle.countDocuments();
    if (circleCount === 0) {
      const circles = [
        { name: '惠州摄影爱好者', category: 'photography', description: '记录惠州的美好瞬间，分享摄影技巧与作品', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=photography%20club%20camera%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=huizhou%20west%20lake%20landscape%20photography&image_size=landscape_16_9', memberCount: 1280, postCount: 3560 },
        { name: '惠州亲子乐园', category: 'parenting', description: '惠州宝爸宝妈交流平台，分享育儿经验与亲子活动', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parenting%20family%20kids%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20family%20park%20children&image_size=landscape_16_9', memberCount: 2560, postCount: 8900 },
        { name: '惠州美食探索', category: 'food', description: '发现惠州美食，分享地道客家菜与海鲜', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20delicious%20restaurant%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=huizhou%20seafood%20hakka%20cuisine&image_size=landscape_16_9', memberCount: 3200, postCount: 12000 },
        { name: '惠州户外探险', category: 'outdoor', description: '徒步、登山、露营，探索惠州的自然之美', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=outdoor%20hiking%20mountain%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luofu%20mountain%20hiking%20nature&image_size=landscape_16_9', memberCount: 1890, postCount: 4500 },
        { name: '惠州健身达人', category: 'fitness', description: '运动健身交流，打卡锻炼，共同进步', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fitness%20gym%20workout%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fitness%20gym%20workout%20people&image_size=landscape_16_9', memberCount: 1560, postCount: 3200 },
        { name: '惠州科技前沿', category: 'tech', description: '科技爱好者聚集地，分享数码产品与技术', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=technology%20digital%20innovation%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=technology%20digital%20future%20city&image_size=landscape_16_9', memberCount: 980, postCount: 2100 },
        { name: '惠州艺术空间', category: 'art', description: '绘画、书法、音乐等艺术交流平台', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20painting%20creativity%20logo&image_size=square', coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20painting%20gallery%20creative&image_size=landscape_16_9', memberCount: 720, postCount: 1800 },
      ];
      
      for (const circle of circles) {
        const c = new Circle(circle);
        await c.save();
      }
    }
    
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      const coupons = [
        { merchantName: '华贸天地', title: '满200减50代金券', description: '全场通用，可与其他优惠叠加', discount: '满200减50', pointsRequired: 500, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping%20mall%20coupon%20voucher&image_size=square', validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), stock: 200 },
        { merchantName: '万达影城', title: '电影票5折优惠券', description: '普通厅通兑，不限场次', discount: '5折', pointsRequired: 300, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20movie%20ticket%20coupon&image_size=square', validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), stock: 500 },
        { merchantName: '真功夫', title: '免费升级套餐券', description: '任意套餐免费升级大份', discount: '免费升级', pointsRequired: 100, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fast%20food%20restaurant%20coupon&image_size=square', validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), stock: 1000 },
        { merchantName: '惠州西湖景区', title: '游船8折优惠券', description: '画舫游船票8折优惠', discount: '8折', pointsRequired: 200, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=west%20lake%20boat%20tour%20coupon&image_size=square', validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), stock: 300 },
        { merchantName: '星巴克', title: '买一送一券', description: '指定饮品买一送一', discount: '买一送一', pointsRequired: 400, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20starbucks%20coupon%20voucher&image_size=square', validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), stock: 150 },
      ];
      
      for (const coupon of coupons) {
        const c = new Coupon(coupon);
        await c.save();
      }
    }
    
    const donationCount = await Donation.countDocuments();
    if (donationCount === 0) {
      const donations = [
        { title: '山区儿童图书捐赠计划', description: '为惠州山区学校捐赠图书，让孩子们有更多阅读机会', targetAmount: 100000, currentAmount: 35600, pointsRequired: 100, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20reading%20books%20donation&image_size=square', donorCount: 356 },
        { title: '环卫工人爱心早餐', description: '为惠州环卫工人提供爱心早餐，温暖城市美容师', targetAmount: 50000, currentAmount: 28900, pointsRequired: 50, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=street%20cleaner%20breakfast%20charity&image_size=square', donorCount: 578 },
        { title: '流浪动物救助基金', description: '救助惠州流浪猫狗，提供食物、医疗和领养服务', targetAmount: 80000, currentAmount: 42300, pointsRequired: 80, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stray%20cat%20dog%20rescue%20charity&image_size=square', donorCount: 528 },
      ];
      
      for (const donation of donations) {
        const d = new Donation(donation);
        await d.save();
      }
    }
    
    res.json({ success: true, message: '种子数据初始化成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
