const natural = require('natural');
const db = require('../db');

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

const extractKeywords = (text) => {
  if (!text) return [];
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return [...new Set(tokens)];
};

const calculateKeywordMatch = (resumeText, jobKeywords) => {
  const resumeKeywords = extractKeywords(resumeText);
  const match = jobKeywords.filter(k => 
    resumeKeywords.some(rk => rk.includes(k.toLowerCase()) || k.toLowerCase().includes(rk))
  );
  return {
    matched: match,
    count: match.length,
    total: jobKeywords.length,
    score: jobKeywords.length > 0 ? Math.round((match.length / jobKeywords.length) * 100) : 0
  };
};

const calculateSemanticSimilarity = (resumeExperience, jobRequirements) => {
  if (!resumeExperience || !jobRequirements) return 0;
  
  const tfidf = new TfIdf();
  tfidf.addDocument(resumeExperience);
  tfidf.addDocument(jobRequirements);
  
  let similarity = 0;
  const terms = new Set([...extractKeywords(resumeExperience), ...extractKeywords(jobRequirements)]);
  
  terms.forEach(term => {
    const doc0 = tfidf.tfidf(term, 0);
    const doc1 = tfidf.tfidf(term, 1);
    similarity += doc0 * doc1;
  });
  
  return Math.round(Math.min(similarity * 10, 100));
};

const extractJobKeywords = (job) => {
  const keywords = [];
  
  if (job.requirements) {
    const techPatterns = [/精通\s*([^，。,\.\s]+)/g, /熟悉\s*([^，。,\.\s]+)/g, /掌握\s*([^，。,\.\s]+)/g];
    techPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(job.requirements)) !== null) {
        keywords.push(match[1]);
      }
    });
  }
  
  if (job.ability_model) {
    try {
      const ability = JSON.parse(job.ability_model);
      if (ability.technical) keywords.push(...ability.technical);
      if (ability.experience) keywords.push(...ability.experience);
    } catch (e) {}
  }
  
  const standardKeywords = ['CNC', 'UG', 'Mastercam', 'PLC', 'AutoCAD', 'Pro/E', 'FANUC', 'SIEMENS', '三菱', '西门子', '模具', '数控', '精益', '六西格玛', 'SPC', 'FMEA', 'ISO', '机器人', '自动化'];
  standardKeywords.forEach(kw => {
    const text = (job.requirements || '') + (job.job_description || '');
    if (text.includes(kw)) keywords.push(kw);
  });
  
  return [...new Set(keywords)];
};

const screenResume = (applicationId, resume, job) => {
  const resumeText = [
    resume.skills,
    resume.work_experience,
    resume.project_experience,
    resume.education_experience
  ].filter(Boolean).join(' ');
  
  const jobKeywords = extractJobKeywords(job);
  const keywordMatch = calculateKeywordMatch(resumeText, jobKeywords);
  
  const expText = resume.work_experience || '';
  const reqText = job.requirements || '';
  const semanticScore = calculateSemanticSimilarity(expText, reqText);
  
  const overallScore = Math.round(keywordMatch.score * 0.6 + semanticScore * 0.4);
  
  const analysis = {
    keyword_match: keywordMatch,
    semantic_analysis: {
      score: semanticScore,
      details: `工作经验与岗位要求的语义匹配度为 ${semanticScore}%`
    },
    strengths: keywordMatch.matched.slice(0, 5),
    gaps: jobKeywords.filter(k => !keywordMatch.matched.includes(k)).slice(0, 5)
  };
  
  db.prepare(`
    UPDATE applications 
    SET ats_score = ?, ats_keyword_match = ?, ats_semantic_analysis = ?
    WHERE id = ?
  `).run(overallScore, JSON.stringify(keywordMatch), JSON.stringify(analysis), applicationId);
  
  return {
    applicationId,
    overallScore,
    keywordMatch,
    semanticScore,
    analysis
  };
};

module.exports = { screenResume, extractJobKeywords, calculateKeywordMatch };
