import { mockPolicies, mockAtomicServices, mockPolicyPushRecords } from '../data/mockData';
import type { PolicyDocument, AtomicService, OrchestrationFlow, PolicyPushRecord, FlowReleaseRecord, ServiceStats, ServiceCallRecord, ServiceDependency, FlowNodeProperty } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class GovernmentService {
  async getPolicies(category?: string, keyword?: string, page: number = 1, pageSize: number = 10): Promise<{ total: number; policies: PolicyDocument[] }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let policies = [...mockPolicies];
    if (category && category !== 'all') {
      policies = policies.filter(p => p.category === category);
    }
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      policies = policies.filter(p => 
        p.title.toLowerCase().includes(lowerKeyword) || 
        p.content.toLowerCase().includes(lowerKeyword) ||
        p.tags.some(t => t.toLowerCase().includes(lowerKeyword))
      );
    }
    const start = (page - 1) * pageSize;
    return {
      total: policies.length,
      policies: policies.slice(start, start + pageSize),
    };
  }

  async getPolicyDetail(policyId: string): Promise<PolicyDocument | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPolicies.find(p => p.id === policyId) || null;
  }

  async getPolicyInterpretation(policyId: string): Promise<{ interpretation: string; keyPoints: string[]; relatedPolicies: PolicyDocument[] } | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const policy = mockPolicies.find(p => p.id === policyId);
    if (!policy) return null;

    return {
      interpretation: policy.aiInterpretation || 'AI解读生成中...',
      keyPoints: policy.structuredContent.flatMap(s => s.keyPoints || []),
      relatedPolicies: mockPolicies.filter(p => p.id !== policyId && p.tags.some(t => policy.tags.includes(t))),
    };
  }

  async getRelatedPolicies(policyId: string): Promise<PolicyDocument[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const policy = mockPolicies.find(p => p.id === policyId);
    if (!policy) return [];
    
    return mockPolicies
      .filter(p => p.id !== policyId && (p.category === policy.category || p.tags.some(t => policy.tags.includes(t))))
      .slice(0, 3);
  }

  async getPolicyPushRecords(): Promise<PolicyPushRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockPolicyPushRecords];
  }

  async markPolicyAsRead(recordId: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const record = mockPolicyPushRecords.find(r => r.id === recordId);
    if (record) {
      record.read = true;
      return { success: true };
    }
    return { success: false };
  }

  async structurePolicy(content: string): Promise<{ sections: Array<{ title: string; level: number; content: string; keyPoints?: string[] }> }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const lines = content.split('\n').filter(l => l.trim());
    const sections: Array<{ title: string; level: number; content: string; keyPoints?: string[] }> = [];
    let currentSection: typeof sections[0] | null = null;

    for (const line of lines) {
      const level1Match = line.match(/^[一二三四五六七八九十]+、/);
      const level2Match = line.match(/^（[一二三四五六七八九十]+）/);
      if (level1Match) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: line, level: 1, content: '' };
      } else if (level2Match && currentSection) {
        currentSection.keyPoints = currentSection.keyPoints || [];
        currentSection.keyPoints.push(line);
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    if (currentSection) sections.push(currentSection);

    return { sections };
  }

  async getGovernmentServices(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    requiredMaterials: string[];
    processingTime: string;
    fee: string;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'svc001',
        name: '身份证补办',
        category: '户籍证件',
        description: '居民身份证丢失、损坏后申请补办',
        requiredMaterials: ['户口本', '身份证照片回执', '补办申请表'],
        processingTime: '15个工作日',
        fee: '40元',
      },
      {
        id: 'svc002',
        name: '社保转移',
        category: '社会保障',
        description: '跨统筹地区职工基本养老保险关系转移接续',
        requiredMaterials: ['身份证', '社保卡', '缴费凭证'],
        processingTime: '45个工作日',
        fee: '免费',
      },
      {
        id: 'svc003',
        name: '不动产登记',
        category: '房产登记',
        description: '国有建设用地使用权及房屋所有权首次登记',
        requiredMaterials: ['身份证', '不动产权属证书', '完税凭证', '测绘报告'],
        processingTime: '30个工作日',
        fee: '住宅80元/件，非住宅550元/件',
      },
    ];
  }

  async submitApplication(serviceId: string, userId: string, formData: Record<string, any>): Promise<{ applicationId: string; status: string; estimatedDate: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 15);
    return {
      applicationId: uuidv4(),
      status: 'received',
      estimatedDate: estimatedDate.toISOString().split('T')[0],
    };
  }
}

export class OrchestrationService {
  async getAtomicServices(category?: string): Promise<AtomicService[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let services = [...mockAtomicServices];
    if (category) {
      services = services.filter(s => s.category === category);
    }
    return services;
  }

  async getServiceDetail(serviceId: string): Promise<AtomicService | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAtomicServices.find(s => s.id === serviceId) || null;
  }

  async createFlow(name: string, description: string, flowDefinition: Record<string, any>, triggerServiceId?: string): Promise<{ flowId: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newFlow: OrchestrationFlow = {
      id: uuidv4(),
      name,
      description,
      flowDefinition,
      triggerServiceId,
      isEnabled: true,
      createdAt: new Date().toISOString(),
    };
    return { flowId: newFlow.id };
  }

  async getFlows(): Promise<OrchestrationFlow[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: uuidv4(),
        name: '入学报名全流程',
        description: '小学入学报名自动审核流程',
        flowDefinition: {
          nodes: [
            { id: 'start', type: 'start', label: '开始' },
            { id: 'validate', type: 'service', serviceId: 'school_query_district', label: '学区验证' },
            { id: 'check_materials', type: 'service', serviceId: 'identity_verify_face', label: '身份核验' },
            { id: 'submit', type: 'end', label: '提交成功' },
          ],
          edges: [
            { source: 'start', target: 'validate' },
            { source: 'validate', target: 'check_materials' },
            { source: 'check_materials', target: 'submit' },
          ],
        },
        isEnabled: true,
        createdAt: '2024-01-01',
        currentVersion: 'v1.2.0',
        lastReleaseTime: '2024-05-20 14:30:00',
        lastPublisher: '管理员',
        stats: {
          executionCount: 1234,
          successRate: 98.5,
          avgDuration: 2.3,
        },
      },
      {
        id: uuidv4(),
        name: '就医挂号全流程',
        description: '医院挂号缴费一体化流程',
        flowDefinition: {
          nodes: [
            { id: 'start', type: 'start', label: '开始' },
            { id: 'query_dept', type: 'service', serviceId: 'hospital_query_departments', label: '查询科室' },
            { id: 'generate_qr', type: 'service', serviceId: 'brt_generate_qr', label: '生成就医码' },
            { id: 'end', type: 'end', label: '完成' },
          ],
          edges: [
            { source: 'start', target: 'query_dept' },
            { source: 'query_dept', target: 'generate_qr' },
            { source: 'generate_qr', target: 'end' },
          ],
        },
        isEnabled: true,
        createdAt: '2024-01-15',
        currentVersion: 'v1.0.3',
        lastReleaseTime: '2024-06-10 09:15:00',
        lastPublisher: '李科长',
        stats: {
          executionCount: 856,
          successRate: 96.8,
          avgDuration: 3.1,
        },
      },
      {
        id: uuidv4(),
        name: '违章处理流程',
        description: '交通违章查询与缴费自动化处理',
        flowDefinition: {
          nodes: [
            { id: 'start', type: 'start', label: '开始' },
            { id: 'verify', type: 'service', serviceId: 'identity_verify_face', label: '身份认证' },
            { id: 'query', type: 'service', label: '查询违章记录' },
            { id: 'calculate', type: 'service', label: '计算罚款金额' },
            { id: 'pay', type: 'service', label: '生成支付订单' },
            { id: 'notify', type: 'service', label: '发送通知' },
            { id: 'end', type: 'end', label: '结束' },
          ],
          edges: [],
        },
        isEnabled: false,
        createdAt: '2024-03-01',
        currentVersion: 'v2.0.0',
        lastReleaseTime: '2024-06-15 16:45:00',
        lastPublisher: '王工程师',
        stats: {
          executionCount: 567,
          successRate: 99.2,
          avgDuration: 4.5,
        },
      },
    ];
  }

  async getFlowReleaseRecords(flowId: string): Promise<FlowReleaseRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: uuidv4(),
        flowId,
        version: 'v1.2.0',
        releaseTime: '2024-05-20 14:30:00',
        publisher: '管理员',
        publisherId: 'admin-001',
        changeLog: '优化学区验证算法，提升识别准确率；增加材料审核并行处理能力，缩短处理时间。',
        status: 'success',
        flowDefinitionSnapshot: {},
      },
      {
        id: uuidv4(),
        flowId,
        version: 'v1.1.0',
        releaseTime: '2024-04-15 10:20:00',
        publisher: '李科长',
        publisherId: 'admin-002',
        changeLog: '新增身份核验节点，接入人脸识别服务；修复网络异常时的重试机制问题。',
        status: 'success',
        flowDefinitionSnapshot: {},
      },
      {
        id: uuidv4(),
        flowId,
        version: 'v1.0.1',
        releaseTime: '2024-03-28 16:00:00',
        publisher: '王工程师',
        publisherId: 'admin-003',
        changeLog: '修复提交成功后状态未更新的Bug；优化错误提示信息。',
        status: 'rollback',
        flowDefinitionSnapshot: {},
      },
      {
        id: uuidv4(),
        flowId,
        version: 'v1.0.0',
        releaseTime: '2024-01-01 08:00:00',
        publisher: '管理员',
        publisherId: 'admin-001',
        changeLog: '首次发布，包含学区验证、身份核验、提交三个核心节点。',
        status: 'success',
        flowDefinitionSnapshot: {},
      },
    ];
  }

  async rollbackFlow(flowId: string, version: string): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: `已成功回滚到版本 ${version}` };
  }

  async compareFlowVersions(flowId: string, version1: string, version2: string): Promise<{ diff: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      diff: [
        `版本 ${version2} 新增「并行处理」配置`,
        `版本 ${version2} 优化「学区验证」节点参数`,
        `版本 ${version2} 调整节点执行超时时间从 30s 到 60s`,
        `版本 ${version2} 新增异常处理分支`,
      ],
    };
  }

  async getServiceStats(serviceId: string): Promise<ServiceStats> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      serviceId,
      callCount: Math.floor(5000 + Math.random() * 10000),
      avgDuration: Math.round((0.1 + Math.random() * 2) * 100) / 100,
      successRate: Math.round((95 + Math.random() * 5) * 10) / 10,
      errorCount: Math.floor(Math.random() * 50),
      lastCallTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    };
  }

  async getServiceCallRecords(serviceId: string): Promise<ServiceCallRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const service = mockAtomicServices.find(s => s.id === serviceId);
    const records: ServiceCallRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push({
        id: uuidv4(),
        serviceId,
        serviceName: service?.name || '未知服务',
        callTime: new Date(Date.now() - i * 300000 - Math.random() * 60000).toISOString(),
        duration: Math.round((0.1 + Math.random() * 3) * 100) / 100,
        status: Math.random() > 0.05 ? 'success' : 'failed',
        caller: ['入学报名流程', '就医挂号流程', '违章处理流程'][Math.floor(Math.random() * 3)],
      });
    }
    return records;
  }

  async getServiceDependencies(serviceId: string): Promise<ServiceDependency[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      { source: '身份认证服务', target: '学区查询服务', label: '用户信息' },
      { source: '学区查询服务', target: '学校信息服务', label: '学校ID' },
      { source: '学校信息服务', target: '报名提交服务', label: '报名信息' },
      { source: '报名提交服务', target: '消息通知服务', label: '通知数据' },
    ];
  }

  async getNodeProperties(nodeId: string, serviceId?: string): Promise<FlowNodeProperty[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (nodeId === 'start') {
      return [
        { key: 'nodeName', name: '节点名称', type: 'string', required: true, value: '开始', description: '流程起始节点的显示名称' },
        { key: 'timeout', name: '超时时间(秒)', type: 'number', required: false, value: 30, description: '节点执行超时时间' },
        { key: 'autoContinue', name: '自动继续', type: 'boolean', required: false, value: true, description: '是否自动进入下一节点' },
      ];
    }
    if (nodeId === 'end') {
      return [
        { key: 'nodeName', name: '节点名称', type: 'string', required: true, value: '结束', description: '流程结束节点的显示名称' },
        { key: 'notifyOnComplete', name: '完成通知', type: 'boolean', required: false, value: false, description: '流程完成时是否发送通知' },
        { key: 'notificationType', name: '通知类型', type: 'select', required: false, value: 'sms', options: [{ label: '短信', value: 'sms' }, { label: 'APP推送', value: 'push' }, { label: '邮件', value: 'email' }] },
      ];
    }
    return [
      { key: 'nodeName', name: '节点名称', type: 'string', required: true, value: '服务节点', description: '节点的显示名称' },
      { key: 'serviceId', name: '关联服务', type: 'select', required: true, value: serviceId || '', options: mockAtomicServices.map(s => ({ label: s.name, value: s.id })) },
      { key: 'timeout', name: '超时时间(秒)', type: 'number', required: false, value: 30, description: '服务调用超时时间' },
      { key: 'retryCount', name: '重试次数', type: 'number', required: false, value: 3, description: '失败时的重试次数' },
      { key: 'ignoreError', name: '忽略错误', type: 'boolean', required: false, value: false, description: '是否忽略错误继续执行' },
      { key: 'description', name: '节点说明', type: 'textarea', required: false, value: '', description: '节点的详细说明' },
    ];
  }

  async executeFlow(flowId: string, params: Record<string, any>): Promise<{ success: boolean; result: Record<string, any> }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      result: {
        flowId,
        executedAt: new Date().toISOString(),
        steps: [
          { step: 1, service: '身份验证', status: 'completed' },
          { step: 2, service: '数据查询', status: 'completed' },
          { step: 3, service: '业务办理', status: 'completed' },
        ],
        output: params,
      },
    };
  }
}

export const governmentService = new GovernmentService();
export const orchestrationService = new OrchestrationService();
