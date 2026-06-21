import type { Person, Position, EquityRelation, JudicialRisk, GraphData, GraphNode, GraphLink } from '../types/person';

export const mockPersons: Person[] = [
  {
    id: 'person-001',
    name: '郁亮',
    avatar: '👤',
    gender: 'male',
    birthYear: 1965,
    education: '硕士研究生',
    description: '万科企业股份有限公司董事会主席',
  },
  {
    id: 'person-002',
    name: '祝九胜',
    avatar: '👤',
    gender: 'male',
    birthYear: 1969,
    education: '博士研究生',
    description: '万科企业股份有限公司总裁、首席执行官',
  },
  {
    id: 'person-003',
    name: '刘平',
    avatar: '👤',
    gender: 'male',
    birthYear: 1972,
    education: '硕士研究生',
    description: '保利发展控股集团股份有限公司董事长',
  },
  {
    id: 'person-004',
    name: '张智超',
    avatar: '👤',
    gender: 'male',
    birthYear: 1968,
    education: '硕士研究生',
    description: '中国海外发展有限公司董事长',
  },
  {
    id: 'person-005',
    name: '杨惠妍',
    avatar: '👤',
    gender: 'female',
    birthYear: 1981,
    education: '本科',
    description: '碧桂园控股有限公司董事会主席',
  },
  {
    id: 'person-006',
    name: '李欣',
    avatar: '👤',
    gender: 'male',
    birthYear: 1970,
    education: '硕士研究生',
    description: '华润置地有限公司董事会主席',
  },
  {
    id: 'person-007',
    name: '陈序平',
    avatar: '👤',
    gender: 'male',
    birthYear: 1982,
    education: '硕士研究生',
    description: '龙湖集团控股有限公司首席执行官',
  },
  {
    id: 'person-008',
    name: '吴亚军',
    avatar: '👤',
    gender: 'female',
    birthYear: 1964,
    education: '本科',
    description: '龙湖集团控股有限公司创始人、战略发展顾问',
  },
];

export const mockPositions: Position[] = [
  { id: 'pos-001', personId: 'person-001', companyId: 'comp-001', companyName: '万科A', title: '董事会主席', startDate: '2018-01-01', isCurrent: true },
  { id: 'pos-002', personId: 'person-001', companyId: 'comp-001', companyName: '万科A', title: '总裁', startDate: '2009-01-01', endDate: '2018-01-01', isCurrent: false },
  { id: 'pos-003', personId: 'person-002', companyId: 'comp-001', companyName: '万科A', title: '总裁、CEO', startDate: '2018-01-01', isCurrent: true },
  { id: 'pos-004', personId: 'person-003', companyId: 'comp-002', companyName: '保利发展', title: '董事长', startDate: '2021-01-01', isCurrent: true },
  { id: 'pos-005', personId: 'person-004', companyId: 'comp-003', companyName: '中海发展', title: '董事长', startDate: '2020-01-01', isCurrent: true },
  { id: 'pos-006', personId: 'person-005', companyId: 'comp-004', companyName: '碧桂园', title: '董事会主席', startDate: '2023-01-01', isCurrent: true },
  { id: 'pos-007', personId: 'person-006', companyId: 'comp-005', companyName: '华润置地', title: '董事会主席', startDate: '2019-01-01', isCurrent: true },
  { id: 'pos-008', personId: 'person-007', companyId: 'comp-006', companyName: '龙湖集团', title: '首席执行官', startDate: '2022-01-01', isCurrent: true },
  { id: 'pos-009', personId: 'person-008', companyId: 'comp-006', companyName: '龙湖集团', title: '战略发展顾问', startDate: '2022-11-01', isCurrent: true },
  { id: 'pos-010', personId: 'person-008', companyId: 'comp-006', companyName: '龙湖集团', title: '董事会主席', startDate: '2009-01-01', endDate: '2022-10-31', isCurrent: false },
];

export const mockEquityRelations: EquityRelation[] = [
  { id: 'eq-001', fromCompanyId: 'comp-001', fromCompanyName: '万科A', toCompanyId: 'comp-010', toCompanyName: '新城发展', shareRatio: 0.05, type: 'direct', level: 1 },
  { id: 'eq-002', fromCompanyId: 'comp-002', fromCompanyName: '保利发展', toCompanyId: 'comp-007', toCompanyName: '招商蛇口', shareRatio: 0.02, type: 'indirect', level: 2 },
  { id: 'eq-003', fromCompanyId: 'comp-003', fromCompanyName: '中海发展', toCompanyId: 'comp-005', toCompanyName: '华润置地', shareRatio: 0.01, type: 'indirect', level: 3 },
  { id: 'eq-004', fromCompanyId: 'comp-005', fromCompanyName: '华润置地', toCompanyId: 'comp-012', toCompanyName: '金地集团', shareRatio: 0.03, type: 'direct', level: 1 },
  { id: 'eq-005', fromCompanyId: 'comp-007', fromCompanyName: '招商蛇口', toCompanyId: 'comp-008', toCompanyName: '中国金茂', shareRatio: 0.04, type: 'direct', level: 1 },
];

export const mockJudicialRisks: JudicialRisk[] = [
  {
    id: 'jr-001',
    companyId: 'comp-004',
    companyName: '碧桂园',
    type: 'lawsuit',
    amount: 2500000000,
    date: '2023-12-15',
    status: '审理中',
    description: '因逾期交付被业主集体起诉，涉及金额约25亿元',
  },
  {
    id: 'jr-002',
    companyId: 'comp-004',
    companyName: '碧桂园',
    personId: 'person-005',
    personName: '杨惠妍',
    type: 'execution',
    amount: 8500000000,
    date: '2024-01-20',
    status: '执行中',
    description: '因债务违约被列为被执行人，执行标的85亿元',
  },
  {
    id: 'jr-003',
    companyId: 'comp-004',
    companyName: '碧桂园',
    type: 'dishonest',
    date: '2024-02-10',
    status: '已发布',
    description: '被列入失信被执行人名单',
  },
  {
    id: 'jr-004',
    companyId: 'comp-011',
    companyName: '旭辉控股',
    type: 'lawsuit',
    amount: 1200000000,
    date: '2023-11-05',
    status: '审理中',
    description: '与建筑承包商的工程款纠纷案件',
  },
  {
    id: 'jr-005',
    companyId: 'comp-009',
    companyName: '绿地控股',
    type: 'freeze',
    amount: 500000000,
    date: '2023-10-18',
    status: '已冻结',
    description: '银行账户被冻结，涉及金额5亿元',
  },
];

export function getMockGraphData(): GraphData {
  const nodes: GraphNode[] = [
    { id: 'comp-001', name: '万科A', type: 'company', subType: 'mixed', radius: 40, color: '#3B82F6' },
    { id: 'comp-002', name: '保利发展', type: 'company', subType: 'state-owned', radius: 40, color: '#EF4444' },
    { id: 'comp-004', name: '碧桂园', type: 'company', subType: 'private', radius: 40, color: '#10B981' },
    { id: 'comp-005', name: '华润置地', type: 'company', subType: 'state-owned', radius: 35, color: '#EF4444' },
    { id: 'comp-006', name: '龙湖集团', type: 'company', subType: 'private', radius: 35, color: '#10B981' },
    { id: 'comp-007', name: '招商蛇口', type: 'company', subType: 'state-owned', radius: 30, color: '#EF4444' },
    { id: 'person-001', name: '郁亮', type: 'person', radius: 20, color: '#8B5CF6' },
    { id: 'person-002', name: '祝九胜', type: 'person', radius: 18, color: '#8B5CF6' },
    { id: 'person-003', name: '刘平', type: 'person', radius: 18, color: '#8B5CF6' },
    { id: 'person-005', name: '杨惠妍', type: 'person', radius: 20, color: '#8B5CF6' },
    { id: 'person-006', name: '李欣', type: 'person', radius: 18, color: '#8B5CF6' },
    { id: 'person-008', name: '吴亚军', type: 'person', radius: 18, color: '#8B5CF6' },
    { id: 'jr-001', name: '司法风险-碧桂园', type: 'judicial', subType: 'lawsuit', radius: 22, color: '#F59E0B' },
    { id: 'jr-002', name: '执行-杨惠妍', type: 'judicial', subType: 'execution', radius: 20, color: '#F59E0B' },
  ];

  const links: GraphLink[] = [
    { source: 'person-001', target: 'comp-001', type: 'position', label: '董事会主席' },
    { source: 'person-002', target: 'comp-001', type: 'position', label: '总裁' },
    { source: 'person-003', target: 'comp-002', type: 'position', label: '董事长' },
    { source: 'person-005', target: 'comp-004', type: 'position', label: '董事会主席' },
    { source: 'person-006', target: 'comp-005', type: 'position', label: '董事会主席' },
    { source: 'person-008', target: 'comp-006', type: 'position', label: '顾问' },
    { source: 'comp-001', target: 'comp-005', type: 'equity', label: '5%' },
    { source: 'comp-002', target: 'comp-007', type: 'equity', label: '2%' },
    { source: 'jr-001', target: 'comp-004', type: 'judicial', label: '诉讼' },
    { source: 'jr-002', target: 'person-005', type: 'judicial', label: '执行' },
    { source: 'comp-004', target: 'comp-006', type: 'industry', label: '竞品' },
    { source: 'comp-001', target: 'comp-002', type: 'industry', label: '竞品' },
  ];

  return { nodes, links };
}

export function getPersonById(id: string): Person | undefined {
  return mockPersons.find(p => p.id === id);
}

export function getPositionsByPerson(personId: string): Position[] {
  return mockPositions.filter(p => p.personId === personId);
}

export function getJudicialByCompany(companyId: string): JudicialRisk[] {
  return mockJudicialRisks.filter(j => j.companyId === companyId);
}
