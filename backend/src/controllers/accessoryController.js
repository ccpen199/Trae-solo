const { AccessoryCategory, Accessory, PackageAccessory } = require('../models/Accessory');
const { UpgradePackage } = require('../models/ShoppingCart');
const { cache } = require('../config/redis');

const accessoryController = {
  
  getAccessoryCategories: async (req, res) => {
    try {
      const cacheKey = 'accessories:categories';
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const categories = await AccessoryCategory.findAll({
        where: { status: 1 },
        order: [['sortOrder', 'ASC']]
      });

      await cache.set(cacheKey, categories, 300);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取配件分类失败',
        error: error.message
      });
    }
  },

  getAccessoryList: async (req, res) => {
    try {
      const { categoryId, packageId, isRecommended, page = 1, pageSize = 20 } = req.query;

      const cacheKey = `accessories:list:${categoryId || 'all'}:${packageId || 'all'}:${isRecommended || 'all'}:${page}:${pageSize}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const where = { status: 1 };
      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (isRecommended === 'true') {
        where.isRecommended = true;
      }

      const include = [
        {
          model: AccessoryCategory,
          as: 'category',
          attributes: ['id', 'name', 'code']
        }
      ];

      if (packageId) {
        include.push({
          model: PackageAccessory,
          as: 'packageAccessories',
          where: { packageId },
          required: false
        });
      }

      const { count, rows } = await Accessory.findAndCountAll({
        where,
        include,
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize)
      });

      const result = {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };

      await cache.set(cacheKey, result, 300);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取配件列表失败',
        error: error.message
      });
    }
  },

  getAccessoryDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const { packageId } = req.query;

      const cacheKey = `accessories:detail:${id}:${packageId || 'none'}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const include = [
        {
          model: AccessoryCategory,
          as: 'category',
          attributes: ['id', 'name', 'code']
        }
      ];

      if (packageId) {
        include.push({
          model: PackageAccessory,
          as: 'packageAccessories',
          where: { packageId },
          required: false
        });
      }

      const accessory = await Accessory.findByPk(id, { include });

      if (!accessory) {
        return res.status(404).json({
          success: false,
          message: '配件不存在'
        });
      }

      let displayPrice = parseFloat(accessory.basePrice);
      let isIncluded = false;
      let minQuantity = 0;
      let maxQuantity = 999;
      let defaultQuantity = 1;

      if (packageId && accessory.packageAccessories && accessory.packageAccessories.length > 0) {
        const pkgAcc = accessory.packageAccessories[0];
        if (pkgAcc.discountPrice !== null) {
          displayPrice = parseFloat(pkgAcc.discountPrice);
        }
        isIncluded = pkgAcc.isIncluded;
        minQuantity = pkgAcc.minQuantity;
        maxQuantity = pkgAcc.maxQuantity;
        defaultQuantity = pkgAcc.defaultQuantity;
      }

      const result = {
        ...accessory.toJSON(),
        displayPrice,
        isIncluded,
        minQuantity,
        maxQuantity,
        defaultQuantity,
        marketPrice: accessory.marketPrice ? parseFloat(accessory.marketPrice) : null
      };

      await cache.set(cacheKey, result, 300);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取配件详情失败',
        error: error.message
      });
    }
  },

  getPackageAccessories: async (req, res) => {
    try {
      const { packageId } = req.params;
      const { categoryId, page = 1, pageSize = 50 } = req.query;

      const where = { packageId };
      
      const include = [
        {
          model: Accessory,
          as: 'accessory',
          where: { status: 1 },
          include: [{
            model: AccessoryCategory,
            as: 'category',
            attributes: ['id', 'name', 'code']
          }]
        }
      ];

      if (categoryId) {
        include[0].where.categoryId = categoryId;
      }

      const { count, rows } = await PackageAccessory.findAndCountAll({
        where,
        include,
        order: [['sortOrder', 'ASC']],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize)
      });

      const formattedList = rows.map(pa => ({
        ...pa.toJSON(),
        accessory: {
          ...pa.accessory?.toJSON(),
          displayPrice: pa.discountPrice !== null ? parseFloat(pa.discountPrice) : parseFloat(pa.accessory?.basePrice || 0),
          isIncluded: pa.isIncluded
        }
      }));

      res.json({
        success: true,
        data: {
          list: formattedList,
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取套餐配件失败',
        error: error.message
      });
    }
  },

  getUpgradePackages: async (req, res) => {
    try {
      const cacheKey = 'upgrade:packages';
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const packages = await UpgradePackage.findAll({
        where: { status: 1 },
        order: [['sortOrder', 'ASC']]
      });

      await cache.set(cacheKey, packages, 300);

      res.json({
        success: true,
        data: packages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取优化改造包失败',
        error: error.message
      });
    }
  },

  getUpgradePackageDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const { houseArea } = req.query;

      const upgradePkg = await UpgradePackage.findByPk(id);

      if (!upgradePkg) {
        return res.status(404).json({
          success: false,
          message: '优化改造包不存在'
        });
      }

      let totalPrice = null;
      if (houseArea && houseArea > 0) {
        const area = parseFloat(houseArea);
        if (upgradePkg.priceType === 'fixed') {
          totalPrice = parseFloat(upgradePkg.price);
        } else {
          totalPrice = Math.round(parseFloat(upgradePkg.price) * area * 100) / 100;
        }
      }

      res.json({
        success: true,
        data: {
          ...upgradePkg.toJSON(),
          totalPrice,
          houseArea: houseArea ? parseFloat(houseArea) : null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取优化改造包详情失败',
        error: error.message
      });
    }
  }
};

module.exports = accessoryController;
