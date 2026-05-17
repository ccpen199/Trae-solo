import express from 'express';
import { getProfile, updateProfile, getFamilyMembers, addFamilyMember } from '../controllers/user.controller';
import auth from '../middleware/auth';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/family', auth, getFamilyMembers);
router.post('/family', auth, addFamilyMember);

export default router;
