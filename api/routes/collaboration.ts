import { Router } from 'express'
import { getSpaces, createSpace, getSpaceById, addMember, removeMember, sendMessage } from '../controllers/collaborationController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/spaces', auth, getSpaces)
router.post('/spaces', auth, createSpace)
router.get('/spaces/:id', auth, getSpaceById)
router.post('/spaces/:id/members', auth, addMember)
router.delete('/spaces/:id/members/:userId', auth, removeMember)
router.post('/spaces/:id/messages', auth, sendMessage)

export default router
