import { Request, Response } from 'express';
import { urbanService, type ComplaintRequest } from '../services/urbanService';
import type { ApiResponse } from '../../shared/types';

export const classifyTicket = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        code: 400,
        message: '内容不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await urbanService.classifyTicket(content);
    res.json({
      code: 200,
      message: '分类成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const submitComplaint = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const request: ComplaintRequest = {
      ...req.body,
      userId,
    };
    if (!request.title || !request.content || !request.category) {
      return res.status(400).json({
        code: 400,
        message: '必填项不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await urbanService.submitComplaint(request);
    res.json({
      code: 200,
      message: '提交成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const { status, category } = req.query;
    const result = await urbanService.getTickets(
      userId,
      status as string | undefined,
      category as string | undefined
    );
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getTicketDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await urbanService.getTicketDetail(id);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '工单不存在',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const rateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        code: 400,
        message: '评分必须在1-5之间',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await urbanService.rateTicket(id, score, comment);
    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: '评价失败',
        data: result,
        timestamp: Date.now(),
      } as ApiResponse<typeof result>);
    }
    res.json({
      code: 200,
      message: '评价成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getVitalSigns = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getVitalSigns();
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getVitalSignsHistory = async (req: Request, res: Response) => {
  try {
    const { hours } = req.query;
    const result = await urbanService.getVitalSignsHistory(
      hours ? parseInt(hours as string) : 24
    );
    res.json({
      code: 200,
      message: '获取成功',
      data: result,
      timestamp: Date.now(),
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};
