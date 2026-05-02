import { jest } from '@jest/globals';

const mockSKU = {
  id: 1,
  product_id: 1,
  sku_code: 'SKU-TEST-001',
  attributes: { color: 'red', size: 'M' },
  price: 99.99,
  cost: 50.00,
  stock: 100,
  min_stock: 10,
  platform_skus: {},
  save: jest.fn()
};

jest.unstable_mockModule('../models/SKU.js', () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue(mockSKU),
    create: jest.fn().mockResolvedValue({ ...mockSKU, id: 2 })
  }
}));

jest.unstable_mockModule('../models/Product.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../models/Shop.js', () => ({
  default: {
    findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test Shop' })
  }
}));

jest.unstable_mockModule('../models/Log.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue({})
  }
}));

jest.unstable_mockModule('../models/Alert.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue({})
  }
}));

const { SKUEngine } = await import('../engines/SKUEngine.js');

describe('SKUEngine', () => {
  let skuEngine;

  beforeEach(() => {
    skuEngine = new SKUEngine();
    jest.clearAllMocks();
  });

  describe('generateSKUCode', () => {
    it('should generate a unique SKU code', () => {
      const code1 = skuEngine.generateSKUCode(1, { color: 'red' });
      const code2 = skuEngine.generateSKUCode(1, { color: 'blue' });
      expect(code1).toBeDefined();
      expect(code2).toBeDefined();
      expect(code1).not.toBe(code2);
    });

    it('should include product ID in SKU code', () => {
      const code = skuEngine.generateSKUCode(123, {});
      expect(code).toContain('123');
    });
  });

  describe('hashAttributes', () => {
    it('should generate consistent hash for same attributes', () => {
      const hash1 = skuEngine.hashAttributes({ color: 'red', size: 'M' });
      const hash2 = skuEngine.hashAttributes({ color: 'red', size: 'M' });
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different attributes', () => {
      const hash1 = skuEngine.hashAttributes({ color: 'red' });
      const hash2 = skuEngine.hashAttributes({ color: 'blue' });
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('updateStock', () => {
    it('should update stock correctly for positive delta', async () => {
      const result = await skuEngine.updateStock(1, 10, 'Restock');
      expect(result.stock).toBe(110);
    });

    it('should update stock correctly for negative delta', async () => {
      const result = await skuEngine.updateStock(1, -5, 'Sale');
      expect(result.stock).toBe(95);
    });

    it('should not allow stock to go below zero', async () => {
      const result = await skuEngine.updateStock(1, -200, 'Large sale');
      expect(result.stock).toBe(0);
    });

    it('should create alert for low stock', async () => {
      const { Alert } = await import('../models/Alert.js');
      await skuEngine.updateStock(1, -95, 'Large sale');
      expect(Alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'inventory',
          level: 'warning'
        })
      );
    });
  });

  describe('mapPlatformSKU', () => {
    it('should map platform SKU correctly', async () => {
      const result = await skuEngine.mapPlatformSKU(1, 'amazon', 'AMZ-SKU-001');
      expect(result.platform_skus).toHaveProperty('amazon', 'AMZ-SKU-001');
    });
  });
});