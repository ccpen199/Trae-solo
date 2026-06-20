import { getDb } from '../db';
import { Job, JobStatus, RpoBatch } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface RpoJobImport {
  title: string;
  category: string;
  industry_zone: string;
  salary_min: number;
  salary_max: number;
  salary_negotiable?: boolean;
  location_code: string;
  address: string;
  description: string;
  requirements: string;
  benefits: string;
  quantity: number;
}

export function importRpoJobs(
  companyId: string,
  jobs: RpoJobImport[],
  batchName: string,
  targetSchools: string[],
  autoPush: boolean = false
): RpoBatch {
  const db = getDb();
  const batchId = uuidv4();
  const now = new Date();

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!company) {
    throw new Error('企业不存在');
  }

  const batch: RpoBatch = {
    id: batchId,
    company_id: companyId,
    batch_name: batchName,
    total_jobs: jobs.length,
    success_count: 0,
    fail_count: 0,
    status: 'processing',
    target_schools: targetSchools,
    auto_push: autoPush,
    created_at: now.toISOString(),
    completed_at: null,
  };

  db.prepare(`
    INSERT INTO rpo_batches (
      id, company_id, batch_name, total_jobs, success_count, fail_count,
      status, target_schools, auto_push, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    batchId,
    companyId,
    batchName,
    jobs.length,
    0,
    0,
    'processing',
    JSON.stringify(targetSchools),
    autoPush ? 1 : 0,
    now.toISOString()
  );

  let successCount = 0;
  let failCount = 0;
  const importedJobIds: string[] = [];

  for (const jobData of jobs) {
    try {
      const division = db.prepare('SELECT id FROM admin_divisions WHERE code = ?').get(jobData.location_code) as { id: string } | undefined;
      if (!division) {
        failCount++;
        continue;
      }

      const jobId = uuidv4();
      const job: Job = {
        id: jobId,
        company_id: companyId,
        title: jobData.title,
        industry_zone: jobData.industry_zone as any,
        category: jobData.category,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        salary_negotiable: jobData.salary_negotiable || false,
        location_id: division.id,
        address: jobData.address,
        description: jobData.description,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
        quantity: jobData.quantity,
        status: JobStatus.PUBLISHED,
        publish_date: now.toISOString(),
        expiry_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        view_count: 0,
        application_count: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      db.prepare(`
        INSERT INTO jobs (
          id, company_id, title, industry_zone, category, salary_min, salary_max, salary_negotiable,
          location_id, address, description, requirements, benefits, quantity, status, publish_date,
          expiry_date, view_count, application_count, created_at, updated_at
        ) VALUES (
          @id, @company_id, @title, @industry_zone, @category, @salary_min, @salary_max, @salary_negotiable,
          @location_id, @address, @description, @requirements, @benefits, @quantity, @status, @publish_date,
          @expiry_date, @view_count, @application_count, @created_at, @updated_at
        )
      `).run(job);

      importedJobIds.push(jobId);
      successCount++;
    } catch (error) {
      failCount++;
    }
  }

  if (autoPush && targetSchools.length > 0 && importedJobIds.length > 0) {
    for (const jobId of importedJobIds) {
      for (const schoolId of targetSchools) {
        db.prepare(`
          INSERT INTO job_school_push (id, job_id, school_id, rpo_batch_id, push_time, view_count, application_count)
          VALUES (?, ?, ?, ?, ?, 0, 0)
        `).run(uuidv4(), jobId, schoolId, batchId, now.toISOString());
      }
    }
  }

  db.prepare(`
    UPDATE rpo_batches 
    SET success_count = ?, fail_count = ?, status = 'completed', completed_at = ?
    WHERE id = ?
  `).run(successCount, failCount, now.toISOString(), batchId);

  return {
    ...batch,
    success_count: successCount,
    fail_count: failCount,
    status: 'completed',
    completed_at: now.toISOString(),
  };
}

export function getRpoBatches(companyId: string, page: number = 1, pageSize: number = 10): { batches: RpoBatch[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) as count FROM rpo_batches WHERE company_id = ?').get(companyId) as { count: number };
  const batches = db.prepare(`
    SELECT * FROM rpo_batches 
    WHERE company_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(companyId, pageSize, offset) as any[];

  return {
    batches: batches.map(b => ({
      ...b,
      target_schools: JSON.parse(b.target_schools),
      auto_push: b.auto_push === 1,
    })),
    total: total.count,
  };
}

export function getPushJobsForSchool(schoolId: string, page: number = 1, pageSize: number = 10): { jobs: any[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * pageSize;

  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM job_school_push jsp
    INNER JOIN jobs j ON jsp.job_id = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE jsp.school_id = ? AND j.status = 'published'
  `).get(schoolId) as { count: number };

  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.credit_level, 
           jsp.view_count as push_view_count, jsp.application_count as push_apply_count,
           jsp.push_time
    FROM job_school_push jsp
    INNER JOIN jobs j ON jsp.job_id = j.id
    INNER JOIN companies c ON j.company_id = c.id
    WHERE jsp.school_id = ? AND j.status = 'published'
    ORDER BY jsp.push_time DESC
    LIMIT ? OFFSET ?
  `).all(schoolId, pageSize, offset);

  return { jobs, total: total.count };
}

export function getMatchedGraduatesForJob(jobId: string, limit: number = 50): any[] {
  const db = getDb();
  const job = db.prepare(`
    SELECT j.*, c.industry_zone 
    FROM jobs j 
    INNER JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `).get(jobId) as any;

  if (!job) {
    throw new Error('岗位不存在');
  }

  const graduates = db.prepare(`
    SELECT g.*, 
           CASE WHEN g.skills LIKE ? THEN 1 ELSE 0 END as skill_match
    FROM graduates g
    WHERE g.employment_status = 'unemployed' 
      AND g.verification_status = 'verified'
    ORDER BY skill_match DESC, g.created_at DESC
    LIMIT ?
  `).all(`%${job.category || ''}%`, limit);

  return graduates.map(g => ({
    ...g,
    skills: JSON.parse(g.skills || '[]'),
    match_score: calculateMatchScore(job, g),
  }));
}

function calculateMatchScore(job: any, graduate: any): number {
  let score = 0;
  const skills = JSON.parse(graduate.skills || '[]');

  if (job.requirements) {
    const reqWords = job.requirements.split(/[，。、,\s]+/);
    reqWords.forEach((word: string) => {
      if (word.length >= 2 && skills.some((s: string) => s.includes(word) || word.includes(s))) {
        score += 10;
      }
    });
  }

  if (job.salary_min && graduate.education_level) {
    score += 20;
  }

  if (graduate.internships && graduate.internships.length > 0) {
    score += 15;
  }

  if (graduate.certificates && graduate.certificates.length > 0) {
    score += 15;
  }

  return Math.min(100, score);
}

export function generateGraduateMatchReport(schoolId: string): any {
  const db = getDb();
  const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId) as any;
  if (!school) {
    throw new Error('学校不存在');
  }

  const schoolMajors = JSON.parse(school.majors || '[]');

  const graduates = db.prepare(`
    SELECT * FROM graduates 
    WHERE school = ? AND verification_status = 'verified'
  `).all(school.name) as any[];

  const totalGraduates = graduates.length;
  const employedCount = graduates.filter(g => g.employment_status === 'employed').length;
  const unemployedCount = graduates.filter(g => g.employment_status === 'unemployed').length;
  const postgraduateCount = graduates.filter(g => g.employment_status === 'postgraduate').length;
  const otherCount = graduates.filter(g => g.employment_status === 'other').length;

  const employmentRate = totalGraduates > 0 ? (employedCount / totalGraduates) * 100 : 0;

  const pushResult = db.prepare(`
    SELECT COUNT(*) as total, 
           COALESCE(SUM(view_count), 0) as views,
           COALESCE(SUM(application_count), 0) as applications
    FROM job_school_push 
    WHERE school_id = ?
  `).get(schoolId) as any;

  const majorStats = schoolMajors.map((major: string) => {
    const majorGraduates = graduates.filter(g => g.major === major);
    const majorEmployed = majorGraduates.filter(g => g.employment_status === 'employed').length;
    return {
      major,
      total: majorGraduates.length,
      employed: majorEmployed,
      employment_rate: majorGraduates.length > 0 ? (majorEmployed / majorGraduates.length) * 100 : 0,
    };
  });

  return {
    school_name: school.name,
    report_date: new Date().toISOString(),
    total_graduates: totalGraduates,
    employment_statistics: {
      employed: employedCount,
      unemployed: unemployedCount,
      postgraduate: postgraduateCount,
      other: otherCount,
      employment_rate: Math.round(employmentRate * 10) / 10,
    },
    job_push_statistics: {
      total_jobs_pushed: pushResult.total,
      total_views: pushResult.views,
      total_applications: pushResult.applications,
      avg_view_per_job: pushResult.total > 0 ? Math.round(pushResult.views / pushResult.total) : 0,
    },
    major_breakdown: majorStats,
    recommendations: generateRecommendations(graduates),
  };
}

function generateRecommendations(graduates: any[]): string[] {
  const recommendations: string[] = [];
  const unemployed = graduates.filter(g => g.employment_status === 'unemployed');

  if (unemployed.length > 0) {
    const skillGaps = analyzeSkillGaps(unemployed);
    if (skillGaps.length > 0) {
      recommendations.push(`建议加强以下技能培训：${skillGaps.join('、')}`);
    }
  }

  const lowSkillGrads = unemployed.filter(g => {
    const skills = JSON.parse(g.skills || '[]');
    return skills.length < 3;
  });

  if (lowSkillGrads.length > unemployed.length * 0.3) {
    recommendations.push('建议开设职业技能提升课程，提高毕业生就业竞争力');
  }

  recommendations.push('建议加强与对口企业的合作，建立实习基地');
  recommendations.push('建议开展就业指导讲座，帮助毕业生规划职业发展');

  return recommendations;
}

function analyzeSkillGaps(graduates: any[]): string[] {
  const inDemandSkills = ['Java', 'Python', '数据分析', '英语六级', 'AutoCAD', 'SQL', '项目管理'];
  const skillCounts: Record<string, number> = {};

  graduates.forEach(g => {
    const skills = JSON.parse(g.skills || '[]');
    inDemandSkills.forEach(skill => {
      if (!skills.some((s: string) => s.includes(skill))) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    });
  });

  return Object.entries(skillCounts)
    .filter(([, count]) => count > graduates.length * 0.5)
    .map(([skill]) => skill)
    .slice(0, 5);
}

export function getGraduateEmploymentTracking(schoolId: string, filters: any = {}): { graduates: any[]; total: number } {
  const db = getDb();
  const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId) as any;
  if (!school) {
    throw new Error('学校不存在');
  }

  let whereClause = 'WHERE school = ?';
  const params: any[] = [school.name];

  if (filters.employment_status) {
    whereClause += ' AND employment_status = ?';
    params.push(filters.employment_status);
  }

  if (filters.major) {
    whereClause += ' AND major = ?';
    params.push(filters.major);
  }

  if (filters.verification_status) {
    whereClause += ' AND verification_status = ?';
    params.push(filters.verification_status);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM graduates ${whereClause}`).get(...params) as { count: number };

  const graduates = db.prepare(`
    SELECT g.*, c.name as employed_company_name, j.title as employed_job_title
    FROM graduates g
    LEFT JOIN companies c ON g.employed_company_id = c.id
    LEFT JOIN jobs j ON g.employed_job_id = j.id
    ${whereClause}
    ORDER BY g.updated_at DESC
  `).all(...params);

  return {
    graduates: graduates.map(g => ({
      ...g,
      skills: JSON.parse(g.skills || '[]'),
    })),
    total: total.count,
  };
}
