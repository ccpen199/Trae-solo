import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import SKU from '../models/SKU.js';
import Log from '../models/Log.js';
import { SKUEngine } from '../engines/SKUEngine.js';

const router = express.Router();
const skuEngine = new SKUEngine();

router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const where = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const products = await Product.findAll({
      where,
      include: [{
        model: SKU,
        as: 'skus'
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: SKU,
        as: 'skus'
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', [
  body('name').notEmpty().trim(),
  body('price').optional().isNumeric(),
  body('cost').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, brand, images, attributes, status, skus } = req.body;

    const product = await Product.create({
      name,
      description,
      category,
      brand,
      images: images || [],
      attributes: attributes || {},
      status: status || 'draft'
    });

    if (skus && Array.isArray(skus)) {
      for (const skuData of skus) {
        await skuEngine.createSKU(
          product.id,
          skuData.attributes || {},
          skuData.price || 0,
          skuData.cost || 0
        );
      }
    }

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'create_product',
      target: 'product',
      target_id: product.id,
      message: `Created new product: ${name}`,
      details: { name, category }
    });

    const productWithSKUs = await Product.findByPk(product.id, {
      include: [{ model: SKU, as: 'skus' }]
    });

    res.status(201).json({ product: productWithSKUs });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, category, brand, images, attributes, status } = req.body;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (images) product.images = images;
    if (attributes) product.attributes = attributes;
    if (status) product.status = status;

    await product.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'update_product',
      target: 'product',
      target_id: product.id,
      message: `Updated product: ${product.name}`,
      details: req.body
    });

    res.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'delete_product',
      target: 'product',
      target_id: req.params.id,
      message: `Deleted product: ${product.name}`
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/publish', [
  body('platforms').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platforms } = req.body;

    const product = await Product.findByPk(req.params.id, {
      include: [{ model: SKU, as: 'skus' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const results = [];

    for (const sku of product.skus) {
      const skuResults = await skuEngine.publishToPlatforms(sku.id, platforms, req.user.id);
      results.push({
        skuId: sku.id,
        skuCode: sku.sku_code,
        results: skuResults
      });
    }

    if (product.status === 'draft') {
      product.status = 'active';
      await product.save();
    }

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'publish_product',
      target: 'product',
      target_id: product.id,
      message: `Published product ${product.name} to platforms: ${platforms.join(', ')}`,
      details: { platforms }
    });

    res.json({
      message: 'Product published successfully',
      results
    });
  } catch (error) {
    console.error('Publish product error:', error);
    res.status(500).json({ error: 'Publish failed' });
  }
});

export default router;