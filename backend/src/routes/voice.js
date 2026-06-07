const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const intentPatterns = [
  { pattern: /打开.*灯|开灯|把灯打开/, intent: 'turn_on_light', device: 'light', action: { power: true } },
  { pattern: /关闭.*灯|关灯|把灯关掉/, intent: 'turn_off_light', device: 'light', action: { power: false } },
  { pattern: /打开.*空调|开空调/, intent: 'turn_on_ac', device: 'ac', action: { power: true } },
  { pattern: /关闭.*空调|关空调/, intent: 'turn_off_ac', device: 'ac', action: { power: false } },
  { pattern: /温度调到?(\d+)度/, intent: 'set_temperature', device: 'ac', param: 'temperature' },
  { pattern: /亮度调到?(\d+)%|亮度(\d+)/, intent: 'set_brightness', device: 'light', param: 'brightness' },
  { pattern: /看电影|观影模式|我想看电影/, intent: 'activate_scene', scene: 'scene-movie' },
  { pattern: /我要买|帮我买|下单/, intent: 'shopping' },
  { pattern: /搜索|查找/, intent: 'search' }
];

const fuzzyCorrections = {
  '打灯': '开灯',
  '关灯灯': '关灯',
  '开调': '开空调',
  '关调': '关空调',
  '看影': '看电影',
  '观影': '看电影'
};

router.post('/session/start', (req, res) => {
  const { userId = 'default' } = req.body;
  const id = `voice-${uuidv4().slice(0, 12)}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO voice_sessions (id, user_id, context, last_intent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, '{}', null, now, now);
  
  res.json({ success: true, data: { sessionId: id } });
});

router.post('/understand', (req, res) => {
  const { session_id, text } = req.body;
  req.body.sessionId = session_id;
  req.body.text = text;
  handleCommand(req, res);
});

function handleCommand(req, res) {
  const { sessionId, text, command, userId = 'default' } = req.body;
  const inputText = text || command || '';
  const now = Date.now();
  
  let session;
  if (sessionId) {
    session = db.prepare('SELECT * FROM voice_sessions WHERE id = ?').get(sessionId);
  }
  
  if (!session) {
    const id = sessionId || `voice-${uuidv4().slice(0, 12)}`;
    db.prepare(`
      INSERT INTO voice_sessions (id, user_id, context, last_intent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, '{}', null, now, now);
    session = { id, user_id: userId, context: '{}', last_intent: null };
  }
  
  let correctedCommand = inputText;
  let wasCorrected = false;
  
  Object.entries(fuzzyCorrections).forEach(([wrong, correct]) => {
    if (inputText && inputText.includes(wrong)) {
      correctedCommand = inputText.replace(wrong, correct);
      wasCorrected = true;
    }
  });
  
  let matchedIntent = null;
  let entities = {};
  let actionResult = null;
  
  for (const p of intentPatterns) {
    const match = correctedCommand.match(p.pattern);
    if (match) {
      matchedIntent = p.intent;
      
      if (p.param && match[1]) {
        entities[p.param] = parseInt(match[1]);
      }
      if (p.device) entities.deviceType = p.device;
      if (p.scene) entities.sceneId = p.scene;
      if (p.action) entities.action = p.action;
      
      break;
    }
  }
  
  if (!matchedIntent && session.last_intent) {
    const context = JSON.parse(session.context || '{}');
    if (context.expects === 'temperature') {
      const tempMatch = correctedCommand.match(/(\d+)/);
      if (tempMatch) {
        matchedIntent = 'set_temperature';
        entities = { ...context.entities, temperature: parseInt(tempMatch[1]) };
        wasCorrected = true;
        correctedCommand = `(上下文) 设置温度 ${tempMatch[1]} 度`;
      }
    }
  }
  
  if (matchedIntent) {
    actionResult = executeIntent(matchedIntent, entities, session);
  }
  
  db.prepare(`
    INSERT INTO voice_commands (session_id, command, intent, entities, corrected_intent, success, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    session.id, 
    inputText, 
    matchedIntent, 
    JSON.stringify(entities),
    wasCorrected ? correctedCommand : null,
    actionResult?.success ? 1 : 0,
    now
  );
  
  const expectsTemp = matchedIntent === 'turn_on_ac' || matchedIntent === 'turn_off_ac';
  const newContext = JSON.stringify({
    lastCommand: inputText,
    expects: expectsTemp ? 'temperature' : null,
    entities
  });
  
  db.prepare('UPDATE voice_sessions SET context = ?, last_intent = ?, updated_at = ? WHERE id = ?')
    .run(newContext, matchedIntent, now, session.id);
  
  const sceneName = entities.sceneId === 'scene-movie' ? '观影模式' : null;
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      originalText: inputText,
      correctedText: wasCorrected ? correctedCommand : null,
      intent: matchedIntent || 'unknown',
      entities,
      params: entities,
      temperature: entities.temperature,
      sceneId: entities.sceneId,
      sceneName,
      actionResult,
      response: generateResponse(matchedIntent, entities, actionResult)
    }
  });
}

router.post('/command', handleCommand);

function executeIntent(intent, entities, session) {
  const result = { success: true, message: '' };
  
  switch (intent) {
    case 'turn_on_light':
    case 'turn_off_light':
      result.message = entities.action?.power ? '已为您打开灯' : '已为您关闭灯';
      break;
    case 'turn_on_ac':
    case 'turn_off_ac':
      result.message = entities.action?.power ? '已为您打开空调' : '已为您关闭空调';
      break;
    case 'set_temperature':
      result.message = `已将空调温度设置为 ${entities.temperature} 度`;
      break;
    case 'set_brightness':
      result.message = `已将灯光亮度设置为 ${entities.brightness}%`;
      break;
    case 'activate_scene':
      result.message = '已为您切换到观影模式';
      break;
    case 'shopping':
      result.message = '好的，正在为您查找商品，请告诉我您想买什么？';
      break;
    default:
      result.message = '抱歉，我没有理解您的意思，请再说一次';
  }
  
  return result;
}

function generateResponse(intent, entities, actionResult) {
  if (actionResult?.message) return actionResult.message;
  
  if (!intent) {
    return '抱歉，我没有理解您的指令。您可以说"开灯"、"打开空调"或"看电影"等。';
  }
  
  return '好的，已执行';
}

router.get('/sessions', (req, res) => {
  const sessions = db.prepare('SELECT * FROM voice_sessions ORDER BY updated_at DESC LIMIT 20').all().map(s => ({
    ...s,
    context: JSON.parse(s.context || '{}')
  }));
  
  res.json({ success: true, data: sessions });
});

router.get('/commands/:sessionId', (req, res) => {
  const commands = db.prepare(`
    SELECT * FROM voice_commands 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `).all(req.params.sessionId).map(c => ({
    ...c,
    entities: JSON.parse(c.entities || '{}')
  }));
  
  res.json({ success: true, data: commands });
});

router.get('/history', (req, res) => {
  const { limit = 50 } = req.query;
  const history = db.prepare(`
    SELECT vc.*, vs.user_id
    FROM voice_commands vc
    LEFT JOIN voice_sessions vs ON vc.session_id = vs.id
    ORDER BY vc.timestamp DESC
    LIMIT ?
  `).all(parseInt(limit)).map(c => ({
    ...c,
    entities: JSON.parse(c.entities || '{}')
  }));
  
  res.json({ success: true, data: history });
});

module.exports = router;
