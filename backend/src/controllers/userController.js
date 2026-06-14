const User = require('../models/User');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user,
      message: '获取用户信息成功'
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { companyName, contact, phone, address, province, city, district, businessLicense, idCard, hazardousQualification } = req.body;

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (contact !== undefined) updateData.contact = contact;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (province !== undefined) updateData.province = province;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (businessLicense !== undefined) updateData.businessLicense = businessLicense;
    if (idCard !== undefined) updateData.idCard = idCard;
    if (hazardousQualification !== undefined) updateData.hazardousQualification = hazardousQualification;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user,
      message: '更新用户信息成功'
    });
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const { businessLicense, idCard, hazardousQualification, companyName, contact, phone } = req.body;

    if (!businessLicense || !idCard) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '营业执照和身份证为必填项'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        businessLicense,
        idCard,
        hazardousQualification,
        companyName: companyName || req.user.companyName,
        contact: contact || req.user.contact,
        phone: phone || req.user.phone,
        verifyStatus: 'pending',
        isVerified: false
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user,
      message: '资质认证提交成功，请等待审核'
    });
  } catch (error) {
    next(error);
  }
};

const getList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { role, isVerified, keyword } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { companyName: { $regex: keyword, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page,
        pageSize
      },
      message: '获取用户列表成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  verify,
  getList
};
