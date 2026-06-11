import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();
const CURRENT_USER_ID = 'u1';

router.post('/image', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({ error: 'imageUrl is required' });
      return;
    }

    const allItems = db.prepare('SELECT * FROM contraband_library').all() as any[];
    const isMatch = Math.random() > 0.6;
    let matchedItems: any[] = [];
    let riskLevel: string = 'none';
    let isContraband = false;

    if (isMatch && allItems.length > 0) {
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...allItems].sort(() => Math.random() - 0.5);
      matchedItems = shuffled.slice(0, count);
      riskLevel = matchedItems.some(i => i.risk_level === 'high') ? 'high'
        : matchedItems.some(i => i.risk_level === 'medium') ? 'medium' : 'low';
      isContraband = true;
    }

    const checkId = `cc-${Date.now()}`;
    db.prepare(
      `INSERT INTO contraband_checks (id, user_id, input_type, input_content, is_contraband, risk_level, matched_items)
       VALUES (?, ?, 'image', ?, ?, ?, ?)`
    ).run(checkId, CURRENT_USER_ID, imageUrl, isContraband ? 1 : 0, riskLevel, JSON.stringify(matchedItems.map(i => i.id)));

    res.json({
      id: checkId,
      userId: CURRENT_USER_ID,
      inputType: 'image',
      inputContent: imageUrl,
      isContraband,
      riskLevel,
      matchedItems: matchedItems.map(i => i.name),
      description: isContraband
        ? `检测到${matchedItems.length}项疑似违禁品: ${matchedItems.map(i => i.name).join('、')}`
        : '未检测到违禁品',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  } catch (error) {
    console.error('Image contraband check failed:', error);
    res.status(500).json({ error: 'Image contraband check failed' });
  }
});

router.post('/text', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const allItems = db.prepare('SELECT * FROM contraband_library').all() as any[];
    const matchedItems = allItems.filter(item => {
      const keywords = item.keywords.split(',');
      return keywords.some((kw: string) => text.includes(kw.trim()));
    });

    const riskLevel = matchedItems.some(i => i.risk_level === 'high') ? 'high'
      : matchedItems.some(i => i.risk_level === 'medium') ? 'medium'
      : matchedItems.length > 0 ? 'low' : 'none';
    const isContraband = matchedItems.length > 0;

    const checkId = `cc-${Date.now()}`;
    db.prepare(
      `INSERT INTO contraband_checks (id, user_id, input_type, input_content, is_contraband, risk_level, matched_items)
       VALUES (?, ?, 'text', ?, ?, ?, ?)`
    ).run(checkId, CURRENT_USER_ID, text, isContraband ? 1 : 0, riskLevel, JSON.stringify(matchedItems.map(i => i.id)));

    res.json({
      id: checkId,
      userId: CURRENT_USER_ID,
      inputType: 'text',
      inputContent: text,
      isContraband,
      riskLevel,
      matchedItems: matchedItems.map(i => i.name),
      description: isContraband
        ? `检测到${matchedItems.length}项违禁品匹配: ${matchedItems.map(i => i.name).join('、')}`
        : '未检测到违禁品',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  } catch (error) {
    console.error('Text contraband check failed:', error);
    res.status(500).json({ error: 'Text contraband check failed' });
  }
});

router.get('/library', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const items = db.prepare('SELECT * FROM contraband_library ORDER BY risk_level DESC, category').all() as any[];
    res.json(items.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      keywords: i.keywords,
      riskLevel: i.risk_level,
    })));
  } catch (error) {
    console.error('Failed to fetch contraband library:', error);
    res.status(500).json({ error: 'Failed to fetch contraband library' });
  }
});

export default router;
