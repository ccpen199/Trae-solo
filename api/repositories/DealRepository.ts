import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../data/database.js';
import type { ViewingRecord, Deal, RegulatoryReport } from '../../shared/types.js';

interface ViewingRecordRow {
  id: string;
  property_id: string;
  client_id: string;
  agent_id: string;
  viewing_date: string;
  time_slot: string;
  feedback: string;
  interest_level: string;
  created_at: string;
}

interface DealRow {
  id: string;
  property_id: string;
  client_id: string;
  agent_id: string;
  deal_price: number;
  commission: number;
  deal_date: string;
  status: string;
  created_at: string;
}

interface RegulatoryReportRow {
  id: string;
  deal_id: string;
  report_id: string;
  report_time: string;
  status: string;
  government_response: string;
  created_at: string;
}

function mapViewingRecordRow(row: ViewingRecordRow): ViewingRecord {
  return {
    id: row.id,
    propertyId: row.property_id,
    clientId: row.client_id,
    agentId: row.agent_id,
    date: row.viewing_date,
    timeSlot: row.time_slot,
    feedback: row.feedback,
    interestLevel: row.interest_level as 'high' | 'medium' | 'low',
    createdAt: row.created_at,
  };
}

function mapDealRow(row: DealRow): Deal {
  return {
    id: row.id,
    propertyId: row.property_id,
    clientId: row.client_id,
    agentId: row.agent_id,
    dealPrice: row.deal_price,
    commission: row.commission,
    dealDate: row.deal_date,
    status: row.status as 'pending' | 'completed' | 'reported',
    createdAt: row.created_at,
  };
}

function mapRegulatoryReportRow(row: RegulatoryReportRow): RegulatoryReport {
  return {
    id: row.id,
    dealId: row.deal_id,
    reportId: row.report_id,
    reportTime: row.report_time,
    status: row.status as 'pending' | 'success' | 'failed',
    governmentResponse: row.government_response,
    createdAt: row.created_at,
  };
}

export const DealRepository = {
  async createViewingRecord(viewing: Omit<ViewingRecord, 'id' | 'createdAt'>): Promise<ViewingRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      'INSERT INTO viewing_records (id, property_id, client_id, agent_id, viewing_date, time_slot, feedback, interest_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        viewing.propertyId,
        viewing.clientId,
        viewing.agentId,
        viewing.date,
        viewing.timeSlot,
        viewing.feedback,
        viewing.interestLevel,
        now,
      ]
    );

    const created = await this.findViewingRecordById(id);
    if (!created) {
      throw new Error('Failed to create viewing record');
    }
    return created;
  },

  async findViewingRecordById(id: string): Promise<ViewingRecord | undefined> {
    const row = await get<ViewingRecordRow>('SELECT * FROM viewing_records WHERE id = ?', [id]);
    if (!row) return undefined;
    return mapViewingRecordRow(row);
  },

  async findViewingRecordsByAgent(agentId: string, limit = 100, offset = 0): Promise<ViewingRecord[]> {
    const rows = await all<ViewingRecordRow>(
      `SELECT vr.*, p.title as property_title, c.name as client_name
       FROM viewing_records vr
       LEFT JOIN properties p ON vr.property_id = p.id
       LEFT JOIN clients c ON vr.client_id = c.id
       WHERE vr.agent_id = ?
       ORDER BY vr.viewing_date DESC, vr.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
    return rows.map((row) => {
      const record = mapViewingRecordRow(row);
      const extendedRow = row as ViewingRecordRow & { property_title?: string; client_name?: string };
      return {
        ...record,
        propertyTitle: extendedRow.property_title,
        clientName: extendedRow.client_name,
      };
    });
  },

  async findViewingRecordsByProperty(propertyId: string): Promise<ViewingRecord[]> {
    const rows = await all<ViewingRecordRow>(
      `SELECT vr.*, c.name as client_name
       FROM viewing_records vr
       LEFT JOIN clients c ON vr.client_id = c.id
       WHERE vr.property_id = ?
       ORDER BY vr.viewing_date DESC`,
      [propertyId]
    );
    return rows.map((row) => {
      const record = mapViewingRecordRow(row);
      const extendedRow = row as ViewingRecordRow & { client_name?: string };
      return {
        ...record,
        clientName: extendedRow.client_name,
      };
    });
  },

  async findViewingRecordsByClient(clientId: string): Promise<ViewingRecord[]> {
    const rows = await all<ViewingRecordRow>(
      `SELECT vr.*, p.title as property_title
       FROM viewing_records vr
       LEFT JOIN properties p ON vr.property_id = p.id
       WHERE vr.client_id = ?
       ORDER BY vr.viewing_date DESC`,
      [clientId]
    );
    return rows.map((row) => {
      const record = mapViewingRecordRow(row);
      const extendedRow = row as ViewingRecordRow & { property_title?: string };
      return {
        ...record,
        propertyTitle: extendedRow.property_title,
      };
    });
  },

  async findViewingRecordsByDateRange(
    agentId: string,
    startDate: string,
    endDate: string
  ): Promise<ViewingRecord[]> {
    const rows = await all<ViewingRecordRow>(
      `SELECT vr.*, p.title as property_title, c.name as client_name
       FROM viewing_records vr
       LEFT JOIN properties p ON vr.property_id = p.id
       LEFT JOIN clients c ON vr.client_id = c.id
       WHERE vr.agent_id = ? AND vr.viewing_date >= ? AND vr.viewing_date <= ?
       ORDER BY vr.viewing_date DESC`,
      [agentId, startDate, endDate]
    );
    return rows.map((row) => {
      const record = mapViewingRecordRow(row);
      const extendedRow = row as ViewingRecordRow & { property_title?: string; client_name?: string };
      return {
        ...record,
        propertyTitle: extendedRow.property_title,
        clientName: extendedRow.client_name,
      };
    });
  },

  async updateViewingRecord(
    id: string,
    updates: Partial<Omit<ViewingRecord, 'id' | 'createdAt'>>
  ): Promise<ViewingRecord | undefined> {
    const existing = await this.findViewingRecordById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<keyof ViewingRecord, string> = {
      id: 'id',
      propertyId: 'property_id',
      propertyTitle: 'property_title',
      clientId: 'client_id',
      clientName: 'client_name',
      agentId: 'agent_id',
      date: 'viewing_date',
      timeSlot: 'time_slot',
      feedback: 'feedback',
      interestLevel: 'interest_level',
      createdAt: 'created_at',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof ViewingRecord] !== undefined) {
        fields.push(`${column} = ?`);
        params.push(updates[key as keyof ViewingRecord]);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await run(`UPDATE viewing_records SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findViewingRecordById(id);
  },

  async deleteViewingRecord(id: string): Promise<boolean> {
    const result = await run('DELETE FROM viewing_records WHERE id = ?', [id]);
    return result.changes ? result.changes > 0 : false;
  },

  async createDeal(deal: Omit<Deal, 'id' | 'createdAt'>): Promise<Deal> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      'INSERT INTO deals (id, property_id, client_id, agent_id, deal_price, commission, deal_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        deal.propertyId,
        deal.clientId,
        deal.agentId,
        deal.dealPrice,
        deal.commission,
        deal.dealDate,
        deal.status,
        now,
      ]
    );

    const created = await this.findDealById(id);
    if (!created) {
      throw new Error('Failed to create deal');
    }
    return created;
  },

  async findDealById(id: string): Promise<Deal | undefined> {
    const row = await get<DealRow>('SELECT * FROM deals WHERE id = ?', [id]);
    if (!row) return undefined;
    return mapDealRow(row);
  },

  async findDealsByAgent(agentId: string, limit = 100, offset = 0): Promise<Deal[]> {
    const rows = await all<DealRow>(
      `SELECT d.*, p.title as property_title, c.name as client_name
       FROM deals d
       LEFT JOIN properties p ON d.property_id = p.id
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE d.agent_id = ?
       ORDER BY d.deal_date DESC, d.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );
    return rows.map((row) => {
      const deal = mapDealRow(row);
      const extendedRow = row as DealRow & { property_title?: string; client_name?: string };
      return {
        ...deal,
        propertyTitle: extendedRow.property_title,
        clientName: extendedRow.client_name,
      };
    });
  },

  async findDealsByStatus(agentId: string, status: 'pending' | 'completed' | 'reported'): Promise<Deal[]> {
    const rows = await all<DealRow>(
      `SELECT d.*, p.title as property_title, c.name as client_name
       FROM deals d
       LEFT JOIN properties p ON d.property_id = p.id
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE d.agent_id = ? AND d.status = ?
       ORDER BY d.deal_date DESC`,
      [agentId, status]
    );
    return rows.map((row) => {
      const deal = mapDealRow(row);
      const extendedRow = row as DealRow & { property_title?: string; client_name?: string };
      return {
        ...deal,
        propertyTitle: extendedRow.property_title,
        clientName: extendedRow.client_name,
      };
    });
  },

  async findDealsByDateRange(
    agentId: string,
    startDate: string,
    endDate: string
  ): Promise<Deal[]> {
    const rows = await all<DealRow>(
      `SELECT d.*, p.title as property_title, c.name as client_name
       FROM deals d
       LEFT JOIN properties p ON d.property_id = p.id
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE d.agent_id = ? AND d.deal_date >= ? AND d.deal_date <= ?
       ORDER BY d.deal_date DESC`,
      [agentId, startDate, endDate]
    );
    return rows.map((row) => {
      const deal = mapDealRow(row);
      const extendedRow = row as DealRow & { property_title?: string; client_name?: string };
      return {
        ...deal,
        propertyTitle: extendedRow.property_title,
        clientName: extendedRow.client_name,
      };
    });
  },

  async updateDeal(
    id: string,
    updates: Partial<Omit<Deal, 'id' | 'createdAt'>>
  ): Promise<Deal | undefined> {
    const existing = await this.findDealById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<keyof Deal, string> = {
      id: 'id',
      propertyId: 'property_id',
      propertyTitle: 'property_title',
      clientId: 'client_id',
      clientName: 'client_name',
      agentId: 'agent_id',
      dealPrice: 'deal_price',
      commission: 'commission',
      dealDate: 'deal_date',
      status: 'status',
      createdAt: 'created_at',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof Deal] !== undefined) {
        fields.push(`${column} = ?`);
        params.push(updates[key as keyof Deal]);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await run(`UPDATE deals SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findDealById(id);
  },

  async deleteDeal(id: string): Promise<boolean> {
    const result = await run('DELETE FROM deals WHERE id = ?', [id]);
    return result.changes ? result.changes > 0 : false;
  },

  async createRegulatoryReport(
    report: Omit<RegulatoryReport, 'id' | 'createdAt'>
  ): Promise<RegulatoryReport> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      'INSERT INTO regulatory_reports (id, deal_id, report_id, report_time, status, government_response, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        report.dealId,
        report.reportId,
        report.reportTime,
        report.status,
        report.governmentResponse || '',
        now,
      ]
    );

    const created = await this.findRegulatoryReportById(id);
    if (!created) {
      throw new Error('Failed to create regulatory report');
    }
    return created;
  },

  async findRegulatoryReportById(id: string): Promise<RegulatoryReport | undefined> {
    const row = await get<RegulatoryReportRow>('SELECT * FROM regulatory_reports WHERE id = ?', [id]);
    if (!row) return undefined;
    return mapRegulatoryReportRow(row);
  },

  async findRegulatoryReportsByDeal(dealId: string): Promise<RegulatoryReport[]> {
    const rows = await all<RegulatoryReportRow>(
      'SELECT * FROM regulatory_reports WHERE deal_id = ? ORDER BY report_time DESC',
      [dealId]
    );
    return rows.map(mapRegulatoryReportRow);
  },

  async updateRegulatoryReport(
    id: string,
    updates: Partial<Omit<RegulatoryReport, 'id' | 'createdAt'>>
  ): Promise<RegulatoryReport | undefined> {
    const existing = await this.findRegulatoryReportById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<keyof RegulatoryReport, string> = {
      id: 'id',
      dealId: 'deal_id',
      reportId: 'report_id',
      reportTime: 'report_time',
      status: 'status',
      governmentResponse: 'government_response',
      createdAt: 'created_at',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof RegulatoryReport] !== undefined) {
        fields.push(`${column} = ?`);
        params.push(updates[key as keyof RegulatoryReport]);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await run(`UPDATE regulatory_reports SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findRegulatoryReportById(id);
  },

  async getDealStats(agentId: string): Promise<{
    totalDeals: number;
    totalDealAmount: number;
    totalCommission: number;
    pendingDeals: number;
    completedDeals: number;
    reportedDeals: number;
    totalViewings: number;
    highInterestViewings: number;
  }> {
    const [dealStats, viewingStats] = await Promise.all([
      all<{ status: string; count: number; total_amount: number; total_commission: number }>(
        `SELECT status,
                COUNT(*) as count,
                SUM(deal_price) as total_amount,
                SUM(commission) as total_commission
         FROM deals
         WHERE agent_id = ?
         GROUP BY status`,
        [agentId]
      ),
      all<{ interest_level: string; count: number }>(
        'SELECT interest_level, COUNT(*) as count FROM viewing_records WHERE agent_id = ? GROUP BY interest_level',
        [agentId]
      ),
    ]);

    let totalDeals = 0;
    let totalDealAmount = 0;
    let totalCommission = 0;
    let pendingDeals = 0;
    let completedDeals = 0;
    let reportedDeals = 0;

    dealStats.forEach((stat) => {
      totalDeals += stat.count;
      totalDealAmount += stat.total_amount || 0;
      totalCommission += stat.total_commission || 0;
      if (stat.status === 'pending') pendingDeals = stat.count;
      else if (stat.status === 'completed') completedDeals = stat.count;
      else if (stat.status === 'reported') reportedDeals = stat.count;
    });

    let totalViewings = 0;
    let highInterestViewings = 0;

    viewingStats.forEach((stat) => {
      totalViewings += stat.count;
      if (stat.interest_level === 'high') highInterestViewings = stat.count;
    });

    return {
      totalDeals,
      totalDealAmount,
      totalCommission,
      pendingDeals,
      completedDeals,
      reportedDeals,
      totalViewings,
      highInterestViewings,
    };
  },

  async getMonthlyDeals(agentId: string, months = 12): Promise<{
    month: string;
    count: number;
    amount: number;
    commission: number;
  }[]> {
    const rows = await all<{ month: string; count: number; amount: number; commission: number }>(
      `SELECT strftime('%Y-%m', deal_date) as month,
              COUNT(*) as count,
              SUM(deal_price) as amount,
              SUM(commission) as commission
       FROM deals
       WHERE agent_id = ? AND deal_date >= date('now', ?)
       GROUP BY strftime('%Y-%m', deal_date)
       ORDER BY month DESC`,
      [agentId, `-${months} months`]
    );
    return rows;
  },
};
