import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface SMSRequest {
  packageId: string;
  receiverPhone: string;
  receiverName: string;
  pickupCode: string;
  pickupAddress: string;
  type: 'pickup' | 'delivery' | 'exception';
}

export interface NotificationRecord {
  id: string;
  packageId: string;
  receiverPhone: string;
  type: 'sms' | 'wechat';
  content: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  createdAt: Date;
}

export class SMSEngine {
  static generatePickupMessage(receiverName: string, pickupCode: string, pickupAddress: string): string {
    return `【XX驿站】尊敬的${receiverName}，您的包裹已到${pickupAddress}，取件码：${pickupCode}。请凭取件码取件，如有疑问请联系站点。`;
  }

  static generateDeliveryMessage(receiverName: string, courierName: string, courierPhone: string): string {
    return `【XX快递】尊敬的${receiverName}，快递员${courierName}（${courierPhone}）正在为您派送，请保持电话畅通，准备签收。`;
  }

  static generateExceptionMessage(receiverName: string, reason: string): string {
    return `【XX快递】尊敬的${receiverName}，您的包裹出现异常：${reason}。客服将尽快联系您处理，请留意来电。`;
  }

  static async sendSMS(request: SMSRequest): Promise<{ success: boolean; message: string }> {
    let content: string;
    
    switch (request.type) {
      case 'pickup':
        content = this.generatePickupMessage(
          request.receiverName,
          request.pickupCode,
          request.pickupAddress
        );
        break;
      case 'delivery':
        content = this.generateDeliveryMessage(request.receiverName, '快递员', '站点电话');
        break;
      case 'exception':
        content = this.generateExceptionMessage(request.receiverName, request.pickupCode);
        break;
      default:
        content = this.generatePickupMessage(
          request.receiverName,
          request.pickupCode,
          request.pickupAddress
        );
    }

    const notificationId = uuidv4();
    const now = new Date().toISOString();

    try {
      const insertStmt = db.prepare(`
        INSERT INTO notifications (id, package_id, receiver_phone, type, content, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        notificationId,
        request.packageId,
        request.receiverPhone,
        'sms',
        content,
        'sent',
        now
      );

      const updateStmt = db.prepare(`
        UPDATE notifications SET sent_at = ?, status = ? WHERE id = ?
      `);
      updateStmt.run(now, 'sent', notificationId);

      console.log(`[SMS模拟发送] 发送至 ${request.receiverPhone}: ${content.substring(0, 50)}...`);

      return {
        success: true,
        message: '短信发送成功（模拟）'
      };
    } catch (error) {
      console.error('短信发送失败:', error);
      
      const updateStmt = db.prepare(`
        UPDATE notifications SET status = ? WHERE id = ?
      `);
      updateStmt.run('failed', notificationId);

      return {
        success: false,
        message: '短信发送失败'
      };
    }
  }

  static async sendWechatNotification(request: SMSRequest): Promise<{ success: boolean; message: string }> {
    let content: string;
    
    switch (request.type) {
      case 'pickup':
        content = `您的包裹已送达驿站，取件码：${request.pickupCode}，地址：${request.pickupAddress}`;
        break;
      case 'delivery':
        content = '快递员正在为您派送，请保持电话畅通';
        break;
      case 'exception':
        content = `您的包裹出现异常：${request.pickupCode}，客服将尽快联系您`;
        break;
      default:
        content = `您的包裹已送达驿站，取件码：${request.pickupCode}`;
    }

    const notificationId = uuidv4();
    const now = new Date().toISOString();

    try {
      const insertStmt = db.prepare(`
        INSERT INTO notifications (id, package_id, receiver_phone, type, content, status, sent_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        notificationId,
        request.packageId,
        request.receiverPhone,
        'wechat',
        content,
        'sent',
        now,
        now
      );

      console.log(`[微信模拟通知] 发送至 ${request.receiverPhone}: ${content}`);

      return {
        success: true,
        message: '微信通知发送成功（模拟）'
      };
    } catch (error) {
      console.error('微信通知发送失败:', error);
      return {
        success: false,
        message: '微信通知发送失败'
      };
    }
  }

  static getNotificationHistory(packageId: string): NotificationRecord[] {
    const stmt = db.prepare(`
      SELECT id, package_id as packageId, receiver_phone as receiverPhone,
             type, content, status, sent_at as sentAt, created_at as createdAt
      FROM notifications
      WHERE package_id = ?
      ORDER BY created_at DESC
    `);

    const results = stmt.all(packageId) as any[];
    
    return results.map(r => ({
      ...r,
      sentAt: r.sentAt ? new Date(r.sentAt) : undefined,
      createdAt: new Date(r.createdAt)
    }));
  }
}

export default SMSEngine;
