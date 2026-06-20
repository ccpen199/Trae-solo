import type { ApiResponse, PageResult, PageParams } from '@/types/api';
import type { Bill } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockBills } from '@/mocks/data/payment';

export interface BillListParams extends PageParams {
  type?: string;
  status?: string;
  keyword?: string;
}

export const getBillList = async (
  params?: BillListParams
): Promise<ApiResponse<PageResult<Bill>>> => {
  await mockDelay();

  let list = [...mockBills];

  if (params?.type) {
    list = list.filter((b) => b.type === params.type);
  }
  if (params?.status) {
    list = list.filter((b) => b.status === params.status);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (b) =>
        b.billNo.toLowerCase().includes(kw) ||
        b.userName.toLowerCase().includes(kw) ||
        b.roomNumber.toLowerCase().includes(kw)
    );
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return mockSuccess({
    list: paginatedList,
    total,
    page,
    pageSize,
    totalPages,
  });
};

export const getBillDetail = async (id: string): Promise<ApiResponse<Bill | null>> => {
  await mockDelay();
  const bill = mockBills.find((b) => b.id === id) || null;
  return mockSuccess(bill);
};

export const payBill = async (id: string, amount: number): Promise<ApiResponse<Bill>> => {
  await mockDelay();

  const bill = mockBills.find((b) => b.id === id);
  if (bill) {
    bill.paidAmount += amount;
    if (bill.paidAmount >= bill.amount) {
      bill.status = 'PAID';
      bill.paidAmount = bill.amount;
    } else {
      bill.status = 'PARTIAL_PAID';
    }
    bill.paidAt = new Date().toISOString();
    bill.updatedAt = new Date().toISOString();
  }

  return mockSuccess(bill || ({} as Bill));
};
