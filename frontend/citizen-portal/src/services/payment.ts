import request from './request';

export interface Bill {
  id: string;
  type: 'water' | 'electricity' | 'gas' | 'heating';
  accountNo: string;
  amount: number;
  period: string;
  status: 'unpaid' | 'paid';
  dueDate: string;
}

export function queryBills(type: string, accountNo: string) {
  return request.get<unknown, Bill[]>('/payment/bills', {
    params: { type, accountNo },
  });
}

export function payBill(billId: string, paymentMethod: string) {
  return request.post('/payment/pay', { billId, paymentMethod });
}

export function getPaymentRecords(params?: { page?: number; size?: number }) {
  return request.get('/payment/records', { params });
}

export function bindAccount(type: string, accountNo: string, name: string) {
  return request.post('/payment/accounts/bind', { type, accountNo, name });
}

export function getBoundAccounts() {
  return request.get('/payment/accounts');
}
