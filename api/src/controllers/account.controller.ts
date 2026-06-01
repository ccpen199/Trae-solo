import type { Response } from 'express';
import { AccountService } from '../services/account.service';
import { success, error, paginated } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import type { Account, Valuation } from '@shared/types';

export class AccountController {
  private accountService = new AccountService();

  getAccounts(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const accounts = this.accountService.getAccounts(userId);
      res.json(success(accounts));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取账户列表失败'));
    }
  }

  getAccountById(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json(error('无效的账户ID'));
        return;
      }

      const account = this.accountService.getAccountById(id, userId);
      
      if (!account) {
        res.status(404).json(error('账户不存在'));
        return;
      }

      res.json(success(account));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取账户详情失败'));
    }
  }

  createAccount(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const data = req.body as Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentValue'>;

      if (!data.name || !data.type || !data.category) {
        res.status(400).json(error('账户名称、类型和分类不能为空'));
        return;
      }

      const account = this.accountService.createAccount(userId, data);
      res.status(201).json(success(account, '账户创建成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '创建账户失败'));
    }
  }

  updateAccount(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const id = parseInt(req.params.id);
      const data = req.body as Partial<Account>;

      if (isNaN(id)) {
        res.status(400).json(error('无效的账户ID'));
        return;
      }

      const account = this.accountService.updateAccount(id, userId, data);
      
      if (!account) {
        res.status(404).json(error('账户不存在'));
        return;
      }

      res.json(success(account, '账户更新成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '更新账户失败'));
    }
  }

  deleteAccount(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json(error('无效的账户ID'));
        return;
      }

      const deleted = this.accountService.deleteAccount(id, userId);
      
      if (!deleted) {
        res.status(404).json(error('账户不存在'));
        return;
      }

      res.json(success(null, '账户删除成功'));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '删除账户失败'));
    }
  }

  getValuations(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const accountId = parseInt(req.params.id);

      if (isNaN(accountId)) {
        res.status(400).json(error('无效的账户ID'));
        return;
      }

      const valuations = this.accountService.getValuations(accountId, userId);
      res.json(success(valuations));
    } catch (err) {
      res.status(500).json(error(err instanceof Error ? err.message : '获取估值记录失败'));
    }
  }

  addValuation(req: AuthRequest, res: Response): void {
    try {
      const userId = req.userId!;
      const accountId = parseInt(req.params.id);
      const data = req.body as Omit<Valuation, 'id' | 'accountId' | 'createdAt'>;

      if (isNaN(accountId)) {
        res.status(400).json(error('无效的账户ID'));
        return;
      }

      if (!data.marketValue || !data.valuationDate || !data.dataSource) {
        res.status(400).json(error('市值、估值日期和数据来源不能为空'));
        return;
      }

      const valuation = this.accountService.addValuation(userId, accountId, data);
      res.status(201).json(success(valuation, '估值记录添加成功'));
    } catch (err) {
      res.status(400).json(error(err instanceof Error ? err.message : '添加估值记录失败'));
    }
  }
}
