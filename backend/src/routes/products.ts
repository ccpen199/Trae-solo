import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const where: any = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const products = await prisma.qualificationProduct.findMany({
      where,
      include: {
        personnelRequirements: true,
        performanceRequirements: true,
        materialTemplates: true,
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.qualificationProduct.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        personnelRequirements: true,
        performanceRequirements: true,
        materialTemplates: true
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, qualificationType, region, estimatedCycle, description, price, personnelRequirements, performanceRequirements, materialTemplates } = req.body;

    const product = await prisma.qualificationProduct.create({
      data: {
        name,
        qualificationType,
        region,
        estimatedCycle,
        description,
        price,
        personnelRequirements: {
          create: personnelRequirements || []
        },
        performanceRequirements: {
          create: performanceRequirements || []
        },
        materialTemplates: {
          create: materialTemplates || []
        }
      },
      include: {
        personnelRequirements: true,
        performanceRequirements: true,
        materialTemplates: true
      }
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, qualificationType, region, estimatedCycle, description, price, isActive } = req.body;

    const product = await prisma.qualificationProduct.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        qualificationType,
        region,
        estimatedCycle,
        description,
        price,
        isActive
      }
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
