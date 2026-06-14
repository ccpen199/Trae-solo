import { Router } from 'express'
import { qaTickets, weatherAlerts } from '../data/mockData.js'

export const knowledgeRouter = Router()

let tickets = [...qaTickets]

knowledgeRouter.get('/qa', (req, res) => {
  let result = tickets
  const { status } = req.query
  if (status) {
    result = result.filter(t => t.status === status)
  }
  res.json(result)
})

knowledgeRouter.get('/qa/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id)
  if (!ticket) {
    return res.status(404).json({ error: '问答工单未找到' })
  }
  res.json(ticket)
})

knowledgeRouter.post('/qa', (req, res) => {
  const newTicket = {
    id: `QA-${String(tickets.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending',
    createDate: new Date().toISOString().split('T')[0]
  }
  tickets.push(newTicket)
  res.status(201).json(newTicket)
})

knowledgeRouter.get('/weather', (_req, res) => {
  res.json(weatherAlerts)
})

knowledgeRouter.post('/diagnose', (_req, res) => {
  res.json({
    ok: true,
    diagnosis: {
      pest: '番茄早疫病',
      confidence: 0.87,
      description: '叶片出现同心轮纹状病斑，边缘黄色晕圈，为典型早疫病症状',
      treatment: '1.及时摘除病叶并销毁；2.喷施多抗霉素或百菌清进行防治；3.加强通风降低湿度',
      severity: 'medium'
    }
  })
})
