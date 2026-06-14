import { Router } from 'express'
import { contracts } from '../data/mockData.js'

export const contractRouter = Router()

let contractList = [...contracts]

contractRouter.get('/', (req, res) => {
  let result = contractList
  const { status } = req.query
  if (status) {
    result = result.filter(c => c.status === status)
  }
  res.json(result)
})

contractRouter.get('/:id', (req, res) => {
  const contract = contractList.find(c => c.id === req.params.id)
  if (!contract) {
    return res.status(404).json({ error: '合同未找到' })
  }
  res.json(contract)
})

contractRouter.post('/:id/sign', (req, res) => {
  const contract = contractList.find(c => c.id === req.params.id)
  if (!contract) {
    return res.status(404).json({ error: '合同未找到' })
  }
  contract.status = 'signed'
  contract.signDate = new Date().toISOString().split('T')[0]
  res.json({ ok: true, contract })
})
