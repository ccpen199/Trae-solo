export const getIndustryZoneClass = (zone: string): string => {
  const classMap: Record<string, string> = {
    dianzhong_manufacturing: 'dianzhong',
    puer_tea: 'puer',
    xishuangbanna_tourism: 'tourism',
    yuxi_tobacco: 'tobacco',
    kunming_it: 'it',
    qujing_energy: 'energy',
    honghe_metallurgy: 'metallurgy',
    dali_culture: 'culture',
    other: '',
  };
  return classMap[zone] || '';
};

export const getIndustryZoneLabel = (zone: string): string => {
  const labelMap: Record<string, string> = {
    dianzhong_manufacturing: '滇中制造',
    puer_tea: '普洱茶业',
    xishuangbanna_tourism: '西双版纳旅游',
    yuxi_tobacco: '玉溪烟草',
    kunming_it: '昆明信息产业',
    qujing_energy: '曲靖能源',
    honghe_metallurgy: '红河冶金',
    dali_culture: '大理文化',
    other: '其他',
  };
  return labelMap[zone] || zone;
};

export const getProsperityLevel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: '景气', color: '#52c41a' };
  if (score >= 60) return { label: '较景气', color: '#73d13d' };
  if (score >= 40) return { label: '一般', color: '#faad14' };
  if (score >= 20) return { label: '较不景气', color: '#fa8c16' };
  return { label: '不景气', color: '#f5222d' };
};

export const formatSalary = (min: number, max: number, negotiable?: boolean): string => {
  if (negotiable) return '面议';
  if (!min && !max) return '面议';
  if (min === max) return `¥${min.toLocaleString()}/月`;
  if (!max) return `¥${min.toLocaleString()}/月以上`;
  if (!min) return `¥${max.toLocaleString()}/月以下`;
  return `¥${min.toLocaleString()} - ${max.toLocaleString()}/月`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getEmploymentStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    employed: '已就业',
    unemployed: '未就业',
    postgraduate: '升学',
    other: '其他',
  };
  return map[status] || status;
};

export const getEmploymentStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    employed: '#52c41a',
    unemployed: '#f5222d',
    postgraduate: '#1890ff',
    other: '#8c8c8c',
  };
  return map[status] || '#8c8c8c';
};

export const getFairStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
    cancelled: '已取消',
  };
  return map[status] || status;
};

export const getFairStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    upcoming: '#1890ff',
    ongoing: '#52c41a',
    ended: '#8c8c8c',
    cancelled: '#f5222d',
  };
  return map[status] || '#8c8c8c';
};

export const getCreditLevelLabel = (level: string): string => {
  const map: Record<string, string> = {
    AAA: 'AAA',
    AA: 'AA',
    A: 'A',
    BBB: 'BBB',
    BB: 'BB',
    B: 'B',
  };
  return map[level] || level;
};

export const getJobStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    recruiting: '招聘中',
    paused: '已暂停',
    closed: '已关闭',
    filled: '已招满',
  };
  return map[status] || status;
};

export const getJobStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    recruiting: 'green',
    paused: 'orange',
    closed: 'default',
    filled: 'blue',
  };
  return map[status] || 'default';
};

export const getProsperityLevelClass = (score: number): string => {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'normal';
  return 'cold';
};
