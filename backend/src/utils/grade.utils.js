const calculateLevel = (score) => {
  if (score === null || score === undefined) return null;
  
  const scoreNum = parseFloat(score);
  
  if (isNaN(scoreNum)) return null;
  
  if (scoreNum >= 90) return '优秀';
  if (scoreNum >= 80) return '良好';
  if (scoreNum >= 70) return '中等';
  if (scoreNum >= 60) return '及格';
  return '不及格';
};

const calculatePoints = (score) => {
  if (score === null || score === undefined) return null;
  
  const scoreNum = parseFloat(score);
  
  if (isNaN(scoreNum)) return null;
  
  if (scoreNum < 60) return 0;
  if (scoreNum >= 95) return 4.5;
  if (scoreNum >= 90) return 4.0;
  if (scoreNum >= 85) return 3.5;
  if (scoreNum >= 80) return 3.0;
  if (scoreNum >= 75) return 2.5;
  if (scoreNum >= 70) return 2.0;
  if (scoreNum >= 65) return 1.5;
  return 1.0;
};

const calculateCreditsEarned = (score, courseCredits) => {
  if (score === null || score === undefined || courseCredits === null || courseCredits === undefined) {
    return 0;
  }
  
  const scoreNum = parseFloat(score);
  const creditsNum = parseFloat(courseCredits);
  
  if (isNaN(scoreNum) || isNaN(creditsNum)) return 0;
  
  return scoreNum >= 60 ? creditsNum : 0;
};

const calculateGPA = (grades) => {
  if (!grades || grades.length === 0) return 0;
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const grade of grades) {
    const points = grade.points || 0;
    const credits = grade.credits || 0;
    
    if (points !== null && points !== undefined && credits > 0) {
      totalPoints += parseFloat(points) * parseFloat(credits);
      totalCredits += parseFloat(credits);
    }
  }
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
};

const calculateClassStatistics = (grades) => {
  if (!grades || grades.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      levelDistribution: {
        '优秀': 0,
        '良好': 0,
        '中等': 0,
        '及格': 0,
        '不及格': 0,
        '缺考': 0,
        '作弊': 0,
        '缓考': 0
      }
    };
  }
  
  const validScores = grades
    .filter(g => g.score !== null && g.score !== undefined)
    .map(g => parseFloat(g.score));
  
  const total = grades.length;
  const passed = validScores.filter(s => s >= 60).length;
  const failed = validScores.filter(s => s < 60).length;
  const passRate = validScores.length > 0 ? (passed / validScores.length) * 100 : 0;
  
  const averageScore = validScores.length > 0 
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
    : 0;
  
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const minScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  
  const levelDistribution = {
    '优秀': 0,
    '良好': 0,
    '中等': 0,
    '及格': 0,
    '不及格': 0,
    '缺考': 0,
    '作弊': 0,
    '缓考': 0
  };
  
  for (const grade of grades) {
    if (grade.level && levelDistribution.hasOwnProperty(grade.level)) {
      levelDistribution[grade.level]++;
    }
  }
  
  return {
    total,
    passed,
    failed,
    passRate: parseFloat(passRate.toFixed(2)),
    averageScore: parseFloat(averageScore.toFixed(2)),
    maxScore: parseFloat(maxScore.toFixed(2)),
    minScore: parseFloat(minScore.toFixed(2)),
    levelDistribution
  };
};

module.exports = {
  calculateLevel,
  calculatePoints,
  calculateCreditsEarned,
  calculateGPA,
  calculateClassStatistics
};
