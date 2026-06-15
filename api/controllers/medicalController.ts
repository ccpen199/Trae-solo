import { Request, Response } from 'express';
import { medicalService, type AppointmentRequest } from '../services/medicalService';
import type { ApiResponse } from '../../shared/types';

export const getHospitals = async (req: Request, res: Response) => {
  try {
    const result = await medicalService.getHospitals();
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

export const getHospitalDepartments = async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const result = await medicalService.getHospitalDepartments(hospitalId);
    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '医院不存在',
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

export const getWaitTimes = async (req: Request, res: Response) => {
  try {
    const result = await medicalService.getWaitTimes();
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

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const request: AppointmentRequest = {
      ...req.body,
      userId,
    };
    if (!request.hospitalId || !request.departmentId || !request.date || !request.timeSlot) {
      return res.status(400).json({
        code: 400,
        message: '必填项不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await medicalService.createAppointment(request);
    res.json({
      code: 200,
      message: '预约成功',
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

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-001';
    const result = await medicalService.getAppointments(userId);
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

export const payMedicalBill = async (req: Request, res: Response) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({
        code: 400,
        message: '订单号和金额不能为空',
        data: null,
        timestamp: Date.now(),
      } as ApiResponse<null>);
    }
    const result = await medicalService.payMedicalBill(orderId, amount);
    res.json({
      code: 200,
      message: '支付成功',
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
