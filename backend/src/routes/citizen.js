const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const INTENT_MAP = {
  '预约': 'reservation',
  '办事': 'service',
  '政策': 'policy',
  '企业': 'enterprise',
  '社保': 'social_security',
  '公积金': 'housing_fund',
  '营业执照': 'business_license',
  '补贴': 'subsidy',
  '退税': 'tax_refund',
  '身份证': 'id_card',
  '户口': 'household',
  '不动产': 'real_estate',
  '帮助': 'help',
  '你好': 'greeting',
  'hello': 'greeting',
  'hi': 'greeting'
};

const SERVICE_MAP = {
  '营业执照': 'GS001',
  '公章': 'GS002',
  '税务': 'SW001',
  '社保': 'SB001',
  '公积金': 'GG001',
  '不动产': 'ZJ001'
};

router.post('/chat', auth.optional, (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: '请输入消息' });
  }
  
  const newSessionId = sessionId || uuidv4();
  
  if (!sessionId) {
    db.prepare(`
      INSERT INTO chat_sessions (session_id, user_id, title)
      VALUES (?, ?, ?)
    `).run(newSessionId, req.userId || null, message.substring(0, 30));
  }
  
  db.prepare(`
    INSERT INTO chat_messages (session_id, role, content)
    VALUES (?, ?, ?)
  `).run(newSessionId, 'user', message);
  
  const { intent, relatedService, response } = analyzeMessage(message);
  
  db.prepare(`
    INSERT INTO chat_messages (session_id, role, content, intent, related_service)
    VALUES (?, ?, ?, ?, ?)
  `).run(newSessionId, 'assistant', response, intent, relatedService);
  
  res.json({
    sessionId: newSessionId,
    response,
    intent,
    relatedService,
    suggestions: generateSuggestions(intent, relatedService)
  });
});

function analyzeMessage(message) {
  let intent = 'general';
  let relatedService = null;
  
  for (const [keyword, mappedIntent] of Object.entries(INTENT_MAP)) {
    if (message.includes(keyword)) {
      intent = mappedIntent;
      break;
    }
  }
  
  for (const [keyword, serviceCode] of Object.entries(SERVICE_MAP)) {
    if (message.includes(keyword)) {
      relatedService = serviceCode;
      break;
    }
  }
  
  const responses = {
    greeting: '您好！我是"小浙"智能助手，很高兴为您服务。请问有什么可以帮您的？您可以咨询办事预约、政策查询、企业服务等问题。',
    reservation: '关于预约服务，您可以：\n1. 访问"预约办事"页面选择网点和时段\n2. 每个时段最多可预约5人\n3. 预约成功后请提前15分钟到达现场签到\n\n需要我帮您推荐就近的办事网点吗？',
    service: '我可以帮您查询办事指南。请问您想办理哪方面的业务？\n- 企业登记类\n- 税务服务类\n- 社会保障类\n- 住房公积金类\n- 不动产登记类',
    policy: '政策查询服务：\n1. 您可以在"惠企政策"页面查看所有政策\n2. 绑定企业后可获得精准推送\n3. 支持在线申报和进度跟踪\n\n请问您的企业属于哪个行业？我可以为您推荐相关政策。',
    enterprise: '企业服务包括：\n1. 企业信息管理和组织架构\n2. 法人数字身份绑定\n3. 惠企政策精准推送\n4. 政策兑付在线申报\n\n请先完成企业绑定以使用完整功能。',
    social_security: '社保服务指南：\n- 服务编码：SB001\n- 办理时间：3个工作日\n- 所需材料：营业执照、法人身份证、银行开户许可证\n\n是否需要预约办理？',
    housing_fund: '住房公积金服务指南：\n- 服务编码：GG001\n- 办理时间：3个工作日\n- 所需材料：营业执照、法人身份证\n\n是否需要预约办理？',
    business_license: '营业执照办理指南：\n- 服务编码：GS001\n- 办理时间：3个工作日\n- 所需材料：身份证、公司章程、住所证明\n\n是否需要预约办理？',
    subsidy: '补贴政策查询：\n目前有小微企业纾困补贴、数字化转型资助等政策。\n请先绑定企业，系统将根据您的行业、规模、纳税额精准推送可申报的政策。',
    tax_refund: '退税相关政策：\n1. 高新技术企业税收优惠（减按15%征收）\n2. 研发费用加计扣除（175%加计扣除）\n3. 稳岗返还补贴\n\n请绑定企业查看可申报的政策。',
    help: '小浙助手使用指南：\n- 直接描述您想办理的业务\n- 可以问"怎么办营业执照"、"怎么预约"等\n- 支持政策查询、办事预约、进度跟踪\n\n有任何问题请随时告诉我！',
    general: '抱歉，我没有完全理解您的问题。您可以这样问我：\n- "怎么办营业执照"\n- "怎么预约办事"\n- "有什么补贴政策"\n- "社保怎么办理"\n\n或者选择以下服务：'
  };
  
  return {
    intent,
    relatedService,
    response: responses[intent] || responses.general
  };
}

function generateSuggestions(intent, relatedService) {
  const suggestions = [];
  
  if (intent === 'service' || relatedService) {
    suggestions.push({ text: '立即预约', action: 'reservation' });
    suggestions.push({ text: '查看指南', action: 'guide' });
  }
  if (intent === 'policy') {
    suggestions.push({ text: '查看所有政策', action: 'policies' });
    suggestions.push({ text: '智能匹配', action: 'match' });
  }
  if (intent === 'reservation') {
    suggestions.push({ text: '查找网点', action: 'branches' });
    suggestions.push({ text: '查看我的预约', action: 'my_reservations' });
  }
  
  suggestions.push({ text: '转人工服务', action: 'human' });
  
  return suggestions;
}

router.get('/chat/sessions', auth, (req, res) => {
  const sessions = db.prepare(`
    SELECT * FROM chat_sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.userId);
  
  res.json(sessions);
});

router.get('/chat/sessions/:sessionId', auth, (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM chat_messages
    WHERE session_id = ?
    ORDER BY created_at ASC
  `).all(req.params.sessionId);
  
  res.json(messages);
});

router.get('/city-services', (req, res) => {
  const services = [
    { id: 1, name: '本地政策', icon: 'policy', count: 156 },
    { id: 2, name: '生活地图', icon: 'map', count: 2340 },
    { id: 3, name: '网点查询', icon: 'branch', count: 89 },
    { id: 4, name: '实时公交', icon: 'bus', count: 312 },
    { id: 5, name: '便民缴费', icon: 'payment', count: 28 },
    { id: 6, name: '预约挂号', icon: 'hospital', count: 156 },
    { id: 7, name: '教育服务', icon: 'education', count: 89 },
    { id: 8, name: '法律服务', icon: 'law', count: 45 }
  ];
  
  res.json(services);
});

router.get('/life-map', (req, res) => {
  const { type, keyword } = req.query;
  
  const markers = [
    { id: 1, name: '杭州市民中心', type: 'government', lat: 30.2683, lng: 120.1675, address: '上城区新业路311号', status: 'open' },
    { id: 2, name: '西湖区行政服务中心', type: 'government', lat: 30.2891, lng: 120.0748, address: '西湖区文一西路858号', status: 'open' },
    { id: 3, name: '滨江区行政服务中心', type: 'government', lat: 30.2096, lng: 120.2165, address: '滨江区江南大道100号', status: 'open' },
    { id: 4, name: '杭州大厦', type: 'shopping', lat: 30.2756, lng: 120.1589, address: '拱墅区武林广场1号', status: 'open' },
    { id: 5, name: '西湖景区', type: 'scenic', lat: 30.2430, lng: 120.1446, address: '西湖区', status: 'open' },
    { id: 6, name: '浙一医院', type: 'hospital', lat: 30.2623, lng: 120.1687, address: '上城区庆春东路79号', status: 'busy' },
    { id: 7, name: '杭州火车站', type: 'transport', lat: 30.2389, lng: 120.1886, address: '上城区城站路1号', status: 'busy' },
    { id: 8, name: '钱江新城', type: 'business', lat: 30.2589, lng: 120.2078, address: '上城区钱江新城', status: 'open' }
  ];
  
  let filtered = markers;
  if (type && type !== 'all') {
    filtered = markers.filter(m => m.type === type);
  }
  if (keyword) {
    filtered = filtered.filter(m => m.name.includes(keyword) || m.address.includes(keyword));
  }
  
  res.json(filtered);
});

module.exports = router;
