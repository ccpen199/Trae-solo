import express, { type Request, type Response } from 'express';
import { db } from '../db/init.js';

const router = express.Router();

router.get('/rules', (req: Request, res: Response) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM underwriting_rules WHERE 1=1';
    const params: any[] = [];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    query += ' ORDER BY risk_level DESC, created_at DESC';
    const rules = db.prepare(query).all(...params);

    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/rules', (req: Request, res: Response) => {
  try {
    const { rule_code, rule_name, rule_version, rule_type, risk_level, conditions, actions, description } = req.body;

    const result = db.prepare(`
      INSERT INTO underwriting_rules (rule_code, rule_name, rule_version, rule_type, risk_level, conditions, actions, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(rule_code, rule_name, rule_version || '1.0', rule_type, risk_level, JSON.stringify(conditions), JSON.stringify(actions), description);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/decision', (req: Request, res: Response) => {
  try {
    const { application_id, decision_type, decision_notes, rated_amount, rate_percentage, excluded_conditions, postponed_months, user_id } = req.body;

    const existingDecision = db.prepare('SELECT id FROM underwriting_decisions WHERE application_id = ?').get(application_id);
    if (existingDecision) {
      return res.status(400).json({ success: false, error: '该投保单已有核保结论，不能重复提交' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    try {
      db.prepare(`
        INSERT INTO underwriting_decisions (
          application_id, decision_type, decision_notes, rated_amount, rate_percentage,
          excluded_conditions, postponed_months, decision_made_by, is_locked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(application_id, decision_type, decision_notes, rated_amount, rate_percentage, excluded_conditions, postponed_months, user_id);

      const statusMap: Record<string, string> = {
        approve: 'approved',
        rate: 'rated',
        exclude: 'excluded',
        postpone: 'postponed',
        reject: 'rejected',
        manual_review: 'underwriting'
      };
      const newStatus = statusMap[decision_type] || 'underwriting';
      db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(newStatus, application_id);

      db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
        .run(application_id, user_id, 'make_decision', JSON.stringify({ decision_type, decision_notes }));

      db.prepare('COMMIT').run();

      res.json({ success: true, message: '核保结论已保存并锁定' });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/decision/:applicationId', (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const decision = db.prepare(`
      SELECT ud.*, u.name as decision_maker_name
      FROM underwriting_decisions ud
      LEFT JOIN users u ON ud.decision_made_by = u.id
      WHERE ud.application_id = ?
    `).get(applicationId);

    res.json({ success: true, data: decision });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

interface RuleCondition {
  type: 'all_health_no' | 'occupation_risk' | 'medical_history_contains' | 'bmi_range';
  value?: any;
}

const evaluateRule = (
  rule: any,
  application: any,
  healthDeclarations: any[],
  medicalHistories: any[]
): { hit: boolean; reason: string } => {
  try {
    let conditions: RuleCondition[] = [];
    if (typeof rule.conditions === 'string') {
      conditions = JSON.parse(rule.conditions);
    } else if (Array.isArray(rule.conditions)) {
      conditions = rule.conditions;
    } else if (rule.conditions && typeof rule.conditions === 'object') {
      conditions = [{ type: rule.conditions.type, value: rule.conditions.value } as RuleCondition];
    }

    if (conditions.length === 0) {
      return { hit: false, reason: '' };
    }

    let hitCount = 0;
    const reasons: string[] = [];

    for (const condition of conditions) {
      switch (condition.type) {
        case 'all_health_no':
          const allHealthNo = healthDeclarations.length > 0 && healthDeclarations.every(h => !h.has_condition);
          if (allHealthNo) {
            hitCount++;
            reasons.push('健康告知全部选否，无异常记录');
          }
          break;

        case 'occupation_risk':
          const minRisk = condition.value?.min || 4;
          if (application.occupation_risk_level >= minRisk) {
            hitCount++;
            reasons.push(`职业风险等级为${application.occupation_risk_level}级，达到${minRisk}级风险阈值`);
          }
          break;

        case 'medical_history_contains':
          const keywords = condition.value?.keywords || [];
          for (const mh of medicalHistories) {
            if (keywords.some((kw: string) => mh.condition_name.includes(kw) || mh.condition_type.includes(kw))) {
              hitCount++;
              reasons.push(`存在既往病史：${mh.condition_name}`);
              break;
            }
          }
          break;

        case 'bmi_range':
          if (condition.value?.min && condition.value?.max) {
            reasons.push(`BMI在${condition.value.min}-${condition.value.max}之间`);
            hitCount++;
          }
          break;
      }
    }

    if (hitCount === conditions.length) {
      return { hit: true, reason: reasons.join('; ') };
    }

    return { hit: false, reason: '' };
  } catch (error) {
    console.error('Error evaluating rule:', error);
    return { hit: false, reason: '' };
  }
};

router.post('/run-rules/:applicationId', (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { user_id } = req.body;

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId) as any;
    if (!application) {
      return res.status(404).json({ success: false, error: '投保单不存在' });
    }

    const healthDeclarations = db.prepare('SELECT * FROM health_declarations WHERE application_id = ?').all(applicationId) as any[];
    const medicalHistories = db.prepare('SELECT * FROM medical_histories WHERE application_id = ?').all(applicationId) as any[];
    const activeRules = db.prepare('SELECT * FROM underwriting_rules WHERE is_active = 1 ORDER BY risk_level DESC').all() as any[];

    const hitRules: any[] = [];
    const hitRuleCodes = new Set<string>();

    for (const rule of activeRules) {
      if (hitRuleCodes.has(rule.rule_code)) continue;

      const result = evaluateRule(rule, application, healthDeclarations, medicalHistories);
      if (result.hit) {
        hitRules.push({ rule, hitReason: result.reason });
        hitRuleCodes.add(rule.rule_code);
      }
    }

    db.prepare('DELETE FROM rule_hits WHERE application_id = ?').run(applicationId);

    for (const hit of hitRules) {
      db.prepare(`
        INSERT INTO rule_hits (application_id, rule_id, hit_reason, hit_details, risk_level, rule_version)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(applicationId, hit.rule.id, hit.hitReason, JSON.stringify(hit.rule.conditions), hit.rule.risk_level, hit.rule.rule_version);
    }

    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(applicationId, user_id || 1, 'run_rules', JSON.stringify({ hitCount: hitRules.length }));

    res.json({
      success: true,
      data: {
        hitCount: hitRules.length,
        hitRules: hitRules.map(h => ({
          rule_id: h.rule.id,
          rule_code: h.rule.rule_code,
          rule_name: h.rule.rule_name,
          rule_type: h.rule.rule_type,
          hit_reason: h.hitReason,
          risk_level: h.rule.risk_level
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/rule-hits/:applicationId', (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const hits = db.prepare(`
      SELECT rh.*, ur.rule_name, ur.rule_type, ur.description
      FROM rule_hits rh
      JOIN underwriting_rules ur ON rh.rule_id = ur.id
      WHERE rh.application_id = ?
      ORDER BY rh.risk_level DESC
    `).all(applicationId);

    res.json({ success: true, data: hits });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
