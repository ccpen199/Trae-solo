import { Router, type Request, type Response } from 'express';
import {
  getWorkOrders,
  getWorkOrderById,
  insertWorkOrder,
  rateWorkOrder,
} from '../db.js';
import type { ApiResponse, WorkOrder } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, page, pageSize } = req.query;
    const result = getWorkOrders({
      status: status as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    const response: ApiResponse<{ list: WorkOrder[]; total: number }> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch work orders',
    };
    res.status(500).json(response);
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { title, category, description, responsibleDept, deadline } = req.body;
    if (!title || !category || !description) {
      const response: ApiResponse = {
        success: false,
        error: 'Title, category and description are required',
      };
      res.status(400).json(response);
      return;
    }
    const order = insertWorkOrder({
      title,
      category,
      description,
      status: 'pending',
      responsibleDept: responsibleDept || '',
      submitTime: new Date().toISOString(),
      deadline: deadline || '',
    });
    const response: ApiResponse<WorkOrder> = {
      success: true,
      data: order,
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create work order',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const order = getWorkOrderById(id);
    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Work order not found',
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<WorkOrder> = {
      success: true,
      data: order,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch work order',
    };
    res.status(500).json(response);
  }
});

router.post('/:id/rate', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const order = getWorkOrderById(id);
    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Work order not found',
      };
      res.status(404).json(response);
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      const response: ApiResponse = {
        success: false,
        error: 'Rating must be between 1 and 5',
      };
      res.status(400).json(response);
      return;
    }
    rateWorkOrder(id, rating);
    const updatedOrder = getWorkOrderById(id);
    const response: ApiResponse<WorkOrder> = {
      success: true,
      data: updatedOrder || undefined,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rate work order',
    };
    res.status(500).json(response);
  }
});

export default router;
