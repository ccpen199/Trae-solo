import { AppDataSource } from '../data-source';
import { Job } from '../entities/Job';
import { Company } from '../entities/Company';

const jobRepository = AppDataSource.getRepository(Job);
const companyRepository = AppDataSource.getRepository(Company);

interface JobData {
  title: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  workLocation?: string;
  jobType?: string;
  processRequirements?: {
    printingMethod?: string;
    colorGroupRequirement?: string;
    precisionRequirement?: string;
    [key: string]: unknown;
  };
  equipmentModels?: {
    heidelberg?: string[];
    komori?: string[];
    roland?: string[];
    other?: string[];
    [key: string]: unknown;
  };
  materialStandards?: {
    paperType?: string;
    inkStandard?: string;
    laminationRequirement?: string;
    [key: string]: unknown;
  };
  requiredSkills?: string[];
  experienceYears?: string;
  education?: string;
  description?: string;
  status?: string;
}

interface JobFilters {
  status?: string;
  jobType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const jobService = {
  async createJob(companyId: number, jobData: JobData) {
    const company = await companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      return { success: false, message: '公司不存在' };
    }

    const job = jobRepository.create({
      companyId,
      ...jobData,
      status: jobData.status || 'active'
    });

    const savedJob = await jobRepository.save(job);
    return { success: true, data: savedJob };
  },

  async updateJob(jobId: number, jobData: Partial<JobData>) {
    const job = await jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      return { success: false, message: '岗位不存在' };
    }

    jobRepository.merge(job, jobData);
    const updatedJob = await jobRepository.save(job);
    return { success: true, data: updatedJob };
  },

  async getJobList(companyId: number, filters: JobFilters = {}) {
    const queryBuilder = jobRepository
      .createQueryBuilder('job')
      .where('job.companyId = :companyId', { companyId });

    if (filters.status) {
      queryBuilder.andWhere('job.status = :status', { status: filters.status });
    }

    if (filters.jobType) {
      queryBuilder.andWhere('job.jobType = :jobType', { jobType: filters.jobType });
    }

    if (filters.keyword) {
      queryBuilder.andWhere(
        '(job.title LIKE :keyword OR job.description LIKE :keyword)',
        { keyword: `%${filters.keyword}%` }
      );
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    queryBuilder.skip(skip).take(pageSize).orderBy('job.createdAt', 'DESC');

    const [jobs, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: {
        list: jobs,
        total,
        page,
        pageSize
      }
    };
  },

  async getJobDetail(jobId: number) {
    const job = await jobRepository.findOne({
      where: { id: jobId },
      relations: ['company']
    });

    if (!job) {
      return { success: false, message: '岗位不存在' };
    }

    return { success: true, data: job };
  },

  async deleteJob(jobId: number) {
    const job = await jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      return { success: false, message: '岗位不存在' };
    }

    await jobRepository.delete(jobId);
    return { success: true, message: '删除成功' };
  }
};
