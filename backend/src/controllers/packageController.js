const { Package, PackageAttribute, PackageAttributeValue } = require('../models/Package');
const { cache } = require('../config/redis');
const PriceCalculator = require('../utils/priceCalculator');
const mockData = require('../data/mockData');

const packageController = {
  
  getPackageList: async (req, res) => {
    try {
      const { category, page = 1, pageSize = 20 } = req.query;
      
      const cacheKey = `packages:list:${category || 'all'}:${page}:${pageSize}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const where = { status: 1 };
      if (category) {
        where.category = category;
      }

      const { count, rows } = await Package.findAndCountAll({
        where,
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
      console.log('使用内存数据降级 - 套餐列表');
      try {
        const { category, page = 1, pageSize = 20 } = req.query;
        const result = mockData.findAllPackages({ category, page: parseInt(page), pageSize: parseInt(pageSize) });
        res.json({
          success: true,
          data: result,
          fromMock: true
        });
      } catch (mockError) {
        res.status(500).json({
          success: false,
          message: '获取套餐列表失败',
          error: error.message
        });
      }
    }
  },

  getPackageDetail: async (req, res) => {
    try {
      const { id } = req.params;
      
      const cacheKey = `packages:detail:${id}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      const pkg = await Package.findByPk(id, {
        include: [{
          model: PackageAttribute,
          as: 'attributes',
          where: { status: 1 },
          required: false,
          order: [['sortOrder', 'ASC']],
          include: [{
            model: PackageAttributeValue,
            as: 'values',
            where: { status: 1 },
            required: false,
            order: [['sortOrder', 'ASC']]
          }]
        }]
      });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: '套餐不存在'
        });
      }

      await cache.set(cacheKey, pkg, 600);

      res.json({
        success: true,
        data: pkg
      });
    } catch (error) {
      console.log('使用内存数据降级 - 套餐详情');
      try {
        const { id } = req.params;
        const pkg = mockData.findPackageById(id);
        if (!pkg) {
          return res.status(404).json({
            success: false,
            message: '套餐不存在'
          });
        }
        res.json({
          success: true,
          data: pkg,
          fromMock: true
        });
      } catch (mockError) {
        res.status(500).json({
          success: false,
          message: '获取套餐详情失败',
          error: error.message
        });
      }
    }
  },

  calculatePrice: async (req, res) => {
    try {
      const { packageId, selectedAttributes, houseArea } = req.body;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: '请选择套餐'
        });
      }

      if (!houseArea || houseArea <= 0) {
        return res.status(400).json({
          success: false,
          message: '请输入有效的房屋面积'
        });
      }

      let pkg;
      try {
        pkg = await Package.findByPk(packageId, {
          include: [{
            model: PackageAttribute,
            as: 'attributes',
            where: { status: 1 },
            required: false,
            include: [{
              model: PackageAttributeValue,
              as: 'values',
              where: { status: 1 },
              required: false
            }]
          }]
        });
      } catch (dbError) {
        console.log('使用内存数据降级 - 价格计算');
        pkg = mockData.findPackageById(packageId);
      }

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: '套餐不存在'
        });
      }

      const unitPrice = PriceCalculator.calculatePackageUnitPrice(
        pkg.basePrice,
        selectedAttributes,
        pkg.attributes
      );

      const totalPrice = PriceCalculator.calculatePackageTotalPrice(unitPrice, houseArea);

      const attributeDetails = [];
      pkg.attributes?.forEach(attr => {
        const selectedValueId = selectedAttributes?.[attr.code];
        const selectedValue = attr.values?.find(v => 
          v.id === selectedValueId || v.value === selectedValueId
        );
        
        attributeDetails.push({
          attributeId: attr.id,
          attributeCode: attr.code,
          attributeName: attr.name,
          selectedValueId: selectedValue?.id,
          selectedValue: selectedValue?.value,
          selectedLabel: selectedValue?.label,
          priceAdjustment: selectedValue?.priceAdjustment || 0,
          priceImpactType: attr.priceImpactType
        });
      });

      res.json({
        success: true,
        data: {
          packageId: pkg.id,
          packageName: pkg.name,
          basePrice: parseFloat(pkg.basePrice),
          houseArea: parseFloat(houseArea),
          unitPrice,
          totalPrice,
          selectedAttributes,
          attributeDetails
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '计算价格失败',
        error: error.message
      });
    }
  },

  getPackageCategories: async (req, res) => {
    try {
      const categories = await Package.findAll({
        where: { status: 1 },
        attributes: ['category'],
        group: ['category']
      });

      const result = categories
        .filter(c => c.category)
        .map(c => ({
          code: c.category,
          name: c.category
        }));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.log('使用内存数据降级 - 套餐分类');
      try {
        const result = mockData.getPackageCategories();
        res.json({
          success: true,
          data: result,
          fromMock: true
        });
      } catch (mockError) {
        res.status(500).json({
          success: false,
          message: '获取套餐分类失败',
          error: error.message
        });
      }
    }
  }
};

module.exports = packageController;
