import { db } from '../database';
import { generateId, now } from '../utils';

export interface SupplierConfig {
  id: string;
  code: string;
  name: string;
  apiKey: string;
  apiSecret?: string;
  apiEndpoint?: string;
}

export interface RechargeRequest {
  orderId: string;
  productId: string;
  supplierProductId: string;
  account: string;
  quantity: number;
  amount: number;
}

export interface RechargeResult {
  success: boolean;
  supplierOrderId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface StockQueryResult {
  productId: string;
  supplierProductId: string;
  available: number;
  inStock: boolean;
}

export interface SupplierCallback {
  supplierOrderId: string;
  orderNo: string;
  status: 'success' | 'failed' | 'processing';
  errorCode?: string;
  errorMessage?: string;
}

export abstract class BaseSupplier {
  abstract getCode(): string;
  abstract recharge(req: RechargeRequest): Promise<RechargeResult>;
  abstract queryStock(supplierProductId: string): Promise<StockQueryResult>;
  abstract queryOrder(supplierOrderId: string): Promise<any>;
  abstract handleCallback(data: any): SupplierCallback;

  protected config: SupplierConfig;

  constructor(config: SupplierConfig) {
    this.config = config;
  }
}

export class TencentSupplier extends BaseSupplier {
  getCode() { return 'tencent'; }

  async recharge(req: RechargeRequest): Promise<RechargeResult> {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    const random = Math.random();
    if (random < 0.05) {
      return { success: false, errorCode: 'T1001', errorMessage: '运营商系统维护' };
    }
    if (random < 0.1) {
      return { success: false, errorCode: 'T1002', errorMessage: '号码归属地不支持' };
    }
    return { success: true, supplierOrderId: 'T' + Date.now() + Math.random().toString(36).slice(2, 8) };
  }

  async queryStock(supplierProductId: string): Promise<StockQueryResult> {
    return { productId: '', supplierProductId, available: 9999, inStock: true };
  }

  async queryOrder(supplierOrderId: string): Promise<any> {
    return { status: 'success' };
  }

  handleCallback(data: any): SupplierCallback {
    return {
      supplierOrderId: data.order_id,
      orderNo: data.out_trade_no,
      status: data.status === '1' ? 'success' : data.status === '2' ? 'failed' : 'processing',
      errorCode: data.error_code,
      errorMessage: data.error_msg
    };
  }
}

export class IQiyiSupplier extends BaseSupplier {
  getCode() { return 'iqiyi'; }

  async recharge(req: RechargeRequest): Promise<RechargeResult> {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 800));
    if (Math.random() < 0.03) {
      return { success: false, errorCode: 'Q2001', errorMessage: '账号异常' };
    }
    return { success: true, supplierOrderId: 'Q' + Date.now() + Math.random().toString(36).slice(2, 8) };
  }

  async queryStock(supplierProductId: string): Promise<StockQueryResult> {
    return { productId: '', supplierProductId, available: 9999, inStock: true };
  }

  async queryOrder(supplierOrderId: string): Promise<any> {
    return { status: 'success' };
  }

  handleCallback(data: any): SupplierCallback {
    return {
      supplierOrderId: data.biz_order_id,
      orderNo: data.partner_order_id,
      status: data.state === 'SUCCESS' ? 'success' : data.state === 'FAIL' ? 'failed' : 'processing',
      errorCode: data.err_code,
      errorMessage: data.err_msg
    };
  }
}

export class MeituanSupplier extends BaseSupplier {
  getCode() { return 'meituan'; }

  async recharge(req: RechargeRequest): Promise<RechargeResult> {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 600));
    return { success: true, supplierOrderId: 'M' + Date.now() + Math.random().toString(36).slice(2, 8) };
  }

  async queryStock(supplierProductId: string): Promise<StockQueryResult> {
    return { productId: '', supplierProductId, available: Math.floor(Math.random() * 100), inStock: true };
  }

  async queryOrder(supplierOrderId: string): Promise<any> {
    return { status: 'success' };
  }

  handleCallback(data: any): SupplierCallback {
    return {
      supplierOrderId: data.mt_order_id,
      orderNo: data.out_order_no,
      status: data.status === 'S' ? 'success' : data.status === 'F' ? 'failed' : 'processing'
    };
  }
}

export class JDSupplier extends BaseSupplier {
  getCode() { return 'jd'; }

  async recharge(req: RechargeRequest): Promise<RechargeResult> {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 900));
    if (Math.random() < 0.02) {
      return { success: false, errorCode: 'J3001', errorMessage: '卡密库存不足' };
    }
    return { success: true, supplierOrderId: 'J' + Date.now() + Math.random().toString(36).slice(2, 8) };
  }

  async queryStock(supplierProductId: string): Promise<StockQueryResult> {
    const stmt = db.prepare('SELECT COUNT(*) as cnt FROM card_pool WHERE supplier_product_id = ? AND status = ?');
    const result: any = stmt.get(supplierProductId, 'available');
    return { productId: '', supplierProductId, available: result.cnt, inStock: result.cnt > 0 };
  }

  async queryOrder(supplierOrderId: string): Promise<any> {
    return { status: 'success' };
  }

  handleCallback(data: any): SupplierCallback {
    return {
      supplierOrderId: data.jd_order_id,
      orderNo: data.third_order_id,
      status: data.result === 1 ? 'success' : data.result === 2 ? 'failed' : 'processing'
    };
  }
}

class SupplierManager {
  private suppliers: Map<string, BaseSupplier> = new Map();
  private fallbackChains: Map<string, string[]> = new Map();

  init() {
    const rows: any[] = db.prepare('SELECT * FROM suppliers').all();
    rows.forEach(row => {
      const config: SupplierConfig = {
        id: row.id,
        code: row.code,
        name: row.name,
        apiKey: row.api_key,
        apiSecret: row.api_secret,
        apiEndpoint: row.api_endpoint
      };
      let supplier: BaseSupplier;
      switch (row.code) {
        case 'tencent': supplier = new TencentSupplier(config); break;
        case 'iqiyi': supplier = new IQiyiSupplier(config); break;
        case 'meituan': supplier = new MeituanSupplier(config); break;
        case 'jd': supplier = new JDSupplier(config); break;
        default: supplier = new TencentSupplier(config);
      }
      this.suppliers.set(row.code, supplier);
    });
  }

  getSupplier(code: string): BaseSupplier | undefined {
    return this.suppliers.get(code);
  }

  getSupplierById(id: string): BaseSupplier | undefined {
    const row: any = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.suppliers.get(row.code);
  }

  getAllSuppliers(): Map<string, BaseSupplier> {
    return this.suppliers;
  }

  setFallbackChain(productId: string, supplierCodes: string[]) {
    this.fallbackChains.set(productId, supplierCodes);
  }

  getFallbackChain(productId: string): string[] {
    return this.fallbackChains.get(productId) || [];
  }

  async rechargeWithFallback(req: RechargeRequest & { currentSupplierCode: string; productId: string }): Promise<RechargeResult & { usedSupplier: string }> {
    const chain = this.getFallbackChain(req.productId);
    const suppliers = chain.length > 0 ? chain : [req.currentSupplierCode];

    for (let i = 0; i < suppliers.length; i++) {
      const code = suppliers[i];
      const supplier = this.suppliers.get(code);
      if (!supplier) continue;

      const result = await supplier.recharge(req);
      if (result.success) {
        return { ...result, usedSupplier: code };
      }

      db.prepare('UPDATE recharge_channels SET last_fail_time = ?, success_rate = success_rate * 0.95 WHERE product_id = ? AND supplier_id = (SELECT id FROM suppliers WHERE code = ?)')
        .run(now(), req.productId, code);
    }

    return { success: false, errorCode: 'ALL_FAIL', errorMessage: '所有供应商通道均失败', usedSupplier: req.currentSupplierCode };
  }

  async syncAllStock(): Promise<void> {
    const products: any[] = db.prepare('SELECT id, supplier_id, supplier_product_id FROM products WHERE status = 1').all();
    for (const product of products) {
      const supplier = this.getSupplierById(product.supplier_id);
      if (!supplier) continue;
      try {
        const result = await supplier.queryStock(product.supplier_product_id);
        db.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?')
          .run(result.available, now(), product.id);
      } catch {
      }
    }
  }
}

export const supplierManager = new SupplierManager();
