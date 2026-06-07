const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();
const prisma = new PrismaClient();

const lawKnowledge = {
  salary: '根据《劳动合同法》第三十条，用人单位应当按照劳动合同约定和国家规定，向劳动者及时足额支付劳动报酬。用人单位拖欠或者未足额支付劳动报酬的，劳动者可以依法向当地人民法院申请支付令。',
  overtime: '根据《劳动法》第四十四条，有下列情形之一的，用人单位应当按照下列标准支付高于劳动者正常工作时间工资的工资报酬：（一）安排劳动者延长工作时间的，支付不低于工资的百分之一百五十的工资报酬；（二）休息日安排劳动者工作又不能安排补休的，支付不低于工资的百分之二百的工资报酬；（三）法定休假日安排劳动者工作的，支付不低于工资的百分之三百的工资报酬。',
  social_security: '根据《社会保险法》第五十八条，用人单位应当自用工之日起三十日内为其职工向社会保险经办机构申请办理社会保险登记。未办理社会保险登记的，由社会保险经办机构核定其应当缴纳的社会保险费。',
  dismissal: '根据《劳动合同法》第四十七条，经济补偿按劳动者在本单位工作的年限，每满一年支付一个月工资的标准向劳动者支付。六个月以上不满一年的，按一年计算；不满六个月的，向劳动者支付半个月工资的经济补偿。',
  contract: '根据《劳动合同法》第十条，建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。',
  probation: '根据《劳动合同法》第十九条，劳动合同期限三个月以上不满一年的，试用期不得超过一个月；劳动合同期限一年以上不满三年的，试用期不得超过二个月；三年以上固定期限和无固定期限的劳动合同，试用期不得超过六个月。',
};

const contractRiskRules = [
  {
    keyword: '试用期',
    check: (text) => {
      const match = text.match(/试用期[^。，;]*([\d一二三四五六七八九十]+)[^日月]*[日月]/);
      if (match) {
        const num = match[1];
        const numMap = { '一': 1, '二': 2, '三': 3, '六': 6 };
        const months = numMap[num] || parseInt(num);
        if (months > 6) return { level: 'danger', message: '试用期超过6个月，违反劳动合同法规定' };
      }
      return null;
    }
  },
  {
    keyword: '违约金',
    check: () => ({ level: 'warning', message: '合同中约定违约金，建议核实是否符合法律规定' }),
  },
  {
    keyword: '押金',
    check: () => ({ level: 'danger', message: '收取押金违反劳动合同法第九条规定' }),
  },
  {
    keyword: '加班',
    check: () => ({ level: 'info', message: '建议明确加班工资计算方式和审批流程' }),
  },
  {
    keyword: '工资',
    check: () => ({ level: 'info', message: '建议明确工资发放日期和组成结构' }),
  },
];

router.get('/law/search', authenticateToken, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      const articles = await prisma.lawArticle.findMany({ take: 20 });
      return res.json(articles);
    }

    const articles = await prisma.lawArticle.findMany();
    const results = articles.filter(a =>
      a.title.includes(keyword) || a.content.includes(keyword)
    );

    if (results.length === 0 && lawKnowledge[keyword]) {
      return res.json([{
        id: 'kb-' + keyword,
        title: `关于"${keyword}"相关法律规定`,
        content: lawKnowledge[keyword],
        category: '知识库',
      }]);
    }

    res.json(results);
  } catch (error) {
    console.error('Search law error:', error);
    res.status(500).json({ error: '检索失败' });
  }
});

router.get('/law/articles', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};
    const articles = await prisma.lawArticle.findMany({ where });
    res.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: '获取法条失败' });
  }
});

router.post('/contract/scan', authenticateToken, auditLog('CONTRACT_SCAN', 'compliance'), async (req, res) => {
  try {
    const { content, fileName } = req.body;

    if (!content) {
      return res.status(400).json({ error: '请提供合同内容' });
    }

    const risks = [];

    for (const rule of contractRiskRules) {
      if (content.includes(rule.keyword)) {
        const risk = rule.check(content);
        if (risk) {
          risks.push({
            ...risk,
            keyword: rule.keyword,
          });
        }
      }
    }

    const suggestions = [];
    if (risks.length === 0) {
      suggestions.push('合同条款基本合规，建议定期审查合同期限、工作内容、劳动报酬等核心条款是否明确');
    } else {
      suggestions.push('建议针对上述风险点进行修改');
      suggestions.push('建议由专业律师进行最终审核');
    }

    if (!content.includes('社会保险') || !content.includes('社保')) {
      risks.push({
        level: 'warning',
        message: '合同中缺少社会保险相关条款',
        keyword: '社会保险',
      });
    }

    if (!content.includes('工作时间') || !content.includes('工时')) {
      risks.push({
        level: 'info',
        message: '建议明确工作时间和休息休假条款',
        keyword: '工作时间',
      });
    }

    if (!content.includes('劳动保护') || !content.includes('劳动条件')) {
      risks.push({
        level: 'info',
        message: '建议明确劳动保护和劳动条件条款',
        keyword: '劳动保护',
      });
    }

    const score = Math.max(0, 100 - risks.filter(r => r.level === 'danger').length * 20 - risks.filter(r => r.level === 'warning').length * 10);

    const scan = await prisma.contractScan.create({
      data: {
        userId: req.user.id,
        fileName,
        ocrResult: content,
        riskPoints: JSON.stringify(risks),
        suggestions: JSON.stringify(suggestions),
      },
    });

    res.json({
      scanId: scan.id,
      score,
      risks,
      suggestions,
      level: score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high',
    });
  } catch (error) {
    console.error('Contract scan error:', error);
    res.status(500).json({ error: '合同扫描失败' });
  }
});

router.get('/contract/scans', authenticateToken, async (req, res) => {
  try {
    const scans = await prisma.contractScan.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(scans.map(s => ({
      ...s,
      risks: s.riskPoints ? JSON.parse(s.riskPoints) : [],
      suggestions: s.suggestions ? JSON.parse(s.suggestions) : [],
    })));
  } catch (error) {
    console.error('Get scans error:', error);
    res.status(500).json({ error: '获取扫描记录失败' });
  }
});

router.post('/law/ask', authenticateToken, auditLog('LAW_ASK', 'compliance'), async (req, res) => {
  try {
    const { question } = req.body;

    let answer = '根据您的问题，建议您参考以下法律规定：';

    if (question.includes('工资') || question.includes('薪资') || question.includes('拖欠')) {
      answer += '\n\n' + lawKnowledge.salary;
      answer += '\n\n建议：如果遇到工资拖欠问题，您可以向劳动监察部门投诉或申请劳动仲裁。';
    } else if (question.includes('加班') || question.includes('加班费')) {
      answer += '\n\n' + lawKnowledge.overtime;
      answer += '\n\n建议：保留加班证据，如考勤记录、加班审批等。';
    } else if (question.includes('社保') || question.includes('保险') || question.includes('公积金')) {
      answer += '\n\n' + lawKnowledge.social_security;
      answer += '\n\n建议：可以向社保经办机构投诉，要求补缴。';
    } else if (question.includes('辞退') || question.includes('解雇') || question.includes('赔偿') || question.includes('补偿')) {
      answer += '\n\n' + lawKnowledge.dismissal;
      answer += '\n\n建议：如果是违法解除劳动合同，可要求支付赔偿金（经济补偿的2倍）。';
    } else if (question.includes('合同') || question.includes('劳动合同')) {
      answer += '\n\n' + lawKnowledge.contract;
      answer += '\n\n建议：用人单位自用工之日起超过一个月不满一年未与劳动者订立书面劳动合同的，应当向劳动者每月支付二倍的工资。';
    } else if (question.includes('试用期')) {
      answer += '\n\n' + lawKnowledge.probation;
      answer += '\n\n建议：试用期工资不得低于本单位相同岗位最低档工资或者劳动合同约定工资的百分之八十。';
    } else {
      const articles = await prisma.lawArticle.findMany({ take: 3 });
      answer += '\n\n' + articles.map(a => `《${a.title}》：${a.content}`).join('\n\n');
      answer += '\n\n建议：如需更详细的法律建议，建议咨询专业律师。';
    }

    res.json({ answer });
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: '咨询失败' });
  }
});

module.exports = router;
