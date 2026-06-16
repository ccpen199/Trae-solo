import { mockPolicies, mockAtomicServices, mockPolicyPushRecords } from '../data/mockData';
import type { PolicyDocument, AtomicService, OrchestrationFlow, PolicyPushRecord } from '../../shared/types';
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
      },
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
