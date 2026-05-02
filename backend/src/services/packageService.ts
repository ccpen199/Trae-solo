import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ScanEngine } from '../engines/scanEngine';
import { SignCodeEngine } from '../engines/signCodeEngine';
import { SMSEngine } from '../engines/smsEngine';
import { PerformanceEngine } from '../engines/performanceEngine';
import { AuthUser } from '../middleware/auth';

export interface PackageInfo {
  id: string;
  trackingNumber: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight?: number;
  status: string;
  areaId?: string;
  areaName?: string;
  courierId?: string;
  courierName?: string;
  pickupCode?: string;
  signCode?: string;
  signType?: string;
  signTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrailInfo {
  id: string;
  packageId: string;
  action: string;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  details?: string;
  createdAt: string;
}

class PackageService {
  
  addTrail(
    packageId: string,
    action: string,
    operator?: AuthUser,
    details?: string
  ): void {
    const stmt = db.prepare(`
      INSERT INTO package_trails (id, package_id, action, operator_id, operator_name, operator_role, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      packageId,
      action,
      operator?.id,
      operator?.name,
      operator?.role,
      details,
      new Date().toISOString()
    );
  }

  scanInStation(
    trackingNumber: string,
    operator: AuthUser,
    packageDetails?: {
      senderName?: string;
      senderPhone?: string;
      senderAddress?: string;
      receiverName: string;
      receiverPhone: string;
      receiverAddress: string;
      weight?: number;
    }
  ): PackageInfo {
    const scanResult = ScanEngine.parseBarcode(trackingNumber);
    
    if (!scanResult.isValid) {
      throw new Error('运单号格式无效');
    }

    const existing = db.prepare(`
      SELECT id FROM packages WHERE tracking_number = ?
    `).get(scanResult.trackingNumber) as any;

    if (existing) {
      const existingPackage = this.getById(existing.id);
      if (existingPackage && existingPackage.status !== 'pending') {
        throw new Error('该包裹已入库');
      }
      
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE packages SET status = 'in_station', updated_at = ? WHERE id = ?
      `).run(now, existing.id);
      
      this.addTrail(existing.id, 'in_station', operator, '包裹入库扫描');
      
      return this.getById(existing.id)!;
    }

    if (!packageDetails) {
      throw new Error('新包裹需要提供收件人信息');
    }

    const packageId = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO packages (
        id, tracking_number, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address, weight, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_station', ?, ?)
    `);

    stmt.run(
      packageId,
      scanResult.trackingNumber,
      packageDetails.senderName,
      packageDetails.senderPhone,
      packageDetails.senderAddress,
      packageDetails.receiverName,
      packageDetails.receiverPhone,
      packageDetails.receiverAddress,
      packageDetails.weight,
      now,
      now
    );

    this.addTrail(packageId, 'in_station', operator, `快递品牌: ${scanResult.carrier}`);

    return this.getById(packageId)!;
  }

  assignToArea(
    packageId: string,
    areaId: string,
    operator: AuthUser
  ): PackageInfo {
    const pkg = this.getById(packageId);
    if (!pkg) {
      throw new Error('包裹不存在');
    }

    if (pkg.status === 'signed') {
      throw new Error('包裹已签收，无法分配');
    }

    const area = db.prepare(`
      SELECT id, name FROM areas WHERE id = ?
    `).get(areaId) as any;

    if (!area) {
      throw new Error('区域不存在');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE packages SET area_id = ?, status = 'sorted', updated_at = ? WHERE id = ?
    `).run(areaId, now, packageId);

    this.addTrail(packageId, 'sorted', operator, `分配至区域: ${area.name}`);

    return this.getById(packageId)!;
  }

  assignToCourier(
    packageId: string,
    courierId: string,
    operator: AuthUser
  ): PackageInfo {
    const pkg = this.getById(packageId);
    if (!pkg) {
      throw new Error('包裹不存在');
    }

    if (pkg.status === 'signed') {
      throw new Error('包裹已签收，无法分配');
    }

    const courier = db.prepare(`
      SELECT id, name FROM users WHERE id = ? AND role = 'courier'
    `).get(courierId) as any;

    if (!courier) {
      throw new Error('快递员不存在');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE packages SET courier_id = ?, updated_at = ? WHERE id = ?
    `).run(courierId, now, packageId);

    this.addTrail(packageId, 'assigned', operator, `分配给快递员: ${courier.name}`);
    
    PerformanceEngine.recordPackageAssignment(courierId, packageId);

    return this.getById(packageId)!;
  }

  async generatePickupCode(
    packageId: string,
    operator: AuthUser
  ): Promise<PackageInfo> {
    const pkg = this.getById(packageId);
    if (!pkg) {
      throw new Error('包裹不存在');
    }

    if (pkg.status === 'signed') {
      throw new Error('包裹已签收');
    }

    const pickupCode = SignCodeEngine.generatePickupCode();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE packages SET pickup_code = ?, status = 'notified', updated_at = ? WHERE id = ?
    `).run(pickupCode, now, packageId);

    this.addTrail(packageId, 'notified', operator, `生成取件码: ${pickupCode}`);

    await SMSEngine.sendSMS({
      packageId,
      receiverPhone: pkg.receiverPhone,
      receiverName: pkg.receiverName,
      pickupCode,
      pickupAddress: pkg.receiverAddress,
      type: 'pickup'
    });

    return this.getById(packageId)!;
  }

  startDelivery(
    packageId: string,
    operator: AuthUser
  ): PackageInfo {
    const pkg = this.getById(packageId);
    if (!pkg) {
      throw new Error('包裹不存在');
    }

    if (pkg.status === 'signed' || pkg.status === 'exception') {
      throw new Error('包裹状态不允许开始派送');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE packages SET status = 'delivering', updated_at = ? WHERE id = ?
    `).run(now, packageId);

    this.addTrail(packageId, 'delivering', operator, '开始派送');

    return this.getById(packageId)!;
  }

  async signPackage(
    packageId: string,
    signType: 'home' | 'station',
    pickupCode?: string,
    signCode?: string,
    operator?: AuthUser
  ): Promise<PackageInfo> {
    const pkg = this.getById(packageId);
    if (!pkg) {
      throw new Error('包裹不存在');
    }

    if (pkg.status === 'signed') {
      throw new Error('包裹已签收');
    }

    if (signType === 'station') {
      if (!pickupCode || !pkg.pickupCode) {
        throw new Error('驿站自提需要取件码');
      }
      
      const verifyResult = SignCodeEngine.verifyPickupCode(
        pickupCode,
        pkg.pickupCode,
        undefined,
        pkg.receiverPhone
      );
      
      if (!verifyResult.success) {
        throw new Error(verifyResult.message);
      }
    }

    if (signType === 'home' && signCode) {
      const verifyResult = SignCodeEngine.verifySignCode(
        packageId,
        signCode,
        pkg.receiverPhone
      );
      
      if (!verifyResult.success) {
        throw new Error(verifyResult.message);
      }
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE packages 
      SET status = 'signed', sign_type = ?, sign_time = ?, updated_at = ? 
      WHERE id = ?
    `).run(signType, now, now, packageId);

    this.addTrail(packageId, 'signed', operator, `签收方式: ${signType === 'home' ? '上门派送' : '驿站自提'}`);

    if (pkg.courierId) {
      PerformanceEngine.recordSignature(pkg.courierId, packageId);
    }

    return this.getById(packageId)!;
  }

  async markException(
    packageId: string,
    type: 'damaged' | 'rejected' | 'unreachable' | 'other',
    reason: string,
    operator: AuthUser
  ): Promise<void> {
    const pkg = this.getById(packageId);
    if (!pkg) {
      throw new Error('包裹不存在');
    }

    if (pkg.status === 'signed') {
      throw new Error('已签收包裹无法标记异常');
    }

    const now = new Date().toISOString();
    const exceptionId = uuidv4();

    db.prepare(`
      INSERT INTO exceptions (id, package_id, type, reason, handler_id, handler_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(exceptionId, packageId, type, reason, operator.id, operator.name, now, now);

    db.prepare(`
      UPDATE packages SET status = 'exception', updated_at = ? WHERE id = ?
    `).run(now, packageId);

    const typeNames: Record<string, string> = {
      damaged: '破损',
      rejected: '拒收',
      unreachable: '无法联系',
      other: '其他'
    };

    this.addTrail(packageId, 'exception', operator, `异常类型: ${typeNames[type]}, 原因: ${reason}`);

    if (pkg.courierId) {
      PerformanceEngine.recordException(pkg.courierId, packageId);
    }

    await SMSEngine.sendSMS({
      packageId,
      receiverPhone: pkg.receiverPhone,
      receiverName: pkg.receiverName,
      pickupCode: reason,
      pickupAddress: '',
      type: 'exception'
    });
  }

  getById(packageId: string): PackageInfo | null {
    const pkg = db.prepare(`
      SELECT p.*, a.name as area_name, u.name as courier_name
      FROM packages p
      LEFT JOIN areas a ON p.area_id = a.id
      LEFT JOIN users u ON p.courier_id = u.id
      WHERE p.id = ?
    `).get(packageId) as any;

    if (!pkg) return null;

    return {
      id: pkg.id,
      trackingNumber: pkg.tracking_number,
      senderName: pkg.sender_name,
      senderPhone: pkg.sender_phone,
      senderAddress: pkg.sender_address,
      receiverName: pkg.receiver_name,
      receiverPhone: pkg.receiver_phone,
      receiverAddress: pkg.receiver_address,
      weight: pkg.weight,
      status: pkg.status,
      areaId: pkg.area_id,
      areaName: pkg.area_name,
      courierId: pkg.courier_id,
      courierName: pkg.courier_name,
      pickupCode: pkg.pickup_code,
      signCode: pkg.sign_code,
      signType: pkg.sign_type,
      signTime: pkg.sign_time,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at
    };
  }

  getByTrackingNumber(trackingNumber: string): PackageInfo | null {
    const pkg = db.prepare(`
      SELECT p.*, a.name as area_name, u.name as courier_name
      FROM packages p
      LEFT JOIN areas a ON p.area_id = a.id
      LEFT JOIN users u ON p.courier_id = u.id
      WHERE p.tracking_number = ?
    `).get(trackingNumber) as any;

    if (!pkg) return null;

    return {
      id: pkg.id,
      trackingNumber: pkg.tracking_number,
      senderName: pkg.sender_name,
      senderPhone: pkg.sender_phone,
      senderAddress: pkg.sender_address,
      receiverName: pkg.receiver_name,
      receiverPhone: pkg.receiver_phone,
      receiverAddress: pkg.receiver_address,
      weight: pkg.weight,
      status: pkg.status,
      areaId: pkg.area_id,
      areaName: pkg.area_name,
      courierId: pkg.courier_id,
      courierName: pkg.courier_name,
      pickupCode: pkg.pickup_code,
      signCode: pkg.sign_code,
      signType: pkg.sign_type,
      signTime: pkg.sign_time,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at
    };
  }

  searchByPhone(phone: string): PackageInfo[] {
    const packages = db.prepare(`
      SELECT p.*, a.name as area_name, u.name as courier_name
      FROM packages p
      LEFT JOIN areas a ON p.area_id = a.id
      LEFT JOIN users u ON p.courier_id = u.id
      WHERE p.receiver_phone LIKE ? OR p.sender_phone LIKE ?
      ORDER BY p.created_at DESC
    `).all(`%${phone}%`, `%${phone}%`) as any[];

    return packages.map(pkg => ({
      id: pkg.id,
      trackingNumber: pkg.tracking_number,
      senderName: pkg.sender_name,
      senderPhone: pkg.sender_phone,
      senderAddress: pkg.sender_address,
      receiverName: pkg.receiver_name,
      receiverPhone: pkg.receiver_phone,
      receiverAddress: pkg.receiver_address,
      weight: pkg.weight,
      status: pkg.status,
      areaId: pkg.area_id,
      areaName: pkg.area_name,
      courierId: pkg.courier_id,
      courierName: pkg.courier_name,
      pickupCode: pkg.pickup_code,
      signCode: pkg.sign_code,
      signType: pkg.sign_type,
      signTime: pkg.sign_time,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at
    }));
  }

  getTrails(packageId: string): TrailInfo[] {
    const trails = db.prepare(`
      SELECT * FROM package_trails 
      WHERE package_id = ? 
      ORDER BY created_at ASC
    `).all(packageId) as any[];

    return trails.map(t => ({
      id: t.id,
      packageId: t.package_id,
      action: t.action,
      operatorId: t.operator_id,
      operatorName: t.operator_name,
      operatorRole: t.operator_role,
      details: t.details,
      createdAt: t.created_at
    }));
  }

  getByStatus(status?: string, courierId?: string): PackageInfo[] {
    let sql = `
      SELECT p.*, a.name as area_name, u.name as courier_name
      FROM packages p
      LEFT JOIN areas a ON p.area_id = a.id
      LEFT JOIN users u ON p.courier_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (courierId) {
      sql += ' AND p.courier_id = ?';
      params.push(courierId);
    }

    sql += ' ORDER BY p.created_at DESC';

    const packages = db.prepare(sql).all(...params) as any[];

    return packages.map(pkg => ({
      id: pkg.id,
      trackingNumber: pkg.tracking_number,
      senderName: pkg.sender_name,
      senderPhone: pkg.sender_phone,
      senderAddress: pkg.sender_address,
      receiverName: pkg.receiver_name,
      receiverPhone: pkg.receiver_phone,
      receiverAddress: pkg.receiver_address,
      weight: pkg.weight,
      status: pkg.status,
      areaId: pkg.area_id,
      areaName: pkg.area_name,
      courierId: pkg.courier_id,
      courierName: pkg.courier_name,
      pickupCode: pkg.pickup_code,
      signCode: pkg.sign_code,
      signType: pkg.sign_type,
      signTime: pkg.sign_time,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at
    }));
  }
}

export default new PackageService();
