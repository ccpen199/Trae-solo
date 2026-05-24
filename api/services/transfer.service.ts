import db, { run, get, query } from '../config/database.js';
import type { Transfer, TransferDocument, Contract, Car, User, Deposit } from '../types/index.js';

const TRANSFER_JSON_FIELDS = ['documents_json'];

const VALID_STATUS_TRANSITIONS: Record<Transfer['status'], Transfer['status'][]> = {
  pending: ['submitted', 'rejected'],
  submitted: ['reviewing', 'rejected'],
  reviewing: ['approved', 'rejected'],
  approved: ['completed', 'rejected'],
  completed: [],
  rejected: []
};

function mapTransferRow(row: Record<string, unknown>): Transfer {
  return {
    id: row.id as number,
    contractId: row.contract_id as number,
    carId: row.car_id as number,
    documents: (row.documents_json as TransferDocument[]) || [],
    status: row.status as Transfer['status'],
    reviewerId: row.reviewer_id as number | undefined,
    reviewComment: row.review_comment as string | undefined,
    reviewedAt: row.reviewed_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
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
    status: row.status as Contract['status'],
    signedByBuyerAt: row.signed_by_buyer_at as string | undefined,
    signedByDealerAt: row.signed_by_dealer_at as string | undefined,
    createdAt: row.created_at as string
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

function isValidStatusTransition(from: Transfer['status'], to: Transfer['status']): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

function buildTransferWithRelations(row: Record<string, unknown>): Transfer {
  const transfer = mapTransferRow(row);

  if (row.contract_id) {
    transfer.contract = mapContractRow({
      id: row.contract_id,
      car_id: row.contract_car_id,
      buyer_id: row.contract_buyer_id,
      dealer_id: row.contract_dealer_id,
      deposit_id: row.contract_deposit_id,
      total_price: row.contract_total_price,
      payment_method: row.contract_payment_method,
      finance_plan_json: row.contract_finance_plan_json,
      status: row.contract_status,
      signed_by_buyer_at: row.contract_signed_by_buyer_at,
      signed_by_dealer_at: row.contract_signed_by_dealer_at,
      created_at: row.contract_created_at
    });

    if (row.contract_buyer_id) {
      transfer.contract.buyer = mapUserRow({
        id: row.contract_buyer_id,
        username: row.contract_buyer_username,
        name: row.contract_buyer_name,
        role: row.contract_buyer_role,
        phone: row.contract_buyer_phone,
        email: row.contract_buyer_email,
        status: row.contract_buyer_status,
        created_at: row.contract_buyer_created_at
      });
    }

    if (row.contract_dealer_id) {
      transfer.contract.dealer = mapUserRow({
        id: row.contract_dealer_id,
        username: row.contract_dealer_username,
        name: row.contract_dealer_name,
        role: row.contract_dealer_role,
        phone: row.contract_dealer_phone,
        email: row.contract_dealer_email,
        status: row.contract_dealer_status,
        created_at: row.contract_dealer_created_at
      });
    }

    if (row.contract_deposit_id) {
      transfer.contract.deposit = mapDepositRow({
        id: row.contract_deposit_id,
        car_id: row.contract_deposit_car_id,
        buyer_id: row.contract_deposit_buyer_id,
        amount: row.contract_deposit_amount,
        payment_method: row.contract_deposit_payment_method,
        transaction_id: row.contract_deposit_transaction_id,
        paid_at: row.contract_deposit_paid_at,
        status: row.contract_deposit_status,
        refund_reason: row.contract_deposit_refund_reason,
        refund_approved_by: row.contract_deposit_refund_approved_by,
        refund_approved_at: row.contract_deposit_refund_approved_at,
        release_type: row.contract_deposit_release_type,
        settlement_id: row.contract_deposit_settlement_id,
        created_at: row.contract_deposit_created_at
      });
    }
  }

  if (row.car_id) {
    transfer.car = mapCarRow({
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

  if (row.reviewer_id) {
    transfer.reviewer = mapUserRow({
      id: row.reviewer_id,
      username: row.reviewer_username,
      name: row.reviewer_name,
      role: row.reviewer_role,
      phone: row.reviewer_phone,
      email: row.reviewer_email,
      status: row.reviewer_status,
      created_at: row.reviewer_created_at
    });
  }

  return transfer;
}

export async function getTransfers(filters?: { carId?: number; status?: string }): Promise<Transfer[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.carId !== undefined) {
    conditions.push('t.car_id = ?');
    params.push(filters.carId);
  }

  if (filters?.status !== undefined) {
    conditions.push('t.status = ?');
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      t.id, t.contract_id, t.car_id, t.documents_json,
      t.status, t.reviewer_id, t.review_comment, t.reviewed_at,
      t.completed_at, t.created_at,
      c.id as contract_id, c.car_id as contract_car_id,
      c.buyer_id as contract_buyer_id, c.dealer_id as contract_dealer_id,
      c.deposit_id as contract_deposit_id, c.total_price as contract_total_price,
      c.payment_method as contract_payment_method,
      c.finance_plan_json as contract_finance_plan_json,
      c.status as contract_status,
      c.signed_by_buyer_at as contract_signed_by_buyer_at,
      c.signed_by_dealer_at as contract_signed_by_dealer_at,
      c.created_at as contract_created_at,
      cb.id as contract_buyer_id, cb.username as contract_buyer_username,
      cb.name as contract_buyer_name, cb.role as contract_buyer_role,
      cb.phone as contract_buyer_phone, cb.email as contract_buyer_email,
      cb.status as contract_buyer_status, cb.created_at as contract_buyer_created_at,
      cd.id as contract_dealer_id, cd.username as contract_dealer_username,
      cd.name as contract_dealer_name, cd.role as contract_dealer_role,
      cd.phone as contract_dealer_phone, cd.email as contract_dealer_email,
      cd.status as contract_dealer_status, cd.created_at as contract_dealer_created_at,
      cdeps.id as contract_deposit_id, cdeps.car_id as contract_deposit_car_id,
      cdeps.buyer_id as contract_deposit_buyer_id,
      cdeps.amount as contract_deposit_amount,
      cdeps.payment_method as contract_deposit_payment_method,
      cdeps.transaction_id as contract_deposit_transaction_id,
      cdeps.paid_at as contract_deposit_paid_at,
      cdeps.status as contract_deposit_status,
      cdeps.refund_reason as contract_deposit_refund_reason,
      cdeps.refund_approved_by as contract_deposit_refund_approved_by,
      cdeps.refund_approved_at as contract_deposit_refund_approved_at,
      cdeps.release_type as contract_deposit_release_type,
      cdeps.settlement_id as contract_deposit_settlement_id,
      cdeps.created_at as contract_deposit_created_at,
      car.id as car_id, car.vin as car_vin, car.brand as car_brand,
      car.model as car_model, car.year as car_year, car.month as car_month,
      car.mileage as car_mileage, car.color as car_color, car.price as car_price,
      car.original_price as car_original_price,
      car.configuration as car_configuration,
      car.images_json as car_images_json, car.documents_json as car_documents_json,
      car.dealer_id as car_dealer_id, car.status as car_status,
      car.created_at as car_created_at, car.updated_at as car_updated_at,
      r.id as reviewer_id, r.username as reviewer_username,
      r.name as reviewer_name, r.role as reviewer_role,
      r.phone as reviewer_phone, r.email as reviewer_email,
      r.status as reviewer_status, r.created_at as reviewer_created_at
    FROM transfers t
    LEFT JOIN contracts c ON t.contract_id = c.id
    LEFT JOIN users cb ON c.buyer_id = cb.id
    LEFT JOIN users cd ON c.dealer_id = cd.id
    LEFT JOIN deposits cdeps ON c.deposit_id = cdeps.id
    LEFT JOIN cars car ON t.car_id = car.id
    LEFT JOIN users r ON t.reviewer_id = r.id
    ${whereClause}
    ORDER BY t.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, TRANSFER_JSON_FIELDS);
  return rows.map(row => buildTransferWithRelations(row));
}

export async function getTransferById(id: number): Promise<Transfer | null> {
  const sql = `
    SELECT 
      t.id, t.contract_id, t.car_id, t.documents_json,
      t.status, t.reviewer_id, t.review_comment, t.reviewed_at,
      t.completed_at, t.created_at,
      c.id as contract_id, c.car_id as contract_car_id,
      c.buyer_id as contract_buyer_id, c.dealer_id as contract_dealer_id,
      c.deposit_id as contract_deposit_id, c.total_price as contract_total_price,
      c.payment_method as contract_payment_method,
      c.finance_plan_json as contract_finance_plan_json,
      c.status as contract_status,
      c.signed_by_buyer_at as contract_signed_by_buyer_at,
      c.signed_by_dealer_at as contract_signed_by_dealer_at,
      c.created_at as contract_created_at,
      cb.id as contract_buyer_id, cb.username as contract_buyer_username,
      cb.name as contract_buyer_name, cb.role as contract_buyer_role,
      cb.phone as contract_buyer_phone, cb.email as contract_buyer_email,
      cb.status as contract_buyer_status, cb.created_at as contract_buyer_created_at,
      cd.id as contract_dealer_id, cd.username as contract_dealer_username,
      cd.name as contract_dealer_name, cd.role as contract_dealer_role,
      cd.phone as contract_dealer_phone, cd.email as contract_dealer_email,
      cd.status as contract_dealer_status, cd.created_at as contract_dealer_created_at,
      cdeps.id as contract_deposit_id, cdeps.car_id as contract_deposit_car_id,
      cdeps.buyer_id as contract_deposit_buyer_id,
      cdeps.amount as contract_deposit_amount,
      cdeps.payment_method as contract_deposit_payment_method,
      cdeps.transaction_id as contract_deposit_transaction_id,
      cdeps.paid_at as contract_deposit_paid_at,
      cdeps.status as contract_deposit_status,
      cdeps.refund_reason as contract_deposit_refund_reason,
      cdeps.refund_approved_by as contract_deposit_refund_approved_by,
      cdeps.refund_approved_at as contract_deposit_refund_approved_at,
      cdeps.release_type as contract_deposit_release_type,
      cdeps.settlement_id as contract_deposit_settlement_id,
      cdeps.created_at as contract_deposit_created_at,
      car.id as car_id, car.vin as car_vin, car.brand as car_brand,
      car.model as car_model, car.year as car_year, car.month as car_month,
      car.mileage as car_mileage, car.color as car_color, car.price as car_price,
      car.original_price as car_original_price,
      car.configuration as car_configuration,
      car.images_json as car_images_json, car.documents_json as car_documents_json,
      car.dealer_id as car_dealer_id, car.status as car_status,
      car.created_at as car_created_at, car.updated_at as car_updated_at,
      r.id as reviewer_id, r.username as reviewer_username,
      r.name as reviewer_name, r.role as reviewer_role,
      r.phone as reviewer_phone, r.email as reviewer_email,
      r.status as reviewer_status, r.created_at as reviewer_created_at
    FROM transfers t
    LEFT JOIN contracts c ON t.contract_id = c.id
    LEFT JOIN users cb ON c.buyer_id = cb.id
    LEFT JOIN users cd ON c.dealer_id = cd.id
    LEFT JOIN deposits cdeps ON c.deposit_id = cdeps.id
    LEFT JOIN cars car ON t.car_id = car.id
    LEFT JOIN users r ON t.reviewer_id = r.id
    WHERE t.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], TRANSFER_JSON_FIELDS);
  if (!row) return null;

  return buildTransferWithRelations(row);
}

export async function createTransfer(
  data: Partial<Transfer> & { contractId: number; carId: number }
): Promise<Transfer> {
  const contract = get<{ id: number; status: string; car_id: number }>(
    'SELECT id, status, car_id FROM contracts WHERE id = ?',
    [data.contractId]
  );

  if (!contract) {
    throw new Error('合同不存在');
  }

  if (contract.status !== 'signed' && contract.status !== 'paid') {
    throw new Error('合同状态不正确，无法创建过户申请');
  }

  if (contract.car_id !== data.carId) {
    throw new Error('合同车辆ID不匹配');
  }

  const existingTransfer = get<{ id: number }>(
    'SELECT id FROM transfers WHERE contract_id = ? AND status NOT IN (?, ?)',
    [data.contractId, 'completed', 'rejected']
  );

  if (existingTransfer) {
    throw new Error('该合同已有有效过户申请');
  }

  const sql = `
    INSERT INTO transfers (
      contract_id, car_id, documents_json, status
    ) VALUES (?, ?, ?, ?)
  `;

  const result = run(sql, [
    data.contractId,
    data.carId,
    JSON.stringify(data.documents || []),
    'pending'
  ]);

  const transferId = result.lastInsertRowid as number;

  const transfer = await getTransferById(transferId);
  if (!transfer) {
    throw new Error('创建过户申请失败');
  }

  return transfer;
}

export async function submitTransfer(
  id: number,
  documents: TransferDocument[],
  operatorId: number
): Promise<Transfer> {
  const existing = get<{ id: number; status: Transfer['status']; car_id: number }>(
    'SELECT id, status, car_id FROM transfers WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('过户申请不存在');
  }

  if (existing.status !== 'pending' && existing.status !== 'submitted') {
    throw new Error('过户申请状态不正确，无法提交资料');
  }

  if (!documents || documents.length === 0) {
    throw new Error('请上传过户资料');
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE transfers SET documents_json = ?, status = ? WHERE id = ?',
      [JSON.stringify(documents), 'reviewing', id]
    );

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      ['locked', existing.car_id]
    );
  });

  transaction();

  const transfer = await getTransferById(id);
  if (!transfer) {
    throw new Error('提交过户资料失败');
  }

  return transfer;
}

export async function reviewTransfer(
  id: number,
  approved: boolean,
  comment: string,
  reviewerId: number
): Promise<Transfer> {
  const existing = get<{ id: number; status: Transfer['status']; car_id: number; contract_id: number }>(
    'SELECT id, status, car_id, contract_id FROM transfers WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('过户申请不存在');
  }

  if (existing.status !== 'reviewing') {
    throw new Error('过户申请状态不正确，无法审核');
  }

  const newStatus = approved ? 'approved' : 'rejected';

  if (!isValidStatusTransition(existing.status, newStatus)) {
    throw new Error(`不允许从${existing.status}变更为${newStatus}`);
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE transfers SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, reviewerId, comment, id]
    );

    if (approved) {
      run(
        'UPDATE cars SET status = ? WHERE id = ?',
        ['sold', existing.car_id]
      );

      run(
        'INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
        [existing.car_id, 'locked', 'sold', reviewerId, '过户审核通过，车辆已售出']
      );
    } else {
      run(
        'UPDATE cars SET status = ? WHERE id = ?',
        ['locked', existing.car_id]
      );
    }
  });

  transaction();

  const transfer = await getTransferById(id);
  if (!transfer) {
    throw new Error('审核过户资料失败');
  }

  return transfer;
}

export async function completeTransfer(
  id: number,
  operatorId: number
): Promise<Transfer> {
  const existing = get<{ id: number; status: Transfer['status']; car_id: number; contract_id: number; deposit_id: number | null }>(
    `SELECT t.id, t.status, t.car_id, t.contract_id, c.deposit_id
     FROM transfers t
     LEFT JOIN contracts c ON t.contract_id = c.id
     WHERE t.id = ?`,
    [id]
  );

  if (!existing) {
    throw new Error('过户申请不存在');
  }

  if (existing.status !== 'approved') {
    throw new Error('过户申请状态不正确，无法完成');
  }

  if (!isValidStatusTransition(existing.status, 'completed')) {
    throw new Error(`不允许从${existing.status}变更为completed`);
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE transfers SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', id]
    );

    run(
      'UPDATE cars SET status = ? WHERE id = ?',
      ['sold', existing.car_id]
    );

    run(
      'INSERT INTO status_history (car_id, from_status, to_status, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
      [existing.car_id, 'sold', 'sold', operatorId, '过户已完成']
    );

    if (existing.deposit_id) {
      run(
        'UPDATE deposits SET status = ?, release_type = ? WHERE id = ?',
        ['released_to_seller', 'to_seller', existing.deposit_id]
      );
    }

    run(
      'UPDATE contracts SET status = ? WHERE id = ?',
      ['completed', existing.contract_id]
    );
  });

  transaction();

  const transfer = await getTransferById(id);
  if (!transfer) {
    throw new Error('确认过户完成失败');
  }

  return transfer;
}
