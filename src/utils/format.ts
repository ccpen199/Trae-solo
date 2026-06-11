import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (date: string | Date | number, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const formatCurrency = (value: number, decimals = 2): string => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.substr(0, 6) + '********' + idCard.substr(-4);
};

export const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.substr(0, 3) + '****' + phone.substr(-4);
};

export const daysBetween = (start: string | Date, end: string | Date): number => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  return endDate.diff(startDate, 'day');
};

export const isExpired = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs());
};

export const getInsuranceTypeName = (type: string): string => {
  const map: Record<string, string> = {
    pension: '养老保险',
    medical: '医疗保险',
    unemployment: '失业保险',
    injury: '工伤保险',
    maternity: '生育保险',
  };
  return map[type] || type;
};

export const getVisitTypeName = (type: string): string => {
  const map: Record<string, string> = {
    outpatient: '门诊',
    inpatient: '住院',
    pharmacy: '药店购药',
  };
  return map[type] || type;
};

export const getContractTypeName = (type: string): string => {
  const map: Record<string, string> = {
    fixed_term: '固定期限',
    open_ended: '无固定期限',
    project_based: '以完成一定工作任务为期限',
  };
  return map[type] || type;
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    normal: '正常',
    suspended: '暂停',
    terminated: '终止',
    paid: '已缴',
    unpaid: '未缴',
    refunded: '已退',
    active: '激活',
    inactive: '未激活',
    lost: '挂失',
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
    reviewing: '审核中',
    transferring: '转移中',
    failed: '失败',
    signed: '已签署',
    pending_sign: '待签署',
    expired: '已过期',
    draft: '草稿',
    published: '已发布',
    warning: '预警中',
    overdue: '已超时',
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    normal: 'success',
    suspended: 'warning',
    terminated: 'danger',
    paid: 'success',
    unpaid: 'warning',
    refunded: 'default',
    active: 'success',
    inactive: 'default',
    lost: 'danger',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'success',
    reviewing: 'primary',
    transferring: 'primary',
    failed: 'danger',
    signed: 'success',
    pending_sign: 'warning',
    expired: 'default',
    draft: 'default',
    published: 'success',
    warning: 'warning',
    overdue: 'danger',
  };
  return map[status] || 'default';
};

export const getHospitalTypeName = (type: string): string => {
  const map: Record<string, string> = {
    general: '综合医院',
    specialized: '专科医院',
    community: '社区卫生服务中心',
  };
  return map[type] || type;
};

export const getDesignatedTypeName = (isDesignated: boolean, type: string): string => {
  if (!isDesignated) return '非定点';
  const map: Record<string, string> = {
    general: '定点综合',
    specialized: '定点专科',
    community: '定点社区',
  };
  return map[type] || '定点医疗机构';
};

export const getReimbursementScope = (level: string, type: string): string => {
  if (type === 'community') return '门诊统筹 · 报销90% · 起付线0元';
  if (level.includes('三级')) return '门诊统筹 · 报销70% · 住院85% · 起付线1300元';
  if (level.includes('二级')) return '门诊统筹 · 报销80% · 住院90% · 起付线800元';
  if (level.includes('一级')) return '门诊统筹 · 报销85% · 住院92% · 起付线400元';
  return '门诊统筹 · 报销75% · 住院88%';
};
