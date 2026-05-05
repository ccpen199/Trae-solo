const { Package, PackageAttribute, PackageAttributeValue } = require('../models/Package');
const { Accessory, PackageAccessory } = require('../models/Accessory');
const { UpgradePackage } = require('../models/ShoppingCart');

class PriceCalculator {
  
  static calculatePackageUnitPrice(basePrice, selectedAttributes, attributes) {
    let unitPrice = parseFloat(basePrice);
    
    if (!selectedAttributes || !attributes) {
      return unitPrice;
    }

    attributes.forEach(attr => {
      if (attr.priceImpactType === 'none') return;
      
      const selectedValueId = selectedAttributes[attr.code];
      if (!selectedValueId) return;

      const attrValue = attr.values?.find(v => v.id === selectedValueId || v.value === selectedValueId);
      if (!attrValue) return;

      const adjustment = parseFloat(attrValue.priceAdjustment) || 0;
      
      if (attr.priceImpactType === 'add') {
        unitPrice += adjustment;
      } else if (attr.priceImpactType === 'multiply') {
        unitPrice *= adjustment;
      }
    });

    return Math.round(unitPrice * 100) / 100;
  }

  static calculatePackageTotalPrice(unitPrice, houseArea) {
    const area = parseFloat(houseArea) || 0;
    const price = parseFloat(unitPrice) || 0;
    return Math.round(price * area * 100) / 100;
  }

  static async calculateAccessoryPrice(accessoryId, quantity, packageId = null) {
    const accessory = await Accessory.findByPk(accessoryId);
    if (!accessory) return { unitPrice: 0, totalPrice: 0 };

    let unitPrice = parseFloat(accessory.basePrice) || 0;
    const qty = parseInt(quantity) || 1;

    if (packageId) {
      const pkgAcc = await PackageAccessory.findOne({
        where: { packageId, accessoryId }
      });
      if (pkgAcc && pkgAcc.discountPrice !== null) {
        unitPrice = parseFloat(pkgAcc.discountPrice);
      }
    }

    const totalPrice = Math.round(unitPrice * qty * 100) / 100;
    
    return {
      unitPrice,
      totalPrice,
      quantity: qty,
      accessory
    };
  }

  static calculateUpgradePrice(upgradePackage, houseArea) {
    const pkg = upgradePackage;
    const area = parseFloat(houseArea) || 0;
    const price = parseFloat(pkg.price) || 0;

    if (pkg.priceType === 'fixed') {
      return price;
    }
    
    return Math.round(price * area * 100) / 100;
  }

  static async calculateOrderSummary(cartData) {
    const { packageId, selectedAttributes, houseArea, accessories, upgrades } = cartData;
    
    const result = {
      packagePrice: 0,
      packageUnitPrice: 0,
      upgradePrice: 0,
      accessoryPrice: 0,
      discountAmount: 0,
      totalPrice: 0,
      details: {
        package: null,
        accessories: [],
        upgrades: []
      }
    };

    if (packageId) {
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

      if (pkg) {
        const unitPrice = this.calculatePackageUnitPrice(
          pkg.basePrice,
          selectedAttributes,
          pkg.attributes
        );
        
        const totalPrice = this.calculatePackageTotalPrice(unitPrice, houseArea);
        
        result.packageUnitPrice = unitPrice;
        result.packagePrice = totalPrice;
        result.details.package = {
          id: pkg.id,
          name: pkg.name,
          code: pkg.code,
          basePrice: parseFloat(pkg.basePrice),
          unitPrice,
          houseArea: parseFloat(houseArea),
          totalPrice,
          selectedAttributes
        };
      }
    }

    if (accessories && accessories.length > 0) {
      for (const accItem of accessories) {
        const accResult = await this.calculateAccessoryPrice(
          accItem.accessoryId,
          accItem.quantity,
          packageId
        );
        
        result.accessoryPrice += accResult.totalPrice;
        result.details.accessories.push({
          accessoryId: accItem.accessoryId,
          quantity: accResult.quantity,
          unitPrice: accResult.unitPrice,
          totalPrice: accResult.totalPrice,
          name: accResult.accessory?.name
        });
      }
    }

    if (upgrades && upgrades.length > 0) {
      for (const upgradeItem of upgrades) {
        const upgradePkg = await UpgradePackage.findByPk(upgradeItem.upgradeId);
        if (upgradePkg) {
          const price = this.calculateUpgradePrice(upgradePkg, houseArea);
          result.upgradePrice += price;
          result.details.upgrades.push({
            upgradeId: upgradeItem.upgradeId,
            name: upgradePkg.name,
            priceType: upgradePkg.priceType,
            unitPrice: parseFloat(upgradePkg.price),
            houseArea: parseFloat(houseArea),
            totalPrice: price
          });
        }
      }
    }

    result.totalPrice = Math.round(
      (result.packagePrice + result.upgradePrice + result.accessoryPrice - result.discountAmount) * 100
    ) / 100;

    return result;
  }

  static validatePrice(originalPrice, calculatedPrice, tolerance = 0.01) {
    const diff = Math.abs(parseFloat(originalPrice) - parseFloat(calculatedPrice));
    return diff <= tolerance;
  }
}

module.exports = PriceCalculator;
