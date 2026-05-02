import { jest } from '@jest/globals';

const mockShop = {
  id: 1,
  name: 'Test Shop',
  platform: 'amazon',
  status: 'active',
  auth_token: 'mock_token',
  refresh_token: 'mock_refresh',
  token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  save: jest.fn(),
  shop_config: {}
};

const mockShopFindByPk = jest.fn().mockResolvedValue(mockShop);
const mockShopFindAll = jest.fn().mockResolvedValue([mockShop]);

jest.unstable_mockModule('../models/Shop.js', () => ({
  default: {
    findByPk: mockShopFindByPk,
    findAll: mockShopFindAll
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

const { AuthEngine } = await import('../engines/AuthEngine.js');

describe('AuthEngine', () => {
  let authEngine;

  beforeEach(() => {
    authEngine = new AuthEngine();
    jest.clearAllMocks();
  });

  describe('generateMockToken', () => {
    it('should generate a valid mock token', () => {
      const token = authEngine.generateMockToken?.('test');
      expect(token).toBeDefined();
    });
  });

  describe('authorize', () => {
    it('should authorize a shop and return token info', async () => {
      const result = await authEngine.authorize('amazon', 'test_auth_code', 1);
      expect(result).toBeDefined();
      expect(mockShop.save).toHaveBeenCalled();
    });

    it('should throw error for unsupported platform', async () => {
      await expect(authEngine.authorize('unsupported', 'code')).rejects.toThrow('Unsupported platform');
    });
  });

  describe('validateAuth', () => {
    it('should return valid for active shop with token', async () => {
      const result = await authEngine.validateAuth(1);
      expect(result.valid).toBe(true);
    });

    it('should return invalid for shop without token', async () => {
      mockShopFindByPk.mockResolvedValueOnce({ ...mockShop, auth_token: null });
      const result = await authEngine.validateAuth(1);
      expect(result.valid).toBe(false);
    });

    it('should return expired for shop with expired token', async () => {
      mockShopFindByPk.mockResolvedValueOnce({
        ...mockShop,
        token_expires_at: new Date(Date.now() - 1000)
      });
      const result = await authEngine.validateAuth(1);
      expect(result.expired).toBe(true);
    });

    it('should return invalid for non-existent shop', async () => {
      mockShopFindByPk.mockResolvedValueOnce(null);
      const result = await authEngine.validateAuth(999);
      expect(result.valid).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const result = await authEngine.refreshToken(1);
      expect(result).toBeDefined();
      expect(mockShop.save).toHaveBeenCalled();
    });

    it('should throw error for non-existent shop', async () => {
      mockShopFindByPk.mockResolvedValueOnce(null);
      await expect(authEngine.refreshToken(999)).rejects.toThrow('Shop not found');
    });

    it('should throw error for shop without refresh token', async () => {
      mockShopFindByPk.mockResolvedValueOnce({ ...mockShop, refresh_token: null });
      await expect(authEngine.refreshToken(1)).rejects.toThrow('No refresh token');
    });
  });

  describe('revokeAuth', () => {
    it('should revoke authorization successfully', async () => {
      const result = await authEngine.revokeAuth(1, 1);
      expect(result).toBe(true);
      expect(mockShop.status).toBe('inactive');
    });
  });
});