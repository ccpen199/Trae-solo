import express from 'express';
import { body, validationResult } from 'express-validator';
import Shop from '../models/Shop.js';
import Log from '../models/Log.js';
import { AuthEngine } from '../engines/AuthEngine.js';

const router = express.Router();
const authEngine = new AuthEngine();

router.get('/', async (req, res) => {
  try {
    const { platform, status } = req.query;
    const where = {};

    if (platform) where.platform = platform;
    if (status) where.status = status;

    const shops = await Shop.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({ shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', [
  body('name').notEmpty().trim(),
  body('platform').isIn(['amazon', 'ebay', 'shopify', 'tiktok'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, platform, shop_config } = req.body;

    const shop = await Shop.create({
      name,
      platform,
      status: 'pending',
      shop_config: shop_config || {}
    });

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'create_shop',
      target: 'shop',
      target_id: shop.id,
      message: `Created new shop: ${name} on ${platform}`,
      details: { name, platform }
    });

    res.status(201).json({ shop });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { name, status, shop_config } = req.body;

    if (name) shop.name = name;
    if (status) shop.status = status;
    if (shop_config) shop.shop_config = { ...shop.shop_config, ...shop_config };

    await shop.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'update_shop',
      target: 'shop',
      target_id: shop.id,
      message: `Updated shop: ${shop.name}`,
      details: req.body
    });

    res.json({ shop });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    await shop.destroy();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'delete_shop',
      target: 'shop',
      target_id: req.params.id,
      message: `Deleted shop: ${shop.name}`
    });

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/authorize', [
  body('auth_code').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { auth_code } = req.body;

    const result = await authEngine.authorize(shop.platform, auth_code, shop.id);

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'authorize_shop',
      target: 'shop',
      target_id: shop.id,
      message: `Authorized shop ${shop.name} on ${shop.platform}`,
      details: { platform: shop.platform }
    });

    res.json({
      message: 'Authorization successful',
      shop: result
    });
  } catch (error) {
    console.error('Authorize shop error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
});

router.post('/:id/sync', async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { OrderSyncEngine } = await import('../engines/OrderSyncEngine.js');
    const orderSyncEngine = new OrderSyncEngine();

    const result = await orderSyncEngine.syncOrders(shop.id);

    res.json({
      message: 'Sync completed',
      ...result
    });
  } catch (error) {
    console.error('Sync shop error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;