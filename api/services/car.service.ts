import { query, get, run } from '../config/database.js';
import type { Car, CarStatus, StatusHistory, User, Inspection } from '../types/index.js';

const VALID_STATUS_TRANSITIONS: Record<CarStatus, CarStatus[]> = {
  draft: ['pending_inspection', 'off_shelf'],
  pending_inspection: ['inspecting', 'draft'],
  inspecting: ['inspection_rejected', 'pending_audit'],
  inspection_rejected: ['draft', 'pending_inspection'],
  pending_audit: ['on_sale', 'inspection_rejected'],
  on_sale: ['locked', 'sold', 'off_shelf', 'exception'],
  locked: ['on_sale', 'sold', 'off_shelf'],
  sold: ['off_shelf'],
  off_shelf: ['on_sale', 'draft'],
  exception: ['on_sale', 'off_shelf']
};

const CAR_JSON_FIELDS = ['images', 'documents'];
const INSPECTION_JSON_FIELDS = ['accident', 'waterDamage', 'fireDamage', 'maintenance', 'paintwork', 'roadTest'];

function mapCarRow(row: Record<string, unknown>): Car {
  return {
    id: row.id as number,
    vin: row.vin as string,
    brand: row.brand as string,
    model: row.model as string,
    year: row.year as number,
    month: row.month as number,
    mileage: row.mileage as number,
    color: row.color as string,
    price: row.price as number,
    originalPrice: row.originalPrice as number | undefined,
    configuration: row.configuration as string,
    images: (row.images as string[]) || [],
    documents: (row.documents as Car['documents']) || [],
    dealerId: row.dealerId as number,
    status: row.status as CarStatus,
    statusHistory: [],
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string
  };
}

function mapUserRow(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    username: row.username as string,
    name: row.name as string,
    role: row.role as User['role'],
    phone: row.phone as string,
    email: row.email as string | undefined,
    status: row.status as User['status'],
    createdAt: row.createdAt as string
  };
}

function mapStatusHistoryRow(row: Record<string, unknown>): StatusHistory {
  return {
    id: row.id as number,
    fromStatus: row.fromStatus as string,
    toStatus: row.toStatus as string,
    operatorId: row.operatorId as number,
    reason: row.reason as string,
    createdAt: row.createdAt as string
  };
}

function mapInspectionRow(row: Record<string, unknown>): Inspection {
  return {
    id: row.id as number,
    carId: row.carId as number,
    inspectorId: row.inspectorId as number,
    accident: row.accident as Inspection['accident'],
    waterDamage: row.waterDamage as Inspection['waterDamage'],
    fireDamage: row.fireDamage as Inspection['fireDamage'],
    maintenance: row.maintenance as Inspection['maintenance'],
    paintwork: row.paintwork as Inspection['paintwork'],
    roadTest: row.roadTest as Inspection['roadTest'],
    overallScore: row.overallScore as number,
    overallComment: row.overallComment as string,
    status: row.status as Inspection['status'],
    auditorId: row.auditorId as number | undefined,
    auditComment: row.auditComment as string | undefined,
    auditedAt: row.auditedAt as string | undefined,
    createdAt: row.createdAt as string
  };
}

function isValidStatusTransition(from: CarStatus, to: CarStatus): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function validateCarData(data: Partial<Car>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.vin !== undefined) {
    if (typeof data.vin !== 'string' || data.vin.length !== 17) {
      errors.push('VIN码必须为17位字符');
    }
  }

  if (data.brand !== undefined && (!data.brand || data.brand.trim().length === 0)) {
    errors.push('品牌不能为空');
  }

  if (data.model !== undefined && (!data.model || data.model.trim().length === 0)) {
    errors.push('型号不能为空');
  }

  if (data.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (data.year < 1980 || data.year > currentYear) {
      errors.push(`年份必须在1980-${currentYear}之间`);
    }
  }

  if (data.month !== undefined && (data.month < 1 || data.month > 12)) {
    errors.push('月份必须在1-12之间');
  }

  if (data.mileage !== undefined && data.mileage < 0) {
    errors.push('里程数不能为负数');
  }

  if (data.color !== undefined && (!data.color || data.color.trim().length === 0)) {
    errors.push('颜色不能为空');
  }

  if (data.price !== undefined && data.price <= 0) {
    errors.push('价格必须大于0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function checkVinDuplicate(vin: string, excludeId?: number): Promise<boolean> {
  const sql = excludeId
    ? 'SELECT id FROM cars WHERE vin = ? AND id != ?'
    : 'SELECT id FROM cars WHERE vin = ?';
  const params = excludeId ? [vin, excludeId] : [vin];
  const result = query<{ id: number }>(sql, params);
  return result.length > 0;
}

export async function getCars(filters?: { dealerId?: number; status?: string; brand?: string }): Promise<Car[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.dealerId !== undefined) {
    conditions.push('c.dealer_id = ?');
    params.push(filters.dealerId);
  }

  if (filters?.status !== undefined) {
    conditions.push('c.status = ?');
    params.push(filters.status);
  }

  if (filters?.brand !== undefined) {
    conditions.push('c.brand = ?');
    params.push(filters.brand);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      c.id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color, 
      c.price, c.original_price as originalPrice, c.configuration,
      c.images_json as images, c.documents_json as documents,
      c.dealer_id as dealerId, c.status, c.created_at as createdAt, c.updated_at as updatedAt,
      u.id as dealer_id, u.username as dealer_username, u.name as dealer_name, 
      u.role as dealer_role, u.phone as dealer_phone, u.email as dealer_email,
      u.status as dealer_status, u.created_at as dealer_createdAt
    FROM cars c
    LEFT JOIN users u ON c.dealer_id = u.id
    ${whereClause}
    ORDER BY c.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, CAR_JSON_FIELDS);

  const cars: Car[] = [];
  for (const row of rows) {
    const car = mapCarRow(row);
    if (row.dealer_id) {
      car.dealer = mapUserRow({
        id: row.dealer_id,
        username: row.dealer_username,
        name: row.dealer_name,
        role: row.dealer_role,
        phone: row.dealer_phone,
        email: row.dealer_email,
        status: row.dealer_status,
        createdAt: row.dealer_createdAt
      });
    }
    car.statusHistory = await getStatusHistoryByCarId(car.id);
    cars.push(car);
  }

  return cars;
}

async function getStatusHistoryByCarId(carId: number): Promise<StatusHistory[]> {
  const sql = `
    SELECT 
      sh.id, sh.from_status as fromStatus, sh.to_status as toStatus,
      sh.operator_id as operatorId, sh.reason, sh.created_at as createdAt,
      u.id as operator_id, u.username as operator_username, u.name as operator_name,
      u.role as operator_role, u.phone as operator_phone, u.email as operator_email,
      u.status as operator_status, u.created_at as operator_createdAt
    FROM status_history sh
    LEFT JOIN users u ON sh.operator_id = u.id
    WHERE sh.car_id = ?
    ORDER BY sh.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, [carId]);

  return rows.map(row => {
    const history = mapStatusHistoryRow(row);
    if (row.operator_id) {
      history.operator = mapUserRow({
        id: row.operator_id,
        username: row.operator_username,
        name: row.operator_name,
        role: row.operator_role,
        phone: row.operator_phone,
        email: row.operator_email,
        status: row.operator_status,
        createdAt: row.operator_createdAt
      });
    }
    return history;
  });
}

async function getInspectionByCarId(carId: number): Promise<Inspection | null> {
  const sql = `
    SELECT 
      i.id, i.car_id as carId, i.inspector_id as inspectorId,
      i.accident_json as accident, i.water_damage_json as waterDamage,
      i.fire_damage_json as fireDamage, i.maintenance_json as maintenance,
      i.paintwork_json as paintwork, i.road_test_json as roadTest,
      i.overall_score as overallScore, i.overall_comment as overallComment,
      i.status, i.auditor_id as auditorId, i.audit_comment as auditComment,
      i.audited_at as auditedAt, i.created_at as createdAt
    FROM inspections i
    WHERE i.car_id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [carId], INSPECTION_JSON_FIELDS);

  if (!row) return null;

  return mapInspectionRow(row);
}

export async function getCarById(id: number): Promise<Car | null> {
  const sql = `
    SELECT 
      c.id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color, 
      c.price, c.original_price as originalPrice, c.configuration,
      c.images_json as images, c.documents_json as documents,
      c.dealer_id as dealerId, c.status, c.created_at as createdAt, c.updated_at as updatedAt,
      u.id as dealer_id, u.username as dealer_username, u.name as dealer_name, 
      u.role as dealer_role, u.phone as dealer_phone, u.email as dealer_email,
      u.status as dealer_status, u.created_at as dealer_createdAt
    FROM cars c
    LEFT JOIN users u ON c.dealer_id = u.id
    WHERE c.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], CAR_JSON_FIELDS);

  if (!row) return null;

  const car = mapCarRow(row);
  if (row.dealer_id) {
    car.dealer = mapUserRow({
      id: row.dealer_id,
      username: row.dealer_username,
      name: row.dealer_name,
      role: row.dealer_role,
      phone: row.dealer_phone,
      email: row.dealer_email,
      status: row.dealer_status,
      createdAt: row.dealer_createdAt
    });
  }

  car.statusHistory = await getStatusHistoryByCarId(car.id);
  car.inspection = (await getInspectionByCarId(car.id)) || undefined;

  return car;
}

export async function createCar(data: Partial<Car> & { dealerId: number }): Promise<Car> {
  const validation = validateCarData(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  if (!data.vin) {
    throw new Error('VIN码不能为空');
  }

  const isDuplicate = await checkVinDuplicate(data.vin);
  if (isDuplicate) {
    throw new Error('VIN码已存在');
  }

  const images = data.images || [];
  const documents = data.documents || [];
  const status: CarStatus = 'draft';

  const sql = `
    INSERT INTO cars (
      vin, brand, model, year, month, mileage, color, price, original_price,
      configuration, images_json, documents_json, dealer_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = run(sql, [
    data.vin,
    data.brand,
    data.model,
    data.year,
    data.month,
    data.mileage,
    data.color,
    data.price,
    data.originalPrice || null,
    data.configuration || '',
    JSON.stringify(images),
    JSON.stringify(documents),
    data.dealerId,
    status
  ]);

  const carId = result.lastInsertRowid as number;

  await updateCarStatus(carId, null as unknown as CarStatus, status, data.dealerId, '创建车源');

  const car = await getCarById(carId);
  if (!car) {
    throw new Error('创建车源失败');
  }

  return car;
}

export async function updateCar(id: number, data: Partial<Car>, operatorId: number): Promise<Car> {
  const existingCar = await getCarById(id);
  if (!existingCar) {
    throw new Error('车源不存在');
  }

  const validation = validateCarData(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  if (data.vin !== undefined && data.vin !== existingCar.vin) {
    const isDuplicate = await checkVinDuplicate(data.vin, id);
    if (isDuplicate) {
      throw new Error('VIN码已存在');
    }
  }

  const updateFields: string[] = [];
  const updateParams: (string | number | null)[] = [];

  if (data.vin !== undefined) {
    updateFields.push('vin = ?');
    updateParams.push(data.vin);
  }
  if (data.brand !== undefined) {
    updateFields.push('brand = ?');
    updateParams.push(data.brand);
  }
  if (data.model !== undefined) {
    updateFields.push('model = ?');
    updateParams.push(data.model);
  }
  if (data.year !== undefined) {
    updateFields.push('year = ?');
    updateParams.push(data.year);
  }
  if (data.month !== undefined) {
    updateFields.push('month = ?');
    updateParams.push(data.month);
  }
  if (data.mileage !== undefined) {
    updateFields.push('mileage = ?');
    updateParams.push(data.mileage);
  }
  if (data.color !== undefined) {
    updateFields.push('color = ?');
    updateParams.push(data.color);
  }
  if (data.price !== undefined) {
    updateFields.push('price = ?');
    updateParams.push(data.price);
  }
  if (data.originalPrice !== undefined) {
    updateFields.push('original_price = ?');
    updateParams.push(data.originalPrice);
  }
  if (data.configuration !== undefined) {
    updateFields.push('configuration = ?');
    updateParams.push(data.configuration);
  }

  if (data.images !== undefined) {
    updateFields.push('images_json = ?');
    updateParams.push(JSON.stringify(data.images));
  }

  if (data.documents !== undefined) {
    updateFields.push('documents_json = ?');
    updateParams.push(JSON.stringify(data.documents));
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateParams.push(id);

  const sql = `UPDATE cars SET ${updateFields.join(', ')} WHERE id = ?`;
  run(sql, updateParams);

  if (data.status !== undefined && data.status !== existingCar.status) {
    await updateCarStatus(id, existingCar.status, data.status as CarStatus, operatorId, '更新车源信息');
  }

  const updatedCar = await getCarById(id);
  if (!updatedCar) {
    throw new Error('更新车源失败');
  }

  return updatedCar;
}

export async function updateCarStatus(
  id: number,
  fromStatus: CarStatus,
  toStatus: CarStatus,
  operatorId: number,
  reason?: string
): Promise<void> {
  const existingCar = await getCarById(id);
  if (!existingCar) {
    throw new Error('车源不存在');
  }

  if (fromStatus !== null && fromStatus !== undefined && fromStatus !== existingCar.status) {
    throw new Error(`当前状态为${existingCar.status}，无法从${fromStatus}变更`);
  }

  const actualFromStatus = fromStatus || (existingCar.status as CarStatus);

  if (actualFromStatus !== toStatus && !isValidStatusTransition(actualFromStatus, toStatus)) {
    throw new Error(`不允许从${actualFromStatus}变更为${toStatus}`);
  }

  const updateSql = 'UPDATE cars SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  run(updateSql, [toStatus, id]);

  const historySql = `
    INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason)
    VALUES (?, ?, ?, ?, ?)
  `;
  run(historySql, [id, actualFromStatus, toStatus, operatorId, reason || '']);
}
