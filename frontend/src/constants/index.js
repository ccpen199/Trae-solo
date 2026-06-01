export const CONTAINER_TYPES = [
  { value: '20GP', label: '20GP' },
  { value: '40GP', label: '40GP' },
  { value: '40HQ', label: '40HQ' },
  { value: '45HQ', label: '45HQ' },
  { value: '20RF', label: '20RF' },
  { value: '40RF', label: '40RF' },
];

export const NODE_TYPES = [
  { value: 'PICKUP_EMPTY', label: '提空箱' },
  { value: 'IN_WAREHOUSE', label: '进仓' },
  { value: 'IN_PORT', label: '进港' },
  { value: 'LOADED', label: '装船' },
  { value: 'DEPARTED', label: '离港' },
  { value: 'ARRIVED', label: '到港' },
  { value: 'CUSTOMS_CLEARED', label: '清关' },
  { value: 'PICKUP_LOADED', label: '提重箱' },
  { value: 'RETURN_EMPTY', label: '还空箱' },
];

export const EXCEPTION_TYPES = [
  { value: 'DETENTION', label: '滞箱' },
  { value: 'INSPECTION', label: '查验' },
  { value: 'ROLLED', label: '甩柜' },
  { value: 'DELAYED', label: '晚到' },
  { value: 'DAMAGED', label: '破损' },
  { value: 'MISSING_INFO', label: '信息缺失' },
];

export const RESPONSIBLE_PARTIES = [
  { value: 'CARRIER', label: '船公司' },
  { value: 'FORWARDER', label: '货代' },
  { value: 'CUSTOMER', label: '客户' },
  { value: 'TRUCKING', label: '车队' },
  { value: 'WAREHOUSE', label: '仓库' },
  { value: 'PORT', label: '码头' },
  { value: 'OTHER', label: '其他' },
];

export const getNodeLabel = (type) => {
  const node = NODE_TYPES.find(n => n.value === type);
  return node ? node.label : type;
};

export const getExceptionLabel = (type) => {
  const exception = EXCEPTION_TYPES.find(e => e.value === type);
  return exception ? exception.label : type;
};

export const getResponsiblePartyLabel = (party) => {
  const p = RESPONSIBLE_PARTIES.find(r => r.value === party);
  return p ? p.label : party;
};
