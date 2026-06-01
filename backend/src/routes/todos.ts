import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, assigneeId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = parseInt(assigneeId as string);
    else if (req.user) where.assigneeId = req.user.id;

    const todos = await prisma.todoItem.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        application: {
          include: {
            customer: true,
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get todos' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, priority, applicationId, assigneeId, dueDate } = req.body;

    const todo = await prisma.todoItem.create({
      data: {
        title,
        description,
        type,
        status: 'PENDING',
        priority,
        applicationId: applicationId ? parseInt(applicationId) : null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        creatorId: req.user?.id,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, completedDate } = req.body;

    const todo = await prisma.todoItem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        completedDate: completedDate ? new Date(completedDate) : status === 'COMPLETED' ? new Date() : null
      }
    });

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.todoItem.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
