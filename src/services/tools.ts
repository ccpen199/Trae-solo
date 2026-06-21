import { get, post } from './request';
import { AIMessage, DocumentTemplate, CalculatorResult } from '@/types';
import {
  calculateCourtFee,
  calculateInjuryCompensation,
  calculateInterest,
  calculatePenalty,
  calculateLawyerFee,
  calculateDelayInterest,
  calculateTax,
} from '@/utils/calculator';

export const toolsApi = {
  calculateCourtFee: (amount: number, caseType: string): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateCourtFee(amount, caseType as any));
      }, 300);
    });
  },

  calculateInjury: (level: number, salary: number, medicalExpenses: number, hospitalDays: number, region: string): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateInjuryCompensation(level, salary, medicalExpenses, hospitalDays, region));
      }, 300);
    });
  },

  calculateInterest: (principal: number, annualRate: number, days: number, type: string): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateInterest(principal, annualRate, days, type as any));
      }, 300);
    });
  },

  calculatePenalty: (contractAmount: number, penaltyRate: number, delayDays: number, actualLoss: number): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculatePenalty(contractAmount, penaltyRate, delayDays, actualLoss));
      }, 300);
    });
  },

  calculateLawyerFee: (amount: number, region: string, caseType: string): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateLawyerFee(amount, region, caseType));
      }, 300);
    });
  },

  calculateDelayInterest: (judgmentAmount: number, delayDays: number, generalInterestRate: number): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateDelayInterest(judgmentAmount, delayDays, generalInterestRate));
      }, 300);
    });
  },

  calculateTax: (income: number, type: string): Promise<CalculatorResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateTax(income, type as any));
      }, 300);
    });
  },

  sendAIMessage: (content: string, history: AIMessage[]): Promise<AIMessage> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockCitations = [
          {
            law: '中华人民共和国民法典',
            article: '第五百七十七条',
            content: '当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。',
          },
        ];

        const mockCases = [
          {
            id: 'case-001',
            title: '某科技公司与某贸易公司买卖合同纠纷案',
            caseNumber: '(2023)京01民初123号',
            court: '北京市第一中级人民法院',
            date: '2023-06-15',
            similarity: 0.85,
            summary: '法院认为，被告未按合同约定支付货款，已构成违约，应当承担违约责任。',
          },
        ];

        const response: AIMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `根据您的问题，结合相关法律规定，答复如下：\n\n1. **法律分析**：\n您所咨询的合同违约问题，根据《民法典》第五百七十七条规定，当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。\n\n2. **操作建议**：\n- 首先，建议您先收集相关证据，包括合同、付款凭证、沟通记录等；\n- 其次，可以先尝试与对方协商解决；\n- 若协商不成，可以向法院提起诉讼，主张对方承担违约责任。\n\n3. **证据清单：\n- 合同原件及复印件\n- 已履行义务的证据\n- 对方违约的证据\n- 损失计算依据`,
          citations: mockCitations,
          relatedCases: mockCases,
          timestamp: new Date().toISOString(),
        };

        resolve(response);
      }, 1000);
    });
  },

  getTemplateList: (params?: { category?: string; keyword?: string }): Promise<DocumentTemplate[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const templates: DocumentTemplate[] = [
          { id: 'tpl-001', name: '民事起诉状模板', category: '诉讼文书', description: '适用于民事诉讼的民事起诉', fileType: 'docx', fileSize: 24576, downloadCount: 1523, createdAt: '2024-01-15' },
          { id: 'tpl-002', name: '答辩状模板', category: '诉讼文书', description: '适用于民事诉讼答辩', fileType: 'docx', fileSize: 18432, downloadCount: 986, createdAt: '2024-01-10' },
          { id: 'tpl-003', name: '委托代理合同', category: '合同范本', description: '律师委托代理合同标准模板', fileType: 'docx', fileSize: 32768, downloadCount: 2341, createdAt: '2024-01-05' },
          { id: 'tpl-004', name: '劳动合同模板', category: '合同范本', description: '企业劳动合同标准模板', fileType: 'docx', fileSize: 28672, downloadCount: 5672, createdAt: '2024-01-01' },
          { id: 'tpl-005', name: '律师函模板', category: '法律文书', description: '律师函标准模板', fileType: 'docx', fileSize: 15360, downloadCount: 3421, createdAt: '2023-12-28' },
          { id: 'tpl-006', name: '股权转让协议', category: '合同范本', description: '有限责任公司股权转让协议', fileType: 'docx', fileSize: 40960, downloadCount: 1876, createdAt: '2023-12-25' },
        ];

        let result = templates;
        if (params?.category) {
          result = templates.filter(t => t.category === params.category);
        }
        if (params?.keyword) {
          result = result.filter(t => 
            t.name.includes(params.keyword!) || t.description.includes(params.keyword!));
        }
        resolve(result);
      }, 500);
    });
  },

  downloadTemplate: (id: string): Promise<Blob> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const content = '这是法律文书模板内容...';
        resolve(new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      }, 500);
    });
  },

  generateReport: (companyId: string, reportType: string, format: 'pdf' | 'docx'): Promise<Blob> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const content = `企业尽职调查报告\n\n调查时间：${new Date().toLocaleDateString()}\n\n一、企业基本信息\n...\n\n二、法律风险分析\n...\n\n三、结论与建议\n...`;
        resolve(new Blob([content], { 
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        }));
      }, 1500);
    });
  },

  getReportHistory: (): Promise<any[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'report-001', name: '某科技公司尽职调查报告', type: '尽职调查', companyName: '北京某科技有限公司', createdAt: '2024-03-10', format: 'pdf' },
          { id: 'report-002', name: '某贸易公司信用报告', type: '信用报告', companyName: '上海某贸易有限公司', createdAt: '2024-03-05', format: 'docx' },
        ]);
      }, 300);
    });
  },
};
