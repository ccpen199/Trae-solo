import db from '../db/index.js';
import { CalculationResult, ItemCalculationResult } from '../services/taxCalculator.js';

export interface CalculationRecord {
  id?: number;
  order_id: string;
  country_code: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  insurance_fee: number;
  total_customs_value: number;
  duty_amount: number;
  vat_amount: number;
  excise_amount: number;
  platform_withholding: number;
  total_tax: number;
  calculation_details: string;
  created_at?: string;
  created_by?: string;
  status?: string;
}

export interface CalculationItemRecord {
  id?: number;
  calculation_id: number;
  line_number: number;
  product_name: string;
  hs_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  customs_value: number;
  duty_rate?: number;
  duty_amount?: number;
  vat_rate?: number;
  vat_amount?: number;
  excise_rate?: number;
  excise_amount?: number;
  calculation_details?: string;
}

export function saveCalculationResult(
  result: CalculationResult,
  createdBy?: string
): number {
  const insertRecord = db.prepare(`
    INSERT INTO calculation_records (
      order_id, country_code, currency, exchange_rate, subtotal, discount,
      shipping_fee, insurance_fee, total_customs_value, duty_amount, vat_amount,
      excise_amount, platform_withholding, total_tax, calculation_details, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO calculation_items (
      calculation_id, line_number, product_name, hs_code, quantity, unit_price,
      discount, customs_value, duty_rate, duty_amount, vat_rate, vat_amount,
      excise_rate, excise_amount, calculation_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertResult = insertRecord.run(
    result.orderId,
    result.countryCode,
    result.currency,
    result.exchangeRate,
    result.subtotal,
    result.discount,
    result.shippingFee,
    result.insuranceFee,
    result.totalCustomsValue,
    result.dutyAmount,
    result.vatAmount,
    result.exciseAmount,
    result.platformWithholding,
    result.totalTax,
    result.calculationDetails,
    createdBy || null
  );

  const calculationId = Number(insertResult.lastInsertRowid);

  for (const item of result.items) {
    insertItem.run(
      calculationId,
      item.lineNumber,
      item.productName,
      item.hsCode,
      item.quantity,
      item.unitPrice,
      item.discount,
      item.customsValue,
      item.dutyRate,
      item.dutyAmount,
      item.vatRate,
      item.vatAmount,
      item.exciseRate,
      item.exciseAmount,
      item.calculationDetails
    );
  }

  return calculationId;
}

export function getCalculationById(id: number): (CalculationRecord & { items: ItemCalculationResult[] }) | undefined {
  const record = db.prepare('SELECT * FROM calculation_records WHERE id = ?').get(id) as CalculationRecord | undefined;
  
  if (!record) return undefined;

  const items = db.prepare('SELECT * FROM calculation_items WHERE calculation_id = ? ORDER BY line_number').all(id) as ItemCalculationResult[];

  return {
    ...record,
    items,
  };
}

export function getCalculationByOrderId(orderId: string): (CalculationRecord & { items: ItemCalculationResult[] }) | undefined {
  const record = db.prepare('SELECT * FROM calculation_records WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(orderId) as CalculationRecord | undefined;
  
  if (!record) return undefined;

  const items = db.prepare('SELECT * FROM calculation_items WHERE calculation_id = ? ORDER BY line_number').all(Number(record.id)) as ItemCalculationResult[];

  return {
    ...record,
    items,
  };
}

export function getAllCalculations(limit: number = 100): CalculationRecord[] {
  return db.prepare('SELECT * FROM calculation_records ORDER BY created_at DESC LIMIT ?').all(limit) as CalculationRecord[];
}
