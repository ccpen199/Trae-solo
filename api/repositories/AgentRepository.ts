import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../data/database.js';
import type { Agent, User, Client } from '../../shared/types.js';

interface AgentRow {
  id: string;
  user_id: string;
  license_number: string;
  company: string;
  deal_count: number;
  rating: number;
  is_verified: number;
}

interface UserRow {
  id: string;
  phone: string;
  name: string;
  role: string;
  avatar: string;
  created_at: string;
}

interface ClientRow {
  id: string;
  agent_id: string;
  name: string;
  phone: string;
  level: string;
  budget_min: number;
  budget_max: number;
  preference: string;
  created_at: string;
}

function mapAgentRow(agentRow: AgentRow, userRow: UserRow): Agent {
  return {
    id: agentRow.id,
    name: userRow.name,
    phone: userRow.phone,
    company: agentRow.company,
    licenseNumber: agentRow.license_number,
    avatar: userRow.avatar,
    dealCount: agentRow.deal_count,
    rating: agentRow.rating,
    isVerified: agentRow.is_verified === 1,
  };
}

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    level: row.level as 'A' | 'B' | 'C',
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    preference: row.preference,
    agentId: row.agent_id,
    createdAt: row.created_at,
  };
}

export const AgentRepository = {
  async createAgent(agentData: Omit<Agent, 'id'> & { userId: string }): Promise<Agent> {
    const id = uuidv4();

    await run(
      'INSERT INTO agents (id, user_id, license_number, company, deal_count, rating, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        agentData.userId,
        agentData.licenseNumber,
        agentData.company,
        agentData.dealCount,
        agentData.rating,
        agentData.isVerified ? 1 : 0,
      ]
    );

    const created = await this.findAgentById(id);
    if (!created) {
      throw new Error('Failed to create agent');
    }
    return created;
  },

  async findAgentById(id: string): Promise<Agent | undefined> {
    const row = await get<{ agent: AgentRow; user: UserRow }>(
      `SELECT a.*, u.*
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (!row) return undefined;

    const agentRow = row as unknown as AgentRow;
    const userRow = row as unknown as UserRow;

    if (!('id' in agentRow) || !agentRow.id) return undefined;

    return mapAgentRow(agentRow, userRow);
  },

  async findAgentByUserId(userId: string): Promise<Agent | undefined> {
    const row = await get<{ agent: AgentRow; user: UserRow }>(
      `SELECT a.*, u.*
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = ?`,
      [userId]
    );

    if (!row) return undefined;

    const agentRow = row as unknown as AgentRow;
    const userRow = row as unknown as UserRow;

    if (!('id' in agentRow) || !agentRow.id) return undefined;

    return mapAgentRow(agentRow, userRow);
  },

  async findAllAgents(limit = 50, offset = 0): Promise<Agent[]> {
    const rows = await all<{ agent: AgentRow; user: UserRow }>(
      `SELECT a.*, u.*
       FROM agents a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.deal_count DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return rows
      .filter((row) => {
        const agentRow = row as unknown as AgentRow;
        return 'id' in agentRow && agentRow.id;
      })
      .map((row) => {
        const agentRow = row as unknown as AgentRow;
        const userRow = row as unknown as UserRow;
        return mapAgentRow(agentRow, userRow);
      });
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const existing = await this.findAgentById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<keyof Agent, string> = {
      id: 'id',
      name: 'name',
      phone: 'phone',
      company: 'company',
      licenseNumber: 'license_number',
      avatar: 'avatar',
      dealCount: 'deal_count',
      rating: 'rating',
      isVerified: 'is_verified',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof Agent] !== undefined) {
        const value = updates[key as keyof Agent];
        fields.push(`${column} = ?`);
        params.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await run(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findAgentById(id);
  },

  async deleteAgent(id: string): Promise<boolean> {
    const result = await run('DELETE FROM agents WHERE id = ?', [id]);
    return result.changes ? result.changes > 0 : false;
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      'INSERT INTO clients (id, agent_id, name, phone, level, budget_min, budget_max, preference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        client.agentId,
        client.name,
        client.phone,
        client.level,
        client.budgetMin,
        client.budgetMax,
        client.preference,
        now,
      ]
    );

    const created = await this.findClientById(id);
    if (!created) {
      throw new Error('Failed to create client');
    }
    return created;
  },

  async findClientById(id: string): Promise<Client | undefined> {
    const row = await get<ClientRow>('SELECT * FROM clients WHERE id = ?', [id]);
    if (!row) return undefined;
    return mapClientRow(row);
  },

  async findClientsByAgent(agentId: string, limit = 100, offset = 0): Promise<Client[]> {
    const rows = await all<ClientRow>(
      'SELECT * FROM clients WHERE agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [agentId, limit, offset]
    );
    return rows.map(mapClientRow);
  },

  async findClientsByLevel(agentId: string, level: 'A' | 'B' | 'C'): Promise<Client[]> {
    const rows = await all<ClientRow>(
      'SELECT * FROM clients WHERE agent_id = ? AND level = ? ORDER BY created_at DESC',
      [agentId, level]
    );
    return rows.map(mapClientRow);
  },

  async searchClients(agentId: string, keyword: string): Promise<Client[]> {
    const searchParam = `%${keyword}%`;
    const rows = await all<ClientRow>(
      'SELECT * FROM clients WHERE agent_id = ? AND (name LIKE ? OR phone LIKE ?) ORDER BY created_at DESC',
      [agentId, searchParam, searchParam]
    );
    return rows.map(mapClientRow);
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const existing = await this.findClientById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Record<keyof Client, string> = {
      id: 'id',
      name: 'name',
      phone: 'phone',
      level: 'level',
      budgetMin: 'budget_min',
      budgetMax: 'budget_max',
      preference: 'preference',
      agentId: 'agent_id',
      createdAt: 'created_at',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof Client] !== undefined) {
        fields.push(`${column} = ?`);
        params.push(updates[key as keyof Client]);
      }
    }

    if (fields.length > 0) {
      params.push(id);
      await run(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.findClientById(id);
  },

  async deleteClient(id: string): Promise<boolean> {
    const result = await run('DELETE FROM clients WHERE id = ?', [id]);
    return result.changes ? result.changes > 0 : false;
  },

  async getAgentStats(agentId: string): Promise<{
    totalClients: number;
    totalDeals: number;
    totalViewings: number;
    levelAClients: number;
    levelBClients: number;
    levelCClients: number;
  }> {
    const [clientCount, dealCount, viewingCount, levelCounts] = await Promise.all([
      get<{ count: number }>('SELECT COUNT(*) as count FROM clients WHERE agent_id = ?', [agentId]),
      get<{ count: number }>('SELECT COUNT(*) as count FROM deals WHERE agent_id = ?', [agentId]),
      get<{ count: number }>('SELECT COUNT(*) as count FROM viewing_records WHERE agent_id = ?', [agentId]),
      all<{ level: string; count: number }>(
        'SELECT level, COUNT(*) as count FROM clients WHERE agent_id = ? GROUP BY level',
        [agentId]
      ),
    ]);

    const levelStats: Record<string, number> = {};
    levelCounts.forEach((item) => {
      levelStats[item.level] = item.count;
    });

    return {
      totalClients: clientCount?.count || 0,
      totalDeals: dealCount?.count || 0,
      totalViewings: viewingCount?.count || 0,
      levelAClients: levelStats['A'] || 0,
      levelBClients: levelStats['B'] || 0,
      levelCClients: levelStats['C'] || 0,
    };
  },
};
