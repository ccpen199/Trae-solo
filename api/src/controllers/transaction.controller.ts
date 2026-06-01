import type { Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { success, error, paginated } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import type { Transaction, Transfer } from '@shared/types';

export class TransactionController {
  private transactionService = new TransactionService();

  getTransactions(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const { type, category, startDate, endDate, accountId, page = 1, pageSize = 50 } = req.query;

      const result = this.transactionService.getTransactions(userId, {
        type: type as string | undefined,
        category: category as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        accountId: accountId ? parseInt(accountId as string) : undefined,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      });

      res.json(paginated(result.items, result.total, parseInt(page as string), parseInt(pageSize as string)));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取交易记录失败'));
    }
  }

  createTransaction(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const data = req.body as Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

      if (!data.accountId || !data.type || !data.amount || !data.category || !data.transactionDate) {
        res.status(400).json(error('账户、类型、金额、分类和交易日期不能为空'));
        return;
      }

      if (data.amount <= 0) {
        res.status(400).json(error('金额必须大于0'));
        return;
      }

      const transaction = this.transactionService.createTransaction(userId, data);
      res.status(201).json(success(transaction, '交易记录创建成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '创建交易记录失败'));
    }
  }

  updateTransaction(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const id = parseInt(req.params.id);
      const data = req.body as Partial<Transaction>;

      if (isNaN(id)) {
        res.status(400).json(error('无效的交易ID'));
        return;
      }

      const transaction = this.transactionService.updateTransaction(id, userId, data);
      
      if (!transaction) {
        res.status(404).json(error('交易记录不存在'));
        return;
      }

      res.json(success(transaction, '交易记录更新成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '更新交易记录失败'));
    }
  }

  deleteTransaction(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json(error('无效的交易ID'));
        return;
      }

      const deleted = this.transactionService.deleteTransaction(id, userId);
      
      if (!deleted) {
        res.status(404).json(error('交易记录不存在'));
        return;
      }

      res.json(success(null, '交易记录删除成功'));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '删除交易记录失败'));
    }
  }

  getTransfers(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const { startDate, endDate, page = 1, pageSize = 50 } = req.query;

      const result = this.transactionService.getTransfers(userId, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      });

      res.json(paginated(result.items, result.total, parseInt(page as string), parseInt(pageSize as string)));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取转账记录失败'));
    }
  }

  createTransfer(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const data = req.body as Omit<Transfer, 'id' | 'userId' | 'createdAt'>;

      if (!data.fromAccountId || !data.toAccountId || !data.amount || !data.transferDate) {
        res.status(400).json(error('转出账户、转入账户、金额和转账日期不能为空'));
        return;
      }

      if (data.amount <= 0) {
        res.status(400).json(error('金额必须大于0'));
        return;
      }

      const transfer = this.transactionService.createTransfer(userId, data);
      res.status(201).json(success(transfer, '转账记录创建成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '创建转账记录失败'));
    }
  }

  getCategories(req: AuthRequest, res: Response): void {
    try {
      const { type } = req.query;
      const categories = this.transactionService.getCategories(type as 'income' | 'expense' | undefined);
      res.json(success(categories));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取分类失败'));
    }
  }

  getTags(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const tags = this.transactionService.getTags(userId);
      res.json(success(tags));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取标签失败'));
    }
  }

  createTag(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const { name, color } = req.body;

      if (!name) {
        res.status(400).json(error('标签名称不能为空'));
        return;
      }

      const tag = this.transactionService.createTag(userId, name, color);
      res.status(201).json(success(tag, '标签创建成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '创建标签失败'));
    }
  }

  getMonthlySummary(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const { year, month } = req.params;
      
      const summary = this.transactionService.getMonthlySummary(
        userId,
        parseInt(year),
        parseInt(month)
      );
      
      res.json(success(summary));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取月度汇总失败'));
    }
  }
}
