import { query, queryOne, execute } from '../db.js'

interface PaginationParams {
  page?: number
  pageSize?: number
}

interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface WhereCondition {
  field: string
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN'
  value: unknown
}

class BaseRepository<T extends object> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  findAll(conditions: WhereCondition[] = [], orderBy?: string, order: 'ASC' | 'DESC' = 'ASC'): T[] {
    let sql = `SELECT * FROM ${this.tableName}`
    const params: unknown[] = []

    if (conditions.length > 0) {
      const whereClauses = conditions.map((cond, index) => {
        const operator = cond.operator || '='
        if (operator === 'IN') {
          const placeholders = (cond.value as unknown[]).map(() => '?').join(', ')
          params.push(...(cond.value as unknown[]))
          return `${cond.field} IN (${placeholders})`
        }
        params.push(cond.value)
        return `${cond.field} ${operator} ?`
      })
      sql += ' WHERE ' + whereClauses.join(' AND ')
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${order}`
    }

    return query<T>(sql, params)
  }

  findPaginated(
    params: PaginationParams = {},
    conditions: WhereCondition[] = [],
    orderBy?: string,
    order: 'ASC' | 'DESC' = 'ASC',
  ): PaginationResult<T> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}${conditions.length > 0 ? ' WHERE ' + conditions.map(c => c.field + ' ' + (c.operator || '=') + ' ?').join(' AND ') : ''}`
    const countParams = conditions.map(c => c.value)
    const countResult = queryOne<{ count: number }>(countSql, countParams)
    const total = countResult?.count || 0

    let sql = `SELECT * FROM ${this.tableName}`
    const queryParams: unknown[] = []

    if (conditions.length > 0) {
      const whereClauses = conditions.map((cond) => {
        const operator = cond.operator || '='
        queryParams.push(cond.value)
        return `${cond.field} ${operator} ?`
      })
      sql += ' WHERE ' + whereClauses.join(' AND ')
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${order}`
    }

    sql += ' LIMIT ? OFFSET ?'
    queryParams.push(pageSize, offset)

    const items = query<T>(sql, queryParams)
    const totalPages = Math.ceil(total / pageSize)

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  findById(id: number): T | undefined {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`
    return queryOne<T>(sql, [id])
  }

  findOne(conditions: WhereCondition[]): T | undefined {
    const whereClauses = conditions.map((cond) => {
      const operator = cond.operator || '='
      return `${cond.field} ${operator} ?`
    })
    const params = conditions.map(c => c.value)
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClauses.join(' AND ')} LIMIT 1`
    return queryOne<T>(sql, params)
  }

  create(data: Partial<T>): { id: number; changes: number } {
    const fields = Object.keys(data)
    const placeholders = fields.map(() => '?').join(', ')
    const values = fields.map(field => data[field as keyof T])

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`
    const result = execute(sql, values)

    return {
      id: Number(result.lastInsertRowid),
      changes: result.changes,
    }
  }

  update(id: number, data: Partial<T>): { changes: number } {
    const fields = Object.keys(data)
    const setClauses = fields.map(field => `${field} = ?`).join(', ')
    const values: unknown[] = fields.map(field => data[field as keyof T])
    values.push(id)

    const sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE id = ?`
    const result = execute(sql, values)

    return {
      changes: result.changes,
    }
  }

  delete(id: number): { changes: number } {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`
    const result = execute(sql, [id])

    return {
      changes: result.changes,
    }
  }

  count(conditions: WhereCondition[] = []): number {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`
    const params: unknown[] = []

    if (conditions.length > 0) {
      const whereClauses = conditions.map((cond) => {
        const operator = cond.operator || '='
        params.push(cond.value)
        return `${cond.field} ${operator} ?`
      })
      sql += ' WHERE ' + whereClauses.join(' AND ')
    }

    const result = queryOne<{ count: number }>(sql, params)
    return result?.count || 0
  }
}

export default BaseRepository
export type { WhereCondition, PaginationParams, PaginationResult }
