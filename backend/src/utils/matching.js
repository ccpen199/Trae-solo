function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateMatchScore(jobseeker, job, jobSkills, options = {}) {
  const result = {
    skillMatch: 0,
    salaryMatch: 0,
    locationMatch: 0,
    companyMatch: 0,
    availableDateMatch: 0,
    distance: null,
    withinRadius: true,
    matchScore: 0
  };

  const jobSkillsList = jobSkills.map(s => s.skill.toLowerCase());
  let jobseekerSkillsList = [];
  
  if (jobseeker.skills) {
    if (typeof jobseeker.skills === 'string') {
      jobseekerSkillsList = jobseeker.skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    } else if (Array.isArray(jobseeker.skills)) {
      jobseekerSkillsList = jobseeker.skills.map(s => s.trim().toLowerCase()).filter(s => s);
    }
  }

  if (jobSkillsList.length > 0 && jobseekerSkillsList.length > 0) {
    const matchedSkills = jobseekerSkillsList.filter(s => jobSkillsList.includes(s));
    const skillMatchRate = matchedSkills.length / jobSkillsList.length;
    result.skillMatch = Math.round(skillMatchRate * 100);
  } else if (jobSkillsList.length === 0) {
    result.skillMatch = 80;
  }

  if (jobseeker.expected_salary_min && job.salary_min) {
    const jsMin = jobseeker.expected_salary_min;
    const jsMax = jobseeker.expected_salary_max || jsMin * 1.5;
    const jMin = job.salary_min;
    const jMax = job.salary_max;
    if (jMax >= jsMin && jMin <= jsMax) {
      const overlap = Math.min(jMax, jsMax) - Math.max(jMin, jsMin);
      const jsRange = jsMax - jsMin || 1;
      const salaryMatchRate = Math.min(1, overlap / jsRange);
      result.salaryMatch = Math.round(salaryMatchRate * 100);
    } else if (jMax < jsMin) {
      result.salaryMatch = Math.round((jMax / jsMin) * 50);
    }
  }

  const distance = calculateDistance(
    jobseeker.latitude, jobseeker.longitude,
    job.latitude, job.longitude
  );
  result.distance = distance;

  if (job.location && jobseeker.location) {
    const jobLoc = job.location.replace(/市|区|县|省/g, '').trim();
    const jsLoc = jobseeker.location.replace(/市|区|县|省/g, '').trim();
    
    if (jobLoc === jsLoc || jobLoc.includes(jsLoc) || jsLoc.includes(jobLoc)) {
      result.locationMatch = 100;
      result.withinRadius = true;
    } else if (distance !== null) {
      const commuteRadius = jobseeker.commute_radius || 50;
      if (distance <= commuteRadius) {
        result.locationMatch = Math.round((1 - distance / commuteRadius) * 80 + 20);
        result.withinRadius = true;
      } else {
        result.locationMatch = Math.max(0, Math.round((1 - distance / (commuteRadius * 2)) * 40));
        result.withinRadius = false;
      }
    } else {
      result.locationMatch = 50;
    }
  }

  if (job.available_date && jobseeker.available_date) {
    const jobDate = new Date(job.available_date);
    const jsDate = new Date(jobseeker.available_date);
    const diffDays = Math.ceil((jobDate - jsDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      result.availableDateMatch = 100;
    } else if (diffDays <= 7) {
      result.availableDateMatch = 90;
    } else if (diffDays <= 30) {
      result.availableDateMatch = 70;
    } else if (diffDays <= 60) {
      result.availableDateMatch = 50;
    } else {
      result.availableDateMatch = 30;
    }
  } else {
    result.availableDateMatch = 80;
  }

  const rating = job.company_rating || 5;
  result.companyMatch = Math.round((rating / 5) * 100);

  const skillWeight = 35;
  const salaryWeight = 25;
  const locationWeight = 20;
  const companyWeight = 15;
  const availableDateWeight = 5;
  const totalWeights = skillWeight + salaryWeight + locationWeight + companyWeight + availableDateWeight;

  const weightedScore =
    (result.skillMatch / 100) * skillWeight +
    (result.salaryMatch / 100) * salaryWeight +
    (result.locationMatch / 100) * locationWeight +
    (result.companyMatch / 100) * companyWeight +
    (result.availableDateMatch / 100) * availableDateWeight;

  result.matchScore = Math.round((weightedScore / totalWeights) * 100);

  if (options.requireWithinRadius && !result.withinRadius) {
    result.matchScore = Math.round(result.matchScore * 0.6);
  }

  result.matchBreakdown = `技能${result.skillMatch}%×35% + 薪资${result.salaryMatch}%×25% + 地点${result.locationMatch}%×20% + 企业${result.companyMatch}%×15% + 到岗${result.availableDateMatch}%×5%`;

  return result;
}

module.exports = { calculateMatchScore, calculateDistance };
