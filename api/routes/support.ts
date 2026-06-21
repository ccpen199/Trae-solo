import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse, generateId, detectIntent } from '../utils';
import { mockTickets, policyDocuments } from '../../shared/mockData';
import type { Ticket, ChatMessage, TicketStatus, TicketIntent, TicketPriority } from '../../shared/types';

const router = Router();

let tickets = [...mockTickets];

router.get('/', (req: Request, res: Response) => {
  const { userId, status, intent, priority, page = 1, pageSize = 10 } = req.query;
  let filtered = [...tickets];
  if (userId) filtered = filtered.filter(t => t.userId === userId);
  if (status) filtered = filtered.filter(t => t.status === status);
  if (intent) filtered = filtered.filter(t => t.intent === intent);
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
    stats: {
      NEW: tickets.filter(t => t.status === 'NEW').length,
      AI_PROCESSING: tickets.filter(t => t.status === 'AI_PROCESSING').length,
      PENDING_AGENT: tickets.filter(t => t.status === 'PENDING_AGENT').length,
      PROCESSING: tickets.filter(t => t.status === 'PROCESSING').length,
      RESOLVED: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'AI_RESOLVED').length,
      CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
    },
  }));
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = tickets.find(t => t.id === id || t.ticketNo === id);
  if (!ticket) return res.json(sendResponse(null, '工单不存在', 404));
  res.json(sendResponse(ticket));
});

router.post('/ai/intent', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.json(sendResponse(null, '文本不能为空', 400));
  const { intent, confidence } = detectIntent(text);
  const relatedPolicies = policyDocuments
    .filter(p => {
      const lower = text.toLowerCase();
      return p.title.toLowerCase().includes(lower.slice(0, 4)) ||
        p.tags.some(t => lower.includes(t.toLowerCase()));
    })
    .slice(0, 3)
    .map(p => ({ id: p.id, title: p.title, cityName: p.cityName }));
  setTimeout(() => {
    res.json(sendResponse({
      intent: intent as TicketIntent,
      confidence: Number(confidence.toFixed(2)),
      relatedPolicies,
      suggestedReply: generateAISuggestion(intent as TicketIntent),
    }));
  }, 400);
});

function generateAISuggestion(intent: TicketIntent): string {
  const map: Record<TicketIntent, string> = {
    PAYMENT_INTERRUPT: '您好！AI助手识别到您可能遇到社保断缴问题。断缴会影响：1）养老累计缴纳年限；2）医保报销资格（断缴次月起无法报销）；3）购房/购车/落户资格。您可立即发起补缴，最多支持补缴最近24个月。',
    TRANSFER: '您好！识别到您想办理社保转移接续。转移支持养老和医保，流程：1）在转入地发起申请；2）转出地开具参保凭证；3）两地社保局对接（约15-45工作日）。全程可在线办理。',
    PENSION_CALCULATE: '您好！退休金 = 基础养老金 + 个人账户养老金。基础养老金与退休时社平工资、缴费年限、缴费指数挂钩；个人账户 = 账户余额/计发月数。建议使用"养老金测算器"获取详细结果。',
    REIMBURSEMENT: '您好！医保报销需满足：1）在保状态；2）定点医院；3）符合医保目录。报销比例：在职职工门诊约70%-90%，住院约85%-97%，具体依医院等级和费用分段而定。',
    BASE_QUESTION: '您好！缴费基数每年调整一次（通常7月），范围为社平工资的60%-300%。个人无法随意变更基数，需由单位申报或通过本平台基数调整通道申请。',
    POLICY_CONSULT: '您好！您咨询的政策问题已匹配相关法规文件，建议查看右侧关联政策原文。如需更详细解答可转人工客服。',
    REFUND: '您好！退费支持：多缴/错缴可申请退费，需提供缴费凭证和原因说明，审核周期约5-10工作日。注意：正常缴费部分一般不予退回（除法定情形外）。',
    OTHER: '您好！我是AI智能助手，已记录您的问题。若无法解决，点击"转人工"将分配专业客服为您服务。',
  };
  return map[intent] || map.OTHER;
}

router.post('/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, role = 'USER' } = req.body;
  if (!content) return res.json(sendResponse(null, '消息内容不能为空', 400));
  const idx = tickets.findIndex(t => t.id === id);
  if (idx < 0) return res.json(sendResponse(null, '工单不存在', 404));
  const now = new Date().toISOString();
  const userMsg: ChatMessage = {
    id: generateId('M'),
    role: role as ChatMessage['role'],
    content,
    timestamp: now,
  };
  tickets[idx].messages.push(userMsg);
  if (role === 'USER' && tickets[idx].status === 'NEW') {
    tickets[idx].status = 'AI_PROCESSING';
  }
  tickets[idx].updatedAt = now;
  const { intent: aiIntent } = detectIntent(content);
  const relatedPolicies = policyDocuments
    .filter(p => content.includes(p.category) || p.tags.some(t => content.includes(t)))
    .slice(0, 2)
    .map(p => p.id);
  const aiMsg: ChatMessage = {
    id: generateId('M'),
    role: 'AI',
    content: generateAISuggestion(aiIntent as TicketIntent),
    timestamp: new Date(Date.now() + 500).toISOString(),
    relatedPolicyIds: relatedPolicies.length ? relatedPolicies : undefined,
  };
  tickets[idx].messages.push(aiMsg);
  if (aiIntent === 'OTHER') {
    tickets[idx].status = 'PENDING_AGENT';
  }
  res.json(sendResponse({ userMessage: userMsg, aiMessage: aiMsg, ticketStatus: tickets[idx].status }));
});

router.post('/', (req: Request, res: Response) => {
  const { userId, subject, content, cityCode, priority } = req.body;
  if (!userId || !subject || !content) {
    return res.json(sendResponse(null, '参数不完整', 400));
  }
  const { intent, confidence } = detectIntent(subject + ' ' + content);
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const firstMsg: ChatMessage = {
    id: generateId('M'),
    role: 'USER',
    content,
    timestamp: now,
  };
  const { intent: aiIntent } = detectIntent(content);
  const relatedPolicies = policyDocuments
    .filter(p => content.includes(p.category) || p.tags.some(t => content.includes(t)))
    .slice(0, 2)
    .map(p => p.id);
  const aiMsg: ChatMessage = {
    id: generateId('M'),
    role: 'AI',
    content: generateAISuggestion(aiIntent as TicketIntent),
    timestamp: new Date(Date.now() + 500).toISOString(),
    relatedPolicyIds: relatedPolicies.length ? relatedPolicies : undefined,
  };
  const autoPriority: TicketPriority =
    (priority as TicketPriority) ||
    (['PAYMENT_INTERRUPT', 'REFUND'].includes(intent as string) ? 'HIGH' :
      ['TRANSFER', 'REIMBURSEMENT'].includes(intent as string) ? 'MEDIUM' : 'LOW');
  const newTicket: Ticket = {
    id: generateId('TK'),
    ticketNo: `GD${dateStr}${Math.floor(100 + Math.random() * 900)}`,
    userId,
    subject,
    intent: intent as TicketIntent,
    confidence: Number(confidence.toFixed(2)),
    priority: autoPriority,
    status: 'AI_PROCESSING',
    cityCode: cityCode as CityCode | undefined,
    messages: [firstMsg, aiMsg],
    createdAt: now,
    updatedAt: now,
  };
  tickets.unshift(newTicket);
  res.json(sendResponse(newTicket));
});

export default router;
