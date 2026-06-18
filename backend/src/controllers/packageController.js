const { Package, User } = require('../models');

exports.getPackages = async (req, res, next) => {
  try {
    const { deviceType, packageType, status, page = 1, pageSize = 20 } = req.query;

    const filter = { status: 'active' };
    if (deviceType && deviceType !== 'all') filter.deviceType = deviceType;
    if (packageType) filter.packageType = packageType;
    if (status) filter.status = status;

    if (req.user.role === 'resident' && req.user.communityId) {
      filter.$or = [
        { applicableCommunities: { $in: [req.user.communityId] } },
        { applicableCommunities: { $size: 0 } },
      ];
    }

    const packages = await Package.find(filter)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .sort({ sort: 1, createdAt: -1 });

    const total = await Package.countDocuments(filter);

    res.json({
      success: true,
      data: {
        list: packages,
        pagination: { page: Number(page), pageSize: Number(pageSize), total },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id);

    if (!pkg) {
      return res.status(404).json({ message: '套餐不存在' });
    }

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const {
      name, code, deviceType, packageType, description, features,
      pricing, benefits, applicableCommunities, applicableGrids,
      limitPerUser, totalStock, status, startDate, endDate, sort
    } = req.body;

    const existing = await Package.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: '套餐编码已存在' });
    }

    const pkg = await Package.create({
      name,
      code,
      deviceType,
      packageType,
      description,
      features,
      pricing,
      benefits,
      applicableCommunities,
      applicableGrids,
      limitPerUser,
      totalStock,
      status,
      startDate,
      endDate,
      sort,
    });

    res.status(201).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!pkg) {
      return res.status(404).json({ message: '套餐不存在' });
    }

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePackageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ message: '套餐不存在' });
    }

    pkg.status = status;
    await pkg.save();

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};
