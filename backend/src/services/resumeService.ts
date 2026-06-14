import { AppDataSource } from '../data-source';
import { Resume } from '../entities/Resume';
import { Portfolio, PortfolioType } from '../entities/Portfolio';
import { Job } from '../entities/Job';
import { JobMatch } from '../entities/JobMatch';

const resumeRepository = AppDataSource.getRepository(Resume);
const portfolioRepository = AppDataSource.getRepository(Portfolio);
const jobRepository = AppDataSource.getRepository(Job);
const jobMatchRepository = AppDataSource.getRepository(JobMatch);

interface WorkExperience {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  gravureExperienceYears?: number;
  offsetExperienceYears?: number;
  flexoExperienceYears?: number;
  description?: string;
  [key: string]: unknown;
}

interface Skill {
  name?: string;
  psPlateSoftwareProficiency?: number;
  ctpOperationProficiency?: number;
  colorManagementProficiency?: number;
  [key: string]: unknown;
}

interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
  isoCertificationExperience?: string;
  [key: string]: unknown;
}

interface ResumeData {
  name: string;
  gender?: string;
  age?: number;
  phone: string;
  email: string;
  education?: string;
  workExperience?: WorkExperience[];
  skills?: Skill[];
  certifications?: Certification[];
  expectedSalary?: number;
  expectedPosition?: string;
}

interface PortfolioData {
  type?: PortfolioType;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
}

export const resumeService = {
  async createOrUpdateResume(userId: number, resumeData: ResumeData) {
    try {
      let resume = await resumeRepository.findOne({
        where: { userId }
      });

      if (resume) {
        resumeRepository.merge(resume, resumeData);
      } else {
        resume = resumeRepository.create({
          userId,
          ...resumeData
        });
      }

      const savedResume = await resumeRepository.save(resume);
      return {
        success: true,
        message: resume ? '简历更新成功' : '简历创建成功',
        data: savedResume
      };
    } catch (error) {
      return {
        success: false,
        message: '简历操作失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async addPortfolioItem(userId: number, portfolioData: PortfolioData) {
    try {
      const resume = await resumeRepository.findOne({
        where: { userId }
      });

      if (!resume) {
        return {
          success: false,
          message: '请先完善简历信息'
        };
      }

      const portfolio = portfolioRepository.create({
        resumeId: resume.id,
        type: portfolioData.type || 'printing',
        title: portfolioData.title,
        description: portfolioData.description,
        fileUrl: portfolioData.fileUrl,
        thumbnailUrl: portfolioData.thumbnailUrl
      });

      const savedPortfolio = await portfolioRepository.save(portfolio);
      return {
        success: true,
        message: '作品集添加成功',
        data: savedPortfolio
      };
    } catch (error) {
      return {
        success: false,
        message: '作品集添加失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async deletePortfolioItem(userId: number, portfolioId: number) {
    try {
      const resume = await resumeRepository.findOne({
        where: { userId }
      });

      if (!resume) {
        return {
          success: false,
          message: '简历不存在'
        };
      }

      const portfolio = await portfolioRepository.findOne({
        where: { id: portfolioId, resumeId: resume.id }
      });

      if (!portfolio) {
        return {
          success: false,
          message: '作品集不存在或无权删除'
        };
      }

      await portfolioRepository.delete(portfolioId);
      return {
        success: true,
        message: '作品集删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: '作品集删除失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getPortfoliosByUserId(userId: number) {
    try {
      const resume = await resumeRepository.findOne({
        where: { userId }
      });

      if (!resume) {
        return {
          success: true,
          data: []
        };
      }

      const portfolios = await portfolioRepository.find({
        where: { resumeId: resume.id },
        order: { createdAt: 'DESC' }
      });

      return {
        success: true,
        data: portfolios
      };
    } catch (error) {
      return {
        success: false,
        message: '获取作品集失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getResumeByUserId(userId: number) {
    try {
      const resume = await resumeRepository.findOne({
        where: { userId },
        relations: ['portfolios']
      });

      if (!resume) {
        return {
          success: false,
          message: '简历不存在'
        };
      }

      return {
        success: true,
        data: resume
      };
    } catch (error) {
      return {
        success: false,
        message: '获取简历失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async applyJob(userId: number, jobId: number) {
    try {
      const resume = await resumeRepository.findOne({
        where: { userId }
      });

      if (!resume) {
        return {
          success: false,
          message: '请先完善简历信息'
        };
      }

      const job = await jobRepository.findOne({
        where: { id: jobId, status: 'active' }
      });

      if (!job) {
        return {
          success: false,
          message: '岗位不存在或已关闭'
        };
      }

      const existingApplication = await jobMatchRepository.findOne({
        where: { resumeId: resume.id, jobId }
      });

      if (existingApplication) {
        return {
          success: false,
          message: '您已申请过该岗位'
        };
      }

      const jobMatch = jobMatchRepository.create({
        jobId,
        resumeId: resume.id,
        status: 'applied'
      });

      const savedMatch = await jobMatchRepository.save(jobMatch);
      return {
        success: true,
        message: '申请成功',
        data: savedMatch
      };
    } catch (error) {
      return {
        success: false,
        message: '申请失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getMyApplications(userId: number, page: number = 1, pageSize: number = 10) {
    try {
      const resume = await resumeRepository.findOne({
        where: { userId }
      });

      if (!resume) {
        return {
          success: false,
          message: '简历不存在'
        };
      }

      const skip = (page - 1) * pageSize;

      const [applications, total] = await jobMatchRepository.findAndCount({
        where: { resumeId: resume.id },
        relations: ['job', 'job.company'],
        skip,
        take: pageSize,
        order: { recommendedAt: 'DESC' }
      });

      return {
        success: true,
        data: {
          list: applications,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取申请列表失败',
        data: error instanceof Error ? error.message : error
      };
    }
  }
};
