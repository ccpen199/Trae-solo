import express, { type Request, type Response } from 'express';
import * as settlementRepository from '../db/repositories/settlementRepository.js';
import * as settlementService from '../services/settlementService.js';
import type { CalculateSettlementDto } from '../types/index.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { period, doctorId, institutionId } = req.query;

    let settlements;

    if (doctorId && period) {
      settlements = settlementRepository.findByDoctorId(
        parseInt(doctorId as string, 10),
        period as string
      );
    } else if (doctorId) {
      settlements = settlementRepository.findByDoctorId(parseInt(doctorId as string, 10));
    } else if (institutionId && period) {
      settlements = settlementRepository.findByInstitutionId(
        parseInt(institutionId as string, 10),
        period as string
      );
    } else if (institutionId) {
      settlements = settlementRepository.findByInstitutionId(parseInt(institutionId as string, 10));
    } else if (period) {
      settlements = settlementRepository.findByPeriod(period as string);
    } else {
      settlements = settlementRepository.findAll();
    }

    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/export', (req: Request, res: Response): void => {
  try {
    const { period } = req.query;
    const csvContent = settlementService.exportSettlements(period as string | undefined);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="settlements_${period || 'all'}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/calculate', (req: Request, res: Response): void => {
  try {
    const dto: CalculateSettlementDto = req.body;

    if (!dto.period) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: period (format: YYYY-MM)'
      });
      return;
    }

    const settlements = settlementService.createOrUpdateSettlements(dto);

    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const settlement = settlementRepository.findById(id);

    if (!settlement) {
      res.status(404).json({
        success: false,
        error: 'Settlement not found'
      });
      return;
    }

    res.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/:id/status', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body as { status: 'pending' | 'settled' };

    if (!status || !['pending', 'settled'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "pending" or "settled"'
      });
      return;
    }

    const existing = settlementRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Settlement not found'
      });
      return;
    }

    const settlement = settlementRepository.updateStatus(id, status);
    res.json({
      success: true,
      data: settlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
