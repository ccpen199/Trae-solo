import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            applications: true,
            materials: true,
            certificates: true,
            qualificationCerts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        applications: {
          include: {
            product: true,
            processNodes: true
          }
        },
        materials: true,
        certificates: true,
        qualificationCerts: true
      }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, unifiedSocialCode, legalRepresentative, contactPerson, contactPhone, address, industry, registeredCapital, establishedDate } = req.body;

    const existing = await prisma.customer.findUnique({
      where: { unifiedSocialCode }
    });
    if (existing) {
      return res.status(400).json({ error: 'Customer with this unified social code already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        unifiedSocialCode,
        legalRepresentative,
        contactPerson,
        contactPhone,
        address,
        industry,
        registeredCapital,
        establishedDate: establishedDate ? new Date(establishedDate) : null
      }
    });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

export default router;
