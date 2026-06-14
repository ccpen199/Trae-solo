const Waste = require('../models/Waste');

const getList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { category, status, sellerId, keyword, isHazardous, province, city } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;
    if (isHazardous !== undefined) query.isHazardous = isHazardous === 'true';
    if (province) query.province = province;
    if (city) query.city = city;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { material: { $regex: keyword, $options: 'i' } }
      ];
    }

    const total = await Waste.countDocuments(query);
    const wastes = await Waste.find(query)
      .populate('sellerId', 'username companyName role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: wastes,
        total,
        page,
        pageSize
      },
      message: '获取废弃物列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const waste = await Waste.findById(id).populate('sellerId', 'username companyName role phone');

    if (!waste) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '废弃物不存在'
      });
    }

    waste.viewCount = (waste.viewCount || 0) + 1;
    await waste.save();

    res.json({
      success: true,
      data: waste,
      message: '获取废弃物详情成功'
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      title, category, subCategory, material, weight, weightUnit,
      description, images, priceType, price, isHazardous, hazardousCode,
      location, province, city, district
    } = req.body;

    const waste = new Waste({
      title,
      category,
      subCategory,
      material,
      weight,
      weightUnit,
      description,
      images,
      priceType,
      price,
      estimatedPrice: price,
      sellerId: req.user._id,
      sellerType: req.user.role,
      isHazardous: isHazardous || false,
      hazardousCode,
      location,
      province,
      city,
      district,
      status: 'draft'
    });

    await waste.save();

    res.status(201).json({
      success: true,
      data: waste,
      message: '发布废弃物成功'
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const waste = await Waste.findById(id);

    if (!waste) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '废弃物不存在'
      });
    }

    if (waste.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限修改此废弃物'
      });
    }

    const {
      title, category, subCategory, material, weight, weightUnit,
      description, images, priceType, price, isHazardous, hazardousCode,
      location, province, city, district
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (material !== undefined) updateData.material = material;
    if (weight !== undefined) updateData.weight = weight;
    if (weightUnit !== undefined) updateData.weightUnit = weightUnit;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    if (priceType !== undefined) updateData.priceType = priceType;
    if (price !== undefined) updateData.price = price;
    if (isHazardous !== undefined) updateData.isHazardous = isHazardous;
    if (hazardousCode !== undefined) updateData.hazardousCode = hazardousCode;
    if (location !== undefined) updateData.location = location;
    if (province !== undefined) updateData.province = province;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;

    const updatedWaste = await Waste.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sellerId', 'username companyName role');

    res.json({
      success: true,
      data: updatedWaste,
      message: '更新废弃物成功'
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const waste = await Waste.findById(id);

    if (!waste) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '废弃物不存在'
      });
    }

    if (waste.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限删除此废弃物'
      });
    }

    await Waste.findByIdAndDelete(id);

    res.json({
      success: true,
      data: null,
      message: '删除废弃物成功'
    });
  } catch (error) {
    next(error);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const waste = await Waste.findById(id);

    if (!waste) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '废弃物不存在'
      });
    }

    if (waste.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限提交审核此废弃物'
      });
    }

    waste.status = 'pending_review';
    waste.reviewStatus = 'pending';
    await waste.save();

    res.json({
      success: true,
      data: waste,
      message: '提交审核成功'
    });
  } catch (error) {
    next(error);
  }
};

const estimatePrice = async (req, res, next) => {
  try {
    const { category, material, weight, isHazardous, quality } = req.body;

    const basePrices = {
      industrial_scrap: 3.5,
      used_equipment: 2.8,
      old_appliance: 1.5,
      household_plastic: 0.8,
      hazardous: 8.0
    };

    const materialFactors = {
      steel: 1.2,
      aluminum: 1.8,
      copper: 2.5,
      plastic: 0.9,
      paper: 0.7,
      glass: 0.6
    };

    const basePrice = basePrices[category] || 2.0;
    const materialFactor = materialFactors[material] || 1.0;
    const hazardMultiplier = isHazardous ? 1.5 : 1.0;
    const qualityFactor = quality === 'high' ? 1.3 : quality === 'low' ? 0.7 : 1.0;

    const unitPrice = basePrice * materialFactor * hazardMultiplier * qualityFactor;
    const totalPrice = unitPrice * weight;

    const minPrice = totalPrice * 0.85;
    const maxPrice = totalPrice * 1.15;

    res.json({
      success: true,
      data: {
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        priceRange: `${Math.round(minPrice * 100) / 100} - ${Math.round(maxPrice * 100) / 100}`,
        marketTrend: 'stable',
        factors: {
          basePrice,
          materialFactor,
          hazardMultiplier,
          qualityFactor
        }
      },
      message: '智能估价完成'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  update,
  remove,
  submitReview,
  estimatePrice
};
