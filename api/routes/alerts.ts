import { Router, type Request, type Response } from 'express';
import {
  getEmergencyAlerts,
  getEmergencyAlertById,
} from '../db.js';
import type { ApiResponse, EmergencyAlert } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const alerts = getEmergencyAlerts(false);
    const response: ApiResponse<EmergencyAlert[]> = {
      success: true,
      data: alerts,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch emergency alerts',
    };
    res.status(500).json(response);
  }
});

router.get('/active', (req: Request, res: Response): void => {
  try {
    const alerts = getEmergencyAlerts(true);
    const response: ApiResponse<EmergencyAlert[]> = {
      success: true,
      data: alerts,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active emergency alerts',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const alert = getEmergencyAlertById(id);
    if (!alert) {
      const response: ApiResponse = {
        success: false,
        error: 'Emergency alert not found',
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<EmergencyAlert> = {
      success: true,
      data: alert,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch emergency alert',
    };
    res.status(500).json(response);
  }
});

export default router;
