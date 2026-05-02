import { Router } from 'express'
import declarationService from '../services/declarationService.js'
import { stateMachine } from '../engine/stateMachine.js'
import { StatusDisplayNames, ActionDisplayNames } from '../config/constants.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const params = {
      status: req.query.status,
      creatorId: req.query.creatorId,
      assigneeId: req.query.assigneeId,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    }

    const result = await declarationService.getDeclarations(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error getting declarations:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const declaration = await declarationService.getDeclarationById(req.params.id)
    if (!declaration) {
      return res.status(404).json({ success: false, errors: ['报关单不存在'] })
    }
    res.json({ success: true, data: declaration })
  } catch (error) {
    console.error('Error getting declaration:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/', async (req, res) => {
  try {
    const creatorId = req.headers['x-user-id'] || 'system'
    const result = await declarationService.createDeclaration(req.body, creatorId)
    if (result.success) {
      res.status(201).json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error creating declaration:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const operatorId = req.headers['x-user-id'] || 'system'
    const result = await declarationService.updateDeclaration(
      req.params.id,
      req.body,
      operatorId
    )
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error updating declaration:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/:id/action', async (req, res) => {
  try {
    const { action, comment } = req.body
    const operatorId = req.headers['x-user-id'] || 'system'

    const result = await declarationService.performAction(
      req.params.id,
      action,
      operatorId,
      comment
    )

    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error performing action:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/:id/available-actions', async (req, res) => {
  try {
    const declaration = await declarationService.getDeclarationById(req.params.id)
    if (!declaration) {
      return res.status(404).json({ success: false, errors: ['报关单不存在'] })
    }

    const userRole = req.headers['x-user-role'] || 'ADMIN'
    const availableActions = stateMachine.getAvailableActions(declaration.status, userRole)

    const actionsWithNames = availableActions.map(action => ({
      code: action,
      name: ActionDisplayNames[action] || action,
    }))

    res.json({
      success: true,
      data: {
        currentStatus: declaration.status,
        currentStatusName: StatusDisplayNames[declaration.status],
        availableActions: actionsWithNames,
      },
    })
  } catch (error) {
    console.error('Error getting available actions:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/:id/calculate-tax', async (req, res) => {
  try {
    const operatorId = req.headers['x-user-id'] || 'system'
    const result = await declarationService.calculateAndSaveTaxes(
      req.params.id,
      operatorId
    )
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error calculating tax:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/:id/validate-documents', async (req, res) => {
  try {
    const result = await declarationService.validateDocuments(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error validating documents:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/:id/lock', async (req, res) => {
  try {
    const operatorId = req.headers['x-user-id'] || 'system'
    const result = await declarationService.lockDeclaration(req.params.id, operatorId)
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error locking declaration:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.post('/:id/unlock', async (req, res) => {
  try {
    const operatorId = req.headers['x-user-id'] || 'system'
    const result = await declarationService.unlockDeclaration(req.params.id, operatorId)
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error unlocking declaration:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

export default router
