import { create } from 'zustand';
import type {
  User,
  Company,
  VerificationRecord,
  Job,
  Resume,
  Interview,
  Application,
  AnalyticsData,
  MatchResult,
  Authorization,
  AdminReviewDashboard,
  ReviewItem,
  Contract,
  ContractTemplate,
  Dispute,
} from '../../shared/types';

interface StoreState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

  activeRole: 'employer' | 'jobseeker' | 'admin' | null;
  setActiveRole: (role: 'employer' | 'jobseeker' | 'admin' | null) => void;

  company: Company | null;
  setCompany: (company: Company | null) => void;
  verificationRecord: VerificationRecord | null;
  setVerificationRecord: (record: VerificationRecord | null) => void;
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, data: Partial<Job>) => void;
  talentPool: Resume[];
  setTalentPool: (pool: Resume[]) => void;
  employerInterviews: Interview[];
  setEmployerInterviews: (interviews: Interview[]) => void;
  applications: Application[];
  setApplications: (applications: Application[]) => void;
  analyticsData: AnalyticsData | null;
  setAnalyticsData: (data: AnalyticsData | null) => void;

  resume: Resume | null;
  setResume: (resume: Resume | null) => void;
  toggleDesensitize: () => void;
  recommendedJobs: MatchResult[];
  setRecommendedJobs: (jobs: MatchResult[]) => void;
  myApplications: Application[];
  setMyApplications: (applications: Application[]) => void;
  myInterviews: Interview[];
  setMyInterviews: (interviews: Interview[]) => void;
  authorizations: Authorization[];
  setAuthorizations: (authorizations: Authorization[]) => void;
  addAuthorization: (authorization: Authorization) => void;
  revokeAuthorization: (id: string) => void;

  adminDashboard: AdminReviewDashboard | null;
  setAdminDashboard: (dashboard: AdminReviewDashboard | null) => void;
  reviewItems: ReviewItem[];
  setReviewItems: (items: ReviewItem[]) => void;

  contracts: Contract[];
  setContracts: (contracts: Contract[]) => void;
  contractTemplates: ContractTemplate[];
  setContractTemplates: (templates: ContractTemplate[]) => void;
  disputes: Dispute[];
  setDisputes: (disputes: Dispute[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  logout: () =>
    set({
      currentUser: null,
      activeRole: null,
      company: null,
      verificationRecord: null,
      jobs: [],
      talentPool: [],
      employerInterviews: [],
      applications: [],
      analyticsData: null,
      resume: null,
      recommendedJobs: [],
      myApplications: [],
      myInterviews: [],
      authorizations: [],
      adminDashboard: null,
      reviewItems: [],
      contracts: [],
      contractTemplates: [],
      disputes: [],
    }),

  activeRole: null,
  setActiveRole: (role) => set({ activeRole: role }),

  company: null,
  setCompany: (company) => set({ company }),
  verificationRecord: null,
  setVerificationRecord: (record) => set({ verificationRecord: record }),
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (id, data) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...data } : job)),
    })),
  talentPool: [],
  setTalentPool: (pool) => set({ talentPool: pool }),
  employerInterviews: [],
  setEmployerInterviews: (interviews) => set({ employerInterviews: interviews }),
  applications: [],
  setApplications: (applications) => set({ applications }),
  analyticsData: null,
  setAnalyticsData: (data) => set({ analyticsData: data }),

  resume: null,
  setResume: (resume) => set({ resume }),
  toggleDesensitize: () =>
    set((state) => {
      if (!state.resume) return state;
      return {
        resume: { ...state.resume, isDesensitized: !state.resume.isDesensitized },
      };
    }),
  recommendedJobs: [],
  setRecommendedJobs: (jobs) => set({ recommendedJobs: jobs }),
  myApplications: [],
  setMyApplications: (applications) => set({ myApplications: applications }),
  myInterviews: [],
  setMyInterviews: (interviews) => set({ myInterviews: interviews }),
  authorizations: [],
  setAuthorizations: (authorizations) => set({ authorizations }),
  addAuthorization: (authorization) =>
    set((state) => ({ authorizations: [...state.authorizations, authorization] })),
  revokeAuthorization: (id) =>
    set((state) => ({
      authorizations: state.authorizations.map((auth) =>
        auth.id === id ? { ...auth, revokedAt: new Date().toISOString() } : auth,
      ),
    })),

  adminDashboard: null,
  setAdminDashboard: (dashboard) => set({ adminDashboard: dashboard }),
  reviewItems: [],
  setReviewItems: (items) => set({ reviewItems: items }),

  contracts: [],
  setContracts: (contracts) => set({ contracts }),
  contractTemplates: [],
  setContractTemplates: (templates) => set({ contractTemplates: templates }),
  disputes: [],
  setDisputes: (disputes) => set({ disputes }),
}));
