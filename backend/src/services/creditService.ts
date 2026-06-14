import { AppDataSource } from '../data-source';
import { CompanyCredit } from '../entities/CompanyCredit';
import { Company } from '../entities/Company';
import { Job } from '../entities/Job';
import { JobMatch } from '../entities/JobMatch';

const creditRepository = AppDataSource.getRepository(CompanyCredit);
const companyRepository = AppDataSource.getRepository(Company);
const jobRepository = AppDataSource.getRepository(Job);
const jobMatchRepository = AppDataSource.getRepository(JobMatch);

interface CreditScoreResult {
  complianceScore: number;
  socialSecurityRate: number;
  turnoverRate: number;
  salaryOnTimeRate: number;
  overtimeCompliance: number;
  overallRating: number;
}

export const creditService = {
  async calculateCreditScore(companyId: number): Promise<{ success: boolean; message: string; data?: CreditScoreResult }> {
    try {
      const company = await companyRepository.findOne({
        where: { id: companyId }
      });

      if (!company) {
        return {
          success: false,
          message: '企业不存在'
        };
      }

      const jobs = await jobRepository.find({
        where: { companyId },
        relations: ['matches']
      });

      const totalJobs = jobs.length;
      const totalMatches = jobs.reduce((acc, job) => acc + (job.matches?.length || 0), 0);

      const complianceScore = this.calculateComplianceScore(company, jobs);
      const socialSecurityRate = this.calculateSocialSecurityRate(company);
      const turnoverRate = this.calculateTurnoverRate(company, jobs);
      const salaryOnTimeRate = this.calculateSalaryOnTimeRate(company, jobs);
      const overtimeCompliance = this.calculateOvertimeCompliance(company, jobs);

      const overallRating = Math.round(
        (complianceScore * 0.25 +
          socialSecurityRate * 0.25 +
          (100 - turnoverRate) * 0.2 +
          salaryOnTimeRate * 0.15 +
          overtimeCompliance * 0.15) * 100
      ) / 100;

      const evaluationPeriod = new Date().toISOString().slice(0, 7);
      const existingCredit = await creditRepository.findOne({
        where: { companyId, evaluationPeriod }
      });

      const creditData = {
        companyId,
        complianceScore,
        socialSecurityRate,
        turnoverRate,
        salaryOnTimeRate,
        overtimeCompliance,
        overallRating,
        evaluationPeriod
      };

      let savedCredit: CompanyCredit;
      if (existingCredit) {
        creditRepository.merge(existingCredit, creditData);
        savedCredit = await creditRepository.save(existingCredit);
      } else {
        savedCredit = await creditRepository.save(creditRepository.create(creditData));
      }

      return {
        success: true,
        message: '信用评分计算成功',
        data: {
          complianceScore: savedCredit.complianceScore,
          socialSecurityRate: savedCredit.socialSecurityRate,
          turnoverRate: savedCredit.turnoverRate,
          salaryOnTimeRate: savedCredit.salaryOnTimeRate,
          overtimeCompliance: savedCredit.overtimeCompliance,
          overallRating: savedCredit.overallRating
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '信用评分计算失败',
      };
    }
  },

  calculateComplianceScore(company: Company, jobs: Job[]): number {
    let score = 80;

    if (company.certifications) {
      const certs = company.certifications as Record<string, unknown>;
      if (certs.iso9001) score += 5;
      if (certs.iso14001) score += 5;
      if (certs.g7) score += 5;
    }

    if (company.status === 'approved') score += 5;

    const hasSensitiveWords = jobs.some(job => {
      const description = job.description || '';
      const title = job.title || '';
      const sensitivePatterns = ['无条件加班', '无偿加班', '义务加班'];
      return sensitivePatterns.some(pattern =>
        description.includes(pattern) || title.includes(pattern)
      );
    });

    if (hasSensitiveWords) score -= 20;

    return Math.min(100, Math.max(0, score));
  },

  calculateSocialSecurityRate(company: Company): number {
    let rate = 85;

    if (company.status === 'approved') rate = 95;

    if (company.certifications) {
      const certs = company.certifications as Record<string, unknown>;
      if (certs.iso9001) rate += 3;
    }

    return Math.min(100, Math.max(0, rate));
  },

  calculateTurnoverRate(company: Company, jobs: Job[]): number {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const recentJobs = jobs.filter(job => new Date(job.createdAt) >= sixMonthsAgo);
    const closedJobs = jobs.filter(job => job.status === 'inactive' && new Date(job.createdAt) >= sixMonthsAgo);

    if (recentJobs.length === 0) return 15;

    const turnoverRate = (closedJobs.length / recentJobs.length) * 100;

    return Math.round(Math.min(50, Math.max(5, turnoverRate)) * 100) / 100;
  },

  calculateSalaryOnTimeRate(company: Company, jobs: Job[]): number {
    let rate = 80;

    if (company.status === 'approved') rate = 92;

    const salaryRangeJobs = jobs.filter(job => job.salaryMin && job.salaryMax);
    if (salaryRangeJobs.length > 0) {
      rate += 5;
    }

    const hasVagueSalary = jobs.some(job => {
      const description = job.description || '';
      return description.includes('面议') && !job.salaryMin;
    });

    if (hasVagueSalary) rate -= 10;

    return Math.min(100, Math.max(0, rate));
  },

  calculateOvertimeCompliance(company: Company, jobs: Job[]): number {
    let score = 75;

    const overtimePatterns = [
      { pattern: '无条件加班', penalty: 25 },
      { pattern: '无偿加班', penalty: 25 },
      { pattern: '义务加班', penalty: 25 },
      { pattern: '弹性工作', penalty: 5 },
      { pattern: '接受加班', penalty: 5 },
      { pattern: '能吃苦', penalty: 3 },
      { pattern: '服从安排', penalty: 3 }
    ];

    jobs.forEach(job => {
      const description = job.description || '';
      const title = job.title || '';
      overtimePatterns.forEach(({ pattern, penalty }) => {
        if (description.includes(pattern) || title.includes(pattern)) {
          score -= penalty;
        }
      });
    });

    if (company.certifications) {
      const certs = company.certifications as Record<string, unknown>;
      if (certs.iso14001) score += 10;
    }

    return Math.min(100, Math.max(0, score));
  },

  async getCreditHistory(companyId: number) {
    try {
      const company = await companyRepository.findOne({
        where: { id: companyId }
      });

      if (!company) {
        return {
          success: false,
          message: '企业不存在'
        };
      }

      const creditHistory = await creditRepository.find({
        where: { companyId },
        order: { createdAt: 'DESC' }
      });

      return {
        success: true,
        data: creditHistory
      };
    } catch (error) {
      return {
        success: false,
        message: '获取信用历史失败',
        data: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async generateCreditReport(companyId: number) {
    try {
      const scoreResult = await this.calculateCreditScore(companyId);
      if (!scoreResult.success || !scoreResult.data) {
        return scoreResult;
      }

      const creditHistory = await this.getCreditHistory(companyId);
      if (!creditHistory.success) {
        return creditHistory;
      }

      const company = await companyRepository.findOne({
        where: { id: companyId }
      });

      const scoreData = scoreResult.data;

      const getRatingLevel = (score: number): string => {
        if (score >= 90) return '优秀';
        if (score >= 80) return '良好';
        if (score >= 70) return '中等';
        if (score >= 60) return '及格';
        return '较差';
      };

      const report = {
        companyId,
        companyName: company?.companyName,
        reportDate: new Date().toISOString(),
        overallRating: {
          score: scoreData.overallRating,
          level: getRatingLevel(scoreData.overallRating)
        },
        detailedScores: [
          {
            name: '用工合规评分',
            score: scoreData.complianceScore,
            level: getRatingLevel(scoreData.complianceScore),
            weight: 25,
            description: '评估企业用工制度的合规性，包括劳动合同、工作时间、休息休假等方面'
          },
          {
            name: '社保缴纳率',
            score: scoreData.socialSecurityRate,
            level: getRatingLevel(scoreData.socialSecurityRate),
            weight: 25,
            description: '评估企业社会保险缴纳的规范性和完整性'
          },
          {
            name: '离职率分析',
            score: 100 - scoreData.turnoverRate,
            level: getRatingLevel(100 - scoreData.turnoverRate),
            weight: 20,
            description: `近6个月平均离职率约 ${scoreData.turnoverRate}%，反映企业员工稳定性`
          },
          {
            name: '薪资准时发放率',
            score: scoreData.salaryOnTimeRate,
            level: getRatingLevel(scoreData.salaryOnTimeRate),
            weight: 15,
            description: '评估企业薪资发放的及时性和透明度'
          },
          {
            name: '加班合规评分',
            score: scoreData.overtimeCompliance,
            level: getRatingLevel(scoreData.overtimeCompliance),
            weight: 15,
            description: '评估企业加班制度的合规性，是否存在强制加班、无偿加班等情况'
          }
        ],
        history: creditHistory.data,
        recommendations: this.generateRecommendations(scoreData)
      };

      return {
        success: true,
        message: '信用报告生成成功',
        data: report
      };
    } catch (error) {
      return {
        success: false,
        message: '生成信用报告失败',
        data: error instanceof Error ? error.message : String(error)
      };
    }
  },

  generateRecommendations(scoreData: CreditScoreResult): string[] {
    const recommendations: string[] = [];

    if (scoreData.complianceScore < 80) {
      recommendations.push('建议完善用工合规制度，确保劳动合同、工作时间等方面符合劳动法规定');
    }

    if (scoreData.socialSecurityRate < 90) {
      recommendations.push('建议规范社会保险缴纳，确保员工社保权益');
    }

    if (scoreData.turnoverRate > 25) {
      recommendations.push('员工离职率偏高，建议改善工作环境、优化薪酬福利体系');
    }

    if (scoreData.salaryOnTimeRate < 85) {
      recommendations.push('建议提高薪资透明度，明确薪资范围和发放时间');
    }

    if (scoreData.overtimeCompliance < 70) {
      recommendations.push('建议审查加班制度，避免强制加班、无偿加班等违规行为，确保加班工资按时发放');
    }

    if (scoreData.overallRating >= 80) {
      recommendations.push('企业信用状况良好，建议继续保持并争取更高的信用评级');
    }

    if (recommendations.length === 0) {
      recommendations.push('企业信用状况优秀，各项指标均达到良好水平');
    }

    return recommendations;
  }
};
