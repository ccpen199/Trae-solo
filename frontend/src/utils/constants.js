export const ORDER_STATUSES = {
  PENDING_PICKUP: 'pending_pickup',
  RIDER_ASSIGNED: 'rider_assigned',
  RIDER_ACCEPTED: 'rider_accepted',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived',
  WEIGHING: 'weighing',
  WEIGHED: 'weighed',
  IN_TRANSIT: 'in_transit',
  ARRIVED_AT_CENTER: 'arrived_at_center',
  CENTER_RECEIVED: 'center_received',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

export const STATUS_NAMES = {
  [ORDER_STATUSES.PENDING_PICKUP]: '待揽收',
  [ORDER_STATUSES.RIDER_ASSIGNED]: '已分配骑手',
  [ORDER_STATUSES.RIDER_ACCEPTED]: '骑手已接单',
  [ORDER_STATUSES.ON_THE_WAY]: '骑手正在赶来',
  [ORDER_STATUSES.ARRIVED]: '骑手已到达',
  [ORDER_STATUSES.WEIGHING]: '称重中',
  [ORDER_STATUSES.WEIGHED]: '称重完成',
  [ORDER_STATUSES.IN_TRANSIT]: '运往集散中心',
  [ORDER_STATUSES.ARRIVED_AT_CENTER]: '到达集散中心',
  [ORDER_STATUSES.CENTER_RECEIVED]: '集散中心签收',
  [ORDER_STATUSES.COMPLETED]: '已完成',
  [ORDER_STATUSES.CANCELLED]: '已取消',
  [ORDER_STATUSES.DISPUTED]: '存在异议'
};

export const STATUS_COLORS = {
  [ORDER_STATUSES.PENDING_PICKUP]: 'blue',
  [ORDER_STATUSES.RIDER_ASSIGNED]: 'cyan',
  [ORDER_STATUSES.RIDER_ACCEPTED]: 'cyan',
  [ORDER_STATUSES.ON_THE_WAY]: 'orange',
  [ORDER_STATUSES.ARRIVED]: 'orange',
  [ORDER_STATUSES.WEIGHING]: 'orange',
  [ORDER_STATUSES.WEIGHED]: 'purple',
  [ORDER_STATUSES.IN_TRANSIT]: 'purple',
  [ORDER_STATUSES.ARRIVED_AT_CENTER]: 'purple',
  [ORDER_STATUSES.CENTER_RECEIVED]: 'green',
  [ORDER_STATUSES.COMPLETED]: 'success',
  [ORDER_STATUSES.CANCELLED]: 'default',
  [ORDER_STATUSES.DISPUTED]: 'red'
};

export const CATEGORIES = [
  { value: 'paper', label: '废纸', icon: '📄' },
  { value: 'plastic', label: '塑料', icon: '🥤' },
  { value: 'metal', label: '金属', icon: '🔩' },
  { value: 'glass', label: '玻璃', icon: '🫙' },
  { value: 'electronics', label: '电子产品', icon: '📱' },
  { value: 'clothes', label: '旧衣物', icon: '👕' },
  { value: 'battery', label: '废电池', icon: '🔋' },
  { value: 'organic', label: '厨余垃圾', icon: '🥬' }
];

export const SUB_CATEGORIES = {
  paper: ['废纸', '报纸', '纸箱', '杂志'],
  plastic: ['塑料瓶', '塑料袋', '塑料餐具', '塑料玩具'],
  metal: ['废铁', '废铝', '废铜', '不锈钢'],
  glass: ['玻璃瓶', '玻璃碎片', '玻璃器皿'],
  electronics: ['旧家电', '手机', '电脑', '电池'],
  clothes: ['旧衣物', '旧鞋子', '旧包包'],
  battery: ['干电池', '蓄电池', '锂电池'],
  organic: ['厨余垃圾', '餐厨垃圾', '过期食品']
};

export const getCategoryName = (category) => {
  const found = CATEGORIES.find(c => c.value === category);
  return found ? found.label : category;
};

export const getCategoryIcon = (category) => {
  const found = CATEGORIES.find(c => c.value === category);
  return found ? found.icon : '📦';
};

export const STATUS_TRANSITIONS = {
  [ORDER_STATUSES.PENDING_PICKUP]: {
    rider: ORDER_STATUSES.RIDER_ACCEPTED,
    resident: ORDER_STATUSES.CANCELLED
  },
  [ORDER_STATUSES.RIDER_ACCEPTED]: {
    rider: ORDER_STATUSES.ON_THE_WAY
  },
  [ORDER_STATUSES.ON_THE_WAY]: {
    rider: ORDER_STATUSES.ARRIVED
  },
  [ORDER_STATUSES.ARRIVED]: {
    rider: ORDER_STATUSES.WEIGHING
  },
  [ORDER_STATUSES.WEIGHED]: {
    rider: ORDER_STATUSES.IN_TRANSIT
  },
  [ORDER_STATUSES.IN_TRANSIT]: {
    center: ORDER_STATUSES.ARRIVED_AT_CENTER
  },
  [ORDER_STATUSES.ARRIVED_AT_CENTER]: {
    center: ORDER_STATUSES.CENTER_RECEIVED
  },
  [ORDER_STATUSES.CENTER_RECEIVED]: {
    operator: ORDER_STATUSES.COMPLETED
  },
  [ORDER_STATUSES.DISPUTED]: {
    operator: ORDER_STATUSES.COMPLETED
  }
};

export const getNextStatus = (currentStatus, role) => {
  const transitions = STATUS_TRANSITIONS[currentStatus];
  return transitions ? transitions[role] : null;
};

export const isWeightRequired = (status) => {
  return [
    ORDER_STATUSES.ARRIVED,
    ORDER_STATUSES.WEIGHING
  ].includes(status);
};

export const isReceiptRequired = (status) => {
  return [
    ORDER_STATUSES.IN_TRANSIT,
    ORDER_STATUSES.ARRIVED_AT_CENTER
  ].includes(status);
};

export const getActionLabel = (status, role) => {
  const actions = {
    [ORDER_STATUSES.PENDING_PICKUP]: {
      rider: '接单',
      resident: '取消订单'
    },
    [ORDER_STATUSES.RIDER_ACCEPTED]: {
      rider: '开始前往'
    },
    [ORDER_STATUSES.ON_THE_WAY]: {
      rider: '到达用户'
    },
    [ORDER_STATUSES.ARRIVED]: {
      rider: '开始称重'
    },
    [ORDER_STATUSES.WEIGHED]: {
      rider: '发往集散中心'
    },
    [ORDER_STATUSES.IN_TRANSIT]: {
      center: '到达集散中心'
    },
    [ORDER_STATUSES.ARRIVED_AT_CENTER]: {
      center: '签收'
    },
    [ORDER_STATUSES.CENTER_RECEIVED]: {
      operator: '完成订单'
    },
    [ORDER_STATUSES.DISPUTED]: {
      operator: '处理完成'
    }
  };

  const statusActions = actions[status];
  return statusActions ? statusActions[role] : null;
};
