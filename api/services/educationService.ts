import { v4 as uuidv4 } from 'uuid';
import { mockSchools } from '../data/mockData';
import type { School, EnrollmentApplication } from '../../shared/types';

export interface EnrollmentRequest {
  userId: string;
  childName: string;
  childIdCard: string;
  schoolId: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentIdCard: string;
  documents: {
    householdRegister?: string;
    propertyProof?: string;
    socialSecurity?: string;
  };
}

export class EducationService {
  async getSchools(type?: 'primary' | 'middle' | 'high', district?: string): Promise<School[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let schools = [...mockSchools];
    if (type) {
      schools = schools.filter(s => s.type === type);
    }
    if (district) {
      schools = schools.filter(s => s.district === district);
    }
    return schools;
  }

  async getSchoolByAddress(address: string): Promise<{ school: School | null; confidence: number }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const keywords = ['滨湖', '天桃', '民主', '秀田'];
    for (const kw of keywords) {
      if (address.includes(kw)) {
        const school = mockSchools.find(s => s.name.includes(kw));
        if (school) {
          return { school, confidence: 0.95 };
        }
      }
    }
    return { school: mockSchools[0], confidence: 0.75 };
  }

  async submitEnrollment(request: EnrollmentRequest): Promise<{ applicationId: string; status: string; estimatedReviewDate: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const applicationId = uuidv4();
    const estimatedReviewDate = new Date();
    estimatedReviewDate.setDate(estimatedReviewDate.getDate() + 15);
    return {
      applicationId,
      status: 'pending',
      estimatedReviewDate: estimatedReviewDate.toISOString().split('T')[0],
    };
  }

  async getEnrollmentStatus(applicationId: string): Promise<EnrollmentApplication | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: applicationId,
      childName: '张小明',
      childIdCard: '450101201801010001',
      schoolId: 's001',
      status: 'reviewing',
      reviewComment: '材料审核中，请耐心等待',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async getEnrollmentList(userId: string): Promise<EnrollmentApplication[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: uuidv4(),
        childName: '张小明',
        childIdCard: '450101201801010001',
        schoolId: 's001',
        status: 'reviewing',
        reviewComment: '材料审核中，请耐心等待',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async getEnrollmentGuidelines(): Promise<{
    title: string;
    content: string;
    timeline: Array<{ date: string; event: string }>;
    requiredDocuments: string[];
  }> {
    return {
      title: '南宁市2024年小学入学报名指南',
      content: '根据《中华人民共和国义务教育法》和自治区教育厅有关文件精神，结合我市实际，现就做好2024年我市小学入学报名工作通知如下...',
      timeline: [
        { date: '6月1日-6月15日', event: '网上报名' },
        { date: '6月20日-6月30日', event: '材料审核' },
        { date: '7月5日', event: '公布录取结果' },
        { date: '7月10日', event: '新生注册' },
      ],
      requiredDocuments: [
        '户口本（父母及子女）',
        '父母身份证',
        '房产证或购房合同（本市户籍）',
        '居住证（非本市户籍）',
        '社保缴费证明（非本市户籍）',
        '儿童预防接种证',
      ],
    };
  }
}

export const educationService = new EducationService();
