export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待研判', color: 'orange' },
  reviewed: { label: '已研判', color: 'blue' },
  dispatched: { label: '已派发', color: 'purple' },
  completed: { label: '已结案', color: 'green' },
  duplicate: { label: '重复线索', color: 'default' },
  returned: { label: '退回补充', color: 'red' }
};

export const SOURCE_CHANNELS = [
  '群众举报',
  '上级交办',
  '下级报送',
  '巡逻发现',
  '技术侦查',
  '情报研判',
  '其他来源'
];

export const CATEGORIES = [
  '涉稳线索',
  '涉恐线索',
  '涉黑涉恶',
  '涉毒线索',
  '盗窃抢劫',
  '诈骗线索',
  '经济犯罪',
  '网络犯罪',
  '其他类别'
];

export const SECURITY_LEVELS = [
  { value: 1, label: '一级（普通）' },
  { value: 2, label: '二级（秘密）' },
  { value: 3, label: '三级（机密）' }
];

export const DEPARTMENTS = [
  '刑侦大队',
  '治安大队',
  '禁毒大队',
  '网安大队',
  '经侦大队',
  '派出所',
  '情报中心',
  '指挥中心'
];

export const RISK_TAGS = [
  '高风险',
  '中风险',
  '低风险',
  '涉稳',
  '涉众',
  '涉枪',
  '涉爆',
  '涉毒',
  '网络舆情'
];
