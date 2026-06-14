import { AppDataSource } from '../data-source';
import { Job } from '../entities/Job';
import { Resume } from '../entities/Resume';
import { JobMatch } from '../entities/JobMatch';
import { Company } from '../entities/Company';
import { calculateSkillMatchScore, normalizeSkillName } from '../utils/skillGraph';

const jobRepository = AppDataSource.getRepository(Job);
const resumeRepository = AppDataSource.getRepository(Resume);
const jobMatchRepository = AppDataSource.getRepository(JobMatch);
const companyRepository = AppDataSource.getRepository(Company);

interface JobRequirements {
  requiredSkills?: string[];
  experienceYears?: string;
  education?: string;
  processRequirements?: Record<string, unknown>;
  equipmentModels?: Record<string, unknown>;
}

interface ResumeExperience {
  workExperience?: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    gravureExperienceYears?: number;
    offsetExperienceYears?: number;
    flexoExperienceYears?: number;
    description?: string;
    [key: string]: unknown;
  }>;
  skills?: Array<{
    name?: string;
    [key: string]: unknown;
  }>;
  certifications?: Array<{
    name?: string;
    [key: string]: unknown;
  }>;
  education?: string;
}

interface MatchResult {
  resumeId: number;
  resumeName: string;
  similarityScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  matchedSkills: Array<{
    skill: string;
    matchedSkill: string;
    similarity: number;
    category: string;
  }>;
  matchedCount: number;
  totalRequired: number;
}

function parseExperienceYears(experienceStr: string): { min: number; max: number } {
  if (!experienceStr) return { min: 0, max: 99 };

  const match = experienceStr.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }

  const singleMatch = experienceStr.match(/(\d+)/);
  if (singleMatch) {
    const years = parseInt(singleMatch[1]);
    if (experienceStr.includes('以上')) {
      return { min: years, max: 99 };
    }
    return { min: years, max: years };
  }

  return { min: 0, max: 99 };
}

function calculateTotalExperienceYears(resume: Resume): number {
  let totalYears = 0;

  if (resume.workExperience) {
    resume.workExperience.forEach(exp => {
      if (exp.gravureExperienceYears) totalYears += exp.gravureExperienceYears;
      if (exp.offsetExperienceYears) totalYears += exp.offsetExperienceYears;
      if (exp.flexoExperienceYears) totalYears += exp.flexoExperienceYears;

      if (exp.startDate && exp.endDate && !exp.gravureExperienceYears && !exp.offsetExperienceYears && !exp.flexoExperienceYears) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        totalYears += Math.max(0, years);
      }
    });
  }

  return Math.round(totalYears * 10) / 10;
}

function getResumeSkillNames(resume: Resume): string[] {
  const skillNames: string[] = [];

  if (resume.skills) {
    resume.skills.forEach(skill => {
      if (skill.name) {
        skillNames.push(skill.name);
      }
    });
  }

  if (resume.aiParsedData && (resume.aiParsedData as any).psPlateSoftwareSkills) {
    (resume.aiParsedData as any).psPlateSoftwareSkills.forEach((s: any) => {
      if (s.name) skillNames.push(s.name);
    });
  }

  if (resume.aiParsedData && (resume.aiParsedData as any).equipmentExperience) {
    (resume.aiParsedData as any).equipmentExperience.forEach((e: any) => {
      if (e.brand) skillNames.push(e.brand);
    });
  }

  if (resume.certifications) {
    resume.certifications.forEach(cert => {
      if (cert.name) skillNames.push(cert.name);
    });
  }

  return skillNames.map(normalizeSkillName);
}

export const talentMatchService = {
  calculateSkillMatch(jobSkills: string[], resumeSkills: string[]) {
    return calculateSkillMatchScore(jobSkills, resumeSkills);
  },

  calculateExperienceMatch(jobRequirements: JobRequirements, resumeExperience: ResumeExperience) {
    let score = 0;
    let maxScore = 0;

    if (jobRequirements.experienceYears) {
      maxScore += 40;
      const { min, max } = parseExperienceYears(jobRequirements.experienceYears);
      const resumeYears = calculateTotalExperienceYears(resumeExperience as unknown as Resume);

      if (resumeYears >= min && resumeYears <= max) {
        score += 40;
      } else if (resumeYears > max) {
        score += 35;
      } else if (resumeYears >= min * 0.7) {
        score += 25;
      } else if (resumeYears >= min * 0.5) {
        score += 15;
      }
    }

    if (jobRequirements.education && resumeExperience.education) {
      maxScore += 20;
      const eduLevels: Record<string, number> = {
        '高中': 1,
        '中专': 1,
        '大专': 2,
        '本科': 3,
        '硕士': 4,
        '博士': 5
      };

      const jobEdu = eduLevels[jobRequirements.education] || 0;
      const resumeEdu = eduLevels[resumeExperience.education] || 0;

      if (resumeEdu >= jobEdu) {
        score += 20;
      } else if (resumeEdu >= jobEdu - 0.5) {
        score += 15;
      }
    }

    if (jobRequirements.processRequirements && resumeExperience.workExperience) {
      maxScore += 25;
      let processScore = 0;

      const printingMethod = (jobRequirements.processRequirements as any).printingMethod;
      if (printingMethod) {
        const methodMatch = resumeExperience.workExperience.some(exp => {
          const desc = (exp.description || '').toLowerCase();
          const method = printingMethod.toLowerCase();
          return desc.includes(method) ||
            (exp.gravureExperienceYears && method.includes('凹印')) ||
            (exp.offsetExperienceYears && method.includes('胶印')) ||
            (exp.flexoExperienceYears && method.includes('柔印'));
        });
        if (methodMatch) processScore += 15;
      }

      const precisionReq = (jobRequirements.processRequirements as any).precisionRequirement;
      if (precisionReq && resumeExperience.workExperience.length > 0) {
        processScore += 10;
      }

      score += processScore;
    }

    if (jobRequirements.equipmentModels && resumeExperience.workExperience) {
      maxScore += 15;
      const jobEquipments = Object.keys(jobRequirements.equipmentModels);
      const equipMatch = jobEquipments.some(equip => {
        return resumeExperience.workExperience?.some(exp => {
          const desc = (exp.description || '').toLowerCase();
          return desc.includes(equip);
        });
      });
      if (equipMatch) score += 15;
    }

    const overallScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      overallScore,
      experienceYearsScore: maxScore > 0 ? Math.round((score / maxScore) * 40) : 0,
      educationScore: maxScore > 0 ? Math.round((score / maxScore) * 20) : 0,
      processScore: maxScore > 0 ? Math.round((score / maxScore) * 25) : 0,
      equipmentScore: maxScore > 0 ? Math.round((score / maxScore) * 15) : 0
    };
  },

  calculateOverallSimilarity(job: Job, resume: Resume) {
    const jobSkills = job.requiredSkills || [];
    const resumeSkills = getResumeSkillNames(resume);

    const skillMatch = this.calculateSkillMatch(jobSkills, resumeSkills);
    const experienceMatch = this.calculateExperienceMatch(job, resume);

    const similarityScore = Math.round(skillMatch.overallScore * 0.5 + experienceMatch.overallScore * 0.5);

    return {
      similarityScore,
      skillMatchScore: skillMatch.overallScore,
      experienceMatchScore: experienceMatch.overallScore,
      matchedSkills: skillMatch.matchedSkills,
      matchedCount: skillMatch.matchedCount,
      totalRequired: skillMatch.totalRequired,
      skillDetails: skillMatch,
      experienceDetails: experienceMatch
    };
  },

  async recommendCandidates(jobId: number, topN: number = 10) {
    const job = await jobRepository.findOne({ where: { id: jobId }, relations: ['company'] });
    if (!job) {
      return { success: false, message: '岗位不存在' };
    }

    const resumes = await resumeRepository.find();

    const matchResults: MatchResult[] = [];

    for (const resume of resumes) {
      const similarity = this.calculateOverallSimilarity(job, resume);

      const jobMatch = jobMatchRepository.create({
        jobId,
        resumeId: resume.id,
        similarityScore: similarity.similarityScore,
        skillMatchScore: similarity.skillMatchScore,
        experienceMatchScore: similarity.experienceMatchScore,
        status: 'pending'
      });
      await jobMatchRepository.save(jobMatch);

      matchResults.push({
        resumeId: resume.id,
        resumeName: resume.name,
        similarityScore: similarity.similarityScore,
        skillMatchScore: similarity.skillMatchScore,
        experienceMatchScore: similarity.experienceMatchScore,
        matchedSkills: similarity.matchedSkills,
        matchedCount: similarity.matchedCount,
        totalRequired: similarity.totalRequired
      });
    }

    matchResults.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      success: true,
      data: {
        jobId,
        jobTitle: job.title,
        totalCandidates: matchResults.length,
        recommendations: matchResults.slice(0, topN)
      }
    };
  },

  async getMatchHistory(companyId: number) {
    const company = await companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      return { success: false, message: '公司不存在' };
    }

    const jobs = await jobRepository.find({ where: { companyId } });
    const jobIds = jobs.map(j => j.id);

    const matches = await jobMatchRepository.find({
      where: jobIds.length > 0 ? { jobId: jobIds as any } : {},
      relations: ['job', 'resume'],
      order: { recommendedAt: 'DESC' }
    });

    const history = matches.map(match => ({
      id: match.id,
      jobId: match.jobId,
      jobTitle: match.job?.title,
      resumeId: match.resumeId,
      resumeName: match.resume?.name,
      similarityScore: match.similarityScore,
      skillMatchScore: match.skillMatchScore,
      experienceMatchScore: match.experienceMatchScore,
      status: match.status,
      recommendedAt: match.recommendedAt
    }));

    return {
      success: true,
      data: {
        total: history.length,
        history
      }
    };
  }
};
