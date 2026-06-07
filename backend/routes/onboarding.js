
const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/rateLimit');

const router = express.Router();

const TRAINING_QUESTIONS = [
  {
    id: 1,
    question: '公司规章制度中，以下哪种行为是被禁止的？',
    options: ['按时上下班', '泄露公司商业机密', '参加团建活动', '提交工作报告'],
    answer: 1
  },
  {
    id: 2,
    question: '关于安全生产，以下说法正确的是？',
    options: ['不需要佩戴安全帽', '可以随意操作设备', '必须遵守安全操作规程', '可以酒后上班'],
    answer: 2
  },
  {
    id: 3,
    question: '以下哪项是员工应该遵守的职业道德？',
    options: ['上班迟到早退', '诚实守信，爱岗敬业', '敷衍了事', '损公肥私'],
    answer: 1
  },
  {
    id: 4,
    question: '关于考勤制度，以下说法正确的是？',
    options: ['可以随意旷工', '有事不需要请假', '遵守考勤制度，不迟到不早退', '可以代打卡'],
    answer: 2
  },
  {
    id: 5,
    question: '在工作场所遇到火灾应该？',
    options: ['乘电梯逃生', '从安全通道疏散', '乘乱逃跑', '不报警直接跑'],
    answer: 1
  }
];

const getOnboardingStatus = (flow) => {
  if (flow.completed) return 'completed';
  const now = new Date();
  const expiresAt = new Date(flow.expires_at);
  if (now > expiresAt) return 'expired';
  if (flow.contract_signed && flow.training_completed) return 'completed';
  if (flow.contract_signed) return 'training_pending';
  return 'contract_pending';
};

router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const flows = db.prepare(`
      SELECT 
        of.*,
        r.status as referral_status,
        j.title as job_title,
        c.name as company_name
      FROM onboarding_flows of
      JOIN referrals r ON of.referral_id = r.id
      JOIN jobs j ON r.job_id = j.id
      JOIN companies c ON of.company_id = c.id
      WHERE of.candidate_id = ? OR c.owner_id = ?
      ORDER BY of.created_at DESC
    `).all(userId, userId);

    const onboardings = flows.map(flow => ({
      ...flow,
      status: getOnboardingStatus(flow)
    }));

    res.json({ flows, onboardings });
  } catch (err) {
    console.error('获取入职流程失败:', err);
    res.status(500).json({ error: '获取入职流程失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const flow = db.prepare(`
      SELECT 
        of.*,
        r.status as referral_status,
        j.title as job_title, j.description as job_description,
        c.name as company_name, c.address as company_address,
        u.username as candidate_name, u.phone as candidate_phone
      FROM onboarding_flows of
      JOIN referrals r ON of.referral_id = r.id
      JOIN jobs j ON r.job_id = j.id
      JOIN companies c ON of.company_id = c.id
      JOIN users u ON of.candidate_id = u.id
      WHERE of.id = ?
    `).get(id);

    if (!flow) {
      return res.status(404).json({ error: '入职流程不存在' });
    }

    if (flow.candidate_id !== userId && 
        req.user.role !== 'admin' &&
        !(req.user.role === 'employer' && req.user.current_company_id === flow.company_id)) {
      return res.status(403).json({ error: '无权查看此入职流程' });
    }

    const now = new Date();
    const expiresAt = new Date(flow.expires_at);
    const timeRemaining = expiresAt - now;
    const isExpired = timeRemaining <= 0;
    const onboarding = {
      ...flow,
      status: getOnboardingStatus(flow)
    };

    res.json({ 
      flow: onboarding, 
      onboarding,
      isExpired, 
      timeRemaining,
      expiresAt: flow.expires_at
    });
  } catch (err) {
    console.error('获取入职流程详情失败:', err);
    res.status(500).json({ error: '获取入职流程详情失败' });
  }
});

router.get('/:id/training/questions', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const flow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(id);
    if (!flow) {
      return res.status(404).json({ error: '入职流程不存在' });
    }

    if (flow.candidate_id !== userId) {
      return res.status(403).json({ error: '只能查看自己的培训题目' });
    }

    const shuffled = TRAINING_QUESTIONS.sort(() => Math.random() - 0.5).slice(0, 5);
    const questionsWithoutAnswers = shuffled.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    res.json({ questions: questionsWithoutAnswers });
  } catch (err) {
    console.error('获取培训题目失败:', err);
    res.status(500).json({ error: '获取培训题目失败' });
  }
});

router.post('/:id/contract/sign',
  authenticateToken,
  logAudit('sign_contract'),
  (req, res) => {
    try {
      const { id } = req.params;
      const { signature } = req.body;
      const userId = req.user.id;

      const flow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(id);
      if (!flow) {
        return res.status(404).json({ error: '入职流程不存在' });
      }

      if (flow.candidate_id !== userId) {
        return res.status(403).json({ error: '只能签署自己的合同' });
      }

      if (flow.contract_signed) {
        return res.status(400).json({ error: '合同已签署' });
      }

      const now = new Date();
      const expiresAt = new Date(flow.expires_at);
      if (now > expiresAt) {
        return res.status(400).json({ error: '入职流程已过期，请重新申请' });
      }

      db.prepare(`
        UPDATE onboarding_flows 
        SET contract_signed = 1, step = MAX(step, 1)
        WHERE id = ?
      `).run(id);

      const updatedFlow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(id);
      res.json({ flow: updatedFlow, message: '合同签署成功' });
    } catch (err) {
      console.error('签署合同失败:', err);
      res.status(500).json({ error: '签署合同失败' });
    }
  }
);

router.post('/:id/training/submit',
  authenticateToken,
  logAudit('submit_training'),
  (req, res) => {
    try {
      const { id } = req.params;
      const { answers } = req.body;
      const userId = req.user.id;

      const flow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(id);
      if (!flow) {
        return res.status(404).json({ error: '入职流程不存在' });
      }

      if (flow.candidate_id !== userId) {
        return res.status(403).json({ error: '只能提交自己的培训答案' });
      }

      if (flow.training_completed) {
        return res.status(400).json({ error: '培训已完成' });
      }

      const now = new Date();
      const expiresAt = new Date(flow.expires_at);
      if (now > expiresAt) {
        return res.status(400).json({ error: '入职流程已过期，请重新申请' });
      }

      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: '请提交答案' });
      }

      let correctCount = 0;
      const isSimpleArray = answers.every(a => typeof a === 'number');
      
      if (isSimpleArray) {
        answers.forEach((userAnswer, index) => {
          const question = TRAINING_QUESTIONS[index];
          if (question && question.answer === userAnswer) {
            correctCount++;
          }
        });
      } else {
        answers.forEach(userAnswer => {
          const question = TRAINING_QUESTIONS.find(q => q.id === userAnswer.question_id);
          if (question && question.answer === userAnswer.answer) {
            correctCount++;
          }
        });
      }

      const score = Math.round((correctCount / answers.length) * 100);
      const passed = score >= 60;

      if (passed) {
        db.prepare(`
          UPDATE onboarding_flows 
          SET training_completed = 1, training_score = ?, step = 2
          WHERE id = ?
        `).run(score, id);
      }

      const updatedFlow = db.prepare('SELECT * FROM onboarding_flows WHERE id = ?').get(id);

      if (passed && updatedFlow.contract_signed) {
        db.prepare(`
          UPDATE onboarding_flows 
          SET completed = 1, step = 3
          WHERE id = ?
        `).run(id);
      }

      res.json({ 
        flow: updatedFlow,
        score,
        passed,
        message: passed ? '培训考试通过' : '培训考试未通过，请重新考试'
      });
    } catch (err) {
      console.error('提交培训答案失败:', err);
      res.status(500).json({ error: '提交培训答案失败' });
    }
  }
);

router.get('/:id/contract/template', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const flow = db.prepare(`
      SELECT 
        of.*,
        c.name as company_name,
        j.title as job_title,
        j.salary_min, j.salary_max,
        u.username as candidate_name
      FROM onboarding_flows of
      JOIN companies c ON of.company_id = c.id
      JOIN referrals r ON of.referral_id = r.id
      JOIN jobs j ON r.job_id = j.id
      JOIN users u ON of.candidate_id = u.id
      WHERE of.id = ?
    `).get(id);

    if (!flow) {
      return res.status(404).json({ error: '入职流程不存在' });
    }

    if (flow.candidate_id !== userId && 
        req.user.role !== 'admin' &&
        !(req.user.role === 'employer' && req.user.current_company_id === flow.company_id)) {
      return res.status(403).json({ error: '无权查看此合同' });
    }

    const template = `
# 劳动合同

甲方（用人单位）：${flow.company_name}
乙方（劳动者）：${flow.candidate_name}
工作岗位：${flow.job_title}
薪资待遇：${flow.salary_min} - ${flow.salary_max} 元/月

## 一、合同期限
本合同为固定期限劳动合同，期限为 3 年，自入职之日起计算。

## 二、工作内容和工作地点
1. 乙方同意根据甲方工作需要，担任 ${flow.job_title} 岗位工作。
2. 工作地点：甲方公司所在地。

## 三、工作时间和休息休假
1. 执行标准工时制度，每日工作不超过8小时，每周不超过40小时。
2. 乙方依法享有国家规定的各项休息休假权利。

## 四、劳动报酬
1. 甲方按月支付乙方工资，月工资为 ${flow.salary_min} - ${flow.salary_max} 元。
2. 甲方于每月 15 日前以货币形式支付乙方工资。

## 五、社会保险和福利待遇
1. 甲乙双方按国家规定参加社会保险，缴纳社会保险费。
2. 乙方享受甲方规定的各项福利待遇。

## 六、劳动保护和劳动条件
甲方为乙方提供符合国家规定的劳动安全卫生条件和必要的劳动防护用品。

## 七、劳动合同的解除和终止
双方协商一致，可以解除劳动合同。乙方提前三十日以书面形式通知甲方，可以解除劳动合同。

## 八、其他事项
本合同一式两份，甲乙双方各执一份，自双方签字之日起生效。

甲方（盖章）：${flow.company_name}
乙方（签字）：_______________
日期：___________
    `;

    res.json({ template });
  } catch (err) {
    console.error('获取合同模板失败:', err);
    res.status(500).json({ error: '获取合同模板失败' });
  }
});

module.exports = router;
