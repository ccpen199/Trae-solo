import db from '../db/index.js';

export interface HSCode {
  id?: number;
  hs_code: string;
  category: string;
  material?: string;
  description?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export function getAllHSCodes(): HSCode[] {
  return db.prepare('SELECT * FROM hs_codes WHERE is_active = 1 ORDER BY created_at DESC').all() as HSCode[];
}

export function getHSCodeById(id: number): HSCode | undefined {
  return db.prepare('SELECT * FROM hs_codes WHERE id = ?').get(id) as HSCode | undefined;
}

export function getHSCodeByCode(hsCode: string): HSCode | undefined {
  return db.prepare('SELECT * FROM hs_codes WHERE hs_code = ? AND is_active = 1 ORDER BY version DESC LIMIT 1').get(hsCode) as HSCode | undefined;
}

export function searchHSCodes(query: string): HSCode[] {
  const searchQuery = `%${query}%`;
  return db.prepare(`
    SELECT * FROM hs_codes 
    WHERE is_active = 1 
    AND (hs_code LIKE ? OR category LIKE ? OR description LIKE ?)
    ORDER BY created_at DESC
  `).all(searchQuery, searchQuery, searchQuery) as HSCode[];
}

export function createHSCode(data: Omit<HSCode, 'id' | 'created_at' | 'updated_at'>): number {
  const result = db.prepare(`
    INSERT INTO hs_codes (hs_code, category, material, description, version, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(
    data.hs_code,
    data.category,
    data.material || null,
    data.description || null,
    data.version
  );
  return Number(result.lastInsertRowid);
}

export function updateHSCode(id: number, data: Partial<HSCode>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.material !== undefined) { fields.push('material = ?'); values.push(data.material); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.version !== undefined) { fields.push('version = ?'); values.push(data.version); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.prepare(`UPDATE hs_codes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deactivateHSCode(id: number): void {
  db.prepare('UPDATE hs_codes SET is_active = 0 WHERE id = ?').run(id);
}
