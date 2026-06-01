import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', (req: AuthRequest, res) => {
  const scenes = db.prepare(`
    SELECT * FROM scenes
    ORDER BY created_at DESC
  `).all();

  const formatted = scenes.map((s: any) => ({
    ...s,
    trigger_config: s.trigger_config ? JSON.parse(s.trigger_config) : null,
    actions: JSON.parse(s.actions)
  }));

  res.json(formatted);
});

router.get('/:id', (req: AuthRequest, res) => {
  const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id);
  
  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  res.json({
    ...scene,
    trigger_config: scene.trigger_config ? JSON.parse(scene.trigger_config) : null,
    actions: JSON.parse(scene.actions)
  });
});

router.post('/', (req: AuthRequest, res) => {
  const { name, description, enabled, trigger_type, trigger_config, actions } = req.body;

  if (!name || !trigger_type || !actions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sceneId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO scenes (id, name, description, enabled, trigger_type, trigger_config, actions, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sceneId,
    name,
    description || '',
    enabled !== false ? 1 : 0,
    trigger_type,
    JSON.stringify(trigger_config || {}),
    JSON.stringify(actions),
    now,
    now
  );

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'scenes',
    'create',
    JSON.stringify({ sceneId, name })
  );

  res.status(201).json({ id: sceneId, name });
});

router.put('/:id', (req: AuthRequest, res) => {
  const sceneId = req.params.id;
  const { name, description, enabled, trigger_type, trigger_config, actions } = req.body;

  const scene = db.prepare('SELECT id FROM scenes WHERE id = ?').get(sceneId);
  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    UPDATE scenes SET name = ?, description = ?, enabled = ?, trigger_type = ?, trigger_config = ?, actions = ?, updated_at = ?
    WHERE id = ?
  `).run(
    name,
    description || '',
    enabled !== false ? 1 : 0,
    trigger_type,
    JSON.stringify(trigger_config || {}),
    JSON.stringify(actions),
    now,
    sceneId
  );

  res.json({ success: true });
});

router.delete('/:id', (req: AuthRequest, res) => {
  const sceneId = req.params.id;

  const scene = db.prepare('SELECT id FROM scenes WHERE id = ?').get(sceneId);
  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  db.prepare('DELETE FROM scenes WHERE id = ?').run(sceneId);

  res.json({ success: true });
});

router.post('/:id/execute', (req: AuthRequest, res) => {
  const sceneId = req.params.id;

  const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(sceneId);
  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  const actions = JSON.parse(scene.actions);
  const now = Math.floor(Date.now() / 1000);

  db.prepare('INSERT INTO scene_logs (id, scene_id, triggered_at, success) VALUES (?, ?, ?, ?)').run(
    uuidv4(),
    sceneId,
    now,
    1
  );

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'scenes',
    'execute',
    JSON.stringify({ sceneId, actions: actions.length })
  );

  res.json({ success: true, actions_executed: actions.length });
});

router.get('/:id/logs', (req: AuthRequest, res) => {
  const sceneId = req.params.id;
  const limit = parseInt(req.query.limit as string) || 50;

  const logs = db.prepare(`
    SELECT * FROM scene_logs
    WHERE scene_id = ?
    ORDER BY triggered_at DESC
    LIMIT ?
  `).all(sceneId, limit);

  res.json(logs);
});

export default router;
