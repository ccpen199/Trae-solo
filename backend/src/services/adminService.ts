import { AppDataSource } from '../data-source';
import { Company } from '../entities/Company';
import { User } from '../entities/User';
import { SensitiveWord, SensitiveWordCategory } from '../entities/SensitiveWord';
import { Job } from '../entities/Job';
import { Resume } from '../entities/Resume';
import { CommunityPost } from '../entities/CommunityPost';
import { JobMatch } from '../entities/JobMatch';

const companyRepository = AppDataSource.getRepository(Company);
const userRepository = AppDataSource.getRepository(User);
const sensitiveWordRepository = AppDataSource.getRepository(SensitiveWord);
const jobRepository = AppDataSource.getRepository(Job);
const resumeRepository = AppDataSource.getRepository(Resume);
const postRepository = AppDataSource.getRepository(CommunityPost);
const jobMatchRepository = AppDataSource.getRepository(JobMatch);

interface EnterpriseFilters {
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

interface JobseekerFilters {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

interface SensitiveWordData {
  word: string;
  category?: SensitiveWordCategory;
  riskLevel?: string;
  replacement?: string;
  enabled?: boolean;
}

interface WarningItem {
  id: number;
  type: string;
  content: string;
  source: string;
  sourceId: number;
  matchedWord: string;
  riskLevel: string;
  createdAt: Date;
}

export const adminService = {
  async getEnterpriseList(filters: EnterpriseFilters = {}) {
    try {
      const queryBuilder = companyRepository
        .createQueryBuilder('company')
        .leftJoinAndSelect('company.user', 'user')
        .leftJoinAndSelect('company.jobs', 'jobs');

      if (filters.status) {
        queryBuilder.andWhere('company.status = :status', { status: filters.status });
      }

      if (filters.keyword) {
        queryBuilder.andWhere(
          '(company.companyName LIKE :keyword OR company.industry LIKE :keyword OR user.email LIKE :keyword)',
          { keyword: `%${filters.keyword}%` }
        );
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const skip = (page - 1) * pageSize;

      queryBuilder.skip(skip).take(pageSize).orderBy('company.createdAt', 'DESC');

      const [companies, total] = await queryBuilder.getManyAndCount();

      const processedCompanies = companies.map((company: any) => {
        if (company.user) {
          const { password, ...userWithoutPassword } = company.user;
          company.user = userWithoutPassword;
        }
        return company;
      });

      return {
        success: true,
        data: {
          list: processedCompanies,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取企业列表失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getJobseekerList(filters: JobseekerFilters = {}) {
    try {
      const queryBuilder = userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.resumes', 'resumes')
        .leftJoinAndSelect('user.companies', 'companies')
        .where('user.role = :role', { role: 'jobseeker' });

      if (filters.keyword) {
        queryBuilder.andWhere(
          '(user.name LIKE :keyword OR user.email LIKE :keyword OR user.phone LIKE :keyword)',
          { keyword: `%${filters.keyword}%` }
        );
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const skip = (page - 1) * pageSize;

      queryBuilder.skip(skip).take(pageSize).orderBy('user.createdAt', 'DESC');

      const [users, total] = await queryBuilder.getManyAndCount();

      const processedUsers = users.map((user: any) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return {
        success: true,
        data: {
          list: processedUsers,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取求职者列表失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async manageSensitiveWord(action: 'add' | 'update' | 'delete', wordData: SensitiveWordData & { id?: number }) {
    try {
      if (action === 'add') {
        const existingWord = await sensitiveWordRepository.findOne({
          where: { word: wordData.word }
        });

        if (existingWord) {
          return {
            success: false,
            message: '该敏感词已存在'
          };
        }

        const sensitiveWord = sensitiveWordRepository.create({
          word: wordData.word,
          category: wordData.category || 'other',
          riskLevel: wordData.riskLevel || 'medium',
          replacement: wordData.replacement,
          enabled: wordData.enabled !== false
        });

        const savedWord = await sensitiveWordRepository.save(sensitiveWord);
        return {
          success: true,
          message: '敏感词添加成功',
          data: savedWord
        };
      } else if (action === 'update') {
        if (!wordData.id) {
          return {
            success: false,
            message: '缺少敏感词ID'
          };
        }

        const sensitiveWord = await sensitiveWordRepository.findOne({
          where: { id: wordData.id }
        });

        if (!sensitiveWord) {
          return {
            success: false,
            message: '敏感词不存在'
          };
        }

        sensitiveWordRepository.merge(sensitiveWord, {
          word: wordData.word,
          category: wordData.category,
          riskLevel: wordData.riskLevel,
          replacement: wordData.replacement,
          enabled: wordData.enabled
        });

        const updatedWord = await sensitiveWordRepository.save(sensitiveWord);
        return {
          success: true,
          message: '敏感词更新成功',
          data: updatedWord
        };
      } else if (action === 'delete') {
        if (!wordData.id) {
          return {
            success: false,
            message: '缺少敏感词ID'
          };
        }

        const result = await sensitiveWordRepository.delete(wordData.id);
        if (result.affected === 0) {
          return {
            success: false,
            message: '敏感词不存在'
          };
        }

        return {
          success: true,
          message: '敏感词删除成功'
        };
      }

      return {
        success: false,
        message: '无效的操作类型'
      };
    } catch (error) {
      return {
        success: false,
        message: '敏感词操作失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getSensitiveWordList(page: number = 1, pageSize: number = 20) {
    try {
      const skip = (page - 1) * pageSize;

      const [words, total] = await sensitiveWordRepository.findAndCount({
        skip,
        take: pageSize,
        order: { id: 'ASC' }
      });

      return {
        success: true,
        data: {
          list: words,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取敏感词列表失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getSystemStatistics() {
    try {
      const [
        totalCompanies,
        approvedCompanies,
        pendingCompanies,
        totalJobseekers,
        totalJobs,
        activeJobs,
        totalResumes,
        totalPosts,
        totalMatches
      ] = await Promise.all([
        companyRepository.count(),
        companyRepository.count({ where: { status: 'approved' } }),
        companyRepository.count({ where: { status: 'pending' } }),
        userRepository.count({ where: { role: 'jobseeker' } }),
        jobRepository.count(),
        jobRepository.count({ where: { status: 'active' } }),
        resumeRepository.count(),
        postRepository.count(),
        jobMatchRepository.count()
      ]);

      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        newCompanies30d,
        newJobseekers30d,
        newJobs30d,
        newMatches30d
      ] = await Promise.all([
        companyRepository.createQueryBuilder('c').where('c.createdAt >= :date', { date: last30Days }).getCount(),
        userRepository.createQueryBuilder('u').where('u.createdAt >= :date AND u.role = :role', { date: last30Days, role: 'jobseeker' }).getCount(),
        jobRepository.createQueryBuilder('j').where('j.createdAt >= :date', { date: last30Days }).getCount(),
        jobMatchRepository.createQueryBuilder('m').where('m.recommendedAt >= :date', { date: last30Days }).getCount()
      ]);

      return {
        success: true,
        data: {
          overview: {
            totalCompanies,
            approvedCompanies,
            pendingCompanies,
            totalJobseekers,
            totalJobs,
            activeJobs,
            totalResumes,
            totalPosts,
            totalMatches
          },
          last30Days: {
            newCompanies: newCompanies30d,
            newJobseekers: newJobseekers30d,
            newJobs: newJobs30d,
            newMatches: newMatches30d
          },
          companyStatusDistribution: [
            { name: '已认证', value: approvedCompanies },
            { name: '待审核', value: pendingCompanies },
            { name: '已拒绝', value: totalCompanies - approvedCompanies - pendingCompanies }
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取系统统计失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async auditCompany(companyId: number, auditResult: { status: string; reason?: string }) {
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

      if (!['approved', 'rejected'].includes(auditResult.status)) {
        return {
          success: false,
          message: '无效的审核状态'
        };
      }

      company.status = auditResult.status;
      const updatedCompany = await companyRepository.save(company);

      return {
        success: true,
        message: auditResult.status === 'approved' ? '企业审核通过' : '企业审核拒绝',
        data: updatedCompany
      };
    } catch (error) {
      return {
        success: false,
        message: '审核企业失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getSensitiveWordWarnings(page: number = 1, pageSize: number = 20) {
    try {
      const sensitiveWords = await sensitiveWordRepository.find({
        where: { enabled: true }
      });

      const wordList = sensitiveWords.map(w => ({ word: w.word, riskLevel: w.riskLevel, category: w.category }));

      const warnings: WarningItem[] = [];

      const jobs = await jobRepository.find({
        where: { status: 'active' },
        take: 100,
        order: { createdAt: 'DESC' }
      });

      jobs.forEach(job => {
        const contentToCheck = `${job.title} ${job.description || ''}`;
        wordList.forEach(({ word, riskLevel }) => {
          if (contentToCheck.includes(word)) {
            warnings.push({
              id: warnings.length + 1,
              type: 'job',
              content: job.title,
              source: '岗位招聘',
              sourceId: job.id,
              matchedWord: word,
              riskLevel,
              createdAt: job.createdAt
            });
          }
        });
      });

      const posts = await postRepository.find({
        where: { status: 'published' },
        take: 100,
        order: { createdAt: 'DESC' }
      });

      posts.forEach(post => {
        const contentToCheck = `${post.title} ${post.content}`;
        wordList.forEach(({ word, riskLevel }) => {
          if (contentToCheck.includes(word)) {
            warnings.push({
              id: warnings.length + 1,
              type: 'post',
              content: post.title,
              source: '社区帖子',
              sourceId: post.id,
              matchedWord: word,
              riskLevel,
              createdAt: post.createdAt
            });
          }
        });
      });

      warnings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const skip = (page - 1) * pageSize;
      const paginatedWarnings = warnings.slice(skip, skip + pageSize);

      return {
        success: true,
        data: {
          list: paginatedWarnings,
          total: warnings.length,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取敏感词预警失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async handleWarningAction(warningId: number, action: string) {
    try {
      if (action === 'delete') {
        const allWarnings = await this.getSensitiveWordWarnings(1, 1000);
        if (!allWarnings.success || !allWarnings.data) {
          return { success: false, message: '获取预警列表失败' };
        }
        const warning = (allWarnings.data as any).list.find((w: WarningItem) => w.id === warningId);
        if (!warning) {
          return { success: false, message: '预警记录不存在' };
        }

        if (warning.type === 'job') {
          await jobRepository.delete(warning.sourceId);
        } else if (warning.type === 'post') {
          await postRepository.delete(warning.sourceId);
        }

        return { success: true, message: '内容已删除' };
      }

      if (action === 'ignore') {
        return { success: true, message: '已忽略该预警' };
      }

      if (action === 'warn') {
        return { success: true, message: '已向用户发送警告' };
      }

      return { success: false, message: '无效的操作类型' };
    } catch (error) {
      return {
        success: false,
        message: '处理预警失败',
        data: error instanceof Error ? error.message : error
      };
    }
  }
};
