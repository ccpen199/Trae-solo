import { db } from '../database.js'

const LEVEL_MAP = { P4: 1, P5: 2, P6: 3, P7: 4, P8: 5, P9: 6 }
const MAX_PROFICIENCY = 5
const WEIGHTS = { tech: 0.35, experience: 0.25, level: 0.25, salary: 0.15 }

function parseCSV(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

function calcTechScore(candidateId, jobTechStack) {
  const jobSkills = parseCSV(jobTechStack)
  if (jobSkills.length === 0) return 0

  const candidateSkills = db.prepare(
    'SELECT skill_name, proficiency, weight FROM candidate_skills WHERE candidate_id = ?'
  ).all(candidateId)

  const skillMap = new Map()
  for (const s of candidateSkills) {
    skillMap.set(s.skill_name.toLowerCase(), s)
  }

  let matchedSum = 0
  const maxWeight = Math.max(...candidateSkills.map(s => s.weight), 1)
  const denominator = jobSkills.length * MAX_PROFICIENCY * maxWeight

  for (const skill of jobSkills) {
    const found = skillMap.get(skill.toLowerCase())
    if (found) {
      matchedSum += found.proficiency * found.weight
    }
  }

  if (denominator === 0) return 0
  return Math.min((matchedSum / denominator) * 100, 100)
}

function calcExperienceScore(candidateYears, requiredYears) {
  if (!requiredYears || requiredYears === 0) return 100
  if (candidateYears >= requiredYears) return 100
  return Math.min((candidateYears / requiredYears) * 100, 100)
}

function calcLevelScore(candidateLevel, requiredLevel) {
  const candidateVal = LEVEL_MAP[candidateLevel] || 0
  const requiredVal = LEVEL_MAP[requiredLevel] || 0

  if (candidateVal >= requiredVal) return candidateVal > requiredVal ? 90 : 100
  const diff = requiredVal - candidateVal
  if (diff === 1) return 75
  if (diff === 2) return 40
  return 0
}

function calcSalaryScore(candMin, candMax, jobMin, jobMax) {
  if (!candMin || !candMax || !jobMin || !jobMax) return 50

  const overlapMin = Math.max(candMin, jobMin)
  const overlapMax = Math.min(candMax, jobMax)

  if (overlapMin <= overlapMax) {
    const overlapRange = overlapMax - overlapMin
    const candidateRange = candMax - candMin
    if (candidateRange <= 0) return 100
    const overlapPct = overlapRange / candidateRange
    return 100 * overlapPct
  }

  const gap = Math.min(
    Math.abs(candMin - jobMax),
    Math.abs(candMax - jobMin)
  )
  if (gap <= 50000) return 30
  return 0
}

export function generateMatchDetails(techScore, expScore, levelScore, salaryScore, candidateSkills, jobTechStack) {
  const matched = []
  const missing = []
  const jobSkills = parseCSV(jobTechStack)
  const candSkills = parseCSV(candidateSkills).map(s => s.toLowerCase())
  for (const skill of jobSkills) {
    if (candSkills.includes(skill.toLowerCase())) {
      matched.push(skill)
    } else {
      missing.push(skill)
    }
  }

  return JSON.stringify({
    techStack: { score: Math.round(techScore * 100) / 100, weight: WEIGHTS.tech, matched, missing },
    experience: { score: Math.round(expScore * 100) / 100, weight: WEIGHTS.experience },
    level: { score: Math.round(levelScore * 100) / 100, weight: WEIGHTS.level },
    salary: { score: Math.round(salaryScore * 100) / 100, weight: WEIGHTS.salary },
  })
}

function computeMatch(candidate, job) {
  const techScore = calcTechScore(candidate.id, job.tech_stack)
  const expScore = calcExperienceScore(candidate.experience_years, job.min_experience_years)
  const levelScore = calcLevelScore(candidate.career_level, job.required_level)
  const salaryScore = calcSalaryScore(
    candidate.expected_salary_min, candidate.expected_salary_max,
    job.salary_min, job.salary_max
  )
  const overallScore =
    techScore * WEIGHTS.tech +
    expScore * WEIGHTS.experience +
    levelScore * WEIGHTS.level +
    salaryScore * WEIGHTS.salary

  const matchDetails = generateMatchDetails(
    techScore, expScore, levelScore, salaryScore,
    candidate.skills_vector, job.tech_stack
  )

  return { techScore, expScore, levelScore, salaryScore, overallScore, matchDetails }
}

const deleteMatch = db.prepare(
  'DELETE FROM match_results WHERE candidate_id = ? AND job_id = ?'
)

const insertMatch = db.prepare(`
  INSERT INTO match_results (candidate_id, job_id, overall_score, tech_stack_score, experience_score, level_score, salary_score, match_details, direction)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

function storeMatch(candidateId, jobId, overallScore, techScore, expScore, levelScore, salaryScore, matchDetails, direction) {
  deleteMatch.run(candidateId, jobId)
  insertMatch.run(candidateId, jobId, overallScore, techScore, expScore, levelScore, salaryScore, matchDetails, direction)
}

export function matchCandidateToJobs(candidateId) {
  const candidate = db.prepare(
    'SELECT * FROM candidates WHERE id = ?'
  ).get(candidateId)
  if (!candidate) return []

  const jobs = db.prepare(
    "SELECT * FROM jobs WHERE status = 'published'"
  ).all()

  const results = []
  for (const job of jobs) {
    const m = computeMatch(candidate, job)
    storeMatch(
      candidate.id, job.id,
      Math.round(m.overallScore * 100) / 100,
      Math.round(m.techScore * 100) / 100,
      Math.round(m.expScore * 100) / 100,
      Math.round(m.levelScore * 100) / 100,
      Math.round(m.salaryScore * 100) / 100,
      m.matchDetails,
      'candidate_to_job'
    )
    results.push({ jobId: job.id, title: job.title, ...m })
  }

  results.sort((a, b) => b.overallScore - a.overallScore)
  return results
}

export function matchJobToCandidates(jobId) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId)
  if (!job) return []

  const candidates = db.prepare(
    "SELECT * FROM candidates WHERE job_status IN ('open', 'exploring')"
  ).all()

  const results = []
  for (const candidate of candidates) {
    const m = computeMatch(candidate, job)
    storeMatch(
      candidate.id, job.id,
      Math.round(m.overallScore * 100) / 100,
      Math.round(m.techScore * 100) / 100,
      Math.round(m.expScore * 100) / 100,
      Math.round(m.levelScore * 100) / 100,
      Math.round(m.salaryScore * 100) / 100,
      m.matchDetails,
      'job_to_candidate'
    )
    results.push({ candidateId: candidate.id, name: candidate.name, ...m })
  }

  results.sort((a, b) => b.overallScore - a.overallScore)
  return results
}
