import db, { run, get, query } from '../config/database.js';
import type { Deposit, DepositStatus, Car, User } from '../types/index.js';

const VALID_STATUS_TRANSITIONS: Record<DepositStatus, DepositStatus[]> = {
  pending: ['paid', 'refunded'],
  paid: ['locked', 'refund_pending'],
  locked: ['refund_pending', 'released_to_seller', 'deducted'],
  refund_pending: ['refunded', 'locked'],
  refunded: [],
  released_to_seller: [],
  deducted: []
};

const CAR_JSON_FIELDS = ['images', 'documents'];

function isValidStatusTransition(from: DepositStatus, to: DepositStatus): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

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
    status: row.status as Car['status'],
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

function mapDepositRow(row: Record<string, unknown>): Deposit {
  return {
    id: row.id as number,
    carId: row.carId as number,
    buyerId: row.buyerId as number,
    amount: row.amount as number,
    paymentMethod: row.paymentMethod as string,
    transactionId: row.transactionId as string,
    paidAt: row.paidAt as string | undefined,
    status: row.status as DepositStatus,
    refundReason: row.refundReason as string | undefined,
    refundApprovedBy: row.refundApprovedBy as number | undefined,
    refundApprovedAt: row.refundApprovedAt as string | undefined,
    releaseType: row.releaseType as Deposit['releaseType'],
    settlementId: row.settlementId as number | undefined,
    createdAt: row.createdAt as string
  };
}

export async function getDeposits(filters?: {
  buyerId?: number;
  carId?: number;
  status?: string;
}): Promise<Deposit[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.buyerId !== undefined) {
    conditions.push('d.buyer_id = ?');
    params.push(filters.buyerId);
  }

  if (filters?.carId !== undefined) {
    conditions.push('d.car_id = ?');
    params.push(filters.carId);
  }

  if (filters?.status !== undefined) {
    conditions.push('d.status = ?');
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      d.id, d.car_id as carId, d.buyer_id as buyerId, d.amount,
      d.payment_method as paymentMethod, d.transaction_id as transactionId,
      d.paid_at as paidAt, d.status, d.refund_reason as refundReason,
      d.refund_approved_by as refundApprovedBy, d.refund_approved_at as refundApprovedAt,
      d.release_type as releaseType, d.settlement_id as settlementId,
      d.created_at as createdAt,
      c.id as car_id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color,
      c.price, c.original_price as originalPrice, c.configuration,
      c.images_json as images, c.documents_json as documents,
      c.dealer_id as dealerId, c.status as car_status,
      c.created_at as car_createdAt, c.updated_at as car_updatedAt,
      b.id as buyer_id, b.username as buyer_username, b.name as buyer_name,
      b.role as buyer_role, b.phone as buyer_phone, b.email as buyer_email,
      b.status as buyer_status, b.created_at as buyer_createdAt
    FROM deposits d
    LEFT JOIN cars c ON d.car_id = c.id
    LEFT JOIN users b ON d.buyer_id = b.id
    ${whereClause}
    ORDER BY d.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, CAR_JSON_FIELDS);

  return rows.map(row => {
    const deposit = mapDepositRow(row);

    if (row.car_id) {
      deposit.car = mapCarRow({
        id: row.car_id,
        vin: row.vin,
        brand: row.brand,
        model: row.model,
        year: row.year,
        month: row.month,
        mileage: row.mileage,
        color: row.color,
        price: row.price,
        originalPrice: row.originalPrice,
        configuration: row.configuration,
        images: row.images,
        documents: row.documents,
        dealerId: row.dealerId,
        status: row.car_status,
        createdAt: row.car_createdAt,
        updatedAt: row.car_updatedAt
      });
    }

    if (row.buyer_id) {
      deposit.buyer = mapUserRow({
        id: row.buyer_id,
        username: row.buyer_username,
        name: row.buyer_name,
        role: row.buyer_role,
        phone: row.buyer_phone,
        email: row.buyer_email,
        status: row.buyer_status,
        createdAt: row.buyer_createdAt
      });
    }

    return deposit;
  });
}

export async function getDepositById(id: number): Promise<Deposit | null> {
  const sql = `
    SELECT 
      d.id, d.car_id as carId, d.buyer_id as buyerId, d.amount,
      d.payment_method as paymentMethod, d.transaction_id as transactionId,
      d.paid_at as paidAt, d.status, d.refund_reason as refundReason,
      d.refund_approved_by as refundApprovedBy, d.refund_approved_at as refundApprovedAt,
      d.release_type as releaseType, d.settlement_id as settlementId,
      d.created_at as createdAt,
      c.id as car_id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color,
      c.price, c.original_price as originalPrice, c.configuration,
      c.images_json as images, c.documents_json as documents,
      c.dealer_id as dealerId, c.status as car_status,
      c.created_at as car_createdAt, c.updated_at as car_updatedAt,
      b.id as buyer_id, b.username as buyer_username, b.name as buyer_name,
      b.role as buyer_role, b.phone as buyer_phone, b.email as buyer_email,
      b.status as buyer_status, b.created_at as buyer_createdAt
    FROM deposits d
    LEFT JOIN cars c ON d.car_id = c.id
    LEFT JOIN users b ON d.buyer_id = b.id
    WHERE d.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], CAR_JSON_FIELDS);

  if (!row) return null;

  const deposit = mapDepositRow(row);

  if (row.car_id) {
    deposit.car = mapCarRow({
      id: row.car_id,
      vin: row.vin,
      brand: row.brand,
      model: row.model,
      year: row.year,
      month: row.month,
      mileage: row.mileage,
      color: row.color,
      price: row.price,
      originalPrice: row.originalPrice,
      configuration: row.configuration,
      images: row.images,
      documents: row.documents,
      dealerId: row.dealerId,
      status: row.car_status,
      createdAt: row.car_createdAt,
      updatedAt: row.car_updatedAt
    });
  }

  if (row.buyer_id) {
    deposit.buyer = mapUserRow({
      id: row.buyer_id,
      username: row.buyer_username,
      name: row.buyer_name,
      role: row.buyer_role,
      phone: row.buyer_phone,
      email: row.buyer_email,
      status: row.buyer_status,
      createdAt: row.buyer_createdAt
    });
  }

  return deposit;
}

export async function createDeposit(
  data: Partial<Deposit> & { carId: number; buyerId: number }
): Promise<Deposit> {
  const car = get<{ id: number; status: string; price: number }>(
    'SELECT id, status, price FROM cars WHERE id = ?',
    [data.carId]
  );

  if (!car) {
    throw new Error('车源不存在');
  }

  if (car.status !== 'on_sale') {
    throw new Error('车源状态不是在售，无法支付订金');
  }

  const existingDeposit = get<{ id: number }>(
    'SELECT id FROM deposits WHERE car_id = ? AND status IN (?, ?, ?, ?)',
    [data.carId, 'pending', 'paid', 'locked', 'refund_pending']
  );

  if (existingDeposit) {
    throw new Error('该车源已有有效订金');
  }

  const buyer = get<{ id: number }>(
    'SELECT id FROM users WHERE id = ? AND role = ?',
    [data.buyerId, 'buyer']
  );

  if (!buyer) {
    throw new Error('买家不存在或角色不正确');
  }

  const amount = data.amount || Math.min(car.price * 0.1, 10000);

  const result = run(
    `INSERT INTO deposits (
      car_id, buyer_id, amount, payment_method, transaction_id, status
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.carId,
      data.buyerId,
      amount,
      data.paymentMethod || '',
      data.transactionId || '',
      'pending'
    ]
  );

  const depositId = result.lastInsertRowid as number;

  const deposit = await getDepositById(depositId);
  if (!deposit) {
    throw new Error('创建订金记录失败');
  }

  return deposit;
}

export async function payDeposit(
  id: number,
  paymentMethod: string,
  transactionId: string
): Promise<Deposit> {
  const existing = get<{ id: number; status: string; car_id: number; amount: number }>(
    'SELECT id, status, car_id, amount FROM deposits WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('订金记录不存在');
  }

  const currentStatus = existing.status as DepositStatus;

  if (!isValidStatusTransition(currentStatus, 'paid')) {
    throw new Error(`当前状态为${currentStatus}，无法确认支付`);
  }

  if (!paymentMethod || !transactionId) {
    throw new Error('支付方式和交易号不能为空');
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE deposits SET status = ?, payment_method = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['paid', paymentMethod, transactionId, id]
    );

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      ['locked', existing.car_id]
    );

    run(
      'UPDATE deposits SET status = ? WHERE id = ?',
      ['locked', id]
    );
  });

  transaction();

  const updated = await getDepositById(id);
  if (!updated) {
    throw new Error('确认订金支付失败');
  }

  return updated;
}

export async function requestRefund(
  id: number,
  reason: string,
  operatorId: number
): Promise<Deposit> {
  const existing = get<{ id: number; status: string }>(
    'SELECT id, status FROM deposits WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('订金记录不存在');
  }

  const currentStatus = existing.status as DepositStatus;

  if (!isValidStatusTransition(currentStatus, 'refund_pending')) {
    throw new Error(`当前状态为${currentStatus}，无法申请退款`);
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('退款原因不能为空');
  }

  run(
    'UPDATE deposits SET status = ?, refund_reason = ? WHERE id = ?',
    ['refund_pending', reason, id]
  );

  const updated = await getDepositById(id);
  if (!updated) {
    throw new Error('申请退款失败');
  }

  return updated;
}

export async function approveRefund(
  id: number,
  approved: boolean,
  operatorId: number
): Promise<Deposit> {
  const existing = get<{ id: number; status: string; car_id: number }>(
    'SELECT id, status, car_id FROM deposits WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('订金记录不存在');
  }

  const currentStatus = existing.status as DepositStatus;

  if (currentStatus !== 'refund_pending') {
    throw new Error(`当前状态为${currentStatus}，无法审核退款`);
  }

  const newStatus = approved ? 'refunded' : 'locked';

  const transaction = db.transaction(() => {
    run(
      'UPDATE deposits SET status = ?, refund_approved_by = ?, refund_approved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, operatorId, id]
    );

    if (approved) {
      run(
        'UPDATE cars SET status = ? WHERE id = ?',
        ['on_sale', existing.car_id]
      );
    }
  });

  transaction();

  const updated = await getDepositById(id);
  if (!updated) {
    throw new Error('审核退款失败');
  }

  return updated;
}

export async function releaseDeposit(
  id: number,
  releaseType: 'to_seller' | 'deducted',
  operatorId: number
): Promise<Deposit> {
  const existing = get<{ id: number; status: string }>(
    'SELECT id, status FROM deposits WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('订金记录不存在');
  }

  const currentStatus = existing.status as DepositStatus;

  if (currentStatus !== 'locked') {
    throw new Error(`当前状态为${currentStatus}，无法释放订金`);
  }

  const newStatus = releaseType === 'to_seller' ? 'released_to_seller' : 'deducted';

  run(
    'UPDATE deposits SET status = ?, release_type = ? WHERE id = ?',
    [newStatus, releaseType, id]
  );

  const updated = await getDepositById(id);
  if (!updated) {
    throw new Error('释放订金失败');
  }

  return updated;
}
