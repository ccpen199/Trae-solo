const db = require('../database');
const auth = require('../auth');

function escapeStr(str) {
  return String(str || '').replace(/'/g, "''");
}

function registerPolicyRoutes(app) {
  app.get('/api/policies', auth.requireAuth, (req, res) => {
    const { category_id, target_audience, region, keyword, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT p.*, pc.name as category_name, pc.code as category_code
      FROM policies p
      INNER JOIN policy_categories pc ON p.category_id = pc.id
      WHERE p.is_active = 1
    `;
    const params = [];
    
    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(Number(category_id));
    }
    if (target_audience) {
      sql += ' AND p.target_audience LIKE ?';
      params.push(`%${target_audience}%`);
    }
    if (region) {
      sql += ' AND p.applicable_region LIKE ?';
      params.push(`%${region}%`);
    }
    if (keyword) {
      sql += ' AND (p.title LIKE ? OR p.content LIKE ? OR p.keywords LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY p.issue_date DESC, p.id DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const policies = db.query(sql, params);
    
    const countSql = `SELECT COUNT(*) as total FROM policies p WHERE p.is_active = 1`;
    const countResult = db.query(countSql);
    
    res.json({ ok: true, data: policies, total: countResult[0]?.total || 0, page: Number(page), page_size: Number(page_size) });
  });

  app.get('/api/policies/:id', auth.requireAuth, (req, res) => {
    const policyId = Number(req.params.id);
    
    db.execute('UPDATE policies SET view_count = view_count + 1 WHERE id = ?', [policyId]);
    
    const policies = db.query(`
      SELECT p.*, pc.name as category_name, pc.code as category_code,
             u.real_name as creator_name
      FROM policies p
      INNER JOIN policy_categories pc ON p.category_id = pc.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ? AND p.is_active = 1
      LIMIT 1
    `, [policyId]);
    
    if (policies.length === 0) {
      return res.json({ ok: false, message: '政策不存在' });
    }
    
    const policy = policies[0];
    
    const relatedFaqs = db.query(`
      SELECT id, question, answer, view_count
      FROM faqs
      WHERE policy_id = ? AND is_active = 1
      ORDER BY view_count DESC
      LIMIT 5
    `, [policyId]);
    
    const relatedPolicies = db.query(`
      SELECT id, title, issue_date
      FROM policies
      WHERE category_id = ? AND id != ? AND is_active = 1
      ORDER BY issue_date DESC
      LIMIT 5
    `, [policy.category_id, policyId]);
    
    res.json({ 
      ok: true, 
      data: { 
        ...policy, 
        related_faqs: relatedFaqs,
        related_policies: relatedPolicies
      } 
    });
  });

  app.get('/api/policies/3d-search', auth.requireAuth, (req, res) => {
    const { population, matter, region } = req.query;
    
    let sql = `
      SELECT DISTINCT p.*, pc.name as category_name
      FROM policies p
      INNER JOIN policy_categories pc ON p.category_id = pc.id
      WHERE p.is_active = 1
    `;
    const params = [];
    
    if (population) {
      sql += ' AND p.target_audience LIKE ?';
      params.push(`%${population}%`);
    }
    if (matter) {
      sql += ' AND (p.title LIKE ? OR p.content LIKE ? OR p.keywords LIKE ?)';
      params.push(`%${matter}%`, `%${matter}%`, `%${matter}%`);
    }
    if (region) {
      sql += ' AND p.applicable_region LIKE ?';
      params.push(`%${region}%`);
    }
    
    sql += ' ORDER BY p.issue_date DESC LIMIT 50';
    
    const policies = db.query(sql, params);
    
    const faqSql = `
      SELECT DISTINCT f.*
      FROM faqs f
      WHERE f.is_active = 1
    `;
    const faqParams = [];
    
    if (population) {
      faqSql += ' AND f.target_audience LIKE ?';
      faqParams.push(`%${population}%`);
    }
    if (matter) {
      faqSql += ' AND (f.question LIKE ? OR f.answer LIKE ? OR f.keywords LIKE ?)';
      faqParams.push(`%${matter}%`, `%${matter}%`, `%${matter}%`);
    }
    if (region) {
      faqSql += ' AND f.applicable_region LIKE ?';
      faqParams.push(`%${region}%`);
    }
    
    faqSql += ' ORDER BY f.view_count DESC LIMIT 30';
    
    const faqs = db.query(faqSql, faqParams);
    
    res.json({ ok: true, data: { policies, faqs }, filters: { population, matter, region } });
  });

  app.get('/api/faq', auth.requireAuth, (req, res) => {
    const { category_id, keyword, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    let sql = `
      SELECT f.*, pc.name as category_name, p.title as policy_title
      FROM faqs f
      LEFT JOIN policy_categories pc ON f.category_id = pc.id
      LEFT JOIN policies p ON f.policy_id = p.id
      WHERE f.is_active = 1
    `;
    const params = [];
    
    if (category_id) {
      sql += ' AND f.category_id = ?';
      params.push(Number(category_id));
    }
    if (keyword) {
      sql += ' AND (f.question LIKE ? OR f.answer LIKE ? OR f.keywords LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY f.view_count DESC, f.helpful_count DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), Number(offset));
    
    const faqs = db.query(sql, params);
    
    res.json({ ok: true, data: faqs, page: Number(page), page_size: Number(page_size) });
  });

  app.post('/api/faq/:id/feedback', auth.requireAuth, (req, res) => {
    const faqId = Number(req.params.id);
    const { helpful } = req.body;
    
    if (helpful === true) {
      db.execute('UPDATE faqs SET helpful_count = helpful_count + 1 WHERE id = ?', [faqId]);
    } else {
      db.execute('UPDATE faqs SET not_helpful_count = not_helpful_count + 1 WHERE id = ?', [faqId]);
    }
    
    res.json({ ok: true, message: '反馈已提交' });
  });

  app.get('/api/faq/auto-attribution', auth.requireAuth, (req, res) => {
    const { question } = req.query;
    
    if (!question) {
      return res.json({ ok: false, message: '请输入问题' });
    }
    
    const keywords = question.split(/[\s，。？！、；：""''（）\[\]【】]+/).filter(k => k.length > 1);
    
    let sql = `
      SELECT f.*, pc.name as category_name,
             (0
    `;
    const params = [];
    
    keywords.forEach((kw, i) => {
      sql += ` + CASE WHEN f.question LIKE ? THEN 3 ELSE 0 END`;
      sql += ` + CASE WHEN f.answer LIKE ? THEN 2 ELSE 0 END`;
      sql += ` + CASE WHEN f.keywords LIKE ? THEN 3 ELSE 0 END`;
      params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
    });
    
    sql += `) as match_score
      FROM faqs f
      LEFT JOIN policy_categories pc ON f.category_id = pc.id
      WHERE f.is_active = 1
      HAVING match_score > 0
      ORDER BY match_score DESC
      LIMIT 5
    `;
    
    const matchedFaqs = db.query(sql, params);
    
    const policySql = `
      SELECT p.*, pc.name as category_name,
             (0
    `;
    const policyParams = [];
    
    keywords.forEach((kw, i) => {
      policySql += ` + CASE WHEN p.title LIKE ? THEN 3 ELSE 0 END`;
      policySql += ` + CASE WHEN p.content LIKE ? THEN 1 ELSE 0 END`;
      policySql += ` + CASE WHEN p.keywords LIKE ? THEN 3 ELSE 0 END`;
      policyParams.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
    });
    
    policySql += `) as match_score
      FROM policies p
      LEFT JOIN policy_categories pc ON p.category_id = pc.id
      WHERE p.is_active = 1
      HAVING match_score > 0
      ORDER BY match_score DESC
      LIMIT 3
    `;
    
    const matchedPolicies = db.query(policySql, policyParams);
    
    const autoTags = [
      ...new Set([
        ...matchedFaqs.slice(0, 2).map(f => f.auto_attribution_tags ? f.auto_attribution_tags.split(',') : []).flat(),
        ...keywords.slice(0, 5)
      ])
    ].slice(0, 10);
    
    res.json({ 
      ok: true, 
      data: { 
        matched_faqs: matchedFaqs,
        matched_policies: matchedPolicies,
        auto_attribution_tags: autoTags,
        extracted_keywords: keywords
      } 
    });
  });

  app.post('/api/consultation', auth.requireAuth, async (req, res) => {
    const body = await req.body;
    const { question, session_type = 'text', question_voice_url, question_voice_duration } = body;
    
    if (!question) {
      return res.json({ ok: false, message: '请输入咨询问题' });
    }
    
    const keywords = question.split(/[\s，。？！、；：""''（）\[\]【】]+/).filter(k => k.length > 1);
    
    let matchScore = 0;
    let matchedFaqId = null;
    let matchedPolicyId = null;
    let autoAnswer = '';
    let confidenceScore = 0;
    
    if (keywords.length > 0) {
      let faqSql = `
        SELECT f.*, (0
      `;
      const faqParams = [];
      
      keywords.forEach((kw, i) => {
        faqSql += ` + CASE WHEN f.question LIKE ? THEN 5 ELSE 0 END`;
        faqSql += ` + CASE WHEN f.answer LIKE ? THEN 2 ELSE 0 END`;
        faqSql += ` + CASE WHEN f.keywords LIKE ? THEN 4 ELSE 0 END`;
      faqParams.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
    });
    
    faqSql += `) as match_score
      FROM faqs f
      WHERE f.is_active = 1
      HAVING match_score > 0
      ORDER BY match_score DESC
      LIMIT 1
    `;
      
      const matchedFaqs = db.query(faqSql, faqParams);
      
      if (matchedFaqs.length > 0 && matchedFaqs[0].match_score >= 5) {
        matchedFaqId = matchedFaqs[0].id;
        autoAnswer = matchedFaqs[0].answer;
        confidenceScore = Math.min(matchedFaqs[0].match_score / (keywords.length * 5), 0.98);
        matchScore = matchedFaqs[0].match_score;
        
        db.execute('UPDATE faq_items SET view_count = view_count + 1 WHERE id = ?', [matchedFaqId]);
      }
    }
    
    let isManualTransfer = confidenceScore < 0.6;
    let transferReason = isManualTransfer ? '置信度不足，需要人工回复' : null;
    
    const initialIntent = keywords.length > 0 ? keywords[0] : '政策咨询';
    
    db.execute(`
      INSERT INTO consulting_sessions 
      (user_id, user_type, session_type, question, question_voice_url, question_voice_duration,
       initial_intent, confidence_score, matched_policy_id, matched_faq_id, 
       auto_answer, is_manual_transfer, transfer_reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.session.userId,
      req.session.userType,
      session_type,
      escapeStr(question),
      question_voice_url ? escapeStr(question_voice_url) : null,
      question_voice_duration || null,
      escapeStr(initialIntent),
      confidenceScore,
      matchedPolicyId,
      matchedFaqId,
      escapeStr(autoAnswer),
      isManualTransfer ? 1 : 0,
      transferReason ? escapeStr(transferReason) : null,
      isManualTransfer ? 'pending' : 'auto_answered'
    ]);
    
    const sessionId = db.getLastInsertId();
    
    const response = {
      ok: true,
      data: {
        session_id: sessionId,
        auto_answer: autoAnswer,
        confidence_score: confidenceScore,
        is_manual_transfer: isManualTransfer,
        matched_faq: matchedFaqId ? { id: matchedFaqId, match_score: matchScore } : null,
        matched_policy: matchedPolicyId ? { id: matchedPolicyId } : null,
        suggested_keywords: keywords.slice(0, 5),
        status: isManualTransfer ? 'pending' : 'auto_answered'
      }
    };
    
    if (isManualTransfer) {
      response.data.message = '您的问题已转人工处理，我们将尽快回复您';
    }
    
    res.json(response);
  });

  app.get('/api/consultation/history', auth.requireAuth, (req, res) => {
    const { page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;
    
    const sessions = db.query(`
      SELECT cs.*, u.real_name as operator_name
      FROM consulting_sessions cs
      LEFT JOIN users u ON cs.operator_id = u.id
      WHERE cs.user_id = ?
      ORDER BY cs.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.session.userId, Number(page_size), Number(offset)]);
    
    res.json({ ok: true, data: sessions, page: Number(page), page_size: Number(page_size) });
  });

  app.post('/api/consultation/:id/satisfaction', auth.requireAuth, async (req, res) => {
    const sessionId = Number(req.params.id);
    const body = await req.body;
    const { rating, comment } = body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.json({ ok: false, message: '请选择有效的评分（1-5星）' });
    }
    
    db.execute(`
      UPDATE consulting_sessions
      SET satisfaction_rating = ?, satisfaction_comment = ?, status = 'completed'
      WHERE id = ? AND user_id = ?
    `, [rating, comment ? escapeStr(comment) : null, sessionId, req.session.userId]);
    
    res.json({ ok: true, message: '感谢您的评价' });
  });

  app.get('/api/knowledge-graph', auth.requireAuth, (req, res) => {
    const { node_type, keyword, depth = 2 } = req.query;
    
    let nodeSql = `
      SELECT * FROM policy_nodes
      WHERE 1=1
    `;
    const nodeParams = [];
    
    if (node_type) {
      nodeSql += ' AND node_type = ?';
      nodeParams.push(node_type);
    }
    if (keyword) {
      nodeSql += ' AND (node_title LIKE ? OR node_content LIKE ?)';
      nodeParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    nodeSql += ' ORDER BY node_type, id LIMIT 100';
    
    const nodes = db.query(nodeSql, nodeParams);
    
    const nodeIds = nodes.map(n => n.id);
    let relations = [];
    
    if (nodeIds.length > 0) {
      const placeholders = nodeIds.map(() => '?').join(',');
      relations = db.query(`
        SELECT kgr.*, 
               src.node_title as source_name, src.node_type as source_type,
               tgt.node_title as target_name, tgt.node_type as target_type
        FROM policy_relations kgr
        INNER JOIN policy_nodes src ON kgr.policy_id = src.id
        INNER JOIN policy_nodes tgt ON kgr.related_policy_id = tgt.id
        WHERE kgr.policy_id IN (${placeholders}) 
           OR kgr.related_policy_id IN (${placeholders})
        ORDER BY kgr.id DESC
        LIMIT 200
      `, [...nodeIds, ...nodeIds]);
    }
    
    const nodeTypes = db.query(`
      SELECT DISTINCT node_type, COUNT(*) as count
      FROM policy_nodes
      GROUP BY node_type
      ORDER BY count DESC
    `);
    
    res.json({ 
      ok: true, 
      data: { 
        nodes, 
        relations, 
        node_types: nodeTypes,
        total_nodes: nodes.length,
        total_relations: relations.length
      } 
    });
  });

  app.get('/api/knowledge-graph/:id', auth.requireAuth, (req, res) => {
    const nodeId = Number(req.params.id);
    
    const nodes = db.query(`
      SELECT * FROM policy_nodes WHERE id = ? LIMIT 1
    `, [nodeId]);
    
    if (nodes.length === 0) {
      return res.json({ ok: false, message: '节点不存在' });
    }
    
    const relations = db.query(`
      SELECT kgr.*,
             CASE WHEN kgr.policy_id = ? THEN 'outgoing' ELSE 'incoming' END as direction,
             CASE WHEN kgr.policy_id = ? THEN tgt.node_title ELSE src.node_title END as related_node_name,
             CASE WHEN kgr.policy_id = ? THEN tgt.node_type ELSE src.node_type END as related_node_type,
             CASE WHEN kgr.policy_id = ? THEN tgt.id ELSE src.id END as related_node_id
      FROM policy_relations kgr
      LEFT JOIN policy_nodes src ON kgr.policy_id = src.id
      LEFT JOIN policy_nodes tgt ON kgr.related_policy_id = tgt.id
      WHERE kgr.policy_id = ? OR kgr.related_policy_id = ?
      ORDER BY kgr.id DESC
    `, [nodeId, nodeId, nodeId, nodeId, nodeId, nodeId]);
    
    res.json({ ok: true, data: { node: nodes[0], relations } });
  });

  app.get('/api/policy-categories', auth.requireAuth, (req, res) => {
    const categories = db.query(`
      SELECT pc.*, 
             (SELECT COUNT(*) FROM policies p WHERE p.category_id = pc.id AND p.is_active = 1) as policy_count,
             (SELECT COUNT(*) FROM faqs f WHERE f.category_id = pc.id AND f.is_active = 1) as faq_count
      FROM policy_categories pc
      ORDER BY pc.level, pc.sort_order, pc.id
    `);
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(c => c.parent_id === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };
    
    const tree = buildTree(null);
    
    res.json({ ok: true, data: tree, flat: categories });
  });

  app.get('/api/policies/hot', auth.requireAuth, (req, res) => {
    const { limit = 10 } = req.query;
    
    const hotPolicies = db.query(`
      SELECT p.id, p.title, p.issue_date, p.view_count, pc.name as category_name
      FROM policies p
      INNER JOIN policy_categories pc ON p.category_id = pc.id
      WHERE p.is_active = 1
      ORDER BY p.view_count DESC
      LIMIT ?
    `, [Number(limit)]);
    
    const hotFaqs = db.query(`
      SELECT f.id, f.question, f.view_count, f.helpful_count
      FROM faqs f
      WHERE f.is_active = 1
      ORDER BY f.view_count DESC
      LIMIT ?
    `, [Number(limit)]);
    
    res.json({ ok: true, data: { hot_policies: hotPolicies, hot_faqs: hotFaqs } });
  });
}

module.exports = { registerPolicyRoutes };
