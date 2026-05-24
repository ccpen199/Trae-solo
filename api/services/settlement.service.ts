import db, { run, get, query } from '../config/database.js';
import type { Settlement, SettlementFee, Contract, Car, User } from '../types/index.js';

const SETTLEMENT_JSON_FIELDS = ['other_fees_json'];

const VALID_STATUS_TRANSITIONS: Record<Settlement['status'], Settlement['status'][]> = {
  pending: ['settled', 'reconciled', 'invoiced'],
  settled: ['reconciled', 'invoiced'],
  reconciled: ['invoiced'],
  invoiced: []
};

const PLATFORM_FEE_RATE = 0.03;
const INSPECTION_FEE = 300;
const TRANSFER_FEE = 500;

function mapSettlementRow(row: Record<string, unknown>): Settlement {
  return {
    id: row.id as number,
    contractId: row.contract_id as number,
    carId: row.car_id as number,
    dealerId: row.dealer_id as number,
    totalAmount: row.total_amount as number,
    platformFee: row.platform_fee as number,
    feeRate: row.fee_rate as number,
    otherFees: (row.other_fees_json as SettlementFee[]) || [],
    amountToDealer: row.amount_to_dealer as number,
    status: row.status as Settlement['status'],
    settledAt: row.settled_at as string | undefined,
    reconciledAt: row.reconciled_at as string | undefined,
    invoicedAt: row.invoiced_at as string | undefined,
    invoiceNumber: row.invoice_number as string | undefined,
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

function isValidStatusTransition(from: Settlement['status'], to: Settlement['status']): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

function calculateOtherFees(): SettlementFee[] {
  return [
    { type: 'inspection', name: '检测费', amount: INSPECTION_FEE },
    { type: 'transfer', name: '过户费', amount: TRANSFER_FEE }
  ];
}

function calculateSettlementAmounts(
  totalAmount: number,
  feeRate: number,
  otherFees: SettlementFee[]
): {
  platformFee: number;
  totalOtherFees: number;
  amountToDealer: number;
} {
  const platformFee = Math.round(totalAmount * feeRate * 100) / 100;
  const totalOtherFees = otherFees.reduce((sum, fee) => sum + fee.amount, 0);
  const amountToDealer = Math.round((totalAmount - platformFee - totalOtherFees) * 100) / 100;

  return {
    platformFee,
    totalOtherFees,
    amountToDealer
  };
}

function buildSettlementWithRelations(row: Record<string, unknown>): Settlement {
  const settlement = mapSettlementRow(row);

  if (row.contract_id) {
    settlement.contract = mapContractRow({
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
      settlement.contract.buyer = mapUserRow({
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
  }

  if (row.car_id) {
    settlement.car = mapCarRow({
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

  if (row.dealer_id) {
    settlement.dealer = mapUserRow({
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

  return settlement;
}

export async function getSettlements(filters?: { dealerId?: number; status?: string }): Promise<Settlement[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.dealerId !== undefined) {
    conditions.push('s.dealer_id = ?');
    params.push(filters.dealerId);
  }

  if (filters?.status !== undefined) {
    conditions.push('s.status = ?');
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      s.id, s.contract_id, s.car_id, s.dealer_id,
      s.total_amount, s.platform_fee, s.fee_rate,
      s.other_fees_json, s.amount_to_dealer,
      s.status, s.settled_at, s.reconciled_at,
      s.invoiced_at, s.invoice_number, s.created_at,
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
      car.id as car_id, car.vin as car_vin, car.brand as car_brand,
      car.model as car_model, car.year as car_year, car.month as car_month,
      car.mileage as car_mileage, car.color as car_color, car.price as car_price,
      car.original_price as car_original_price,
      car.configuration as car_configuration,
      car.images_json as car_images_json, car.documents_json as car_documents_json,
      car.dealer_id as car_dealer_id, car.status as car_status,
      car.created_at as car_created_at, car.updated_at as car_updated_at,
      d.id as dealer_id, d.username as dealer_username,
      d.name as dealer_name, d.role as dealer_role,
      d.phone as dealer_phone, d.email as dealer_email,
      d.status as dealer_status, d.created_at as dealer_created_at
    FROM settlements s
    LEFT JOIN contracts c ON s.contract_id = c.id
    LEFT JOIN users cb ON c.buyer_id = cb.id
    LEFT JOIN cars car ON s.car_id = car.id
    LEFT JOIN users d ON s.dealer_id = d.id
    ${whereClause}
    ORDER BY s.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, SETTLEMENT_JSON_FIELDS);
  return rows.map(row => buildSettlementWithRelations(row));
}

export async function getSettlementById(id: number): Promise<Settlement | null> {
  const sql = `
    SELECT 
      s.id, s.contract_id, s.car_id, s.dealer_id,
      s.total_amount, s.platform_fee, s.fee_rate,
      s.other_fees_json, s.amount_to_dealer,
      s.status, s.settled_at, s.reconciled_at,
      s.invoiced_at, s.invoice_number, s.created_at,
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
      car.id as car_id, car.vin as car_vin, car.brand as car_brand,
      car.model as car_model, car.year as car_year, car.month as car_month,
      car.mileage as car_mileage, car.color as car_color, car.price as car_price,
      car.original_price as car_original_price,
      car.configuration as car_configuration,
      car.images_json as car_images_json, car.documents_json as car_documents_json,
      car.dealer_id as car_dealer_id, car.status as car_status,
      car.created_at as car_created_at, car.updated_at as car_updated_at,
      d.id as dealer_id, d.username as dealer_username,
      d.name as dealer_name, d.role as dealer_role,
      d.phone as dealer_phone, d.email as dealer_email,
      d.status as dealer_status, d.created_at as dealer_created_at
    FROM settlements s
    LEFT JOIN contracts c ON s.contract_id = c.id
    LEFT JOIN users cb ON c.buyer_id = cb.id
    LEFT JOIN cars car ON s.car_id = car.id
    LEFT JOIN users d ON s.dealer_id = d.id
    WHERE s.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], SETTLEMENT_JSON_FIELDS);
  if (!row) return null;

  return buildSettlementWithRelations(row);
}

export async function createSettlement(
  contractId: number,
  operatorId: number
): Promise<Settlement> {
  const contract = get<{
    id: number;
    car_id: number;
    dealer_id: number;
    total_price: number;
    status: string;
  }>(
    'SELECT id, car_id, dealer_id, total_price, status FROM contracts WHERE id = ?',
    [contractId]
  );

  if (!contract) {
    throw new Error('合同不存在');
  }

  if (contract.status !== 'paid' && contract.status !== 'completed') {
    throw new Error('合同状态不正确，无法创建结算单');
  }

  const existingSettlement = get<{ id: number }>(
    'SELECT id FROM settlements WHERE contract_id = ?',
    [contractId]
  );

  if (existingSettlement) {
    throw new Error('该合同已有结算单');
  }

  const otherFees = calculateOtherFees();
  const { platformFee, amountToDealer } = calculateSettlementAmounts(
    contract.total_price,
    PLATFORM_FEE_RATE,
    otherFees
  );

  const transaction = db.transaction(() => {
    const insertResult = run(
      `INSERT INTO settlements (
        contract_id, car_id, dealer_id, total_amount,
        platform_fee, fee_rate, other_fees_json,
        amount_to_dealer, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractId,
        contract.car_id,
        contract.dealer_id,
        contract.total_price,
        platformFee,
        PLATFORM_FEE_RATE,
        JSON.stringify(otherFees),
        amountToDealer,
        'pending'
      ]
    );

    const settlementId = insertResult.lastInsertRowid as number;

    run(
      'UPDATE deposits SET settlement_id = ? WHERE contract_id = ?',
      [settlementId, contractId]
    );

    return settlementId;
  });

  const settlementId = transaction();

  const settlement = await getSettlementById(settlementId);
  if (!settlement) {
    throw new Error('创建结算单失败');
  }

  return settlement;
}

export async function markSettled(
  id: number,
  operatorId: number
): Promise<Settlement> {
  const existing = get<{ id: number; status: Settlement['status'] }>(
    'SELECT id, status FROM settlements WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('结算单不存在');
  }

  if (!isValidStatusTransition(existing.status, 'settled')) {
    throw new Error(`不允许从${existing.status}变更为settled`);
  }

  run(
    'UPDATE settlements SET status = ?, settled_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['settled', id]
  );

  const settlement = await getSettlementById(id);
  if (!settlement) {
    throw new Error('标记已结算失败');
  }

  return settlement;
}

export async function markReconciled(
  id: number,
  operatorId: number
): Promise<Settlement> {
  const existing = get<{ id: number; status: Settlement['status'] }>(
    'SELECT id, status FROM settlements WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('结算单不存在');
  }

  if (!isValidStatusTransition(existing.status, 'reconciled')) {
    throw new Error(`不允许从${existing.status}变更为reconciled`);
  }

  run(
    'UPDATE settlements SET status = ?, reconciled_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['reconciled', id]
  );

  const settlement = await getSettlementById(id);
  if (!settlement) {
    throw new Error('标记已对账失败');
  }

  return settlement;
}

export async function markInvoiced(
  id: number,
  invoiceNumber: string,
  operatorId: number
): Promise<Settlement> {
  const existing = get<{ id: number; status: Settlement['status'] }>(
    'SELECT id, status FROM settlements WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('结算单不存在');
  }

  if (!invoiceNumber || invoiceNumber.trim().length === 0) {
    throw new Error('发票号不能为空');
  }

  if (!isValidStatusTransition(existing.status, 'invoiced')) {
    throw new Error(`不允许从${existing.status}变更为invoiced`);
  }

  run(
    'UPDATE settlements SET status = ?, invoiced_at = CURRENT_TIMESTAMP, invoice_number = ? WHERE id = ?',
    ['invoiced', invoiceNumber, id]
  );

  const settlement = await getSettlementById(id);
  if (!settlement) {
    throw new Error('标记已开票失败');
  }

  return settlement;
}
