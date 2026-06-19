import { Router } from 'express';
import {
  createComplaint,
  getComplaintList,
  getComplaintById,
  handleComplaint,
  getComplaintStats,
} from '../services/complaintService';

const router = Router();

router.get('/', (req, res) => {
  const { status, type, rider_id, page, pageSize } = req.query;
  const result = getComplaintList({
    status: status as any,
    type: type as any,
    rider_id: rider_id ? parseInt(rider_id as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.json({ code: 0, data: result });
});

router.get('/stats', (req, res) => {
  const stats = getComplaintStats();
  res.json({ code: 0, data: stats });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const complaint = getComplaintById(id);
  if (!complaint) {
    res.status(404).json({ code: 1, message: '申诉不存在' });
    return;
  }
  res.json({ code: 0, data: complaint });
});

router.post('/', (req, res) => {
  const complaint = createComplaint(req.body);
  res.json({ code: 0, data: complaint });
});

router.post('/:id/handle', (req, res) => {
  const id = parseInt(req.params.id);
  const { handler_id, result, penalty_amount, handler_note } = req.body;
  const success = handleComplaint(id, handler_id, result, penalty_amount, handler_note);
  res.json({ code: success ? 0 : 1, data: { success } });
});

export default router;
