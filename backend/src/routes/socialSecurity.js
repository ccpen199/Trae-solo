const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/policies', authenticateToken, async (req, res) => {
  try {
    const policies = await prisma.socialSecurityPolicy.findMany({
      orderBy: { cityName: 'asc' },
    });

    const result = policies.map(p => ({
      cityCode: p.cityCode,
      cityName: p.cityName,
      minBase: p.minBase,
      maxBase: p.maxBase,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ error: '获取政策列表失败' });
  }
});

router.get('/policies/:cityCode', authenticateToken, async (req, res) => {
  try {
    const { cityCode } = req.params;
    const policy = await prisma.socialSecurityPolicy.findUnique({
      where: { cityCode },
    });

    if (!policy) {
      return res.status(404).json({ error: '未找到该城市的社保政策' });
    }

    res.json({
      cityCode: policy.cityCode,
      cityName: policy.cityName,
      pensionRates: JSON.parse(policy.pensionRates),
      medicalRates: JSON.parse(policy.medicalRates),
      unemploymentRates: JSON.parse(policy.unemploymentRates),
      injuryRates: JSON.parse(policy.injuryRates),
      maternityRates: JSON.parse(policy.maternityRates),
      housingFundRates: JSON.parse(policy.housingFundRates),
      minBase: policy.minBase,
      maxBase: policy.maxBase,
      effectiveDate: policy.effectiveDate,
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ error: '获取社保政策失败' });
  }
});

router.post('/calculate', authenticateToken, auditLog('SOCIAL_SECURITY_CALCULATE', 'social_security'), async (req, res) => {
  try {
    const { cityCode, baseSalary, housingFundRatio } = req.body;

    const policy = await prisma.socialSecurityPolicy.findUnique({
      where: { cityCode },
    });

    if (!policy) {
      return res.status(404).json({ error: '未找到该城市的社保政策' });
    }

    const actualBase = Math.min(Math.max(baseSalary, policy.minBase), policy.maxBase);

    const pensionRates = JSON.parse(policy.pensionRates);
    const medicalRates = JSON.parse(policy.medicalRates);
    const unemploymentRates = JSON.parse(policy.unemploymentRates);
    const injuryRates = JSON.parse(policy.injuryRates);
    const maternityRates = JSON.parse(policy.maternityRates);
    const housingFundRates = JSON.parse(policy.housingFundRates);

    const actualHousingRatio = housingFundRatio || housingFundRates.personal;

    const result = {
      cityName: policy.cityName,
      baseSalary: baseSalary,
      actualBase: actualBase,
      pension: {
        personal: Math.round(actualBase * pensionRates.personal * 100) / 100,
        company: Math.round(actualBase * pensionRates.company * 100) / 100,
      },
      medical: {
        personal: Math.round(actualBase * medicalRates.personal * 100) / 100,
        company: Math.round(actualBase * medicalRates.company * 100) / 100,
      },
      unemployment: {
        personal: Math.round(actualBase * unemploymentRates.personal * 100) / 100,
        company: Math.round(actualBase * unemploymentRates.company * 100) / 100,
      },
      injury: {
        company: Math.round(actualBase * injuryRates.company * 100) / 100,
      },
      maternity: {
        company: Math.round(actualBase * maternityRates.company * 100) / 100,
      },
      housingFund: {
        personal: Math.round(actualBase * actualHousingRatio * 100) / 100,
        company: Math.round(actualBase * housingFundRates.company * 100) / 100,
      },
    };

    result.totalPersonal = Math.round((
      result.pension.personal +
      result.medical.personal +
      result.unemployment.personal +
      result.housingFund.personal
    ) * 100) / 100;

    result.totalCompany = Math.round((
      result.pension.company +
      result.medical.company +
      result.unemployment.company +
      result.injury.company +
      result.maternity.company +
      result.housingFund.company
    ) * 100) / 100;

    const suggestions = [];
    if (baseSalary < policy.minBase) {
      suggestions.push(`您的薪资${baseSalary}元低于最低缴费基数${policy.minBase}元，将按最低基数计算。`);
    }
    if (baseSalary > policy.maxBase) {
      suggestions.push(`您的薪资${baseSalary}元高于最高缴费基数${policy.maxBase}元，将按最高基数计算。`);
    }
    if (actualHousingRatio < housingFundRates.personal) {
      suggestions.push(`建议将公积金缴费比例提高至${(housingFundRates.personal * 100).toFixed(0)}%，增加免税收入。`);
    }
    suggestions.push(`个人每月共需缴纳${result.totalPersonal}元，企业缴纳${result.totalCompany}元。`);
    suggestions.push(`建议定期关注社保政策变化，及时调整缴费规划。`);

    result.suggestions = suggestions;

    await prisma.socialSecurityRecord.create({
      data: {
        userId: req.user.id,
        cityCode,
        baseSalary,
        resultJson: JSON.stringify(result),
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({ error: '计算失败' });
  }
});

router.get('/records', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.socialSecurityRecord.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json(records.map(r => ({
      ...r,
      result: JSON.parse(r.resultJson),
    })));
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

module.exports = router;
