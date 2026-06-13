import type { User, UserRole } from "@/types";
import { mockUsers } from "@/mock";

const STORAGE_KEY = "syt_auth_user";

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function login(username: string, _password: string): User | null {
  const found = mockUsers.find(
    (u) => u.username === username.trim().toLowerCase()
  );
  if (found) {
    setCurrentUser(found);
    return found;
  }
  return null;
}

export function logout(): void {
  clearCurrentUser();
}

export function hasPermission(user: User | null, perm: string): boolean {
  if (!user) return false;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(perm);
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "courier":
      return "快递员";
    case "branch_admin":
      return "网点管理员";
    case "regional_supervisor":
      return "区域主管";
  }
}

export const roleAccounts: {
  role: UserRole;
  label: string;
  desc: string;
  accounts: string[];
  features: string[];
}[] = [
  {
    role: "branch_admin",
    label: "网点管理员",
    desc: "负责网点整体运营管理",
    accounts: ["admin"],
    features: [
      "全部揽收作业功能",
      "客户关系与协议管理",
      "经营数据看板分析",
      "员工分账与对账",
      "面单模板与打印配置",
      "操作日志与合规设置",
    ],
  },
  {
    role: "courier",
    label: "快递员",
    desc: "一线揽收派送作业人员",
    accounts: ["courier1", "courier2"],
    features: [
      "上门揽收作业",
      "面单云打印",
      "OCR 智能录单",
      "物流轨迹查询",
      "客户绑定与查看",
      "个人业绩统计",
    ],
  },
  {
    role: "regional_supervisor",
    label: "区域主管",
    desc: "跨网点经营分析与合规审计",
    accounts: ["super"],
    features: [
      "多网点经营对比",
      "区域热力分布分析",
      "客户留存全局分析",
      "操作审计日志查询",
      "数据合规策略配置",
      "面单耗材总览",
    ],
  },
];
