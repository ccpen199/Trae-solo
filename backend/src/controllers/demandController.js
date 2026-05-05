const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Demand, House, User, Notification } = require('../models');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../middleware/errorHandler');

const generateDemandNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DEM${year}${month}${day}${random}`;
};

const createDemand = async (req, res, next) => {
  try {
    const {
      title,
      description,
      city,
      district,
      checkInDate,
      checkOutDate,
      maxGuests,
      houseType,
      minPrice,
      maxPrice,
      rooms,
      bedrooms,
      bathrooms,
      amenities,
      specialRequirements,
      isUrgent,
      budget
    } = req.body;
    const userId = req.user.id;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return next(new BadRequestError('入住日期不能早于今天'));
    }
    if (checkOut <= checkIn) {
      return next(new BadRequestError('退房日期必须晚于入住日期'));
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    const demand = await Demand.create({
      demandNo: generateDemandNo(),
      userId,
      title,
      description,
      city,
      district,
      checkInDate,
      checkOutDate,
      nights,
      maxGuests: maxGuests || 2,
      houseType: houseType || [],
      minPrice,
      maxPrice,
      rooms,
      bedrooms,
      bathrooms,
      amenities: amenities || [],
      specialRequirements,
      isUrgent: isUrgent || false,
      budget,
      status: 'published'
    });

    const matchingHouses = await House.findAll({
      where: {
        city,
        status: 'published',
        ...(maxGuests && { maxGuests: { [Op.gte]: maxGuests } }),
        ...(minPrice && { pricePerNight: { [Op.gte]: minPrice } }),
        ...(maxPrice && { pricePerNight: { [Op.lte]: maxPrice } }),
        ...(houseType && houseType.length > 0 && { type: { [Op.in]: houseType } })
      },
      include: [{ model: User, as: 'landlord' }]
    });

    for (const house of matchingHouses) {
      await Notification.create({
        userId: house.landlordId,
        type: 'demand',
        title: '新的找房需求',
        content: `有用户在${city}发布了找房需求：${title}`,
        relatedId: demand.id,
        relatedType: 'Demand'
      });
    }

    await demand.update({ matchedCount: matchingHouses.length });

    res.status(201).json({
      success: true,
      message: '需求发布成功',
      data: {
        demand,
        matchedCount: matchingHouses.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDemandList = async (req, res, next) => {
  try {
    const {
      city,
      district,
      minPrice,
      maxPrice,
      minGuests,
      houseType,
      isUrgent,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const where = { status: 'published' };

    if (city) where.city = city;
    if (district) where.district = district;
    if (minPrice !== undefined) where.pricePerNight = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice !== undefined) {
      where.pricePerNight = where.pricePerNight
        ? { ...where.pricePerNight, [Op.lte]: parseFloat(maxPrice) }
        : { [Op.lte]: parseFloat(maxPrice) };
    }
    if (minGuests !== undefined) where.maxGuests = { [Op.gte]: parseInt(minGuests) };
    if (houseType) where.houseType = { [Op.contains]: [houseType] };
    if (isUrgent !== undefined) where.isUrgent = isUrgent === 'true';
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: demands } = await Demand.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ],
      order: [['isUrgent', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        demands,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDemandDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const demand = await Demand.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ]
    });

    if (!demand) {
      return next(new NotFoundError('需求不存在'));
    }

    await demand.increment('viewCount');

    const matchingHouses = await House.findAll({
      where: {
        city: demand.city,
        status: 'published',
        maxGuests: { [Op.gte]: demand.maxGuests },
        ...(demand.minPrice && { pricePerNight: { [Op.gte]: demand.minPrice } }),
        ...(demand.maxPrice && { pricePerNight: { [Op.lte]: demand.maxPrice } })
      },
      include: [{ model: User, as: 'landlord', attributes: ['id', 'nickname', 'avatar'] }],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        demand,
        matchedHouses
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMyDemands = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: demands } = await Demand.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        demands,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateDemandStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const demand = await Demand.findOne({
      where: { id, userId }
    });

    if (!demand) {
      return next(new NotFoundError('需求不存在或无权操作'));
    }

    if (!['draft', 'published', 'expired', 'closed', 'booked'].includes(status)) {
      return next(new BadRequestError('无效的状态'));
    }

    await demand.update({ status });

    res.json({
      success: true,
      message: '状态更新成功',
      data: demand
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDemand,
  getDemandList,
  getDemandDetail,
  getMyDemands,
  updateDemandStatus
};
