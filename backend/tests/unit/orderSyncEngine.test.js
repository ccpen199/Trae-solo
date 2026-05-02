import { jest } from '@jest/globals';

const mockOrder = {
  id: 1,
  shop_id: 1,
  platform_order_id: 'AMZN-123456',
  platform: 'amazon',
  customer_info: { name: 'Test Customer', email: 'test@example.com' },
  items: [
    { sku_id: 1, sku_code: 'SKU-001', name: 'Test Product', price: 99.99, quantity: 2 }
  ],
  total_amount: 199.98,
  currency: 'USD',
  status: 'pending',
  payment_status: 'paid',
  shipping_status: 'unshipped',
  sync_status: 'synced',
  processing_chain: [],
  save: jest.fn()
};

jest.unstable_mockModule('../models/Order.js', () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue(mockOrder),
    findAll: jest.fn().mockResolvedValue([mockOrder]),
    create: jest.fn().mockResolvedValue({ ...mockOrder, id: 2 })
  }
}));

jest.unstable_mockModule('../models/Shop.js', () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue({ id: 1, name: 'Test Shop', platform: 'amazon' }),
    findAll: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Shop', status: 'active' }])
  }
}));

jest.unstable_mockModule('../models/SKU.js', () => ({
  default: {}
}));

jest.unstable_mockModule('../models/Shipment.js', () => ({
  default: {}
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

const { OrderSyncEngine } = await import('../engines/OrderSyncEngine.js');

describe('OrderSyncEngine', () => {
  let orderSyncEngine;

  beforeEach(() => {
    orderSyncEngine = new OrderSyncEngine();
    jest.clearAllMocks();
  });

  describe('detectAnomalies', () => {
    it('should detect high value orders', async () => {
      const order = { ...mockOrder, total_amount: '2000.00' };
      const result = await orderSyncEngine.detectAnomalies(order);
      expect(result.detected).toBe(true);
      expect(result.anomalies).toContainEqual(
        expect.objectContaining({ type: 'high_value' })
      );
    });

    it('should detect high quantity items', async () => {
      const order = {
        ...mockOrder,
        total_amount: '100.00',
        items: [{ ...mockOrder.items[0], quantity: 10 }]
      };
      const result = await orderSyncEngine.detectAnomalies(order);
      expect(result.detected).toBe(true);
      expect(result.anomalies).toContainEqual(
        expect.objectContaining({ type: 'high_quantity' })
      );
    });

    it('should detect incomplete address', async () => {
      const order = {
        ...mockOrder,
        total_amount: '100.00',
        customer_info: { name: 'Test' }
      };
      const result = await orderSyncEngine.detectAnomalies(order);
      expect(result.detected).toBe(true);
      expect(result.anomalies).toContainEqual(
        expect.objectContaining({ type: 'incomplete_address' })
      );
    });

    it('should not detect anomalies for normal orders', async () => {
      const result = await orderSyncEngine.detectAnomalies(mockOrder);
      expect(result.detected).toBe(false);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status correctly', async () => {
      const result = await orderSyncEngine.updateOrderStatus(1, 'confirmed', 1);
      expect(result.status).toBe('confirmed');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should add to processing chain on status change', async () => {
      await orderSyncEngine.updateOrderStatus(1, 'shipped', 1);
      expect(mockOrder.processing_chain.length).toBeGreaterThan(0);
    });
  });

  describe('addProcessingChain', () => {
    it('should add entry to processing chain', async () => {
      const order = { ...mockOrder, processing_chain: [] };
      const { Order } = await import('../models/Order.js');
      Order.findByPk.mockResolvedValueOnce(order);

      await orderSyncEngine.addProcessingChain(1, 'test_action', 'Test message', { key: 'value' });
      expect(order.processing_chain.length).toBe(1);
      expect(order.processing_chain[0]).toMatchObject({
        action: 'test_action',
        message: 'Test message'
      });
    });
  });
});