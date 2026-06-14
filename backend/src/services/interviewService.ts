import { AppDataSource } from '../data-source';
import { InterviewSchedule } from '../entities/InterviewSchedule';
import { Job } from '../entities/Job';
import { Company } from '../entities/Company';
import { User } from '../entities/User';
import { generateICSFromInterview } from '../utils/icsGenerator';

const interviewRepository = AppDataSource.getRepository(InterviewSchedule);
const jobRepository = AppDataSource.getRepository(Job);
const companyRepository = AppDataSource.getRepository(Company);
const userRepository = AppDataSource.getRepository(User);

interface InterviewData {
  jobId: number;
  jobseekerId: number;
  interviewTime: Date;
  location?: string;
  interviewer?: string;
}

export type InterviewStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

interface InterviewFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export const interviewService = {
  async createInterview(companyId: number, interviewData: InterviewData) {
    try {
      const job = await jobRepository.findOne({
        where: { id: interviewData.jobId, companyId }
      });

      if (!job) {
        return {
          success: false,
          message: '岗位不存在或无权操作'
        };
      }

      const jobseeker = await userRepository.findOne({
        where: { id: interviewData.jobseekerId, role: 'jobseeker' }
      });

      if (!jobseeker) {
        return {
          success: false,
          message: '求职者不存在'
        };
      }

      const existingInterview = await interviewRepository.findOne({
        where: {
          jobId: interviewData.jobId,
          jobseekerId: interviewData.jobseekerId,
          status: 'scheduled'
        }
      });

      if (existingInterview) {
        return {
          success: false,
          message: '该求职者已有待面试安排'
        };
      }

      const interview = interviewRepository.create({
        jobId: interviewData.jobId,
        jobseekerId: interviewData.jobseekerId,
        companyId,
        interviewTime: new Date(interviewData.interviewTime),
        location: interviewData.location,
        interviewer: interviewData.interviewer,
        status: 'scheduled',
        calendarSynced: false
      });

      const savedInterview = await interviewRepository.save(interview);
      return {
        success: true,
        message: '面试安排创建成功',
        data: savedInterview
      };
    } catch (error) {
      return {
        success: false,
        message: '创建面试安排失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async updateInterviewStatus(interviewId: number, status: InterviewStatus, companyId?: number) {
    try {
      const whereCondition: any = { id: interviewId };
      if (companyId) {
        whereCondition.companyId = companyId;
      }

      const interview = await interviewRepository.findOne({
        where: whereCondition
      });

      if (!interview) {
        return {
          success: false,
          message: '面试安排不存在或无权操作'
        };
      }

      interview.status = status;
      const updatedInterview = await interviewRepository.save(interview);

      return {
        success: true,
        message: '面试状态更新成功',
        data: updatedInterview
      };
    } catch (error) {
      return {
        success: false,
        message: '更新面试状态失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getInterviewList(userId: number, role: string, filters: InterviewFilters = {}) {
    try {
      const queryBuilder = interviewRepository
        .createQueryBuilder('interview')
        .leftJoinAndSelect('interview.job', 'job')
        .leftJoinAndSelect('interview.company', 'company')
        .leftJoinAndSelect('interview.jobseeker', 'jobseeker');

      if (role === 'enterprise') {
        queryBuilder.where('interview.companyId IN (SELECT c.id FROM Company c WHERE c.userId = :userId)', { userId });
      } else if (role === 'jobseeker') {
        queryBuilder.where('interview.jobseekerId = :userId', { userId });
      } else if (role === 'admin') {
        // Admin can see all interviews
      } else {
        return {
          success: false,
          message: '无权访问'
        };
      }

      if (filters.status) {
        queryBuilder.andWhere('interview.status = :status', { status: filters.status });
      }

      if (filters.startDate) {
        queryBuilder.andWhere('interview.interviewTime >= :startDate', { startDate: filters.startDate });
      }

      if (filters.endDate) {
        queryBuilder.andWhere('interview.interviewTime <= :endDate', { endDate: filters.endDate });
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const skip = (page - 1) * pageSize;

      queryBuilder.skip(skip).take(pageSize).orderBy('interview.interviewTime', 'DESC');

      const [interviews, total] = await queryBuilder.getManyAndCount();

      const processedInterviews = interviews.map((interview: any) => {
        if (interview.jobseeker) {
          const { password, ...jobseekerWithoutPassword } = interview.jobseeker;
          interview.jobseeker = jobseekerWithoutPassword;
        }
        return interview;
      });

      return {
        success: true,
        data: {
          list: processedInterviews,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取面试列表失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async syncToCalendar(interviewId: number, userId: number) {
    try {
      const interview = await interviewRepository.findOne({
        where: { id: interviewId },
        relations: ['job', 'company', 'jobseeker']
      });

      if (!interview) {
        return {
          success: false,
          message: '面试安排不存在'
        };
      }

      if (interview.jobseekerId !== userId) {
        return {
          success: false,
          message: '无权操作'
        };
      }

      const icsData = generateICSFromInterview(
        interview,
        interview.job?.title || '',
        interview.company?.companyName || '',
        interview.jobseeker?.name
      );

      interview.icsData = icsData;
      interview.calendarSynced = true;
      await interviewRepository.save(interview);

      return {
        success: true,
        message: '日历同步成功',
        data: { icsData, calendarSynced: true }
      };
    } catch (error) {
      return {
        success: false,
        message: '日历同步失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getCalendarICS(interviewId: number, userId: number) {
    try {
      const interview = await interviewRepository.findOne({
        where: { id: interviewId },
        relations: ['job', 'company', 'jobseeker']
      });

      if (!interview) {
        return {
          success: false,
          message: '面试安排不存在'
        };
      }

      const isAuthorized =
        interview.jobseekerId === userId ||
        interview.company?.userId === userId;

      if (!isAuthorized) {
        return {
          success: false,
          message: '无权访问'
        };
      }

      let icsData = interview.icsData;

      if (!icsData) {
        icsData = generateICSFromInterview(
          interview,
          interview.job?.title || '',
          interview.company?.companyName || '',
          interview.jobseeker?.name
        );
      }

      return {
        success: true,
        data: {
          icsData,
          filename: `interview-${interviewId}.ics`
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取日历文件失败',
        data: error instanceof Error ? error.message : error
      };
    }
  }
};
