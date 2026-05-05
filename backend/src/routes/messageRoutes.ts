import { Router } from 'express';
import { 
  getChatHistory, 
  sendMessage, 
  getUnreadMessages, 
  getUnreadCount,
  markAsRead 
} from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/unread', authMiddleware, getUnreadMessages);
router.get('/unread/count', authMiddleware, getUnreadCount);
router.get('/:friendId', authMiddleware, getChatHistory);
router.post('/send', authMiddleware, sendMessage);
router.post('/read/:fromUserId', authMiddleware, markAsRead);

export default router;
