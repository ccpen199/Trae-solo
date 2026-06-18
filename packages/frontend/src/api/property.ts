import client from './client';

export function requestDoorOpen(deviceId: string) {
  return client.post('/property/access-control/open', { deviceId });
}

export function getBills(params?: Record<string, any>) {
  return client.get('/property/bills', { params });
}

export function payBill(id: string) {
  return client.post(`/property/bills/${id}/pay`);
}

export function submitRepair(data: Record<string, any>) {
  return client.post('/property/repairs', data);
}

export function getRepairs(params?: Record<string, any>) {
  return client.get('/property/repairs', { params });
}

export function rateRepair(id: string, data: Record<string, any>) {
  return client.post(`/property/repairs/${id}/rate`, data);
}

export function submitComplaint(data: Record<string, any>) {
  return client.post('/property/complaints', data);
}

export function getComplaints(params?: Record<string, any>) {
  return client.get('/property/complaints', { params });
}

export function getNotifications(params?: Record<string, any>) {
  return client.get('/property/notifications', { params });
}

export function callGateway(serviceType: string, data?: Record<string, any>) {
  return client.post('/property/gateway', { serviceType, ...data });
}
