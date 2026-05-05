import { Router } from 'express';
import { 
  getFriends, 
  addFriend, 
  deleteFriend, 
  getPendingRequests, 
  getSentRequests,
  respondFriendRequest 
} from '../controllers/friendController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getFriends);
router.post('/add', authMiddleware, addFriend);
router.delete('/:friendId', authMiddleware, deleteFriend);
router.get('/requests/pending', authMiddleware, getPendingRequests);
router.get('/requests/sent', authMiddleware, getSentRequests);
router.post('/requests/respond', authMiddleware, respondFriendRequest);

export default router;
