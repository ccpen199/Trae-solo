import express from 'express';
import { body, validationResult } from 'express-validator';
import SKU from '../models/SKU.js';
import Product from '../models/Product.js';
import Log from '../models/Log.js';
import { SKUEngine } from '../engines/SKUEngine.js';

const router = express.Router();
const skuEngine = new SKUEngine();

router.get('/', async (req, res) => {
  try {
    const { product_id, low_stock } = req.query;
    const where = {};

    if (product_id) where.product_id = product_id;

    const skus = await SKU.findAll({
      where,
      include: [{
        model: Product,
        as: 'product'
      }],
      order: [['created_at', 'DESC']]
    });

    let result = skus;

    if (low_stock === 'true') {
      result = skus.filter(sku => sku.stock < sku.min_stock);
    }

    res.json({ skus: result });
  } catch (error) {
    console.error('Get SKUs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sku = await SKU.findByPk(req.params.id, {
      include: [{
        model: Product,
        as: 'product'
      }]
    });

    if (!sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    res.json({ sku });
  } catch (error) {
    console.error('Get SKU error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', [
  body('product_id').isInt(),
  body('attributes').optional().isObject(),
  body('price').optional().isNumeric(),
  body('cost').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, attributes, price, cost, min_stock } = req.body;

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const sku = await skuEngine.createSKU(
      product_id,
      attributes || {},
      price || 0,
      cost || 0
    );

    if (min_stock !== undefined) {
      sku.min_stock = min_stock;
      await sku.save();
    }

    const skuWithProduct = await SKU.findByPk(sku.id, {
      include: [{ model: Product, as: 'product' }]
    });

    res.status(201).json({ sku: skuWithProduct });
  } catch (error) {
    console.error('Create SKU error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const sku = await SKU.findByPk(req.params.id);

    if (!sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    const { attributes, price, cost, min_stock, platform_skus } = req.body;

    if (attributes) sku.attributes = attributes;
    if (price !== undefined) sku.price = price;
    if (cost !== undefined) sku.cost = cost;
    if (min_stock !== undefined) sku.min_stock = min_stock;
    if (platform_skus) sku.platform_skus = platform_skus;

    await sku.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'update_sku',
      target: 'sku',
      target_id: sku.id,
      message: `Updated SKU: ${sku.sku_code}`,
      details: req.body
    });

    res.json({ sku });
  } catch (error) {
    console.error('Update SKU error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const sku = await SKU.findByPk(req.params.id);

    if (!sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    await sku.destroy();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'delete_sku',
      target: 'sku',
      target_id: req.params.id,
      message: `Deleted SKU: ${sku.sku_code}`
    });

    res.json({ message: 'SKU deleted successfully' });
  } catch (error) {
    console.error('Delete SKU error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/stock', [
  body('delta').isInt(),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { delta, reason } = req.body;

    const sku = await skuEngine.updateStock(
      req.params.id,
      delta,
      reason || 'Manual adjustment',
      req.user.id
    );

    res.json({
      message: 'Stock updated successfully',
      sku
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/batch-update-stock', [
  body('updates').isArray({ min: 1 }),
  body('updates.*.sku_id').isInt(),
  body('updates.*.delta').isInt(),
  body('updates.*.reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;

    const results = await skuEngine.batchUpdateStock(updates, req.user.id);

    res.json({
      message: 'Batch stock update completed',
      results
    });
  } catch (error) {
    console.error('Batch update stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;