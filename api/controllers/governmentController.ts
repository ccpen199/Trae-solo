import { Request, Response } from 'express';
import { governmentService, orchestrationService } from '../services/governmentService';
import type { ApiResponse } from '../../shared/types';

export const getPolicies = async (req: Request, res: Response) => {
  try {
    const { category, keyword, page, pageSize } = req.query;
    const result = await governmentService.getPolicies(
      category as string | undefined,
      keyword as string | undefined,
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 10
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

export const getPolicyDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await governmentService.getPolicyDetail(id);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '政策不存在',
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

export const getPolicyInterpretation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await governmentService.getPolicyInterpretation(id);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '政策不存在',
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

export const getRelatedPolicies = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await governmentService.getRelatedPolicies(id);
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

export const getPolicyPushRecords = async (_req: Request, res: Response) => {
  try {
    const result = await governmentService.getPolicyPushRecords();
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

export const markPolicyAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await governmentService.markPolicyAsRead(id);
    res.json({
      code: 200,
      message: result.success ? '标记成功' : '标记失败',
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

export const getGovernmentServices = async (_req: Request, res: Response) => {
  try {
    const result = await governmentService.getGovernmentServices();
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

export const submitApplication = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const userId = (req as any).user?.id || 'user-001';
    const result = await governmentService.submitApplication(serviceId, userId, req.body);
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

export const getAtomicServices = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const result = await orchestrationService.getAtomicServices(
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

export const getAtomicServiceDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await orchestrationService.getServiceDetail(id);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '服务不存在',
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

export const createFlow = async (req: Request, res: Response) => {
  try {
    const { name, description, flowDefinition, triggerServiceId } = req.body;
    if (!name || !flowDefinition) {
      return res.status(400).json({
        code: 400,
        message: '名称和流程定义不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await orchestrationService.createFlow(
      name,
      description,
      flowDefinition,
      triggerServiceId
    );
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

export const getFlows = async (_req: Request, res: Response) => {
  try {
    const result = await orchestrationService.getFlows();
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

export const executeFlow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await orchestrationService.executeFlow(id, req.body || {});
    res.json({
      code: 200,
      message: result.success ? '执行成功' : '执行失败',
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

export const getFlowReleaseRecords = async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    const result = await orchestrationService.getFlowReleaseRecords(flowId);
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

export const rollbackFlow = async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    const { version } = req.body;
    const result = await orchestrationService.rollbackFlow(flowId, version);
    res.json({
      code: 200,
      message: result.message,
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

export const compareFlowVersions = async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    const { version1, version2 } = req.query;
    const result = await orchestrationService.compareFlowVersions(
      flowId,
      version1 as string,
      version2 as string
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

export const getServiceStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await orchestrationService.getServiceStats(id);
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

export const getServiceCallRecords = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await orchestrationService.getServiceCallRecords(id);
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

export const getServiceDependencies = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await orchestrationService.getServiceDependencies(id);
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

export const getNodeProperties = async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { serviceId } = req.query;
    const result = await orchestrationService.getNodeProperties(nodeId, serviceId as string | undefined);
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

export const publishFlow = async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params;
    const { changeLog } = req.body;
    await new Promise(resolve => setTimeout(resolve, 1500));
    res.json({
      code: 200,
      message: '发布成功',
      data: { success: true, version: 'v' + (Math.floor(Math.random() * 3) + 1) + '.' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 10) },
      timestamp: Date.now(),
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null,
      timestamp: Date.now(),
    } as ApiResponse<null>);
  }
};
