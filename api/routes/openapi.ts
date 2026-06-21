import { Router, type Request, type Response } from 'express'
import * as certificateService from '../services/certificateService.js'
import * as valuationService from '../services/valuationService.js'
import * as knowledgeService from '../services/knowledgeService.js'
import * as expertService from '../services/expertService.js'

const router = Router()

router.get('/health', (req: Request, res: Response): void => {
  res.json({
    success: true,
    service: '文玩艺术品鉴定平台 OpenAPI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

router.get('/certificate/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const certificateNo = req.query.certificateNo as string | undefined
    const id = req.query.id as string | undefined
    if (!certificateNo && !id) {
      res.status(400).json({ success: false, error: 'certificateNo or id is required' })
      return
    }
    const result = certificateService.verifyCertificate(certificateNo || '', id)
    res.json({
      success: true,
      valid: result.valid,
      message: result.message,
      certificate: result.certificate ? {
        id: result.certificate.id,
        certificate_no: result.certificate.certificate_no,
        category: result.certificate.category,
        conclusion: result.certificate.conclusion,
        valuation: result.certificate.valuation,
        status: result.certificate.status,
        issued_at: result.certificate.issued_at,
        blockchain_tx: result.certificate.blockchain_tx,
        artwork_title: result.certificate.artwork_title,
        expert_name: result.certificate.expert_name,
      } : null,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Verification failed' })
  }
})

router.get('/experts', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string | undefined
    const result = expertService.getApprovedExperts(page, pageSize, category)
    res.json({
      success: true,
      data: result.list.map(e => ({
        id: e.id,
        name: e.name,
        title: e.title,
        category: e.category,
        years_of_experience: e.years_of_experience,
        bio: e.bio,
        rating: e.rating,
        appraisal_count: e.appraisal_count,
        price_per_appraisal: e.price_per_appraisal,
      })),
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get experts' })
  }
})

router.get('/knowledge/articles', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string | undefined
    const result = knowledgeService.getArticles(page, pageSize, category)
    res.json({
      success: true,
      data: result.list.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        summary: a.summary,
        cover_image: a.cover_image,
        author: a.author,
        views: a.views,
        likes: a.likes,
        tags: a.tags ? JSON.parse(a.tags) : [],
        created_at: a.created_at,
      })),
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get articles' })
  }
})

router.get('/knowledge/articles/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const article = knowledgeService.getArticleById(req.params.id)
    if (!article) {
      res.status(404).json({ success: false, error: 'Article not found' })
      return
    }
    res.json({
      success: true,
      data: {
        id: article.id,
        title: article.title,
        category: article.category,
        summary: article.summary,
        content: article.content,
        cover_image: article.cover_image,
        author: article.author,
        views: article.views,
        likes: article.likes,
        tags: article.tags ? JSON.parse(article.tags) : [],
        created_at: article.created_at,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get article' })
  }
})

router.get('/market/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = valuationService.getMarketStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get market stats' })
  }
})

router.get('/valuation/historical', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined
    const data = valuationService.getHistoricalPrices(category)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get historical prices' })
  }
})

export default router
