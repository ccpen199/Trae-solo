export interface User {
  id: string;
  phone: string;
  nickname: string;
  inviteCode: string;
  force: number;
  blackDiamond: number;
  blockchainAddress: string;
  lastCheckinDate?: string;
  lastDiamondClaimDate?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, code: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  handleLoginSuccess: (token: string, user: User) => void;
  isAuthenticated: boolean;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  force: number;
  type: string;
  icon?: string;
}

export interface ForceTask {
  id: string;
  task_type: string;
  task_name: string;
  force_value: number;
  completed_at: string;
}

export interface DiamondRecord {
  id: string;
  amount: number;
  source: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  tx_type: string;
  amount: number;
  from_address?: string;
  to_address?: string;
  tx_hash?: string;
  status: string;
  created_at: string;
}

export interface PassportCategory {
  id: string;
  category: string;
  data_points: number;
  value_score: number;
  last_updated: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  banner?: string;
  status: string;
}
