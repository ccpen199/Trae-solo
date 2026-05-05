const { ShoppingCart, CartItem, UpgradePackage } = require('../models/ShoppingCart');
const { Package, PackageAttribute, PackageAttributeValue } = require('../models/Package');
const { Accessory, PackageAccessory } = require('../models/Accessory');
const PriceCalculator = require('../utils/priceCalculator');

const cartController = {
  
  getCart: async (req, res) => {
    try {
      const userId = req.userId;
      
      let cart = await ShoppingCart.findOne({
        where: { userId },
        include: [{
          model: CartItem,
          as: 'items',
          order: [['createdAt', 'ASC']]
        }]
      });

      if (!cart) {
        cart = await ShoppingCart.create({ userId });
        cart.items = [];
      }

      let totalAmount = 0;
      let selectedCount = 0;
      
      for (const item of cart.items) {
        if (item.isSelected) {
          totalAmount += parseFloat(item.totalPrice) || 0;
          selectedCount++;
        }
      }

      res.json({
        success: true,
        data: {
          cartId: cart.id,
          items: cart.items,
          totalAmount: Math.round(totalAmount * 100) / 100,
          selectedCount,
          totalCount: cart.items.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取购物车失败',
        error: error.message
      });
    }
  },

  addPackageToCart: async (req, res) => {
    try {
      const userId = req.userId;
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

      const pkg = await Package.findByPk(packageId, {
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

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: '套餐不存在'
        });
      }

      let cart = await ShoppingCart.findOne({ where: { userId } });
      if (!cart) {
        cart = await ShoppingCart.create({ userId });
      }

      const existingItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          itemType: 'package',
          itemId: packageId
        }
      });

      const unitPrice = PriceCalculator.calculatePackageUnitPrice(
        pkg.basePrice,
        selectedAttributes,
        pkg.attributes
      );
      const totalPrice = PriceCalculator.calculatePackageTotalPrice(unitPrice, houseArea);

      const metadata = {
        name: pkg.name,
        code: pkg.code,
        coverImage: pkg.coverImage,
        basePrice: parseFloat(pkg.basePrice)
      };

      if (existingItem) {
        await existingItem.update({
          quantity: 1,
          unitPrice,
          totalPrice,
          selectedAttributes,
          houseArea: parseFloat(houseArea),
          metadata
        });
      } else {
        await CartItem.create({
          cartId: cart.id,
          itemType: 'package',
          itemId: packageId,
          quantity: 1,
          unitPrice,
          totalPrice,
          selectedAttributes,
          houseArea: parseFloat(houseArea),
          metadata,
          isSelected: true
        });
      }

      res.json({
        success: true,
        message: '已添加到购物车',
        data: {
          packageId,
          unitPrice,
          totalPrice,
          houseArea
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '添加到购物车失败',
        error: error.message
      });
    }
  },

  addAccessoryToCart: async (req, res) => {
    try {
      const userId = req.userId;
      const { accessoryId, quantity = 1, packageId } = req.body;

      if (!accessoryId) {
        return res.status(400).json({
          success: false,
          message: '请选择配件'
        });
      }

      const accessory = await Accessory.findByPk(accessoryId);
      if (!accessory) {
        return res.status(404).json({
          success: false,
          message: '配件不存在'
        });
      }

      let cart = await ShoppingCart.findOne({ where: { userId } });
      if (!cart) {
        cart = await ShoppingCart.create({ userId });
      }

      const existingItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          itemType: 'accessory',
          itemId: accessoryId
        }
      });

      const priceResult = await PriceCalculator.calculateAccessoryPrice(
        accessoryId,
        quantity,
        packageId
      );

      const metadata = {
        name: accessory.name,
        code: accessory.code,
        coverImage: accessory.coverImage,
        brand: accessory.brand,
        unit: accessory.unit,
        packageId
      };

      if (existingItem) {
        const newQuantity = existingItem.quantity + parseInt(quantity);
        const newTotalPrice = priceResult.unitPrice * newQuantity;
        
        await existingItem.update({
          quantity: newQuantity,
          totalPrice: Math.round(newTotalPrice * 100) / 100
        });
      } else {
        await CartItem.create({
          cartId: cart.id,
          itemType: 'accessory',
          itemId: accessoryId,
          quantity: parseInt(quantity),
          unitPrice: priceResult.unitPrice,
          totalPrice: priceResult.totalPrice,
          metadata,
          isSelected: true
        });
      }

      res.json({
        success: true,
        message: '已添加到购物车',
        data: {
          accessoryId,
          quantity: parseInt(quantity),
          unitPrice: priceResult.unitPrice,
          totalPrice: priceResult.totalPrice
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '添加到购物车失败',
        error: error.message
      });
    }
  },

  addUpgradeToCart: async (req, res) => {
    try {
      const userId = req.userId;
      const { upgradeId, houseArea } = req.body;

      if (!upgradeId) {
        return res.status(400).json({
          success: false,
          message: '请选择优化改造包'
        });
      }

      const upgradePkg = await UpgradePackage.findByPk(upgradeId);
      if (!upgradePkg) {
        return res.status(404).json({
          success: false,
          message: '优化改造包不存在'
        });
      }

      let cart = await ShoppingCart.findOne({ where: { userId } });
      if (!cart) {
        cart = await ShoppingCart.create({ userId });
      }

      const existingItem = await CartItem.findOne({
        where: {
          cartId: cart.id,
          itemType: 'upgrade',
          itemId: upgradeId
        }
      });

      const totalPrice = PriceCalculator.calculateUpgradePrice(upgradePkg, houseArea);

      const metadata = {
        name: upgradePkg.name,
        code: upgradePkg.code,
        coverImage: upgradePkg.coverImage,
        priceType: upgradePkg.priceType,
        unitPrice: parseFloat(upgradePkg.price)
      };

      if (existingItem) {
        await existingItem.update({
          quantity: 1,
          unitPrice: parseFloat(upgradePkg.price),
          totalPrice,
          houseArea: houseArea ? parseFloat(houseArea) : null,
          metadata
        });
      } else {
        await CartItem.create({
          cartId: cart.id,
          itemType: 'upgrade',
          itemId: upgradeId,
          quantity: 1,
          unitPrice: parseFloat(upgradePkg.price),
          totalPrice,
          houseArea: houseArea ? parseFloat(houseArea) : null,
          metadata,
          isSelected: true
        });
      }

      res.json({
        success: true,
        message: '已添加到购物车',
        data: {
          upgradeId,
          unitPrice: parseFloat(upgradePkg.price),
          totalPrice
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '添加到购物车失败',
        error: error.message
      });
    }
  },

  updateCartItem: async (req, res) => {
    try {
      const userId = req.userId;
      const { itemId } = req.params;
      const { quantity, isSelected } = req.body;

      const cart = await ShoppingCart.findOne({ where: { userId } });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: '购物车不存在'
        });
      }

      const item = await CartItem.findOne({
        where: { id: itemId, cartId: cart.id }
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: '购物车项不存在'
        });
      }

      const updateData = {};
      if (quantity !== undefined && quantity >= 0) {
        updateData.quantity = quantity;
        updateData.totalPrice = Math.round(
          (parseFloat(item.unitPrice) || 0) * quantity * 100
        ) / 100;
      }
      if (isSelected !== undefined) {
        updateData.isSelected = isSelected;
      }

      await item.update(updateData);

      res.json({
        success: true,
        message: '更新成功',
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新购物车失败',
        error: error.message
      });
    }
  },

  removeFromCart: async (req, res) => {
    try {
      const userId = req.userId;
      const { itemId } = req.params;

      const cart = await ShoppingCart.findOne({ where: { userId } });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: '购物车不存在'
        });
      }

      const item = await CartItem.findOne({
        where: { id: itemId, cartId: cart.id }
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: '购物车项不存在'
        });
      }

      await item.destroy();

      res.json({
        success: true,
        message: '已从购物车移除'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '移除购物车项失败',
        error: error.message
      });
    }
  },

  clearCart: async (req, res) => {
    try {
      const userId = req.userId;

      const cart = await ShoppingCart.findOne({ where: { userId } });
      if (cart) {
        await CartItem.destroy({ where: { cartId: cart.id } });
      }

      res.json({
        success: true,
        message: '购物车已清空'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '清空购物车失败',
        error: error.message
      });
    }
  },

  calculateCartTotal: async (req, res) => {
    try {
      const userId = req.userId;

      const cart = await ShoppingCart.findOne({
        where: { userId },
        include: [{
          model: CartItem,
          as: 'items',
          where: { isSelected: true }
        }]
      });

      if (!cart || !cart.items) {
        return res.json({
          success: true,
          data: {
            packagePrice: 0,
            upgradePrice: 0,
            accessoryPrice: 0,
            discountAmount: 0,
            totalPrice: 0,
            items: []
          }
        });
      }

      let packagePrice = 0;
      let upgradePrice = 0;
      let accessoryPrice = 0;

      cart.items.forEach(item => {
        const price = parseFloat(item.totalPrice) || 0;
        if (item.itemType === 'package') {
          packagePrice += price;
        } else if (item.itemType === 'upgrade') {
          upgradePrice += price;
        } else if (item.itemType === 'accessory') {
          accessoryPrice += price;
        }
      });

      const totalPrice = packagePrice + upgradePrice + accessoryPrice;

      res.json({
        success: true,
        data: {
          packagePrice: Math.round(packagePrice * 100) / 100,
          upgradePrice: Math.round(upgradePrice * 100) / 100,
          accessoryPrice: Math.round(accessoryPrice * 100) / 100,
          discountAmount: 0,
          totalPrice: Math.round(totalPrice * 100) / 100,
          items: cart.items
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '计算购物车金额失败',
        error: error.message
      });
    }
  }
};

module.exports = cartController;
