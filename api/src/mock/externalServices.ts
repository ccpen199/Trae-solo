const randomBoolean = (idCard?: string): boolean => {
  if (idCard && idCard.startsWith('110101')) {
    return true;
  }
  return Math.random() > 0.2;
};

const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

export const verifyPolice = async (
  idCard: string,
  name: string
): Promise<{ verified: boolean; nameMatch: boolean }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const verified = randomBoolean(idCard);
  return {
    verified,
    nameMatch: verified ? randomBoolean() : false,
  };
};

export const verifySocial = async (
  idCard: string
): Promise<{
  verified: boolean;
  contributionMonths: number;
  lastContributionDate: string;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const verified = randomBoolean(idCard);
  return {
    verified,
    contributionMonths: verified ? Math.floor(Math.random() * 240) + 12 : 0,
    lastContributionDate: verified
      ? randomDate(new Date('2023-01-01'), new Date())
      : '',
  };
};

export const verifyMinimumAllowance = async (
  idCard: string
): Promise<{ matched: boolean; details?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const matched = randomBoolean(idCard);
  return {
    matched,
    details: matched
      ? '已纳入最低生活保障范围，月保障金额 800 元'
      : '未查询到低保记录',
  };
};

export const verifyDisability = async (
  idCard: string
): Promise<{ matched: boolean; details?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const matched = randomBoolean(idCard);
  const levels = ['一级', '二级', '三级', '四级'];
  return {
    matched,
    details: matched
      ? `持有${levels[Math.floor(Math.random() * levels.length)]}残疾证`
      : '未查询到残疾登记信息',
  };
};

export const verifySeriousIllness = async (
  idCard: string
): Promise<{ matched: boolean; details?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const matched = randomBoolean(idCard);
  const illnesses = ['恶性肿瘤', '尿毒症', '白血病', '重型再生障碍性贫血'];
  return {
    matched,
    details: matched
      ? `确诊${illnesses[Math.floor(Math.random() * illnesses.length)]}，正在接受治疗`
      : '未查询到大病医疗记录',
  };
};

export const verifyVocationalCertificate = async (
  userId: number,
  courseId: number,
  totalHours: number
): Promise<{ verified: boolean; certificateNumber: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const verified = totalHours >= 40;
  const certificateNumber = verified
    ? `VOC-${Date.now()}-${userId}-${courseId}`
    : '';
  return {
    verified,
    certificateNumber,
  };
};

export const getSupplyChain = async (
  productId: number
): Promise<
  Array<{
    stage: string;
    location: string;
    operator: string;
    date: string;
    description: string;
  }>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const stages = [
    {
      stage: '原料采集',
      location: '云南普洱有机茶园',
      operator: '李农',
      description: '采摘当季新鲜茶叶，严格筛选优质原料',
    },
    {
      stage: '生产加工',
      location: '福建安溪茶厂',
      operator: '王师傅',
      description: '传统工艺与现代技术结合，精心炒制',
    },
    {
      stage: '质量检测',
      location: '国家茶叶质量监督检验中心',
      operator: '质检科',
      description: '通过23项质量检测，农药残留零检出',
    },
    {
      stage: '包装入库',
      location: '厦门物流中心',
      operator: '仓储部',
      description: '环保包装，冷链仓储保鲜',
    },
    {
      stage: '物流配送',
      location: '顺丰速运',
      operator: '张快递',
      description: '全程冷链配送，48小时直达',
    },
  ];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 15);
  return stages.map((s, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 3);
    return {
      ...s,
      date: date.toISOString().split('T')[0],
    };
  });
};
