import db, { run, get, query } from '../config/database.js';
import type { Contract, Car, User, Deposit, ContractStatus } from '../types/index.js';

const CONTRACT_JSON_FIELDS = ['finance_plan_json'];

const VALID_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending_sign', 'cancelled'],
  pending_sign: ['signed', 'cancelled'],
  signed: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

function mapContractRow(row: Record<string, unknown>): Contract {
  return {
    id: row.id as number,
    carId: row.car_id as number,
    buyerId: row.buyer_id as number,
    dealerId: row.dealer_id as number,
    depositId: row.deposit_id as number | undefined,
    totalPrice: row.total_price as number,
    paymentMethod: row.payment_method as Contract['paymentMethod'],
    financePlan: row.finance_plan_json ? (row.finance_plan_json as Contract['financePlan']) : undefined,
    status: row.status as ContractStatus,
    signedByBuyerAt: row.signed_by_buyer_at as string | undefined,
    signedByDealerAt: row.signed_by_dealer_at as string | undefined,
    createdAt: row.created_at as string
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
    createdAt: row.created_at as string
  };
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
    originalPrice: row.original_price as number | undefined,
    configuration: row.configuration as string,
    images: (row.images_json as string[]) || [],
    documents: (row.documents_json as Car['documents']) || [],
    dealerId: row.dealer_id as number,
    status: row.status as Car['status'],
    statusHistory: [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

function mapDepositRow(row: Record<string, unknown>): Deposit {
  return {
    id: row.id as number,
    carId: row.car_id as number,
    buyerId: row.buyer_id as number,
    amount: row.amount as number,
    paymentMethod: row.payment_method as string,
    transactionId: row.transaction_id as string,
    paidAt: row.paid_at as string | undefined,
    status: row.status as Deposit['status'],
    refundReason: row.refund_reason as string | undefined,
    refundApprovedBy: row.refund_approved_by as number | undefined,
    refundApprovedAt: row.refund_approved_at as string | undefined,
    releaseType: row.release_type as Deposit['releaseType'],
    settlementId: row.settlement_id as number | undefined,
    createdAt: row.created_at as string
  };
}

function isValidStatusTransition(from: ContractStatus, to: ContractStatus): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

function buildContractWithRelations(row: Record<string, unknown>): Contract {
  const contract = mapContractRow(row);

  if (row.car_id) {
    contract.car = mapCarRow({
      id: row.car_id,
      vin: row.car_vin,
      brand: row.car_brand,
      model: row.car_model,
      year: row.car_year,
      month: row.car_month,
      mileage: row.car_mileage,
      color: row.car_color,
      price: row.car_price,
      original_price: row.car_original_price,
      configuration: row.car_configuration,
      images_json: row.car_images_json,
      documents_json: row.car_documents_json,
      dealer_id: row.car_dealer_id,
      status: row.car_status,
      created_at: row.car_created_at,
      updated_at: row.car_updated_at
    });
  }

  if (row.buyer_id) {
    contract.buyer = mapUserRow({
      id: row.buyer_id,
      username: row.buyer_username,
      name: row.buyer_name,
      role: row.buyer_role,
      phone: row.buyer_phone,
      email: row.buyer_email,
      status: row.buyer_status,
      created_at: row.buyer_created_at
    });
  }

  if (row.dealer_id) {
    contract.dealer = mapUserRow({
      id: row.dealer_id,
      username: row.dealer_username,
      name: row.dealer_name,
      role: row.dealer_role,
      phone: row.dealer_phone,
      email: row.dealer_email,
      status: row.dealer_status,
      created_at: row.dealer_created_at
    });
  }

  if (row.deposit_id) {
    contract.deposit = mapDepositRow({
      id: row.deposit_id,
      car_id: row.deposit_car_id,
      buyer_id: row.deposit_buyer_id,
      amount: row.deposit_amount,
      payment_method: row.deposit_payment_method,
      transaction_id: row.deposit_transaction_id,
      paid_at: row.deposit_paid_at,
      status: row.deposit_status,
      refund_reason: row.deposit_refund_reason,
      refund_approved_by: row.deposit_refund_approved_by,
      refund_approved_at: row.deposit_refund_approved_at,
      release_type: row.deposit_release_type,
      settlement_id: row.deposit_settlement_id,
      created_at: row.deposit_created_at
    });
  }

  return contract;
}

export async function getContracts(filters?: { buyerId?: number; dealerId?: number; status?: string }): Promise<Contract[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.buyerId !== undefined) {
    conditions.push('c.buyer_id = ?');
    params.push(filters.buyerId);
  }

  if (filters?.dealerId !== undefined) {
    conditions.push('c.dealer_id = ?');
    params.push(filters.dealerId);
  }

  if (filters?.status !== undefined) {
    conditions.push('c.status = ?');
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      c.id, c.car_id, c.buyer_id, c.dealer_id, c.deposit_id,
      c.total_price, c.payment_method, c.finance_plan_json,
      c.status, c.signed_by_buyer_at, c.signed_by_dealer_at, c.created_at,
      car.id as car_id, car.vin as car_vin, car.brand as car_brand, car.model as car_model,
      car.year as car_year, car.month as car_month, car.mileage as car_mileage,
      car.color as car_color, car.price as car_price, car.original_price as car_original_price,
      car.configuration as car_configuration, car.images_json as car_images_json,
      car.documents_json as car_documents_json, car.dealer_id as car_dealer_id,
      car.status as car_status, car.created_at as car_created_at, car.updated_at as car_updated_at,
      buyer.id as buyer_id, buyer.username as buyer_username, buyer.name as buyer_name,
      buyer.role as buyer_role, buyer.phone as buyer_phone, buyer.email as buyer_email,
      buyer.status as buyer_status, buyer.created_at as buyer_created_at,
      dealer.id as dealer_id, dealer.username as dealer_username, dealer.name as dealer_name,
      dealer.role as dealer_role, dealer.phone as dealer_phone, dealer.email as dealer_email,
      dealer.status as dealer_status, dealer.created_at as dealer_created_at,
      d.id as deposit_id, d.car_id as deposit_car_id, d.buyer_id as deposit_buyer_id,
      d.amount as deposit_amount, d.payment_method as deposit_payment_method,
      d.transaction_id as deposit_transaction_id, d.paid_at as deposit_paid_at,
      d.status as deposit_status, d.refund_reason as deposit_refund_reason,
      d.refund_approved_by as deposit_refund_approved_by, d.refund_approved_at as deposit_refund_approved_at,
      d.release_type as deposit_release_type, d.settlement_id as deposit_settlement_id,
      d.created_at as deposit_created_at
    FROM contracts c
    LEFT JOIN cars car ON c.car_id = car.id
    LEFT JOIN users buyer ON c.buyer_id = buyer.id
    LEFT JOIN users dealer ON c.dealer_id = dealer.id
    LEFT JOIN deposits d ON c.deposit_id = d.id
    ${whereClause}
    ORDER BY c.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, CONTRACT_JSON_FIELDS);
  return rows.map(row => buildContractWithRelations(row));
}

export async function getContractById(id: number): Promise<Contract | null> {
  const sql = `
    SELECT 
      c.id, c.car_id, c.buyer_id, c.dealer_id, c.deposit_id,
      c.total_price, c.payment_method, c.finance_plan_json,
      c.status, c.signed_by_buyer_at, c.signed_by_dealer_at, c.created_at,
      car.id as car_id, car.vin as car_vin, car.brand as car_brand, car.model as car_model,
      car.year as car_year, car.month as car_month, car.mileage as car_mileage,
      car.color as car_color, car.price as car_price, car.original_price as car_original_price,
      car.configuration as car_configuration, car.images_json as car_images_json,
      car.documents_json as car_documents_json, car.dealer_id as car_dealer_id,
      car.status as car_status, car.created_at as car_created_at, car.updated_at as car_updated_at,
      buyer.id as buyer_id, buyer.username as buyer_username, buyer.name as buyer_name,
      buyer.role as buyer_role, buyer.phone as buyer_phone, buyer.email as buyer_email,
      buyer.status as buyer_status, buyer.created_at as buyer_created_at,
      dealer.id as dealer_id, dealer.username as dealer_username, dealer.name as dealer_name,
      dealer.role as dealer_role, dealer.phone as dealer_phone, dealer.email as dealer_email,
      dealer.status as dealer_status, dealer.created_at as dealer_created_at,
      d.id as deposit_id, d.car_id as deposit_car_id, d.buyer_id as deposit_buyer_id,
      d.amount as deposit_amount, d.payment_method as deposit_payment_method,
      d.transaction_id as deposit_transaction_id, d.paid_at as deposit_paid_at,
      d.status as deposit_status, d.refund_reason as deposit_refund_reason,
      d.refund_approved_by as deposit_refund_approved_by, d.refund_approved_at as deposit_refund_approved_at,
      d.release_type as deposit_release_type, d.settlement_id as deposit_settlement_id,
      d.created_at as deposit_created_at
    FROM contracts c
    LEFT JOIN cars car ON c.car_id = car.id
    LEFT JOIN users buyer ON c.buyer_id = buyer.id
    LEFT JOIN users dealer ON c.dealer_id = dealer.id
    LEFT JOIN deposits d ON c.deposit_id = d.id
    WHERE c.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], CONTRACT_JSON_FIELDS);
  if (!row) return null;

  return buildContractWithRelations(row);
}

export async function createContract(
  data: Partial<Contract> & { carId: number; buyerId: number; dealerId: number; depositId?: number }
): Promise<Contract> {
  const car = get<{ id: number; price: number; status: string }>(
    'SELECT id, price, status FROM cars WHERE id = ?',
    [data.carId]
  );

  if (!car) {
    throw new Error('车源不存在');
  }

  if (car.status !== 'locked') {
    throw new Error('车辆未锁定，无法创建合同');
  }

  if (data.depositId !== undefined) {
    const deposit = get<{ id: number; status: string; amount: number }>(
      'SELECT id, status, amount FROM deposits WHERE id = ?',
      [data.depositId]
    );

    if (!deposit) {
      throw new Error('订金记录不存在');
    }

    if (deposit.status !== 'paid') {
      throw new Error('订金未支付，无法创建合同');
    }
  }

  const existingContract = get<{ id: number }>(
    'SELECT id FROM contracts WHERE car_id = ? AND status NOT IN (?, ?)',
    [data.carId, 'completed', 'cancelled']
  );

  if (existingContract) {
    throw new Error('该车源已有有效合同');
  }

  const totalPrice = data.totalPrice ?? car.price;
  const paymentMethod = data.paymentMethod ?? 'full';

  const sql = `
    INSERT INTO contracts (
      car_id, buyer_id, dealer_id, deposit_id, total_price,
      payment_method, finance_plan_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = run(sql, [
    data.carId,
    data.buyerId,
    data.dealerId,
    data.depositId || null,
    totalPrice,
    paymentMethod,
    data.financePlan ? JSON.stringify(data.financePlan) : null,
    'draft'
  ]);

  const contractId = result.lastInsertRowid as number;

  const contract = await getContractById(contractId);
  if (!contract) {
    throw new Error('创建合同失败');
  }

  return contract;
}

export async function sendForSign(id: number): Promise<Contract> {
  const existing = get<{ id: number; status: ContractStatus }>(
    'SELECT id, status FROM contracts WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('合同不存在');
  }

  if (existing.status !== 'draft') {
    throw new Error('只能发送草稿状态的合同');
  }

  if (!isValidStatusTransition(existing.status, 'pending_sign')) {
    throw new Error(`不允许从${existing.status}变更为pending_sign`);
  }

  run(
    'UPDATE contracts SET status = ? WHERE id = ?',
    ['pending_sign', id]
  );

  const contract = await getContractById(id);
  if (!contract) {
    throw new Error('发送签署失败');
  }

  return contract;
}

export async function signContract(
  id: number,
  signerRole: 'buyer' | 'dealer',
  operatorId: number
): Promise<Contract> {
  const existing = get<{
    id: number;
    status: ContractStatus;
    buyer_id: number;
    dealer_id: number;
    signed_by_buyer_at: string | null;
    signed_by_dealer_at: string | null;
  }>(
    'SELECT id, status, buyer_id, dealer_id, signed_by_buyer_at, signed_by_dealer_at FROM contracts WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('合同不存在');
  }

  if (existing.status !== 'pending_sign') {
    throw new Error('合同状态不是待签署');
  }

  if (signerRole === 'buyer' && existing.buyer_id !== operatorId) {
    throw new Error('只有买家可以签署买家方');
  }

  if (signerRole === 'dealer' && existing.dealer_id !== operatorId) {
    throw new Error('只有车商可以签署车商方');
  }

  const transaction = db.transaction(() => {
    if (signerRole === 'buyer' && !existing.signed_by_buyer_at) {
      run(
        'UPDATE contracts SET signed_by_buyer_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } else if (signerRole === 'dealer' && !existing.signed_by_dealer_at) {
      run(
        'UPDATE contracts SET signed_by_dealer_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    const updated = get<{ signed_by_buyer_at: string | null; signed_by_dealer_at: string | null }>(
      'SELECT signed_by_buyer_at, signed_by_dealer_at FROM contracts WHERE id = ?',
      [id]
    );

    if (updated?.signed_by_buyer_at && updated?.signed_by_dealer_at) {
      run(
        'UPDATE contracts SET status = ? WHERE id = ?',
        ['signed', id]
      );
    }
  });

  transaction();

  const contract = await getContractById(id);
  if (!contract) {
    throw new Error('签署合同失败');
  }

  return contract;
}

export async function confirmPayment(id: number, operatorId: number): Promise<Contract> {
  const existing = get<{ id: number; status: ContractStatus; car_id: number }>(
    'SELECT id, status, car_id FROM contracts WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('合同不存在');
  }

  if (existing.status !== 'signed' && existing.status !== 'pending_payment') {
    throw new Error('合同状态不正确，无法确认尾款支付');
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE contracts SET status = ? WHERE id = ?',
      ['paid', id]
    );

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      ['sold', existing.car_id]
    );

    run(
      'INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
      [existing.car_id, 'locked', 'sold', operatorId, '合同尾款已确认支付']
    );
  });

  transaction();

  const contract = await getContractById(id);
  if (!contract) {
    throw new Error('确认尾款支付失败');
  }

  return contract;
}

export async function completeContract(id: number, operatorId: number): Promise<Contract> {
  const existing = get<{ id: number; status: ContractStatus }>(
    'SELECT id, status FROM contracts WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('合同不存在');
  }

  if (existing.status !== 'paid') {
    throw new Error('合同状态不是已支付，无法完成');
  }

  if (!isValidStatusTransition(existing.status, 'completed')) {
    throw new Error(`不允许从${existing.status}变更为completed`);
  }

  run(
    'UPDATE contracts SET status = ? WHERE id = ?',
    ['completed', id]
  );

  const contract = await getContractById(id);
  if (!contract) {
    throw new Error('完成合同失败');
  }

  return contract;
}
