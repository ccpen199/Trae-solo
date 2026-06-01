import { Request, Response } from 'express';
import * as ticketService from '../services/ticketService.js';
import type { ApiResponse } from '../types/index.js';

export const generateQRCode = (req: Request, res: Response): void => {
  try {
    const { contractId } = req.params;
    
    const contract = ticketService.getTicketContract(contractId);
    
    if (!contract) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '票务合约不存在'
      });
      return;
    }
    
    const qrData = ticketService.generateQRCodeData(contract);
    const watermark = ticketService.generateWatermark(
      contract.watermark_seed,
      contract.user_id,
      contract.order_id
    );
    
    const response: ApiResponse = {
      code: 0,
      data: {
        qr_data: qrData,
        watermark,
        contract
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '生成二维码失败'
    });
  }
};

export const verifyTicket = (req: Request, res: Response): void => {
  try {
    const { qr_data } = req.body;
    
    if (!qr_data) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '缺少二维码数据'
      });
      return;
    }
    
    const result = ticketService.verifyTicket(qr_data);
    
    const response: ApiResponse = {
      code: 0,
      data: result,
      message: result.valid ? '验票成功' : '验票失败'
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '验票失败'
    });
  }
};

export const getUserTickets = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    
    const tickets = ticketService.getUserTickets(userId);
    
    const response: ApiResponse = {
      code: 0,
      data: tickets
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取用户票夹失败'
    });
  }
};

export const getTicketDetail = (req: Request, res: Response): void => {
  try {
    const { contractId } = req.params;
    
    const contract = ticketService.getTicketContract(contractId);
    
    if (!contract) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '票据不存在'
      });
      return;
    }
    
    const watermark = ticketService.generateWatermark(
      contract.watermark_seed,
      contract.user_id,
      contract.order_id
    );
    
    const response: ApiResponse = {
      code: 0,
      data: {
        ...contract,
        watermark
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取票据详情失败'
    });
  }
};

export const generateWatermark = (req: Request, res: Response): void => {
  try {
    const { seed, userId, orderId } = req.body;
    
    if (!seed || !userId || !orderId) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '参数不完整'
      });
      return;
    }
    
    const watermark = ticketService.generateWatermark(seed, userId, orderId);
    const invisibleWatermark = ticketService.generateInvisibleWatermark(orderId, seed);
    
    const response: ApiResponse = {
      code: 0,
      data: {
        visible: watermark,
        invisible: invisibleWatermark
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '生成水印失败'
    });
  }
};
