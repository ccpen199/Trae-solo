import { v4 as uuidv4 } from 'uuid';
import { dbQueries, type Waybill, type Order } from '../db/database.js';

export interface CreateWaybillParams {
  order_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  goods_description: string;
  goods_weight: number;
  total_amount: number;
  tax_rate?: number;
}

export interface WaybillExportData {
  waybill_no: string;
  order_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  goods_description: string;
  goods_weight: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
}

const TAX_RATE = 0.06;

function generateWaybillNo(): string {
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `WB${datePart}${random}`;
}

function calculateTax(amount: number, rate: number = TAX_RATE): number {
  const preTax = amount / (1 + rate);
  return Math.round((amount - preTax) * 100) / 100;
}

export function createWaybill(params: CreateWaybillParams): Waybill {
  const now = new Date().toISOString();
  const taxRate = params.tax_rate ?? TAX_RATE;
  const taxAmount = calculateTax(params.total_amount, taxRate);

  const waybill: Waybill = {
    id: uuidv4(),
    order_id: params.order_id,
    waybill_no: generateWaybillNo(),
    sender_name: params.sender_name,
    sender_phone: params.sender_phone,
    sender_address: params.sender_address,
    receiver_name: params.receiver_name,
    receiver_phone: params.receiver_phone,
    receiver_address: params.receiver_address,
    goods_description: params.goods_description,
    goods_weight: params.goods_weight,
    tax_amount: taxAmount,
    tax_rate: taxRate,
    total_amount: params.total_amount,
    status: 'generated',
    pdf_url: `/waybills/${generateWaybillNo()}.pdf`,
    created_at: now,
    exported: false,
  };

  dbQueries.waybills.create().run({
    ...waybill,
    exported: waybill.exported ? 1 : 0,
  });

  return waybill;
}

export function createWaybillFromOrder(
  order: Order,
  senderInfo: { name: string; phone: string },
  receiverInfo: { name: string; phone: string },
): Waybill {
  return createWaybill({
    order_id: order.id,
    sender_name: senderInfo.name,
    sender_phone: senderInfo.phone,
    sender_address: order.pickup_address,
    receiver_name: receiverInfo.name,
    receiver_phone: receiverInfo.phone,
    receiver_address: order.delivery_address,
    goods_description: order.goods_type,
    goods_weight: order.goods_weight,
    total_amount: order.actual_price ?? order.estimated_price,
  });
}

export function getWaybillById(id: string): Waybill | null {
  const result = dbQueries.waybills.findById().get(id) as (Waybill & { exported: number | boolean }) | undefined;
  if (!result) return null;
  return { ...result, exported: Boolean(result.exported) };
}

export function getWaybillByOrderId(orderId: string): Waybill | null {
  const result = dbQueries.waybills.findByOrderId().get(orderId) as (Waybill & { exported: number | boolean }) | undefined;
  if (!result) return null;
  return { ...result, exported: Boolean(result.exported) };
}

export function getWaybillByNo(waybillNo: string): Waybill | null {
  const result = dbQueries.waybills.findByWaybillNo().get(waybillNo) as (Waybill & { exported: number | boolean }) | undefined;
  if (!result) return null;
  return { ...result, exported: Boolean(result.exported) };
}

export function getAllWaybills(): Waybill[] {
  const results = dbQueries.waybills.findAll().all() as Array<Waybill & { exported: number | boolean }>;
  return results.map((w) => ({ ...w, exported: Boolean(w.exported) }));
}

export function getPendingExportWaybills(): Waybill[] {
  const results = dbQueries.waybills.findPendingExport().all() as Array<Waybill & { exported: number | boolean }>;
  return results.map((w) => ({ ...w, exported: Boolean(w.exported) }));
}

export function markWaybillExported(id: string): Waybill | null {
  const existing = getWaybillById(id);
  if (!existing) return null;

  dbQueries.waybills.markExported().run(id);
  return getWaybillById(id);
}

export function prepareExportData(waybills: Waybill[]): WaybillExportData[] {
  return waybills.map((w) => ({
    waybill_no: w.waybill_no,
    order_id: w.order_id,
    sender_name: w.sender_name,
    sender_phone: w.sender_phone,
    sender_address: w.sender_address,
    receiver_name: w.receiver_name,
    receiver_phone: w.receiver_phone,
    receiver_address: w.receiver_address,
    goods_description: w.goods_description,
    goods_weight: w.goods_weight,
    tax_amount: w.tax_amount,
    total_amount: w.total_amount,
    created_at: w.created_at,
  }));
}

export function generateCSVExport(waybills: Waybill[]): string {
  const data = prepareExportData(waybills);
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerLine = headers.join(',');

  const dataLines = data.map((row) =>
    headers.map((h) => {
      const value = row[h as keyof WaybillExportData];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(','),
  );

  return [headerLine, ...dataLines].join('\n');
}

export function batchMarkExported(ids: string[]): number {
  let count = 0;
  for (const id of ids) {
    if (markWaybillExported(id)) {
      count++;
    }
  }
  return count;
}
