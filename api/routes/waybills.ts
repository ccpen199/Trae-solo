import { Router, type Request, type Response } from 'express'
import type { ApiResponse } from '../../shared/types/index.js'
import {
  getAllWaybills,
  getPendingExportWaybills,
  generateCSVExport,
  batchMarkExported,
} from '../services/waybillService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingOnly = req.query.pending === 'true'

    const waybills = pendingOnly ? getPendingExportWaybills() : getAllWaybills()

    const response: ApiResponse = {
      success: true,
      data: waybills,
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch waybills',
    })
  }
})

router.post('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, format } = req.body as { ids?: string[]; format?: 'csv' | 'json' }

    let waybills = getAllWaybills()

    if (ids && ids.length > 0) {
      waybills = waybills.filter((w) => ids.includes(w.id))
    }

    const exportFormat = format ?? 'csv'

    if (exportFormat === 'csv') {
      const csvContent = generateCSVExport(waybills)
      const exportedIds = waybills.map((w) => w.id)
      batchMarkExported(exportedIds)

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=waybills.csv')
      res.status(200).send('\uFEFF' + csvContent)
    } else {
      const exportedIds = waybills.map((w) => w.id)
      batchMarkExported(exportedIds)

      const response: ApiResponse = {
        success: true,
        data: waybills,
        message: `${waybills.length} waybills exported successfully`,
      }
      res.status(200).json(response)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export waybills',
    })
  }
})

export default router
