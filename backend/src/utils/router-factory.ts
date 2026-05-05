import { Router } from 'express'
import { BaseController } from '../controllers/base.controller'
import { authMiddleware } from '../middleware/auth'

export function createCrudRouter(controller: BaseController): Router {
  const router = Router()

  router.get('/', authMiddleware, controller.list.bind(controller))
  router.get('/all', authMiddleware, controller.all.bind(controller))
  router.get('/:id', authMiddleware, controller.getById.bind(controller))
  router.post('/', authMiddleware, controller.create.bind(controller))
  router.put('/:id', authMiddleware, controller.update.bind(controller))
  router.delete('/:id', authMiddleware, controller.delete.bind(controller))
  router.post('/batch-delete', authMiddleware, controller.batchDelete.bind(controller))
  router.put('/:id/status', authMiddleware, controller.toggleStatus.bind(controller))

  return router
}
