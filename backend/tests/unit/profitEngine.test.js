import { jest } from '@jest/globals';

const mockOrder = {
  id: 1,
  platform_order_id: 'AMZN-123456',
  total_amount: 199.98,
  currency: 'USD',
  status: 'completed',
  shop_id: 1,
  created_at: new Date(),
  items: [
    { sku_id: 1, sku_code: 'SKU-001', name: 'Test Product', price: 99.99, quantity: 2 }
  ],
  shop: { platform: 'amazon' }
};

const mockSKU = {
  id: 1,
  sku_code: 'SKU-001',
  cost: 50.00
};

jest.unstable_mockModule('../models/Order.js', () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue(mockOrder),
    findAll: jest.fn().mockResolvedValue([mockOrder])
  }
}));

jest.unstable_mockModule('../models/SKU.js', () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue(mockSKU)
  }
}));

jest.unstable_mockModule('../models/Shop.js', () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue({ id: 1, platform: 'amazon' })
  }
}));

jest.unstable_mockModule('../models/Cost.js', () => ({
  default: {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 1 })
  }
}));

jest.unstable_mockModule('../models/Log.js', () => ({
  default: {
    create: jest.fn().mockResolvedValue({})
  }
}));

const { ProfitEngine } = await import('../engines/ProfitEngine.js');

describe('ProfitEngine', () => {
  let profitEngine;

  beforeEach(() => {
    profitEngine = new ProfitEngine();
    jest.clearAllMocks();
  });

  describe('aggregateOrderCosts', () => {
    it('should aggregate costs for an order', async () => {
      const costs = await profitEngine.aggregateOrderCosts(1);
      expect(costs).toBeDefined();
      expect(Array.isArray(costs)).toBe(true);
    });

    it('should include shipping cost', async () => {
      const costs = await profitEngine.aggregateOrderCosts(1);
      const shippingCost = costs.find(c => c.type === 'shipping');
      expect(shippingCost).toBeDefined();
      expect(shippingCost.amount).toBe(profitEngine.defaultShippingCost);
    });

    it('should include platform fee', async () => {
      const costs = await profitEngine.aggregateOrderCosts(1);
      const platformFee = costs.find(c => c.type === 'platform_fee');
      expect(platformFee).toBeDefined();
    });
  });

  describe('calculateOrderProfit', () => {
    it('should calculate profit correctly', async () => {
      const result = await profitEngine.calculateOrderProfit(1);
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('profit');
      expect(result).toHaveProperty('profitMargin');
      expect(result.profit).toBe(result.revenue - result.totalCost);
    });
  });

  describe('getGroupKey', () => {
    it('should group by day correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const key = profitEngine.getGroupKey(date, 'day');
      expect(key).toBe('2024-01-15');
    });

    it('should group by month correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const key = profitEngine.getGroupKey(date, 'month');
      expect(key).toBe('2024-01');
    });

    it('should group by year correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const key = profitEngine.getGroupKey(date, 'year');
      expect(key).toBe('2024');
    });
  });

  describe('platformFeeRates', () => {
    it('should have correct fee rate for Amazon', () => {
      expect(profitEngine.platformFeeRates.amazon).toBe(0.15);
    });

    it('should have correct fee rate for eBay', () => {
      expect(profitEngine.platformFeeRates.ebay).toBe(0.10);
    });

    it('should have correct fee rate for Shopify', () => {
      expect(profitEngine.platformFeeRates.shopify).toBe(0.02);
    });

    it('should have correct fee rate for TikTok', () => {
      expect(profitEngine.platformFeeRates.tiktok).toBe(0.08);
    });
  });
});