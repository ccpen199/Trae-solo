import client from './client';

export function getRedPackets(params?: Record<string, any>) {
  return client.get('/redpackets', { params });
}

export function getWallet() {
  return client.get('/redpackets/wallet');
}

export function getTransactions(params?: Record<string, any>) {
  return client.get('/redpackets/transactions', { params });
}

export function withdraw(data: Record<string, any>) {
  return client.post('/redpackets/withdraw', data);
}

export function signIn() {
  return client.post('/redpackets/sign-in');
}

export function getTasks() {
  return client.get('/redpackets/tasks');
}

export function getTaskRecords() {
  return client.get('/redpackets/task-records');
}
