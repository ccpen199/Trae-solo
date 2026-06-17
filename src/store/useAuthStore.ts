import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@shared/types';

interface OriginalCredentials {
  phone: string;
  password: string;
  role: UserRole;
}

export interface ImpersonationOperation {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  detail: string;
  writeAttempted: boolean;
  writeAllowed: boolean;
  result: 'completed' | 'blocked' | 'simulated';
  ip: string;
}

export interface ImpersonationSession {
  sessionId: string;
  startTime: string;
  endTime: string | null;
  targetRole: UserRole;
  originalRole: UserRole;
  permissionBoundary: string[];
  writeAllowed: boolean;
  operationLog: ImpersonationOperation[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  impersonateRole: UserRole | null;
  originalCredentials: OriginalCredentials | null;
  impersonationSession: ImpersonationSession | null;
  impersonationHistory: ImpersonationSession[];
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: Partial<User>) => void;
  startImpersonation: (impersonateRole: UserRole, credentials: OriginalCredentials, writeAllowed?: boolean, permissionBoundary?: string[]) => void;
  exitImpersonation: () => void;
  recordImpersonationOperation: (action: string, target: string, detail: string, writeAttempted: boolean, writeAllowed: boolean, result: 'completed' | 'blocked' | 'simulated') => void;
  clearImpersonationHistory: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const getClientIp = () => {
  if (typeof window !== 'undefined') {
    return '127.0.0.1';
  }
  return 'unknown';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      impersonateRole: null,
      originalCredentials: null,
      impersonationSession: null,
      impersonationHistory: [],
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          impersonateRole: null,
          originalCredentials: null,
          impersonationSession: null,
        }),
      setUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      startImpersonation: (impersonateRole, credentials, writeAllowed = true, permissionBoundary) => {
        const defaultPermissions = [
          '页面访问:/',
          '页面访问:/pets',
          '页面访问:/consultations',
          '页面访问:/hospitals',
          '页面访问:/shop',
          '页面访问:/community',
          '页面访问:/lost-pet',
          '页面访问:/calendar',
          '数据查询:*',
          '表单提交:/pets/*',
          '表单提交:/consultations/*',
          '表单提交:/shop/*',
          '按钮点击:*',
        ];
        const boundary = permissionBoundary || defaultPermissions;
        const session: ImpersonationSession = {
          sessionId: generateId(),
          startTime: new Date().toISOString(),
          endTime: null,
          targetRole: impersonateRole,
          originalRole: credentials.role,
          permissionBoundary: boundary,
          writeAllowed,
          operationLog: [],
        };
        const startOperation: ImpersonationOperation = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          action: '模拟开始',
          target: `role:${impersonateRole}`,
          detail: `从${credentials.role}切换到${impersonateRole}，权限边界已设定`,
          writeAttempted: false,
          writeAllowed,
          result: 'completed',
          ip: getClientIp(),
        };
        session.operationLog.push(startOperation);
        set({
          impersonateRole,
          originalCredentials: credentials,
          impersonationSession: session,
        });
      },
      exitImpersonation: () => {
        const state = get();
        if (state.impersonationSession) {
          const endOperation: ImpersonationOperation = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            action: '模拟结束',
            target: `role:${state.impersonationSession.targetRole}`,
            detail: `退出${state.impersonationSession.targetRole}身份模拟`,
            writeAttempted: false,
            writeAllowed: state.impersonationSession.writeAllowed,
            result: 'completed',
            ip: getClientIp(),
          };
          const completedSession: ImpersonationSession = {
            ...state.impersonationSession,
            endTime: new Date().toISOString(),
            operationLog: [...state.impersonationSession.operationLog, endOperation],
          };
          set({
            impersonateRole: null,
            originalCredentials: null,
            impersonationSession: null,
            impersonationHistory: [...state.impersonationHistory, completedSession],
          });
        } else {
          set({
            impersonateRole: null,
            originalCredentials: null,
          });
        }
      },
      recordImpersonationOperation: (action, target, detail, writeAttempted, writeAllowed, result) => {
        const state = get();
        if (!state.impersonationSession) return;
        const operation: ImpersonationOperation = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          action,
          target,
          detail,
          writeAttempted,
          writeAllowed,
          result,
          ip: getClientIp(),
        };
        set({
          impersonationSession: {
            ...state.impersonationSession,
            operationLog: [...state.impersonationSession.operationLog, operation],
          },
        });
      },
      clearImpersonationHistory: () => {
        set({
          impersonationHistory: [],
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        impersonateRole: state.impersonateRole,
        originalCredentials: state.originalCredentials,
        impersonationSession: state.impersonationSession,
        impersonationHistory: state.impersonationHistory,
      }),
    }
  )
);
