import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = parseInt(customerId as string);

    const applications = await prisma.qualificationApplication.findMany({
      where,
      include: {
        customer: true,
        product: true,
        handler: {
          select: { id: true, name: true }
        },
        processNodes: {
          orderBy: { createdAt: 'asc' }
        },
        todoItems: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const application = await prisma.qualificationApplication.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        product: {
          include: {
            personnelRequirements: true,
            performanceRequirements: true,
            materialTemplates: true
          }
        },
        processNodes: {
          include: {
            operator: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        certificates: true,
        qualificationCert: true,
        todoItems: true
      }
    });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get application' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customerId, productId, remark } = req.body;

    const product = await prisma.qualificationProduct.findUnique({
      where: { id: productId }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const applicationNo = `QUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const planStartDate = new Date();
    const planEndDate = new Date();
    planEndDate.setDate(planEndDate.getDate() + product.estimatedCycle);

    const application = await prisma.qualificationApplication.create({
      data: {
        customerId,
        productId,
        applicationNo,
        status: 'DRAFT',
        planStartDate,
        planEndDate,
        handleBy: req.user?.id,
        remark,
        processNodes: {
          create: [
            { nodeType: 'INITIAL_REVIEW', nodeName: '材料初审', status: 'PENDING' },
            { nodeType: 'SUBMIT', nodeName: '正式提交', status: 'PENDING' },
            { nodeType: 'ACCEPT', nodeName: '受理审核', status: 'PENDING' },
            { nodeType: 'PUBLICITY', nodeName: '结果公示', status: 'PENDING' },
            { nodeType: 'ISSUE', nodeName: '证书颁发', status: 'PENDING' }
          ]
        }
      },
      include: {
        customer: true,
        product: true,
        processNodes: true
      }
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, remark } = req.body;

    const application = await prisma.qualificationApplication.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        remark
      },
      include: {
        processNodes: true
      }
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.post('/:id/nodes/:nodeId/process', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, remark, rejectReason } = req.body;
    const applicationId = parseInt(req.params.id);
    const nodeId = parseInt(req.params.nodeId);

    const node = await prisma.processNode.update({
      where: { id: nodeId },
      data: {
        status,
        operatorId: req.user?.id,
        handleDate: new Date(),
        remark,
        rejectReason
      }
    });

    if (rejectReason && status === 'REJECTED') {
      await prisma.todoItem.create({
        data: {
          title: '申请被退回，需要补充材料',
          description: rejectReason,
          type: 'SUPPLEMENT',
          status: 'PENDING',
          priority: 'HIGH',
          applicationId,
          assigneeId: req.user?.id,
          creatorId: req.user?.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    }

    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process node' });
  }
});

export default router;
