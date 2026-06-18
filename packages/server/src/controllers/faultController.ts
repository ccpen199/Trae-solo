import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { faultService } from '../services';

export const reportFault = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const fault = await faultService.reportFault({
      ...req.body,
      userId,
    });
    success(res, fault, '故障上报成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getFaultList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, status, pileId } = req.query;
    const userId = req.user?.userId;

    const result = await faultService.getFaultList({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string,
      pileId: pileId as string,
      userId,
    });
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getFaultDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faultId } = req.params;
    const fault = await faultService.getFaultById(faultId);
    success(res, fault);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const handleFault = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faultId } = req.params;
    const { handler, remark } = req.body;
    const fault = await faultService.handleFault(faultId, handler, remark);
    success(res, fault, '处理成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  reportFault,
  getFaultList,
  getFaultDetail,
  handleFault,
};
