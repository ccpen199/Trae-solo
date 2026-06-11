import request from './request';

export interface GovCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface GovItem {
  id: string;
  name: string;
  department: string;
  category: string;
  online: boolean;
}

export function getCategories() {
  return request.get<unknown, GovCategory[]>('/government/categories');
}

export function searchItems(keyword: string, categoryId?: string) {
  return request.get<unknown, GovItem[]>('/government/items', {
    params: { keyword, categoryId },
  });
}

export function getItemDetail(id: string) {
  return request.get(`/government/items/${id}`);
}

export function applyItem(id: string, formData: Record<string, unknown>) {
  return request.post(`/government/items/${id}/apply`, formData);
}

export function getMyApplications() {
  return request.get('/government/my-applications');
}
