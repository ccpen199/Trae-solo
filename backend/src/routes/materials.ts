import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, status } = req.query;
    const where: any = {};
    if (customerId) where.customerId = parseInt(customerId as string);
    if (status) where.status = status;

    const materials = await prisma.customerMaterial.findMany({
      where,
      include: {
        customer: true,
        template: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get materials' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customerId, templateId, name, type, fileUrl, fileSize, expiryDate, remark } = req.body;

    const material = await prisma.customerMaterial.create({
      data: {
        customerId: parseInt(customerId),
        templateId: templateId ? parseInt(templateId) : null,
        name,
        type,
        fileUrl,
        fileSize: parseFloat(fileSize) || 0,
        status: 'PENDING',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        uploaderId: req.user?.id,
        remark
      }
    });

    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create material' });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, remark } = req.body;

    const material = await prisma.customerMaterial.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        remark
      }
    });

    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material status' });
  }
});

router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const today = new Date();
    const expiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const materials = await prisma.customerMaterial.findMany({
      where: {
        expiryDate: {
          lte: expiryDate,
          not: null
        },
        status: {
          not: 'INVALID'
        }
      },
      include: { customer: true }
    });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expiring materials' });
  }
});

export default router;
