export const ORDER_STATUS = {
  PENDING_LOCATION: 'PENDING_LOCATION',
  PENDING_ROUTE_PLAN: 'PENDING_ROUTE_PLAN',
  NAVIGATING: 'NAVIGATING',
  PENDING_TRACK_RECORD: 'PENDING_TRACK_RECORD',
  ARRIVED: 'ARRIVED',
  CANCELLED: 'CANCELLED',
  EXCEPTION: 'EXCEPTION',
};

export const STATUS_NAMES = {
  [ORDER_STATUS.PENDING_LOCATION]: '待输入位置',
  [ORDER_STATUS.PENDING_ROUTE_PLAN]: '待路线规划',
  [ORDER_STATUS.NAVIGATING]: '导航执行中',
  [ORDER_STATUS.PENDING_TRACK_RECORD]: '待轨迹记录',
  [ORDER_STATUS.ARRIVED]: '已到达确认',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.EXCEPTION]: '异常',
};

export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING_LOCATION]: 'orange',
  [ORDER_STATUS.PENDING_ROUTE_PLAN]: 'blue',
  [ORDER_STATUS.NAVIGATING]: 'processing',
  [ORDER_STATUS.PENDING_TRACK_RECORD]: 'cyan',
  [ORDER_STATUS.ARRIVED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'default',
  [ORDER_STATUS.EXCEPTION]: 'error',
};

export const ROLE_NAMES = {
  ADMIN: '系统管理员',
  USER: '用户',
  DRIVER: '司机',
  DISPATCHER: '调度员',
  OPERATOR: '运营',
  MAP_PROVIDER: '地图服务商',
};

export const ROUTE_TYPES = {
  FASTEST: 'FASTEST',
  SHORTEST: 'SHORTEST',
  NO_HIGHWAY: 'NO_HIGHWAY',
  AVOID_TRAFFIC: 'AVOID_TRAFFIC',
};

export const ROUTE_TYPE_NAMES = {
  [ROUTE_TYPES.FASTEST]: '最快路线',
  [ROUTE_TYPES.SHORTEST]: '最短路线',
  [ROUTE_TYPES.NO_HIGHWAY]: '不走高速',
  [ROUTE_TYPES.AVOID_TRAFFIC]: '躲避拥堵',
};

export const EXCEPTION_TYPES = {
  LOCATION_DRIFT: 'LOCATION_DRIFT',
  ROUTE_DEVIATION: 'ROUTE_DEVIATION',
  DRIVER_REJECT: 'DRIVER_REJECT',
  ARRIVAL_NOT_CONFIRMED: 'ARRIVAL_NOT_CONFIRMED',
  MAP_CALLBACK_DELAY: 'MAP_CALLBACK_DELAY',
  API_FAILURE: 'API_FAILURE',
  DUPLICATE_SUBMIT: 'DUPLICATE_SUBMIT',
  TIMEOUT: 'TIMEOUT',
};

export const EXCEPTION_TYPE_NAMES = {
  [EXCEPTION_TYPES.LOCATION_DRIFT]: '定位漂移',
  [EXCEPTION_TYPES.ROUTE_DEVIATION]: '路线偏离',
  [EXCEPTION_TYPES.DRIVER_REJECT]: '司机拒接',
  [EXCEPTION_TYPES.ARRIVAL_NOT_CONFIRMED]: '到达未确认',
  [EXCEPTION_TYPES.MAP_CALLBACK_DELAY]: '地图回调延迟',
  [EXCEPTION_TYPES.API_FAILURE]: '接口失败',
  [EXCEPTION_TYPES.DUPLICATE_SUBMIT]: '重复提交',
  [EXCEPTION_TYPES.TIMEOUT]: '超时',
};

export const formatDuration = (seconds) => {
  if (!seconds || seconds < 60) return `${seconds || 0}秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}小时${minutes}分钟`;
};

export const formatDistance = (meters) => {
  if (!meters || meters < 1000) return `${meters || 0}米`;
  return `${(meters / 1000).toFixed(1)}公里`;
};
