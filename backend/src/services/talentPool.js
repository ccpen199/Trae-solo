const { db } = require('../database');

const RESIGNATION_REASON_MAP = {
  'career_development': '寻求职业发展',
  'salary': '薪资待遇不满意',
  'team': '团队/文化不匹配',
  'location': '工作地点问题',
  'layoff': '公司裁员',
  'family': '家庭原因',
  'health': '健康原因'
};

const JOB_ACTIVITY_MAP = {
  'active': '积极求职',
  'passive': '待激活',
  'inactive': '不活跃'
};

function generateSimpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const vocab = {};
  let index = 0;
  words.forEach(word => {
    if (!vocab[word]) {
      vocab[word] = index++;
    }
  });
  
  const embedding = new Array(50).fill(0);
  words.forEach(word => {
    const idx = vocab[word] % 50;
    embedding[idx] += 1;
  });
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(v => magnitude > 0 ? v / magnitude : 0);
}

function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

function addCandidate(candidateData, companyId) {
  const stmt = db.prepare(`
    INSERT INTO candidates (
      company_id, name, email, phone, resume_text, 
      tech_stack, project_experience, resignation_reason, 
      job_activity, vector_embedding
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const embeddingText = [
    candidateData.resume_text,
    candidateData.tech_stack,
    candidateData.project_experience
  ].filter(Boolean).join(' ');

  const embedding = generateSimpleEmbedding(embeddingText);
  
  const result = stmt.run(
    companyId,
    candidateData.name,
    candidateData.email,
    candidateData.phone,
    candidateData.resume_text,
    candidateData.tech_stack,
    candidateData.project_experience,
    candidateData.resignation_reason,
    candidateData.job_activity || 'active',
    JSON.stringify(embedding)
  );

  if (candidateData.tags && Array.isArray(candidateData.tags)) {
    const tagStmt = db.prepare(`
      INSERT INTO candidate_tags (candidate_id, tag_category, tag_value)
      VALUES (?, ?, ?)
    `);
    
    candidateData.tags.forEach(tag => {
      tagStmt.run(result.lastInsertRowid, tag.category, tag.value);
    });
  }

  return result.lastInsertRowid;
}

function findSimilarCandidates(candidateId, companyId, limit = 10) {
  const candidateStmt = db.prepare(`
    SELECT vector_embedding FROM candidates 
    WHERE id = ? AND company_id = ?
  `);
  
  const target = candidateStmt.get(candidateId, companyId);
  if (!target || !target.vector_embedding) return [];

  const targetEmbedding = JSON.parse(target.vector_embedding);
  
  const allStmt = db.prepare(`
    SELECT id, name, vector_embedding, tech_stack, job_activity
    FROM candidates 
    WHERE company_id = ? AND id != ?
  `);
  
  const allCandidates = allStmt.all(companyId, candidateId);
  
  const similarities = allCandidates.map(c => {
    if (!c.vector_embedding) return { ...c, similarity: 0 };
    const emb = JSON.parse(c.vector_embedding);
    return {
      ...c,
      vector_embedding: undefined,
      similarity: cosineSimilarity(targetEmbedding, emb)
    };
  });

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function searchCandidatesByTags(companyId, tags) {
  const placeholders = tags.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT DISTINCT c.*, 
           GROUP_CONCAT(ct.tag_category || ':' || ct.tag_value) as tags
    FROM candidates c
    JOIN candidate_tags ct ON c.id = ct.candidate_id
    WHERE c.company_id = ? 
      AND (ct.tag_value IN (${placeholders}))
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  
  return stmt.all(companyId, ...tags);
}

function getCandidateWithTags(candidateId, companyId) {
  const candidateStmt = db.prepare(`
    SELECT * FROM candidates WHERE id = ? AND company_id = ?
  `);
  
  const candidate = candidateStmt.get(candidateId, companyId);
  if (!candidate) return null;

  const tagsStmt = db.prepare(`
    SELECT tag_category, tag_value FROM candidate_tags WHERE candidate_id = ?
  `);
  
  candidate.tags = tagsStmt.all(candidateId);
  candidate.resignation_reason_display = RESIGNATION_REASON_MAP[candidate.resignation_reason] || candidate.resignation_reason;
  candidate.job_activity_display = JOB_ACTIVITY_MAP[candidate.job_activity] || candidate.job_activity;
  
  return candidate;
}

function updateCandidateTags(candidateId, tags) {
  const deleteStmt = db.prepare('DELETE FROM candidate_tags WHERE candidate_id = ?');
  deleteStmt.run(candidateId);

  const insertStmt = db.prepare(`
    INSERT INTO candidate_tags (candidate_id, tag_category, tag_value)
    VALUES (?, ?, ?)
  `);

  tags.forEach(tag => {
    insertStmt.run(candidateId, tag.category, tag.value);
  });
}

module.exports = {
  addCandidate,
  findSimilarCandidates,
  searchCandidatesByTags,
  getCandidateWithTags,
  updateCandidateTags,
  generateSimpleEmbedding,
  RESIGNATION_REASON_MAP,
  JOB_ACTIVITY_MAP
};
