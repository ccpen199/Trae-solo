export const formatNumber = (num: number, digits = 0): string => {
  if (num >= 100000000) return (num / 100000000).toFixed(digits + 1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(digits) + '万';
  return num.toLocaleString('zh-CN', { maximumFractionDigits: digits });
};

export const formatCurrency = (num: number): string => {
  if (num >= 100000000) return `¥${(num / 100000000).toFixed(2)}亿`;
  if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`;
  return `¥${num.toLocaleString('zh-CN')}`;
};

export const formatPercent = (val: number, digits = 1): string => {
  return `${val.toFixed(digits)}%`;
};
