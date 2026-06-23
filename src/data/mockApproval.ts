import { ApprovalTemplate, ApprovalInstance, ApprovalTodo, ApprovalProcessNode, ApprovalProcessHistory, CCUser } from '@/types/approval';

const defaultProcess: ApprovalProcessNode[] = [
  {
    id: 'node_start',
    name: '发起',
    type: 'start',
    assigneeType: 'user',
    isReturnable: false,
    isAddsignable: false,
    isTransferable: false
  },
  {
    id: 'node_1',
    name: '部门负责人审批',
    type: 'approval',
    assigneeType: 'leader',
    isReturnable: true,
    isAddsignable: true,
    isTransferable: true
  },
  {
    id: 'node_2',
    name: '财务部审核',
    type: 'approval',
    assigneeType: 'dept',
    assigneeIds: ['org003'],
    isReturnable: true,
    isAddsignable: true,
    isTransferable: false
  },
  {
    id: 'node_3',
    name: '公司领导审批',
    type: 'countersign',
    assigneeType: 'role',
    assigneeIds: ['role_leader'],
    countersignType: 'all',
    isReturnable: true,
    isAddsignable: true,
    isTransferable: false
  },
  {
    id: 'node_end',
    name: '结束',
    type: 'end',
    assigneeType: 'user',
    isReturnable: false,
    isAddsignable: false,
    isTransferable: false
  }
];

export const mockApprovalTemplates: ApprovalTemplate[] = [
  {
    id: 'tpl001',
    name: '请假申请',
    icon: '📅',
    description: '员工请假、调休、年假等申请',
    category: '人事',
    formFields: [
      { key: 'leaveType', label: '请假类型', type: 'select', required: true, options: [
        { label: '年假', value: 'annual' },
        { label: '事假', value: 'personal' },
        { label: '病假', value: 'sick' },
        { label: '调休', value: 'compensatory' }
      ]},
      { key: 'startDate', label: '开始日期', type: 'date', required: true },
      { key: 'endDate', label: '结束日期', type: 'date', required: true },
      { key: 'days', label: '请假天数', type: 'number', required: true },
      { key: 'reason', label: '请假事由', type: 'textarea', required: true, placeholder: '请详细说明请假原因' }
    ],
    processDefinition: defaultProcess,
    flowNodes: defaultProcess,
    isEnabled: true,
    sort: 1
  },
  {
    id: 'tpl002',
    name: '报销申请',
    icon: '💰',
    description: '差旅费、招待费、办公费等报销',
    category: '财务',
    formFields: [
      { key: 'expenseType', label: '费用类型', type: 'select', required: true, options: [
        { label: '差旅费', value: 'travel' },
        { label: '招待费', value: 'entertainment' },
        { label: '办公费', value: 'office' },
        { label: '交通费', value: 'transport' }
      ]},
      { key: 'amount', label: '报销金额', type: 'number', required: true, placeholder: '请输入报销金额' },
      { key: 'startDate', label: '费用开始日期', type: 'date', required: true },
      { key: 'endDate', label: '费用结束日期', type: 'date', required: true },
      { key: 'description', label: '费用说明', type: 'textarea', required: true, placeholder: '请详细说明费用发生情况' },
      { key: 'attachments', label: '发票附件', type: 'upload', required: true }
    ],
    processDefinition: defaultProcess,
    flowNodes: defaultProcess,
    isEnabled: true,
    sort: 2
  },
  {
    id: 'tpl003',
    name: '采购申请',
    icon: '🛒',
    description: '办公用品、设备等采购申请',
    category: '行政',
    formFields: [
      { key: 'purchaseType', label: '采购类型', type: 'select', required: true, options: [
        { label: '办公用品', value: 'office' },
        { label: 'IT设备', value: 'it' },
        { label: '劳保用品', value: 'labor' },
        { label: '其他', value: 'other' }
      ]},
      { key: 'itemName', label: '物品名称', type: 'input', required: true, placeholder: '请输入物品名称' },
      { key: 'quantity', label: '数量', type: 'number', required: true, placeholder: '请输入数量' },
      { key: 'estimatedAmount', label: '预估金额', type: 'number', required: true, placeholder: '请输入预估金额' },
      { key: 'purpose', label: '采购用途', type: 'textarea', required: true, placeholder: '请说明采购用途' }
    ],
    processDefinition: defaultProcess,
    flowNodes: defaultProcess,
    isEnabled: true,
    sort: 3
  },
  {
    id: 'tpl004',
    name: '出差申请',
    icon: '✈️',
    description: '因公出差申请及审批',
    category: '人事',
    formFields: [
      { key: 'destination', label: '出差地点', type: 'input', required: true, placeholder: '请输入出差地点' },
      { key: 'startDate', label: '开始日期', type: 'date', required: true },
      { key: 'endDate', label: '结束日期', type: 'date', required: true },
      { key: 'days', label: '出差天数', type: 'number', required: true },
      { key: 'purpose', label: '出差事由', type: 'textarea', required: true, placeholder: '请说明出差目的和主要工作内容' },
      { key: 'transport', label: '交通工具', type: 'select', required: true, options: [
        { label: '飞机', value: 'plane' },
        { label: '高铁', value: 'train' },
        { label: '汽车', value: 'car' },
        { label: '其他', value: 'other' }
      ]}
    ],
    processDefinition: defaultProcess,
    flowNodes: defaultProcess,
    isEnabled: true,
    sort: 4
  },
  {
    id: 'tpl005',
    name: '合同审批',
    icon: '📄',
    description: '各类合同的审批流程',
    category: '法务',
    formFields: [
      { key: 'contractType', label: '合同类型', type: 'select', required: true, options: [
        { label: '采购合同', value: 'purchase' },
        { label: '销售合同', value: 'sales' },
        { label: '服务合同', value: 'service' },
        { label: '战略合作协议', value: 'cooperation' }
      ]},
      { key: 'contractName', label: '合同名称', type: 'input', required: true, placeholder: '请输入合同名称' },
      { key: 'partyA', label: '甲方', type: 'input', required: true, placeholder: '请输入甲方名称' },
      { key: 'partyB', label: '乙方', type: 'input', required: true, placeholder: '请输入乙方名称' },
      { key: 'amount', label: '合同金额', type: 'number', required: true, placeholder: '请输入合同金额' },
      { key: 'description', label: '合同说明', type: 'textarea', required: true, placeholder: '请说明合同主要内容' },
      { key: 'contractFile', label: '合同附件', type: 'upload', required: true }
    ],
    processDefinition: defaultProcess,
    flowNodes: defaultProcess,
    isEnabled: true,
    sort: 5
  },
  {
    id: 'tpl006',
    name: '印章使用',
    icon: '🔐',
    description: '公司印章使用申请',
    category: '行政',
    formFields: [
      { key: 'sealType', label: '印章类型', type: 'select', required: true, options: [
        { label: '公司公章', value: 'company' },
        { label: '合同专用章', value: 'contract' },
        { label: '财务专用章', value: 'finance' },
        { label: '法人章', value: 'legal' }
      ]},
      { key: 'documentName', label: '文件名称', type: 'input', required: true, placeholder: '请输入用印文件名称' },
      { key: 'documentCount', label: '文件份数', type: 'number', required: true, placeholder: '请输入文件份数' },
      { key: 'purpose', label: '用印事由', type: 'textarea', required: true, placeholder: '请说明用印事由' }
    ],
    processDefinition: defaultProcess,
    flowNodes: defaultProcess,
    isEnabled: true,
    sort: 6
  }
];

const defaultCCList: CCUser[] = [
  { id: 'u002', name: '李建国' },
  { id: 'u003', name: '王芳' },
  { id: 'u004', name: '刘强' }
];

const commonHistory: ApprovalProcessHistory[] = [
  {
    id: 'hist001',
    nodeId: 'node_start',
    nodeName: '发起',
    operatorId: 'u008',
    operatorName: '周杰',
    operation: 'approve',
    opinion: '发起申请',
    operateTime: '2026-06-20 09:00:00'
  },
  {
    id: 'hist002',
    nodeId: 'node_1',
    nodeName: '部门负责人审批',
    operatorId: 'u005',
    operatorName: '刘伟',
    operation: 'approve',
    opinion: '同意，情况属实。',
    operateTime: '2026-06-20 10:30:00'
  }
];

export const mockApprovalTodos: ApprovalTodo[] = [
  {
    id: 'todo001',
    instanceId: 'inst001',
    title: '周杰-2026年6月年假申请',
    templateName: '请假申请',
    applicantName: '周杰',
    applicantDept: '南山运维一班',
    currentNodeName: '财务部审核',
    receiveTime: '2026-06-20 14:00:00',
    deadline: '2026-06-23 18:00:00',
    priority: 'high',
    isUrgent: true,
    isCountersign: false
  },
  {
    id: 'todo002',
    instanceId: 'inst002',
    title: '黄丽-2026年6月差旅费报销',
    templateName: '报销申请',
    applicantName: '黄丽',
    applicantDept: '天河运维一班',
    currentNodeName: '部门负责人审批',
    receiveTime: '2026-06-21 08:30:00',
    priority: 'medium',
    isUrgent: false,
    isCountersign: false
  },
  {
    id: 'todo003',
    instanceId: 'inst003',
    title: '信息中心-办公设备采购申请',
    templateName: '采购申请',
    applicantName: '赵刚',
    applicantDept: '信息中心',
    currentNodeName: '公司领导审批',
    receiveTime: '2026-06-19 16:00:00',
    deadline: '2026-06-22 18:00:00',
    priority: 'high',
    isUrgent: false,
    isCountersign: true
  },
  {
    id: 'todo004',
    instanceId: 'inst004',
    title: '陈志强-赴京参加信息化研讨会',
    templateName: '出差申请',
    applicantName: '陈志强',
    applicantDept: '广州市供电局',
    currentNodeName: '公司领导审批',
    receiveTime: '2026-06-20 11:00:00',
    deadline: '2026-06-24 18:00:00',
    priority: 'medium',
    isUrgent: false,
    isCountersign: true
  },
  {
    id: 'todo005',
    instanceId: 'inst005',
    title: '信息中心-2026年技术服务合同',
    templateName: '合同审批',
    applicantName: '张明',
    applicantDept: '信息中心',
    currentNodeName: '财务部审核',
    receiveTime: '2026-06-21 10:00:00',
    priority: 'high',
    isUrgent: true,
    isCountersign: false
  },
  {
    id: 'todo006',
    instanceId: 'inst006',
    title: '人力资源部-招聘网站年度服务续约',
    templateName: '合同审批',
    applicantName: '王芳',
    applicantDept: '人力资源部',
    currentNodeName: '部门负责人审批',
    receiveTime: '2026-06-20 15:30:00',
    priority: 'low',
    isUrgent: false,
    isCountersign: false
  }
];

export const mockMyApprovals: ApprovalInstance[] = [
  {
    id: 'inst001',
    instanceNo: 'AP202606200001',
    templateId: 'tpl001',
    templateName: '请假申请',
    title: '2026年6月年假申请',
    formData: {
      leaveType: 'annual',
      startDate: '2026-06-25',
      endDate: '2026-06-27',
      days: 3,
      reason: '家中有事需处理'
    },
    status: 'pending',
    applicantId: 'u001',
    applicantName: '张明',
    applicantDept: '信息中心',
    currentNodeId: 'node_1',
    currentNodeName: '部门负责人审批',
    currentNode: defaultProcess.find(n => n.id === 'node_1')!,
    approvalNodes: defaultProcess,
    ccList: defaultCCList,
    isUrgent: false,
    isCountersign: false,
    canAddSign: true,
    createTime: '2026-06-20 09:00:00',
    updateTime: '2026-06-20 09:00:00',
    processHistory: [
      {
        id: 'hist001',
        nodeId: 'node_start',
        nodeName: '发起',
        operatorId: 'u001',
        operatorName: '张明',
        operation: 'approve',
        opinion: '发起申请',
        operateTime: '2026-06-20 09:00:00'
      }
    ]
  },
  {
    id: 'inst002',
    instanceNo: 'AP202605200001',
    templateId: 'tpl002',
    templateName: '报销申请',
    title: '2026年5月深圳出差差旅费报销',
    formData: {
      expenseType: 'travel',
      amount: 3580,
      startDate: '2026-05-15',
      endDate: '2026-05-17',
      description: '赴深圳局检查信息化建设工作'
    },
    status: 'approved',
    applicantId: 'u001',
    applicantName: '张明',
    applicantDept: '信息中心',
    currentNodeId: 'node_end',
    currentNodeName: '结束',
    currentNode: defaultProcess.find(n => n.id === 'node_end')!,
    approvalNodes: defaultProcess,
    ccList: defaultCCList,
    isUrgent: false,
    isCountersign: false,
    canAddSign: false,
    createTime: '2026-05-20 14:00:00',
    updateTime: '2026-05-22 16:30:00',
    processHistory: [
      {
        id: 'hist001',
        nodeId: 'node_start',
        nodeName: '发起',
        operatorId: 'u001',
        operatorName: '张明',
        operation: 'approve',
        opinion: '发起申请',
        operateTime: '2026-05-20 14:00:00'
      },
      {
        id: 'hist002',
        nodeId: 'node_1',
        nodeName: '部门负责人审批',
        operatorId: 'u002',
        operatorName: '李建国',
        operation: 'approve',
        opinion: '同意',
        operateTime: '2026-05-20 16:00:00'
      },
      {
        id: 'hist003',
        nodeId: 'node_2',
        nodeName: '财务部审核',
        operatorId: 'u003',
        operatorName: '王芳',
        operation: 'approve',
        opinion: '票据齐全，金额无误',
        operateTime: '2026-05-21 10:00:00'
      },
      {
        id: 'hist004',
        nodeId: 'node_3',
        nodeName: '公司领导审批',
        operatorId: 'u002',
        operatorName: '李建国',
        operation: 'approve',
        opinion: '同意报销',
        operateTime: '2026-05-22 16:30:00'
      }
    ]
  },
  {
    id: 'inst003',
    instanceNo: 'AP202606190001',
    templateId: 'tpl004',
    templateName: '出差申请',
    title: '赴北京参加国网信息化工作会议',
    formData: {
      destination: '北京',
      startDate: '2026-06-28',
      endDate: '2026-06-30',
      days: 3,
      purpose: '参加国家电网2026年度信息化工作会议，汇报我省信息化建设成果',
      transport: 'plane'
    },
    status: 'pending',
    applicantId: 'u001',
    applicantName: '张明',
    applicantDept: '信息中心',
    currentNodeId: 'node_2',
    currentNodeName: '财务部审核',
    currentNode: defaultProcess.find(n => n.id === 'node_2')!,
    approvalNodes: defaultProcess,
    ccList: defaultCCList,
    isUrgent: false,
    isCountersign: false,
    canAddSign: true,
    createTime: '2026-06-19 10:00:00',
    updateTime: '2026-06-20 09:30:00',
    processHistory: [
      {
        id: 'hist001',
        nodeId: 'node_start',
        nodeName: '发起',
        operatorId: 'u001',
        operatorName: '张明',
        operation: 'approve',
        opinion: '发起申请',
        operateTime: '2026-06-19 10:00:00'
      },
      {
        id: 'hist002',
        nodeId: 'node_1',
        nodeName: '部门负责人审批',
        operatorId: 'u002',
        operatorName: '李建国',
        operation: 'approve',
        opinion: '同意参加，请做好汇报准备',
        operateTime: '2026-06-20 09:30:00'
      }
    ]
  },
  {
    id: 'inst004',
    instanceNo: 'AP202606150001',
    templateId: 'tpl006',
    templateName: '印章使用',
    title: '项目合作协议用印',
    formData: {
      sealType: 'contract',
      documentName: '信息化建设项目合作协议',
      documentCount: 6,
      purpose: '与合作单位签订项目协议'
    },
    status: 'rejected',
    applicantId: 'u001',
    applicantName: '张明',
    applicantDept: '信息中心',
    currentNodeId: 'node_1',
    currentNodeName: '部门负责人审批',
    currentNode: defaultProcess.find(n => n.id === 'node_1')!,
    approvalNodes: defaultProcess,
    ccList: defaultCCList,
    isUrgent: false,
    isCountersign: false,
    canAddSign: true,
    createTime: '2026-06-15 11:00:00',
    updateTime: '2026-06-15 15:00:00',
    processHistory: [
      {
        id: 'hist001',
        nodeId: 'node_start',
        nodeName: '发起',
        operatorId: 'u001',
        operatorName: '张明',
        operation: 'approve',
        opinion: '发起申请',
        operateTime: '2026-06-15 11:00:00'
      },
      {
        id: 'hist002',
        nodeId: 'node_1',
        nodeName: '部门负责人审批',
        operatorId: 'u002',
        operatorName: '李建国',
        operation: 'reject',
        opinion: '请先将协议文本送法务部审核后再提交用印申请',
        operateTime: '2026-06-15 15:00:00'
      }
    ]
  }
];

export const mockApprovalDetail: ApprovalInstance = {
  id: 'inst001',
  instanceNo: 'AP202606210001',
  templateId: 'tpl001',
  templateName: '请假申请',
  title: '周杰-2026年6月年假申请',
  formData: {
    leaveType: 'annual',
    startDate: '2026-06-25',
    endDate: '2026-06-27',
    days: 3,
    reason: '家中有事需处理，已安排好工作交接。'
  },
  status: 'pending',
  applicantId: 'u008',
  applicantName: '周杰',
  applicantDept: '南山运维一班',
  currentNodeId: 'node_2',
  currentNodeName: '财务部审核',
  currentNode: defaultProcess.find(n => n.id === 'node_2')!,
  approvalNodes: defaultProcess,
  ccList: defaultCCList,
  isUrgent: true,
  isCountersign: false,
  canAddSign: true,
  createTime: '2026-06-20 09:00:00',
  updateTime: '2026-06-20 14:00:00',
  processHistory: commonHistory,
  attachments: [
    {
      id: 'att001',
      name: '请假单扫描件.pdf',
      url: '',
      size: 1024000
    }
  ]
};

export const mockApprovalStats = {
  todo: 6,
  approved: 128,
  rejected: 5,
  myInitiated: 16,
  myCompleted: 86
};
