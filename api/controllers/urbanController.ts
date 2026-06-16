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

export const getTransportationDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getTransportationDashboard();
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

export const getMedicalDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getMedicalDashboard();
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

export const getUtilitiesDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getUtilitiesDashboard();
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

export const getGovernmentDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getGovernmentDashboard();
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

export const getDispatchRules = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getDispatchRules();
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

export const createDispatchRule = async (req: Request, res: Response) => {
  try {
    const ruleData = req.body;
    if (!ruleData.name || !ruleData.type || !ruleData.condition || !ruleData.department || !ruleData.priority) {
      return res.status(400).json({
        code: 400,
        message: '必填项不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await urbanService.createDispatchRule(ruleData);
    res.json({
      code: 200,
      message: '创建成功',
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

export const updateDispatchRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await urbanService.updateDispatchRule(id, updates);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '规则不存在',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    res.json({
      code: 200,
      message: '更新成功',
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

export const toggleDispatchRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        code: 400,
        message: 'isEnabled 必须是布尔值',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await urbanService.toggleDispatchRule(id, isEnabled);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '规则不存在',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    res.json({
      code: 200,
      message: '更新成功',
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

export const deleteDispatchRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await urbanService.deleteDispatchRule(id);
    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '规则不存在',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    res.json({
      code: 200,
      message: '删除成功',
      data: { success: true },
      timestamp: Date.now(),
    } as ApiResponse<{ success: boolean }>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};

export const getDepartmentStats = async (_req: Request, res: Response) => {
  try {
    const result = await urbanService.getDepartmentStats();
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

export const getDepartmentReceipts = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const result = await urbanService.getDepartmentReceipts(department as string | undefined);
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
