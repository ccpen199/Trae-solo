import { getCurrentUser } from '@/router';
import { UserRole, WaybillStatus, FlowNode } from '@/types';

export interface NodeRoleConfig {
  node: FlowNode;
  roles: UserRole[];
  allowedStatuses: WaybillStatus[];
}

export const BUSINESS_NODE_ROLES: Record<FlowNode, UserRole[]> = {
  [FlowNode.BOOKING]: [UserRole.FORWARDER, UserRole.ADMIN],
  [FlowNode.RECEIVING]: [UserRole.WAREHOUSE, UserRole.ADMIN],
  [FlowNode.SECURITY]: [UserRole.SECURITY, UserRole.ADMIN],
  [FlowNode.LOADING]: [UserRole.AIRLINE, UserRole.ADMIN],
  [FlowNode.IN_TRANSIT]: [UserRole.AIRLINE, UserRole.ADMIN],
  [FlowNode.ARRIVAL]: [UserRole.AIRLINE, UserRole.ADMIN],
  [FlowNode.PICKUP]: [UserRole.CONSIGNEE, UserRole.ADMIN],
  [FlowNode.COMPLETION]: [UserRole.ADMIN],
};

export const STATUS_ACTION_ROLES: Record<string, UserRole[]> = {
  [WaybillStatus.DRAFT]: [UserRole.FORWARDER, UserRole.ADMIN],
  [WaybillStatus.BOOKING_SUBMITTED]: [UserRole.AIRLINE, UserRole.ADMIN],
  [WaybillStatus.BOOKING_CONFIRMED]: [UserRole.WAREHOUSE, UserRole.ADMIN],
  [WaybillStatus.RECEIVING]: [UserRole.WAREHOUSE, UserRole.ADMIN],
  [WaybillStatus.RECEIVED]: [UserRole.SECURITY, UserRole.ADMIN],
  [WaybillStatus.SECURITY_CHECKING]: [UserRole.SECURITY, UserRole.ADMIN],
  [WaybillStatus.SECURITY_PASSED]: [UserRole.AIRLINE, UserRole.ADMIN],
  [WaybillStatus.SECURITY_REJECTED]: [UserRole.FORWARDER, UserRole.ADMIN],
  [WaybillStatus.LOADING]: [UserRole.AIRLINE, UserRole.ADMIN],
  [WaybillStatus.IN_TRANSIT]: [UserRole.AIRLINE, UserRole.ADMIN],
  [WaybillStatus.ARRIVED]: [UserRole.CONSIGNEE, UserRole.ADMIN],
  [WaybillStatus.PICKING_UP]: [UserRole.CONSIGNEE, UserRole.ADMIN],
};

export function hasRoleForAction(status: WaybillStatus, action?: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  if (user.role === UserRole.ADMIN) return true;

  const allowedRoles = STATUS_ACTION_ROLES[status];
  if (!allowedRoles) return false;

  return allowedRoles.includes(user.role as UserRole);
}

export function isCurrentUserResponsible(waybill: {
  currentResponsibleRole?: string;
  currentNode?: string;
}): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  if (user.role === UserRole.ADMIN) return true;

  if (waybill.currentResponsibleRole && waybill.currentResponsibleRole === user.role) {
    return true;
  }

  if (waybill.currentNode) {
    const allowedRoles = BUSINESS_NODE_ROLES[waybill.currentNode as FlowNode];
    if (allowedRoles && allowedRoles.includes(user.role as UserRole)) {
      return true;
    }
  }

  return false;
}

export function getCurrentUserRole(): UserRole | null {
  const user = getCurrentUser();
  return user ? (user.role as UserRole) : null;
}

export function getRoleDisplay(role: UserRole): string {
  const displayMap: Record<UserRole, string> = {
    [UserRole.FORWARDER]: '货代',
    [UserRole.AIRLINE]: '航司',
    [UserRole.WAREHOUSE]: '仓库',
    [UserRole.SECURITY]: '安检',
    [UserRole.CONSIGNEE]: '收货人',
    [UserRole.ADMIN]: '管理员',
  };
  return displayMap[role] || role;
}

export function canViewWaybillDetail(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return true;
}

export function canCreateBooking(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return [UserRole.FORWARDER, UserRole.ADMIN].includes(user.role as UserRole);
}

export function canViewAuditLogs(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === UserRole.ADMIN;
}
