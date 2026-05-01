import { Router } from 'express'
import userRoutes from './user.routes'
import pointsRoutes from './points.routes'
import exchangeRoutes from './exchange.routes'
import ruleRoutes from './rule.routes'
import reconciliationRoutes from './reconciliation.routes'

const router = Router()

router.use('/users', userRoutes)
router.use('/points', pointsRoutes)
router.use('/exchanges', exchangeRoutes)
router.use('/rules', ruleRoutes)
router.use('/reconciliations', reconciliationRoutes)

export default router
