const prefixMap: Record<string, string> = {
  purchaseOrder: 'PO',
  salesOrder: 'SO',
  stockIn: 'IN',
  stockOut: 'OUT',
  productionPlan: 'PP',
  purchaseSettlement: 'PS',
  accountPayable: 'AP',
  accountReceivable: 'AR',
  qualityInspection: 'QI',
};

export function generateOrderNo(type: string): string {
  const prefix = prefixMap[type] || 'NO';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}${month}${day}${random}`;
}
