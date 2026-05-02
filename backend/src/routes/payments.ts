import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import bankConnector from '../engines/bank-connector';
import securityVault from '../engines/security-vault';

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  FINANCIAL_MANAGER: 'FINANCIAL_MANAGER',
  CFO: 'CFO',
  AUDITOR: 'AUDITOR',
};

const router = Router();

router.get(
  '/',
  authMiddleware([ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, page = '1', pageSize = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const sizeNum = parseInt(pageSize as string);

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [total, payments] = await Promise.all([
        prisma.paymentRequest.count({ where }),
        prisma.paymentRequest.findMany({
          where,
          include: {
            requester: { select: { id: true, username: true, realName: true } },
            bankAccount: { select: { id: true, accountName: true, accountNumber: true, bankName: true } },
            approvalFlows: {
              include: {
                approver: { select: { id: true, username: true, realName: true } },
              },
              orderBy: { level: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * sizeNum,
          take: sizeNum,
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          page: pageNum,
          pageSize: sizeNum,
          items: payments.map((p) => ({
            ...p,
            amount: Number(p.amount),
          })),
        },
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取付款列表失败' 
      });
    }
  }
);

router.post(
  '/',
  authMiddleware([ROLES.CASHIER, ROLES.FINANCIAL_MANAGER]),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        bankAccountId,
        payeeName,
        payeeAccount,
        payeeBank,
        amount,
        purpose,
        remark,
      } = req.body;

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: '用户未登录' 
        });
      }

      const account = await prisma.bankAccount.findUnique({
        where: { id: bankAccountId },
      });

      if (!account || account.status !== 'ACTIVE') {
        return res.status(400).json({ 
          success: false, 
          error: '账户不存在或不可用' 
        });
      }

      const amountNum = Number(amount);
      if (amountNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: '付款金额必须大于0' 
        });
      }

      const approvalLevel = await securityVault.checkPaymentApprovalLevel(amountNum);

      const paymentRequest = await prisma.paymentRequest.create({
        data: {
          bankAccountId,
          requesterId: userId,
          payeeName,
          payeeAccount,
          payeeBank,
          amount: amountNum,
          purpose,
          remark,
          status: 'DRAFT',
          requiredLevel: approvalLevel.level,
        },
      });

      for (let i = 1; i <= approvalLevel.level; i++) {
        await prisma.approvalFlow.create({
          data: {
            paymentRequestId: paymentRequest.id,
            level: i,
            status: 'PENDING',
          },
        });
      }

      await securityVault.recordAuditLog({
        userId,
        action: 'CREATE',
        module: 'PAYMENT',
        targetType: 'PaymentRequest',
        targetId: paymentRequest.id,
        description: `创建付款申请: ${payeeName} - ${amount}`,
        status: 'SUCCESS',
        riskLevel: securityVault.determineRiskLevel('PAYMENT', 'CREATE'),
      });

      res.json({
        success: true,
        data: {
          ...paymentRequest,
          amount: Number(paymentRequest.amount),
        },
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: '创建付款申请失败' 
      });
    }
  }
);

router.post(
  '/:id/submit',
  authMiddleware([ROLES.CASHIER, ROLES.FINANCIAL_MANAGER]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const payment = await prisma.paymentRequest.findUnique({
        where: { id },
        include: {
          approvalFlows: { orderBy: { level: 'asc' } },
        },
      });

      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          error: '付款申请不存在' 
        });
      }

      if (payment.status !== 'DRAFT') {
        return res.status(400).json({ 
          success: false, 
          error: '只有草稿状态可以提交' 
        });
      }

      if (payment.requesterId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: '只能提交自己创建的申请' 
        });
      }

      const updatedPayment = await prisma.paymentRequest.update({
        where: { id },
        data: {
          status: 'PENDING_APPROVAL',
          submittedAt: new Date(),
        },
      });

      const firstApproval = payment.approvalFlows.find((a) => a.level === 1);
      if (firstApproval) {
        await prisma.approvalFlow.update({
          where: { id: firstApproval.id },
          data: {
            status: 'PENDING',
          },
        });
      }

      await securityVault.recordAuditLog({
        userId: userId!,
        action: 'SUBMIT',
        module: 'PAYMENT',
        targetType: 'PaymentRequest',
        targetId: id,
        description: '提交付款申请等待审批',
        status: 'SUCCESS',
        riskLevel: 'MEDIUM',
      });

      res.json({
        success: true,
        data: {
          ...updatedPayment,
          amount: Number(updatedPayment.amount),
        },
      });
    } catch (error) {
      console.error('Submit payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: '提交付款申请失败' 
      });
    }
  }
);

router.post(
  '/:id/approve',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { remark } = req.body;

      const payment = await prisma.paymentRequest.findUnique({
        where: { id },
        include: {
          approvalFlows: { orderBy: { level: 'asc' } },
          bankAccount: true,
        },
      });

      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          error: '付款申请不存在' 
        });
      }

      if (payment.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({ 
          success: false, 
          error: '当前状态不可审批' 
        });
      }

      const pendingApproval = payment.approvalFlows.find((a) => a.status === 'PENDING');
      if (!pendingApproval) {
        return res.status(400).json({ 
          success: false, 
          error: '没有待审批的流程' 
        });
      }

      const approvalLevel = await securityVault.checkPaymentApprovalLevel(Number(payment.amount));
      const canApprove = approvalLevel.requiredRoles.includes(userRole || '');

      if (!canApprove) {
        return res.status(403).json({ 
          success: false, 
          error: '您没有权限审批此级别的付款' 
        });
      }

      await prisma.approvalFlow.update({
        where: { id: pendingApproval.id },
        data: {
          approverId: userId,
          status: 'APPROVED',
          approvedAt: new Date(),
          remark,
        },
      });

      const nextLevel = pendingApproval.level + 1;
      const nextApproval = payment.approvalFlows.find((a) => a.level === nextLevel);

      let updatedPayment;

      if (nextApproval) {
        await prisma.approvalFlow.update({
          where: { id: nextApproval.id },
          data: { status: 'PENDING' },
        });

        updatedPayment = payment;
      } else {
        const paymentResult = await bankConnector.simulatePayment(
          payment.bankAccountId,
          payment.payeeName,
          payment.payeeAccount,
          payment.payeeBank,
          Number(payment.amount)
        );

        if (!paymentResult.success) {
          updatedPayment = await prisma.paymentRequest.update({
            where: { id },
            data: {
              status: 'FAILED',
              errorMessage: paymentResult.errorMessage,
            },
          });

          await securityVault.recordAuditLog({
            userId: userId!,
            action: 'APPROVE',
            module: 'PAYMENT',
            targetType: 'PaymentRequest',
            targetId: id,
            description: `付款执行失败: ${paymentResult.errorMessage}`,
            status: 'FAILED',
            riskLevel: 'HIGH',
            errorMessage: paymentResult.errorMessage,
          });
        } else {
          if (paymentResult.transactionRef) {
            await prisma.bankReceipt.create({
              data: {
                paymentRequestId: id,
                transactionRef: paymentResult.transactionRef,
                bankReference: paymentResult.bankReference,
                receiptData: paymentResult.receiptData,
              },
            });
          }

          updatedPayment = await prisma.paymentRequest.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              transactionRef: paymentResult.transactionRef,
              completedAt: paymentResult.completedAt,
            },
          });

          await prisma.transaction.create({
            data: {
              bankAccountId: payment.bankAccountId!,
              transactionDate: new Date(),
              transactionRef: paymentResult.transactionRef || `PAY-${id}`,
              counterParty: payment.payeeName,
              counterPartyAccount: payment.payeeAccount,
              amount: -Number(payment.amount),
              transactionType: 'TRANSFER_OUT',
              purpose: payment.purpose,
              isReconciled: false,
              paymentRequestId: id,
            },
          });

          if (payment.bankAccount) {
            const newBalance = Number(payment.bankAccount.currentBalance) - Number(payment.amount);
            const newAvailable = Number(payment.bankAccount.availableBalance) - Number(payment.amount);
            
            await prisma.bankAccount.update({
              where: { id: payment.bankAccountId! },
              data: {
                currentBalance: Math.max(0, newBalance),
                availableBalance: Math.max(0, newAvailable),
              },
            });
          }
        }
      }

      await securityVault.recordAuditLog({
        userId: userId!,
        action: 'APPROVE',
        module: 'PAYMENT',
        targetType: 'PaymentRequest',
        targetId: id,
        description: `审批通过付款申请，金额: ${payment.amount}`,
        status: 'SUCCESS',
        riskLevel: securityVault.determineRiskLevel('PAYMENT', 'APPROVE'),
      });

      res.json({
        success: true,
        data: {
          ...updatedPayment,
          amount: Number(updatedPayment?.amount || 0),
        },
      });
    } catch (error) {
      console.error('Approve payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: '审批失败' 
      });
    }
  }
);

router.post(
  '/:id/reject',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { reason } = req.body;

      const payment = await prisma.paymentRequest.findUnique({
        where: { id },
        include: {
          approvalFlows: { orderBy: { level: 'asc' } },
        },
      });

      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          error: '付款申请不存在' 
        });
      }

      if (payment.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({ 
          success: false, 
          error: '当前状态不可驳回' 
        });
      }

      const pendingApproval = payment.approvalFlows.find((a) => a.status === 'PENDING');
      if (pendingApproval) {
        await prisma.approvalFlow.update({
          where: { id: pendingApproval.id },
          data: {
            approverId: userId,
            status: 'REJECTED',
            approvedAt: new Date(),
            remark: reason,
          },
        });
      }

      const updatedPayment = await prisma.paymentRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectReason: reason,
        },
      });

      await securityVault.recordAuditLog({
        userId: userId!,
        action: 'REJECT',
        module: 'PAYMENT',
        targetType: 'PaymentRequest',
        targetId: id,
        description: `驳回付款申请，原因: ${reason}`,
        status: 'SUCCESS',
        riskLevel: 'MEDIUM',
      });

      res.json({
        success: true,
        data: {
          ...updatedPayment,
          amount: Number(updatedPayment.amount),
        },
      });
    } catch (error) {
      console.error('Reject payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: '驳回失败' 
      });
    }
  }
);

router.get(
  '/pending',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      
      const pendingPayments = await prisma.paymentRequest.findMany({
        where: {
          status: 'PENDING_APPROVAL',
        },
        include: {
          requester: { select: { id: true, username: true, realName: true } },
          bankAccount: { select: { id: true, accountName: true, accountNumber: true, bankName: true } },
          approvalFlows: {
            include: {
              approver: { select: { id: true, username: true, realName: true } },
            },
            orderBy: { level: 'asc' },
          },
        },
        orderBy: { submittedAt: 'asc' },
      });

      res.json({
        success: true,
        data: pendingPayments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      });
    } catch (error) {
      console.error('Get pending payments error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取待审批付款失败' 
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware([ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const payment = await prisma.paymentRequest.findUnique({
        where: { id },
        include: {
          requester: { select: { id: true, username: true, realName: true, role: true } },
          bankAccount: true,
          approvalFlows: {
            include: {
              approver: { select: { id: true, username: true, realName: true, role: true } },
            },
            orderBy: { level: 'asc' },
          },
          bankReceipt: true,
        },
      });

      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          error: '付款申请不存在' 
        });
      }

      res.json({
        success: true,
        data: {
          ...payment,
          amount: Number(payment.amount),
        },
      });
    } catch (error) {
      console.error('Get payment detail error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取付款详情失败' 
      });
    }
  }
);

export default router;
