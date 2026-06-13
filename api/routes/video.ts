import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/link-status', (_req: Request, res: Response) => {
  const p2pJitter = Math.round((Math.random() - 0.5) * 8)
  const relayJitter = Math.round((Math.random() - 0.5) * 12)
  res.json({
    p2p: {
      connected: true,
      latency: 45 + p2pJitter,
      bitrate: 2048 + Math.round(Math.random() * 200),
    },
    relay: {
      connected: true,
      latency: 120 + relayJitter,
      bitrate: 1536 + Math.round(Math.random() * 150),
    },
    activeLink: 'p2p',
    resolution: '1080p',
    fps: 15,
    codec: 'H.265',
  })
})

export default router
