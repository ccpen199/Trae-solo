const { Op } = require('sequelize');
const { House, User, Favorite, BrowseHistory, HouseCalendar, Review } = require('../models');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../middleware/errorHandler');

const getHouseList = async (req, res, next) => {
  try {
    const {
      city,
      district,
      checkInDate,
      checkOutDate,
      minPrice,
      maxPrice,
      houseType,
      minRooms,
      maxGuests,
      amenities,
      keyword,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    const where = { status: 'published' };

    if (city && city.trim()) where.city = city.trim();
    if (district && district.trim()) where.district = district.trim();
    
    const minPriceNum = minPrice ? parseFloat(minPrice) : NaN;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : NaN;
    const minRoomsNum = minRooms ? parseInt(minRooms) : NaN;
    const maxGuestsNum = maxGuests ? parseInt(maxGuests) : NaN;

    if (!isNaN(minPriceNum)) {
      where.pricePerNight = { [Op.gte]: minPriceNum };
    }
    if (!isNaN(maxPriceNum)) {
      where.pricePerNight = where.pricePerNight 
        ? { ...where.pricePerNight, [Op.lte]: maxPriceNum }
        : { [Op.lte]: maxPriceNum };
    }

    if (houseType && houseType.trim()) where.type = houseType.trim();
    if (!isNaN(minRoomsNum)) where.rooms = { [Op.gte]: minRoomsNum };
    if (!isNaN(maxGuestsNum)) where.maxGuests = { [Op.gte]: maxGuestsNum };

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        { address: { [Op.iLike]: `%${keyword}%` } }
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          order = [['pricePerNight', 'ASC']];
          break;
        case 'price_desc':
          order = [['pricePerNight', 'DESC']];
          break;
        case 'rating':
          order = [['rating', 'DESC']];
          break;
        case 'reviews':
          order = [['reviewCount', 'DESC']];
          break;
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows: houses } = await House.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'landlord',
          attributes: ['id', 'nickname', 'avatar', 'isVerified']
        }
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    let houseIds = houses.map(h => h.id);
    let favoritesMap = {};

    if (req.user && houseIds.length > 0) {
      const favorites = await Favorite.findAll({
        where: {
          userId: req.user.id,
          houseId: { [Op.in]: houseIds },
          isFavorite: true
        }
      });
      favorites.forEach(f => {
        favoritesMap[f.houseId] = true;
      });
    }

    const housesWithFavorites = houses.map(house => ({
      ...house.toJSON(),
      isFavorite: favoritesMap[house.id] || false
    }));

    res.json({
      success: true,
      data: {
        houses: housesWithFavorites,
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

const getHouseDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const house = await House.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } },
      include: [
        {
          model: User,
          as: 'landlord',
          attributes: ['id', 'nickname', 'avatar', 'isVerified', 'phone']
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname', 'avatar']
            }
          ],
          where: { status: 'published' },
          required: false,
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!house) {
      return next(new NotFoundError('房源不存在'));
    }

    await house.increment('viewCount');

    if (req.user) {
      await BrowseHistory.upsert({
        userId: req.user.id,
        houseId: house.id,
        viewCount: 1
      }, {
        conflictFields: ['userId', 'houseId'],
        updateOnDuplicate: ['viewCount', 'updatedAt']
      });
    }

    let isFavorite = false;
    if (req.user) {
      const favorite = await Favorite.findOne({
        where: {
          userId: req.user.id,
          houseId: house.id,
          isFavorite: true
        }
      });
      isFavorite = !!favorite;
    }

    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const calendars = await HouseCalendar.findAll({
      where: {
        houseId: house.id,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        ...house.toJSON(),
        isFavorite,
        calendars
      }
    });
  } catch (error) {
    next(error);
  }
};

const createHouse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      city,
      district,
      address,
      longitude,
      latitude,
      rooms,
      bedrooms,
      bathrooms,
      maxGuests,
      area,
      pricePerNight,
      cleaningFee,
      securityDeposit,
      images,
      amenities,
      houseRules,
      checkInTime,
      checkOutTime,
      minNights,
      maxNights,
      isInstantBook,
      tags,
      nearbyAttractions,
      status
    } = req.body;

    const landlord = req.user;

    if (landlord.role !== 'landlord') {
      return next(new ForbiddenError('您还不是房东，请先申请成为房东'));
    }

    const house = await House.create({
      landlordId: landlord.id,
      title,
      description,
      type,
      city,
      district,
      address,
      longitude,
      latitude,
      rooms,
      bedrooms,
      bathrooms,
      maxGuests,
      area,
      pricePerNight,
      cleaningFee: cleaningFee || 0,
      securityDeposit: securityDeposit || 0,
      images: images || [],
      amenities: amenities || [],
      houseRules,
      checkInTime: checkInTime || '14:00',
      checkOutTime: checkOutTime || '12:00',
      minNights: minNights || 1,
      maxNights: maxNights || 365,
      isInstantBook: isInstantBook !== false,
      tags: tags || [],
      nearbyAttractions: nearbyAttractions || [],
      status: status || 'draft'
    });

    res.status(201).json({
      success: true,
      message: '房源创建成功',
      data: house
    });
  } catch (error) {
    next(error);
  }
};

const updateHouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const house = await House.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!house) {
      return next(new NotFoundError('房源不存在'));
    }

    if (house.landlordId !== req.user.id) {
      return next(new ForbiddenError('无权限修改此房源'));
    }

    delete updateData.landlordId;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    await house.update(updateData);

    res.json({
      success: true,
      message: '房源更新成功',
      data: house
    });
  } catch (error) {
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const house = await House.findOne({
      where: { id, status: { [Op.ne]: 'deleted' } }
    });

    if (!house) {
      return next(new NotFoundError('房源不存在'));
    }

    const [favorite, created] = await Favorite.findOrCreate({
      where: { userId, houseId: id },
      defaults: { userId, houseId, isFavorite: true }
    });

    if (!created) {
      const newIsFavorite = !favorite.isFavorite;
      await favorite.update({ isFavorite: newIsFavorite });

      if (newIsFavorite) {
        await house.increment('favoriteCount');
      } else {
        await house.decrement('favoriteCount');
      }

      res.json({
        success: true,
        message: newIsFavorite ? '已收藏' : '已取消收藏',
        data: { isFavorite: newIsFavorite }
      });
    } else {
      await house.increment('favoriteCount');
      res.json({
        success: true,
        message: '已收藏',
        data: { isFavorite: true }
      });
    }
  } catch (error) {
    next(error);
  }
};

const getMyHouses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const where = { landlordId: userId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: houses } = await House.findAndCountAll({
      where,
      include: [
        {
          model: Review,
          as: 'reviews',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        houses,
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

module.exports = {
  getHouseList,
  getHouseDetail,
  createHouse,
  updateHouse,
  toggleFavorite,
  getMyHouses
};
