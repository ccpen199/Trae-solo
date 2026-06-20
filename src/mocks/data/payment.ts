import type { Bill, BillType, BillStatus } from '@/types/entity';

const now = new Date().toISOString();

const billTypes: BillType[] = ['PROPERTY_FEE', 'WATER_FEE', 'ELECTRICITY_FEE', 'PARKING_FEE', 'GAS_FEE'];
const billStatuses: BillStatus[] = ['UNPAID', 'PAID', 'OVERDUE', 'PARTIAL_PAID'];

const residentUsers = [
  { id: 'user_res_001', name: '张三', roomId: 'room_yangguang_1_1_1001', roomNumber: '1001' },
  { id: 'user_res_002', name: '李四', roomId: 'room_yangguang_1_1_1002', roomNumber: '1002' },
  { id: 'user_res_003', name: '王五', roomId: 'room_yangguang_2_1_301', roomNumber: '301' },
  { id: 'user_res_004', name: '赵六', roomId: 'room_cuihu_1_1_501', roomNumber: '501' },
  { id: 'user_res_005', name: '孙七', roomId: 'room_cuihu_2_2_802', roomNumber: '802' },
];

const amountMap: Record<BillType, number> = {
  PROPERTY_FEE: 350,
  WATER_FEE: 80,
  ELECTRICITY_FEE: 200,
  PARKING_FEE: 150,
  GAS_FEE: 120,
  OTHER: 50,
};

export const mockBills: Bill[] = [];

let billId = 1;
residentUsers.forEach((user, userIdx) => {
  const billCount = 5 + (userIdx % 3);
  for (let i = 0; i < billCount; i++) {
    const type = billTypes[i % billTypes.length];
    const statusIdx = i % billStatuses.length;
    const status = billStatuses[statusIdx];
    const baseAmount = amountMap[type];
    const amount = baseAmount + Math.floor(Math.random() * 50);
    const paidAmount = status === 'PAID' ? amount : status === 'PARTIAL_PAID' ? Math.floor(amount * 0.5) : 0;

    const billingMonth = 1 + ((i + userIdx) % 6);
    const billingYear = new Date().getFullYear();
    const billingPeriod = `${billingYear}-${String(billingMonth).padStart(2, '0')}`;
    const dueDate = new Date(billingYear, billingMonth, 15);
    const paidAt = status === 'PAID' || status === 'PARTIAL_PAID'
      ? new Date(billingYear, billingMonth - 1, 20).toISOString()
      : undefined;

    mockBills.push({
      id: `bill_${billId.toString().padStart(3, '0')}`,
      billNo: `BL${billingYear}${String(billId).padStart(8, '0')}`,
      userId: user.id,
      userName: user.name,
      roomId: user.roomId,
      roomNumber: user.roomNumber,
      type,
      amount,
      paidAmount,
      status,
      billingPeriod,
      dueDate: dueDate.toISOString(),
      paidAt,
      createdAt: new Date(billingYear, billingMonth - 1, 1).toISOString(),
      updatedAt: now,
    });
    billId++;
  }
});
