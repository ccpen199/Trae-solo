export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待入库', color: 'default' },
  in_station: { label: '已入库', color: 'blue' },
  sorted: { label: '已分拣', color: 'cyan' },
  notified: { label: '已通知', color: 'purple' },
  delivering: { label: '派送中', color: 'orange' },
  signed: { label: '已签收', color: 'success' },
  exception: { label: '异常', color: 'error' }
};

export const EXCEPTION_TYPE_MAP: Record<string, string> = {
  damaged: '破损',
  rejected: '拒收',
  unreachable: '无法联系',
  other: '其他'
};

export const SIGN_TYPE_MAP: Record<string, string> = {
  home: '上门派送',
  station: '驿站自提'
};

export const ACTION_MAP: Record<string, string> = {
  in_station: '包裹入库',
  sorted: '分拣完成',
  assigned: '分配快递员',
  notified: '发送通知',
  delivering: '开始派送',
  signed: '签收完成',
  exception: '标记异常'
};

export const ROLE_MAP: Record<string, string> = {
  courier: '快递员',
  admin: '站点管理员',
  customer_service: '客服'
};
