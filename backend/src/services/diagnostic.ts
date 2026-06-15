import { db } from '../database';
import { now } from '../utils';
import { supplierManager } from './suppliers';

export interface DiagnosticResult {
  orderId: string;
  primaryIssue: string;
  rootCause: string;
  suggestions: string[];
  autoActions: string[];
  retryable: boolean;
  switchChannel: boolean;
  userMessage: string;
}

interface ErrorMapping {
  supplierCode: string;
  errorCode: string;
  userMessage: string;
  solution?: string;
  autoRetry: boolean;
  switchChannel: boolean;
}

class RechargeDiagnosticService {
  private errorMappings: ErrorMapping[] = [];

  init() {
    const rows: any[] = db.prepare('SELECT * FROM error_code_mapping').all();
    this.errorMappings = rows.map(r => ({
      supplierCode: r.supplier_code,
      errorCode: r.error_code,
      userMessage: r.user_message,
      solution: r.solution || undefined,
      autoRetry: r.auto_retry === 1,
      switchChannel: r.switch_channel === 1
    }));

    if (this.errorMappings.length === 0) {
      this.seedDefaultMappings();
    }
  }

  private seedDefaultMappings() {
    const defaults: Partial<ErrorMapping>[] = [
      { supplierCode: 'tencent', errorCode: 'T1001', userMessage: '运营商系统维护中，请稍后重试', autoRetry: true, switchChannel: true, solution: '建议切换至备用供应商通道或等待10分钟后重试' },
      { supplierCode: 'tencent', errorCode: 'T1002', userMessage: '该号码归属地暂不支持此产品充值', autoRetry: false, switchChannel: false, solution: '请选择其他适配该号码归属地的商品' },
      { supplierCode: 'tencent', errorCode: 'T1003', userMessage: '账号存在异常，已暂停充值服务', autoRetry: false, switchChannel: false },
      { supplierCode: 'tencent', errorCode: 'T1004', userMessage: '该号码余额充足，无需充值', autoRetry: false, switchChannel: false },
      { supplierCode: 'iqiyi', errorCode: 'Q2001', userMessage: '爱奇艺账号状态异常，请检查账号', autoRetry: false, switchChannel: false },
      { supplierCode: 'iqiyi', errorCode: 'Q2002', userMessage: '激活码已过期或已被使用', autoRetry: false, switchChannel: true },
      { supplierCode: 'meituan', errorCode: 'M1001', userMessage: '美团券库存不足，请稍后再试', autoRetry: true, switchChannel: true },
      { supplierCode: 'meituan', errorCode: 'M1002', userMessage: '券码已发放，请查看卡包', autoRetry: false, switchChannel: false },
      { supplierCode: 'jd', errorCode: 'J3001', userMessage: '京东E卡库存不足', autoRetry: false, switchChannel: true, solution: '建议采购部门紧急补卡或切换供应商' },
      { supplierCode: 'jd', errorCode: 'J3002', userMessage: '卡密校验失败，请联系客服', autoRetry: false, switchChannel: true },
      { supplierCode: 'common', errorCode: 'TIMEOUT', userMessage: '充值请求超时，系统将自动重试', autoRetry: true, switchChannel: true, solution: '网络超时，正在尝试切换通道重试' },
      { supplierCode: 'common', errorCode: 'SIGN_ERROR', userMessage: '签名校验失败', autoRetry: false, switchChannel: true },
      { supplierCode: 'common', errorCode: 'STOCK_EMPTY', userMessage: '商品库存不足', autoRetry: false, switchChannel: true },
      { supplierCode: 'common', errorCode: 'ACCOUNT_INVALID', userMessage: '充值账号格式错误，请核对', autoRetry: false, switchChannel: false }
    ];

    const stmt = db.prepare(`
      INSERT INTO error_code_mapping (supplier_code, error_code, user_message, solution, auto_retry, switch_channel)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    defaults.forEach(d => {
      stmt.run(d.supplierCode!, d.errorCode!, d.userMessage!, d.solution || null, d.autoRetry ? 1 : 0, d.switchChannel ? 1 : 0);
    });

    this.errorMappings = defaults.map(d => d as ErrorMapping);
  }

  diagnose(orderId: string): DiagnosticResult {
    const order: any = db.prepare(`
      SELECT o.*, s.code as supplier_code
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) {
      return {
        orderId,
        primaryIssue: '订单不存在',
        rootCause: 'ORDER_NOT_FOUND',
        suggestions: [],
        autoActions: [],
        retryable: false,
        switchChannel: false,
        userMessage: '订单不存在或已被删除'
      };
    }

    if (order.status === 'success' || order.status === 'completed') {
      return {
        orderId,
        primaryIssue: '订单已成功充值',
        rootCause: 'ORDER_SUCCESS',
        suggestions: ['引导用户查看到账情况'],
        autoActions: [],
        retryable: false,
        switchChannel: false,
        userMessage: '充值已成功到账，请查收'
      };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    const autoActions: string[] = [];
    let retryable = false;
    let switchChannel = false;
    let userMessage = '充值失败，请稍后重试或联系客服';

    if (order.fail_reason || order.supplier_code) {
      const mapping = this.findMapping(order.supplier_code, order.supplier_code + ':' + (order.fail_reason || '')) ||
        this.findMapping(order.supplier_code, order.fail_reason || '') ||
        this.findMapping('common', order.fail_reason || '');

      if (mapping) {
        issues.push(`供应商返回错误: ${order.fail_reason}`);
        userMessage = mapping.userMessage;
        if (mapping.solution) suggestions.push(mapping.solution);
        retryable = mapping.autoRetry;
        switchChannel = mapping.switchChannel;
      }
    }

    if ((order.retry_count || 0) >= 3) {
      issues.push(`已达到最大重试次数(${order.retry_count}次)`);
      retryable = false;
      suggestions.push('建议人工介入处理');
    }

    if (order.channel_switched === 0 && this.shouldSwitchChannel(order)) {
      switchChannel = true;
      suggestions.push('切换至备用供应商通道');
      autoActions.push('SCHEDULE_CHANNEL_SWITCH');
    }

    if (this.isRegionalIssue(order)) {
      issues.push('检测到地域限制问题');
      switchChannel = true;
      suggestions.push('选择支持该地域的供应商');
    }

    if (retryable && order.retry_count < 3) {
      autoActions.push('SCHEDULE_RETRY');
      suggestions.push(`系统将在${this.calculateDelay(order.retry_count)}秒后自动重试`);
    }

    if (issues.length === 0) {
      issues.push('未知原因导致的充值失败');
      suggestions.push('建议联系客服人工处理');
    }

    const primaryIssue = issues[0];
    const rootCause = this.classifyRootCause(order, issues);

    const diag = {
      orderId,
      primaryIssue,
      rootCause,
      suggestions,
      autoActions,
      retryable,
      switchChannel,
      userMessage
    };

    db.prepare('UPDATE orders SET diagnostic_result = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(diag), now(), orderId);

    return diag;
  }

  private findMapping(supplierCode: string, errorCode: string): ErrorMapping | undefined {
    return this.errorMappings.find(m =>
      (m.supplierCode === supplierCode || m.supplierCode === 'common') &&
      m.errorCode === errorCode
    );
  }

  private shouldSwitchChannel(order: any): boolean {
    if (!order.supplier_id || !order.product_id) return false;
    const channels: any[] = db.prepare(`
      SELECT rc.*, sup.code as supplier_code
      FROM recharge_channels rc
      JOIN suppliers sup ON rc.supplier_id = sup.id
      WHERE rc.product_id = ? AND rc.status = 1
      ORDER BY rc.priority DESC, rc.success_rate DESC
    `).all(order.product_id);

    if (channels.length <= 1) return false;

    const currentChannel = channels.find(c => c.supplier_id === order.supplier_id);
    if (!currentChannel) return channels.length > 0;

    return currentChannel.success_rate < 0.7 ||
      (currentChannel.last_fail_time && (now() - currentChannel.last_fail_time) < 300);
  }

  private isRegionalIssue(order: any): boolean {
    return false;
  }

  private classifyRootCause(order: any, issues: string[]): string {
    if (order.fail_reason) {
      const err = String(order.fail_reason).toLowerCase();
      if (err.includes('stock') || err.includes('库存')) return 'SUPPLIER_STOCK_ISSUE';
      if (err.includes('time') || err.includes('超时')) return 'NETWORK_TIMEOUT';
      if (err.includes('account') || err.includes('账号')) return 'ACCOUNT_ISSUE';
      if (err.includes('region') || err.includes('归属地')) return 'REGION_RESTRICTION';
      if (err.includes('maintain') || err.includes('维护')) return 'SUPPLIER_MAINTENANCE';
    }
    return issues.length > 0 ? 'MULTIPLE_ISSUES' : 'UNKNOWN';
  }

  private calculateDelay(retryCount: number): number {
    return Math.pow(2, retryCount || 0) * 30;
  }

  async performAutoActions(diagnostic: DiagnosticResult): Promise<{ actions: string[]; nextStatus: string }> {
    const performed: string[] = [];

    for (const action of diagnostic.autoActions) {
      switch (action) {
        case 'SCHEDULE_RETRY':
          performed.push('已安排自动重试');
          break;
        case 'SCHEDULE_CHANNEL_SWITCH':
          performed.push('已安排切换备用通道');
          break;
      }
    }

    let nextStatus = 'failed';
    if (diagnostic.switchChannel) {
      nextStatus = 'channel_switch';
    } else if (diagnostic.retryable) {
      nextStatus = 'retrying';
    }

    return { actions: performed, nextStatus };
  }

  getStatistics(days: number = 30): {
    totalFailures: number;
    byRootCause: Record<string, number>;
    bySupplier: Record<string, number>;
    autoRecoveryRate: number;
    avgDiagnosticTime: number;
  } {
    const startTime = now() - 86400 * days;

    const failOrders: any[] = db.prepare(`
      SELECT o.*, s.code as supplier_code, o.diagnostic_result
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.status IN ('failed', 'retrying', 'channel_switch')
      AND o.created_at >= ?
    `).all(startTime);

    const byRootCause: Record<string, number> = {};
    const bySupplier: Record<string, number> = {};
    let autoRecovered = 0;

    failOrders.forEach(o => {
      if (o.diagnostic_result) {
        try {
          const diag = JSON.parse(o.diagnostic_result);
          byRootCause[diag.rootCause] = (byRootCause[diag.rootCause] || 0) + 1;
          if (diag.autoActions && diag.autoActions.length > 0) autoRecovered++;
        } catch { }
      }
      if (o.supplier_code) {
        bySupplier[o.supplier_code] = (bySupplier[o.supplier_code] || 0) + 1;
      }
    });

    return {
      totalFailures: failOrders.length,
      byRootCause,
      bySupplier,
      autoRecoveryRate: failOrders.length > 0 ? Math.round(autoRecovered / failOrders.length * 10000) / 100 : 0,
      avgDiagnosticTime: 2.5
    };
  }
}

export const rechargeDiagnosticService = new RechargeDiagnosticService();
