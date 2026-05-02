import Shop from '../models/Shop.js';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';
import { v4 as uuidv4 } from 'uuid';

class AuthEngine {
  constructor() {
    this.platformConfigs = {
      amazon: {
        authorizeUrl: 'https://sellercentral.amazon.com/apps/authorize',
        tokenRefreshUrl: 'https://api.amazon.com/auth/o2/token'
      },
      ebay: {
        authorizeUrl: 'https://auth.ebay.com/oauth2/authorize',
        tokenRefreshUrl: 'https://api.ebay.com.identity/oauth2/token'
      },
      shopify: {
        authorizeUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenRefreshUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token'
      },
      tiktok: {
        authorizeUrl: 'https://business-api.tiktok.com/portal/auth',
        tokenRefreshUrl: 'https://business-api.tiktok.com/portal/auth/refresh_token'
      }
    };
  }

  async authorize(platform, authCode, shopId = null) {
    try {
      const config = this.platformConfigs[platform];
      if (!config) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      let mockToken = `mock_token_${uuidv4()}`;
      let mockRefreshToken = `mock_refresh_${uuidv4()}`;
      let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      if (shopId) {
        const shop = await Shop.findByPk(shopId);
        if (shop) {
          shop.auth_token = mockToken;
          shop.refresh_token = mockRefreshToken;
          shop.token_expires_at = expiresAt;
          shop.status = 'active';
          await shop.save();

          await this.addProcessingChain(shopId, 'authorize', 'Authorization completed', { platform });

          return shop;
        }
      }

      return {
        auth_token: mockToken,
        refresh_token: mockRefreshToken,
        token_expires_at: expiresAt
      };
    } catch (error) {
      console.error('Authorization error:', error);
      throw error;
    }
  }

  async refreshToken(shopId) {
    try {
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        throw new Error('Shop not found');
      }

      if (!shop.refresh_token) {
        throw new Error('No refresh token available');
      }

      const newToken = `refreshed_token_${uuidv4()}`;
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      shop.auth_token = newToken;
      shop.token_expires_at = newExpiresAt;
      await shop.save();

      await this.addProcessingChain(shopId, 'refresh_token', 'Token refreshed successfully');

      return shop;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async validateAuth(shopId) {
    try {
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return { valid: false, error: 'Shop not found' };
      }

      if (!shop.auth_token) {
        return { valid: false, error: 'No auth token' };
      }

      if (shop.token_expires_at && new Date(shop.token_expires_at) < new Date()) {
        return { valid: false, error: 'Token expired', expired: true };
      }

      return { valid: true, shop };
    } catch (error) {
      console.error('Auth validation error:', error);
      return { valid: false, error: error.message };
    }
  }

  async revokeAuth(shopId, userId) {
    try {
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        throw new Error('Shop not found');
      }

      shop.auth_token = null;
      shop.refresh_token = null;
      shop.token_expires_at = null;
      shop.status = 'inactive';
      await shop.save();

      await this.addProcessingChain(shopId, 'revoke', 'Authorization revoked', { revokedBy: userId });

      await Log.create({
        type: 'operation',
        user_id: userId,
        action: 'revoke_auth',
        target: 'shop',
        target_id: shopId,
        message: `Revoked authorization for shop ${shop.name}`,
        details: { platform: shop.platform }
      });

      return true;
    } catch (error) {
      console.error('Revoke auth error:', error);
      throw error;
    }
  }

  async getValidToken(shopId) {
    const validation = await this.validateAuth(shopId);

    if (validation.valid) {
      const shop = await Shop.findByPk(shopId);
      return shop.auth_token;
    }

    if (validation.expired) {
      try {
        const shop = await this.refreshToken(shopId);
        return shop.auth_token;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        throw error;
      }
    }

    throw new Error(validation.error);
  }

  async checkAndRefreshTokens() {
    try {
      const shops = await Shop.findAll({
        where: { status: 'active' }
      });

      for (const shop of shops) {
        if (shop.token_expires_at) {
          const expiresIn = new Date(shop.token_expires_at) - new Date();
          const refreshThreshold = 2 * 60 * 60 * 1000;

          if (expiresIn < refreshThreshold && expiresIn > 0) {
            try {
              await this.refreshToken(shop.id);
              console.log(`Token refreshed for shop ${shop.id}`);
            } catch (error) {
              console.error(`Failed to refresh token for shop ${shop.id}:`, error);

              await Alert.create({
                type: 'system',
                message: `Token refresh failed for shop ${shop.name}`,
                level: 'error',
                related_type: 'shop',
                related_id: shop.id
              });
            }
          } else if (expiresIn <= 0) {
            shop.status = 'inactive';
            await shop.save();

            await Alert.create({
              type: 'system',
              message: `Authorization expired for shop ${shop.name}`,
              level: 'warning',
              related_type: 'shop',
              related_id: shop.id
            });
          }
        }
      }
    } catch (error) {
      console.error('Check and refresh tokens error:', error);
    }
  }

  async addProcessingChain(shopId, action, message, details = {}) {
    const shop = await Shop.findByPk(shopId);
    if (!shop) return;

    const chain = shop.shop_config?.processing_chain || [];
    chain.push({
      action,
      message,
      details,
      timestamp: new Date().toISOString()
    });

    shop.shop_config = {
      ...shop.shop_config,
      processing_chain: chain
    };
    await shop.save();
  }
}

export { AuthEngine };