const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function parseJSONFields(item) {
  if (!item) return item;
  try {
    if (item.options) item.options = JSON.parse(item.options || '[]');
  } catch (e) {}
  return item;
}

const policyAnswers = [
  { keywords: ['补贴', '补助', '钱', '申请'], answer: '您好！关于补贴申请：粮食补贴由村委会统一登记，每年6月前完成登记，8-9月打入一卡通账户；低保申请需提供户口本、收入证明，经村委会评议、乡镇审核后公示7天。您想了解哪类补贴的具体信息？' },
  { keywords: ['医保', '合作医疗', '看病', '报销'], answer: '您好！农村合作医疗报销政策：乡镇卫生院住院报销约80%，县级医院约65%，市级医院约55%。门诊在村卫生室报销约60%。大病保险在基本医保报销后，对个人负担超过1万元的部分再报销60%。' },
  { keywords: ['养老', '养老金', '养老保险', '退休'], answer: '您好！农村养老保险政策：缴费档次从100元到3000元不等，政府给予缴费补贴。年满60周岁、累计缴费满15年可领取养老金。目前基础养老金最低标准为每月180元，个人账户养老金=个人账户储存额/139。' },
  { keywords: ['宅基地', '建房', '土地', '确权'], answer: '您好！关于宅基地政策：农村宅基地归集体所有，农户只有使用权。申请建房需符合一户一宅条件，经村委会同意、乡镇规划部门审批后方可施工。宅基地不能向本村以外的人出售。土地确权后会颁发土地承包经营权证，确认承包经营权。' },
  { keywords: ['教育', '上学', '学校', '助学金', '助学贷款'], answer: '您好！农村教育扶持政策：义务教育阶段实行两免一补（免学杂费、免教科书费，补助寄宿生生活费）。高中阶段有国家助学金，家庭困难学生每年资助约2000元。大学生可申请生源地信用助学贷款，每年最高12000元。' },
  { keywords: ['贷款', '借钱', '信贷', '创业'], answer: '您好！关于农村贷款政策：农户小额信用贷款额度一般在10万元以内，凭信用等级发放，无需抵押。返乡创业担保贷款最高20万元，政府给予贴息。具体额度和利率请咨询当地农商行或信用社。' },
  { keywords: ['农机', '农具', '机械', '购置'], answer: '您好！农机购置补贴政策：购买列入国家补贴目录的农机具，可享受购机价格30%以内的补贴，单机最高不超过5万元。购买后携带购机发票、身份证到乡镇农机站申请，补贴款直接打入一卡通。' },
  { keywords: ['保险', '农险', '受灾', '理赔'], answer: '您好！农业保险政策：政府补贴保费80%，农户自付20%。主要险种：水稻每亩保费24元（自付4.8元），保额400元；能繁母猪每头保费60元（自付12元），保额1000元。受灾后及时向保险公司报案，查勘定损后10个工作日内赔付。' },
  { keywords: ['低保', '贫困户', '困难', '五保'], answer: '您好！低保和五保政策：农村低保标准约每人每月400-600元，根据家庭困难程度分档。五保户供养标准每人每年约8000-10000元，可选择集中供养或分散供养。建档立卡贫困户还可享受教育、医疗、住房等多项扶贫政策。' },
  { keywords: ['拆迁', '征收', '补偿', '征地'], answer: '您好！征地拆迁补偿政策：补偿包括土地补偿费、安置补助费、地上附着物和青苗补偿费。土地补偿费一般为前3年平均年产值的6-10倍，安置补助费为4-6倍。具体补偿标准由省级政府制定，每3年调整一次。' },
];

router.get('/votes', (req, res) => {
  try {
    const status = req.query.status;
    let sql = 'SELECT * FROM votes WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const votes = db.prepare(sql).all(...params).map(parseJSONFields);

    for (const vote of votes) {
      const records = db.prepare(
        'SELECT option_index, COUNT(*) as count FROM vote_records WHERE vote_id = ? GROUP BY option_index'
      ).all(vote.id);
      vote.results = records;
      vote.total_votes = records.reduce((sum, r) => sum + r.count, 0);
    }

    res.json(votes);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/votes', authMiddleware, (req, res) => {
  try {
    const { title, description, options = [], start_time, end_time, status = 'active' } = req.body;
    if (!title || options.length < 2) {
      return res.status(400).json({ error: '标题和至少两个选项不能为空', code: 400 });
    }

    const result = db.prepare(
      `INSERT INTO votes (title, description, options, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      title, description || null, JSON.stringify(options),
      start_time || null, end_time || null, status
    );

    res.json({ id: result.lastInsertRowid, message: '投票创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/votes/:id/cast', (req, res) => {
  try {
    const { voter_name, voter_phone, option_index } = req.body;
    const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
    if (!vote) {
      return res.status(404).json({ error: '投票不存在', code: 404 });
    }

    const options = JSON.parse(vote.options || '[]');
    if (option_index < 0 || option_index >= options.length) {
      return res.status(400).json({ error: '无效的选项索引', code: 400 });
    }

    if (voter_phone) {
      const existing = db.prepare(
        'SELECT * FROM vote_records WHERE vote_id = ? AND voter_phone = ?'
      ).get(req.params.id, voter_phone);
      if (existing) {
        return res.status(400).json({ error: '该手机号已投过票', code: 400 });
      }
    }

    db.prepare(
      `INSERT INTO vote_records (vote_id, voter_name, voter_phone, option_index)
       VALUES (?, ?, ?, ?)`
    ).run(req.params.id, voter_name || null, voter_phone || null, option_index);

    res.json({ message: '投票成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/votes/:id/result', (req, res) => {
  try {
    const vote = db.prepare('SELECT * FROM votes WHERE id = ?').get(req.params.id);
    if (!vote) {
      return res.status(404).json({ error: '投票不存在', code: 404 });
    }
    parseJSONFields(vote);

    const records = db.prepare(
      'SELECT option_index, COUNT(*) as count FROM vote_records WHERE vote_id = ? GROUP BY option_index'
    ).all(req.params.id);

    const total = records.reduce((sum, r) => sum + r.count, 0);
    const results = vote.options.map((opt, idx) => {
      const r = records.find(r => r.option_index === idx);
      return {
        option: opt,
        count: r ? r.count : 0,
        percentage: total > 0 ? ((r ? r.count : 0) / total * 100).toFixed(2) + '%' : '0%',
      };
    });

    res.json({ vote, total_votes: total, results });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.get('/discussions', (req, res) => {
  try {
    const type = req.query.type;
    let sql = 'SELECT * FROM discussions WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';
    const discussions = db.prepare(sql).all(...params);

    for (const d of discussions) {
      d.reply_count = db.prepare(
        'SELECT COUNT(*) as count FROM discussion_replies WHERE discussion_id = ?'
      ).get(d.id).count;
    }

    res.json(discussions);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/discussions', (req, res) => {
  try {
    const { title, content, author, type = 'discussion' } = req.body;
    if (!title) {
      return res.status(400).json({ error: '标题不能为空', code: 400 });
    }

    const result = db.prepare(
      `INSERT INTO discussions (title, content, author, type) VALUES (?, ?, ?, ?)`
    ).run(title, content || null, author || null, type);

    res.json({ id: result.lastInsertRowid, message: '发布成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

router.post('/discussions/:id/reply', (req, res) => {
  try {
    const { content, author } = req.body;
    const discussion = db.prepare('SELECT * FROM discussions WHERE id = ?').get(req.params.id);
    if (!discussion) {
      return res.status(404).json({ error: '讨论不存在', code: 404 });
    }
    if (!content) {
      return res.status(400).json({ error: '回复内容不能为空', code: 400 });
    }

    const result = db.prepare(
      `INSERT INTO discussion_replies (discussion_id, content, author) VALUES (?, ?, ?)`
    ).run(req.params.id, content, author || null);

    res.json({ id: result.lastInsertRowid, message: '回复成功' });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

function answerPolicyQuestion(req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: '问题不能为空', code: 400 });
    }

    let matchedAnswer = '您好！感谢您的咨询。关于您的问题，建议您直接到村委会或乡镇政府咨询，工作人员会为您提供详细解答。您也可以拨打政务服务热线12345。';
    let matchedCategory = '通用';

    for (const p of policyAnswers) {
      if (p.keywords.some(k => question.includes(k))) {
        matchedAnswer = p.answer;
        matchedCategory = p.keywords[0];
        break;
      }
    }

    db.prepare(
      `INSERT INTO policy_qa (question, answer, category) VALUES (?, ?, ?)`
    ).run(question, matchedAnswer, matchedCategory);

    res.json({
      question,
      answer: matchedAnswer,
      category: matchedCategory,
      ai_notice: '以上回答由AI智能助手提供，仅供参考。具体政策以官方文件为准。',
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
}

router.post('/qa/ask', answerPolicyQuestion);
router.post('/qa', answerPolicyQuestion);

router.get('/qa/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = db.prepare(
      'SELECT * FROM policy_qa ORDER BY created_at DESC LIMIT ?'
    ).all(limit);

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

module.exports = router;
