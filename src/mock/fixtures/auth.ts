import type { User } from '@/types/auth';

export const mockUser: User = {
  id: 'owner_001',
  role: 'owner',
  phone: '13800138000',
  nickname: '张小花的铲屎官',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner001',
  createdAt: '2024-01-15T08:00:00Z',
};

export const mockStoreUser: User = {
  id: 'store_001',
  role: 'store_admin',
  phone: '13900139000',
  nickname: '爱宠屋店长',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=store001',
  storeId: 'store_001',
  createdAt: '2023-06-01T08:00:00Z',
};

export const mockVeterinarian: User = {
  id: 'vet_001',
  role: 'veterinarian',
  phone: '13700137000',
  nickname: '李兽医',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vet001',
  veterinarianId: 'vet_001',
  licenseNo: 'VET20230001',
  createdAt: '2023-01-01T08:00:00Z',
};
