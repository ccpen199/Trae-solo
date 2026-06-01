import db from '../db/index.js';

export interface TaxRule {
  id?: number;
  hs_code_id: number;
  country_code: string;
  duty_rate: number;
  vat_rate: number;
  excise_rate?: number;
  currency?: string;
  min_value?: number;
  max_value?: number;
  valid_from: string;
  valid_to?: string;
  version: number;
  created_at?: string;
  created_by?: string;
}

export function getAllTaxRules(): (TaxRule & { hs_code: string; category: string })[] {
  return db.prepare(`
    SELECT tr.*, h.hs_code, h.category
    FROM tax_rules tr
    JOIN hs_codes h ON tr.hs_code_id = h.id
    ORDER BY tr.created_at DESC
  `).all() as (TaxRule & { hs_code: string; category: string })[];
}

export function getTaxRuleById(id: number): TaxRule | undefined {
  return db.prepare('SELECT * FROM tax_rules WHERE id = ?').get(id) as TaxRule | undefined;
}

export function getTaxRuleByHSCodeAndCountry(hsCodeId: number, countryCode: string): TaxRule | undefined {
  return db.prepare(`
    SELECT * FROM tax_rules 
    WHERE hs_code_id = ? AND country_code = ?
    AND (valid_to IS NULL OR valid_to >= DATE('now'))
    AND valid_from <= DATE('now')
    ORDER BY version DESC
  `).get(hsCodeId, countryCode) as TaxRule | undefined;
}

export function getTaxRuleByHSCodeStringAndCountry(hsCode: string, countryCode: string): (TaxRule & { hs_code: string; category: string }) | undefined {
  return db.prepare(`
    SELECT tr.*, h.hs_code, h.category
    FROM tax_rules tr
    JOIN hs_codes h ON tr.hs_code_id = h.id
    WHERE h.hs_code = ? AND tr.country_code = ?
    AND h.is_active = 1
    AND (tr.valid_to IS NULL OR tr.valid_to >= DATE('now'))
    AND tr.valid_from <= DATE('now')
    ORDER BY tr.version DESC
    LIMIT 1
  `).get(hsCode, countryCode) as (TaxRule & { hs_code: string; category: string }) | undefined;
}

export function createTaxRule(data: Omit<TaxRule, 'id' | 'created_at'>): number {
  const result = db.prepare(`
    INSERT INTO tax_rules (hs_code_id, country_code, duty_rate, vat_rate, excise_rate, currency, min_value, max_value, valid_from, valid_to, version, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.hs_code_id,
    data.country_code,
    data.duty_rate,
    data.vat_rate,
    data.excise_rate || 0,
    data.currency || 'USD',
    data.min_value || 0,
    data.max_value || null,
    data.valid_from,
    data.valid_to || null,
    data.version,
    data.created_by || null
  );
  return Number(result.lastInsertRowid);
}

export function updateTaxRule(id: number, data: Partial<TaxRule>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.duty_rate !== undefined) { fields.push('duty_rate = ?'); values.push(data.duty_rate); }
  if (data.vat_rate !== undefined) { fields.push('vat_rate = ?'); values.push(data.vat_rate); }
  if (data.excise_rate !== undefined) { fields.push('excise_rate = ?'); values.push(data.excise_rate); }
  if (data.valid_from !== undefined) { fields.push('valid_from = ?'); values.push(data.valid_from); }
  if (data.valid_to !== undefined) { fields.push('valid_to = ?'); values.push(data.valid_to); }
  if (data.version !== undefined) { fields.push('version = ?'); values.push(data.version); }
  values.push(id);
  
  db.prepare(`UPDATE tax_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteTaxRule(id: number): void {
  db.prepare('DELETE FROM tax_rules WHERE id = ?').run(id);
}
