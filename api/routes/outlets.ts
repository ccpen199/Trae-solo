import { Router, type Request, type Response } from 'express';
import {
  getServiceOutlets,
  getServiceOutletById,
} from '../db.js';
import type { ApiResponse, ServiceOutlet } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { type } = req.query;
    const outlets = getServiceOutlets(type as string | undefined);
    const response: ApiResponse<ServiceOutlet[]> = {
      success: true,
      data: outlets,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch service outlets',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const outlet = getServiceOutletById(id);
    if (!outlet) {
      const response: ApiResponse = {
        success: false,
        error: 'Service outlet not found',
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<ServiceOutlet> = {
      success: true,
      data: outlet,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch service outlet',
    };
    res.status(500).json(response);
  }
});

router.get('/:id/queue', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const outlet = getServiceOutletById(id);
    if (!outlet) {
      const response: ApiResponse = {
        success: false,
        error: 'Service outlet not found',
      };
      res.status(404).json(response);
      return;
    }
    const queueData = {
      queueCount: outlet.queueCount,
      queueWaitTime: outlet.queueWaitTime,
      updatedAt: new Date().toISOString(),
    };
    const response: ApiResponse<typeof queueData> = {
      success: true,
      data: queueData,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch queue data',
    };
    res.status(500).json(response);
  }
});

export default router;
