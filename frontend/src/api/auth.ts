import api from './index';
import type { User, DemoAccount } from '@/types';

interface RegisterData {
  username?: string;
  phone?: string;
  password: string;
  role: string;
  nickname?: string;
  identity_tags?: string[];
  skill_certs?: string[];
  employer_type?: string;
  employer_name?: string;
  business_license?: string;
  university_name?: string;
}

interface AuthResult {
  token: string;
  user: User;
}

export function register(data: RegisterData): Promise<AuthResult> {
  return api.post('/auth/register', data).then(res => res.data.data);
}

export function login(account: string, password: string): Promise<AuthResult> {
  return api.post('/auth/login', { account, password }).then(res => res.data.data);
}

export function getProfile(): Promise<User> {
  return api.get('/auth/me').then(res => res.data.data);
}

export function updateProfile(data: Partial<Pick<User, 'nickname' | 'avatar' | 'identity_tags' | 'skill_certs' | 'employer_type' | 'employer_name'>>): Promise<User> {
  return api.put('/auth/profile', data).then(res => res.data.data);
}

export function getDemoAccounts(): Promise<DemoAccount[]> {
  return api.get('/auth/demo-accounts').then(res => res.data.data);
}
