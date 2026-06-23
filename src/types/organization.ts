export type OrgLevel = 'province' | 'city' | 'team';

export interface Organization {
  id: string;
  name: string;
  code: string;
  level: OrgLevel;
  parentId: string | null;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  sort: number;
  status: 'active' | 'inactive';
  syncStatus: 'synced' | 'syncing' | 'failed';
  lastSyncTime: string;
  children?: Organization[];
}

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  position: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  orgLevel: OrgLevel;
  isLeader: boolean;
  status: 'on' | 'off' | 'busy';
  workNo: string;
}

export interface OrgSyncRecord {
  id: string;
  syncTime: string;
  syncType: 'full' | 'incremental';
  status: 'success' | 'failed';
  addCount: number;
  updateCount: number;
  deleteCount: number;
  operator: string;
  remark: string;
}
