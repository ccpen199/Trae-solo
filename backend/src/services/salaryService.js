const db = require('../db');

const checkSalaryCompliance = (jobCategoryCode, city, salaryMin, salaryMax, workYears = '3-5年') => {
  const reference = db.prepare(`
    SELECT salary_min as ref_min, salary_max as ref_max 
    FROM salary_references 
    WHERE job_category_code = ? AND city = ? AND work_years = ?
    ORDER BY effective_date DESC LIMIT 1
  `).get(jobCategoryCode, city, workYears);

  if (!reference) {
    return {
      compliant: true,
      remark: '暂无该地区该岗位的薪酬参考数据',
      reference: null,
    };
  }

  const minLowerBound = reference.ref_min * 0.8;
  const maxUpperBound = reference.ref_max * 1.5;

  const compliant = salaryMin >= minLowerBound && salaryMax <= maxUpperBound && salaryMin <= salaryMax;

  const issues = [];
  if (salaryMin < minLowerBound) {
    issues.push(`最低薪资 ${salaryMin} 低于参考下限 ${Math.round(minLowerBound)}，可能存在薪酬竞争力不足`);
  }
  if (salaryMax > maxUpperBound) {
    issues.push(`最高薪资 ${salaryMax} 高于参考上限 ${Math.round(maxUpperBound)}，请核实岗位级别`);
  }
  if (salaryMin > salaryMax) {
    issues.push('最低薪资高于最高薪资');
  }

  return {
    compliant,
    remark: issues.length > 0 ? issues.join('；') : '薪酬区间符合行业参考标准',
    reference: {
      min: reference.ref_min,
      max: reference.ref_max,
    },
    issues,
  };
};

const updateJobSalaryCompliance = (jobId) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return null;

  const result = checkSalaryCompliance(
    job.job_category_code,
    job.city,
    job.salary_min,
    job.salary_max,
    job.work_experience_required
  );

  db.prepare(`
    UPDATE jobs SET salary_compliance_checked = 1, salary_compliance_remark = ?
    WHERE id = ?
  `).run(result.remark, jobId);

  return { ...result, jobId };
};

module.exports = { checkSalaryCompliance, updateJobSalaryCompliance };
