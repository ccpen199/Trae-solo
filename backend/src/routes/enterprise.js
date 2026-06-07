const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, sensitiveOperation } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/dashboard', authenticateToken, requireRole(['enterprise', 'admin']), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    if (!enterpriseId) {
      return res.status(400).json({ error: '未关联企业账户' });
    }

    const enterprise = await prisma.enterprise.findUnique({
      where: { id: enterpriseId },
    });

    const employeeCount = await prisma.employee.count({
      where: { enterpriseId },
    });

    const alerts = await prisma.alert.findMany({
      where: { enterpriseId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const normalCount = await prisma.employee.count({
      where: { enterpriseId, socialSecurityStatus: 'normal' },
    });

    const stoppedCount = employeeCount - normalCount;

    const highRiskCount = await prisma.employee.count({
      where: { enterpriseId, resignationRiskScore: { gte: 0.7 } },
    });

    const mediumRiskCount = await prisma.employee.count({
      where: { enterpriseId, resignationRiskScore: { gte: 0.4, lt: 0.7 } },
    });

    const lowRiskCount = employeeCount - highRiskCount - mediumRiskCount;

    res.json({
      enterprise,
      stats: {
        totalEmployees: employeeCount,
        normalSocialSecurity: normalCount,
        stoppedSocialSecurity: stoppedCount,
        complianceScore: enterprise.complianceScore,
        alertCount: alerts.length,
      },
      riskDistribution: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount,
      },
      alerts,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

router.get('/employees', authenticateToken, requireRole(['enterprise', 'admin']), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { page = 1, pageSize = 10, status } = req.query;

    const where = { enterpriseId };
    if (status) {
      where.socialSecurityStatus = status;
    }

    const skip = (page - 1) * pageSize;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      employees,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: '获取员工列表失败' });
  }
});

router.post('/employees', authenticateToken, requireRole(['enterprise', 'admin']), sensitiveOperation, auditLog('EMPLOYEE_CREATE', 'enterprise'), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { name, idCard, position, hireDate, contractExpiryDate, socialSecurityBase } = req.body;

    const existing = await prisma.employee.findUnique({
      where: { idCard },
    });

    if (existing) {
      return res.status(400).json({ error: '该身份证号已存在' });
    }

    const employee = await prisma.employee.create({
      data: {
        enterpriseId,
        name,
        idCard,
        position,
        hireDate: hireDate ? new Date(hireDate) : null,
        contractExpiryDate: contractExpiryDate ? new Date(contractExpiryDate) : null,
        socialSecurityBase,
        resignationRiskScore: 0.1 + Math.random() * 0.3,
      },
    });

    res.json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: '创建员工失败' });
  }
});

router.put('/employees/:id', authenticateToken, requireRole(['enterprise', 'admin']), sensitiveOperation, auditLog('EMPLOYEE_UPDATE', 'enterprise'), async (req, res) => {
  try {
    const { id } = req.params;
    const enterpriseId = req.user.enterpriseId;
    const { name, position, socialSecurityBase, socialSecurityStatus } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id, enterpriseId },
    });

    if (!employee) {
      return res.status(404).json({ error: '员工不存在' });
    }

    const oldStatus = employee.socialSecurityStatus;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name,
        position,
        socialSecurityBase,
        socialSecurityStatus,
      },
    });

    if (oldStatus === 'normal' && socialSecurityStatus === 'stopped') {
      await prisma.alert.create({
        data: {
          enterpriseId,
          employeeId: id,
          alertType: 'social_security_stop',
          severity: 'danger',
          message: `员工${name}的社保已停缴，请及时处理。`,
        },
      });
    }

    if (socialSecurityBase && socialSecurityBase > 25000) {
      const avgBase = await prisma.employee.aggregate({
        where: { enterpriseId },
        _avg: { socialSecurityBase: true },
      });

      if (avgBase._avg.socialSecurityBase && socialSecurityBase > avgBase._avg.socialSecurityBase * 1.5) {
        await prisma.alert.create({
          data: {
            enterpriseId,
            employeeId: id,
            alertType: 'base_abnormal',
            severity: 'warning',
            message: `检测到员工${name}的社保基数${socialSecurityBase}元，超过平均水平，建议核实。`,
          },
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: '更新员工失败' });
  }
});

router.get('/alerts', authenticateToken, requireRole(['enterprise', 'admin']), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { isRead } = req.query;

    const where = { enterpriseId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: '获取预警失败' });
  }
});

router.put('/alerts/:id/read', authenticateToken, requireRole(['enterprise', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const enterpriseId = req.user.enterpriseId;

    const alert = await prisma.alert.updateMany({
      where: { id, enterpriseId },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

router.post('/compliance/check', authenticateToken, requireRole(['enterprise', 'admin']), sensitiveOperation, auditLog('COMPLIANCE_CHECK', 'enterprise'), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    const employees = await prisma.employee.findMany({
      where: { enterpriseId },
    });

    const findings = [];
    let score = 100;

    for (const emp of employees) {
      if (emp.socialSecurityStatus === 'stopped') {
        findings.push({
          level: 'danger',
          employeeId: emp.id,
          employeeName: emp.name,
          message: '社保处于停缴状态',
        });
        score -= 5;
      }

      const now = new Date();
      if (emp.contractExpiryDate && new Date(emp.contractExpiryDate) < now) {
        findings.push({
          level: 'danger',
          employeeId: emp.id,
          employeeName: emp.name,
          message: '劳动合同已过期',
        });
        score -= 5;
      } else if (emp.contractExpiryDate) {
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (new Date(emp.contractExpiryDate) < thirtyDaysLater) {
          findings.push({
            level: 'warning',
            employeeId: emp.id,
            employeeName: emp.name,
            message: '劳动合同将在30天内到期',
          });
          score -= 2;
        }
      }

      if (!emp.hireDate) {
        findings.push({
          level: 'info',
          employeeId: emp.id,
          employeeName: emp.name,
          message: '未填写入职日期',
        });
      }

      if (emp.resignationRiskScore >= 0.7) {
        findings.push({
          level: 'warning',
          employeeId: emp.id,
          employeeName: emp.name,
          message: '离职风险较高',
        });
      }
    }

    const recommendations = [];
    if (findings.some(f => f.level === 'danger')) {
      recommendations.push('立即处理社保停缴和合同过期问题');
    }
    recommendations.push('建议每月进行一次合规巡检');
    recommendations.push('建立员工离职风险预警机制');

    const report = await prisma.complianceReport.create({
      data: {
        enterpriseId,
        reportType: 'auto_check',
        score,
        findings: JSON.stringify(findings),
        recommendations: JSON.stringify(recommendations),
      },
    });

    await prisma.enterprise.update({
      where: { id: enterpriseId },
      data: { complianceScore: score, lastComplianceCheck: new Date() },
    });

    res.json({
      reportId: report.id,
      score,
      findings,
      recommendations,
      level: score >= 80 ? 'good' : score >= 60 ? 'warning' : 'danger',
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({ error: '合规巡检失败' });
  }
});

router.get('/compliance/reports', authenticateToken, requireRole(['enterprise', 'admin']), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    const reports = await prisma.complianceReport.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports.map(r => ({
      ...r,
      findings: r.findings ? JSON.parse(r.findings) : [],
      recommendations: r.recommendations ? JSON.parse(r.recommendations) : [],
    })));
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: '获取报告失败' });
  }
});

router.get('/heatmap', authenticateToken, requireRole(['enterprise', 'admin']), async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    const employees = await prisma.employee.findMany({
      where: { enterpriseId },
      include: { socialRecords: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    const categories = ['健康医疗', '心理健康', '运动健身', '教育培训', '节日福利'];
    const usageData = categories.map(cat => ({
      category: cat,
      count: Math.floor(Math.random() * 50 + 10),
    }));

    const departmentData = [
      { department: '技术部', usage: 85 },
      { department: '产品部', usage: 72 },
      { department: '设计部', usage: 68 },
      { department: '市场部', usage: 55 },
      { department: '人事部', usage: 45 },
    ];

    const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}月`,
      usage: Math.floor(Math.random() * 100 + 50),
    }));

    res.json({
      categoryUsage: usageData,
      departmentUsage: departmentData,
      monthlyTrend,
      totalUsage: Math.floor(Math.random() * 200 + 100),
      activeUsers: employees.filter(e => e.socialSecurityStatus === 'normal').length,
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: '获取热力图数据失败' });
  }
});

module.exports = router;
