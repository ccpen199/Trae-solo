import express from 'express';
import prisma from '../utils/prisma';
import { auth, AuthRequest, requireRole } from '../middleware/auth';
import { calculateHotScore } from '../utils/lbs';
import { parseJson } from '../utils/json';

const parsePostImages = (post: any) => {
  if (!post) return post;
  return {
    ...post,
    images: parseJson<string[]>(post.images, []),
  };
};

const parseAuditLog = (log: any) => {
  if (!log) return log;
  return {
    ...log,
    matchedKeywords: parseJson<string[]>(log.matchedKeywords, []),
  };
};

const parsePostWithAudit = (p: any) => ({
  ...parsePostImages(p),
  auditLogs: p.auditLogs ? p.auditLogs.map(parseAuditLog) : [],
});

const router = express.Router();

router.get('/audit/pending', auth, requireRole('ADMIN', 'MODERATOR'), async (req: AuthRequest, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phone: true } },
        merchant: { select: { id: true, businessName: true } },
        topics: { include: { topic: true } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: [{ isPitfall: 'desc' }, { createdAt: 'asc' }],
    });

    const enriched = posts.map(p => {
      const parsed = parsePostWithAudit(p);
      const latestLog = parsed.auditLogs[0];
      return {
        ...parsed,
        aiRiskLevel: latestLog?.riskLevel || null,
        aiRiskScore: latestLog?.aiScore || 0,
        aiMatchedKeywords: latestLog?.matchedKeywords || [],
        interactionCount: parsed._count.likes + parsed._count.comments,
      };
    });

    const levelGroups: Record<string, number> = {};
    enriched.forEach(p => {
      const lvl = p.aiRiskLevel || 'NONE';
      levelGroups[lvl] = (levelGroups[lvl] || 0) + 1;
    });

    res.json({ posts: enriched, levelGroups });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/audit/:id/approve', auth, requireRole('ADMIN', 'MODERATOR'), async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });

    await prisma.auditLog.create({
      data: {
        postId: req.params.id,
        auditorId: req.userId!,
        action: 'MANUAL_APPROVE',
        reason: req.body.reason || req.body.note || '人工审核通过',
        riskLevel: 'LOW',
      },
    });

    res.json({ post: parsePostImages(post) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/audit/:id/reject', auth, requireRole('ADMIN', 'MODERATOR'), async (req: AuthRequest, res) => {
  try {
    const { reason, isRumor } = req.body;

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        isPitfall: isRumor === true ? true : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        postId: req.params.id,
        auditorId: req.userId!,
        action: isRumor ? 'RUMOR_FLAG' : 'MANUAL_REJECT',
        reason: reason || (isRumor ? '标记为谣言' : '人工审核拒绝'),
        riskLevel: isRumor ? 'HIGH' : 'MEDIUM',
      },
    });

    res.json({ post: parsePostImages(post) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit/trace/:id', auth, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { postId: req.params.id },
      include: { auditor: { select: { id: true, nickname: true, role: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, title: true, content: true, images: true,
        isPitfall: true, status: true,
        user: { select: { id: true, nickname: true, phone: true, avatar: true } },
      },
    });

    res.json({
      logs: logs.map(parseAuditLog),
      post: parsePostImages(post),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/merchant/analytics/:merchantId', auth, requireRole('ADMIN', 'MERCHANT'), async (req, res) => {
  try {
    const merchantId = req.params.merchantId;

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return res.status(404).json({ error: '商户不存在' });

    const coupons = await prisma.coupon.findMany({ where: { merchantId } });
    const couponIds = coupons.map(c => c.id);
    const userCoupons = await prisma.userCoupon.findMany({ where: { couponId: { in: couponIds } } });

    const posts = await prisma.post.findMany({
      where: { merchantId, status: 'APPROVED', type: 'REVIEW' },
      include: { _count: { select: { likes: true, comments: true } } },
    });

    const totalCoupons = coupons.length;
    const totalClaimed = userCoupons.length;
    const totalRedeemed = userCoupons.filter(uc => uc.usedAt).length;

    const claimRate = totalCoupons > 0 ? totalClaimed / (totalCoupons * (coupons[0]?.totalQuantity || 1)) : 0;
    const redeemRate = totalClaimed > 0 ? totalRedeemed / totalClaimed : 0;

    const couponAnalytics = coupons.map(c => {
      const claims = userCoupons.filter(uc => uc.couponId === c.id);
      return {
        id: c.id,
        title: c.title,
        totalCount: c.totalQuantity,
        claimedCount: claims.length,
        redeemedCount: claims.filter(x => x.usedAt).length,
        claimRate: c.totalQuantity > 0 ? claims.length / c.totalQuantity : 0,
        redeemRate: claims.length > 0 ? claims.filter(x => x.usedAt).length / claims.length : 0,
      };
    });

    const postAnalytics = posts.map(p => {
      const views = p.viewCount || 0;
      const likes = (p as any)._count.likes || 0;
      const comments = (p as any)._count.comments || 0;
      const shares = p.shareCount || 0;
      return {
        id: p.id,
        title: p.title,
        authorId: p.userId,
        createdAt: p.createdAt,
        hasReceipt: p.hasProof,
        hasProof: p.hasProof,
        isPitfall: p.isPitfall,
        views, likes, comments, shares,
        interactionRate: views > 0 ? (likes + comments + shares) / views : 0,
      };
    });

    const totalViews = postAnalytics.reduce((s, p) => s + p.views, 0);
    const totalLikes = postAnalytics.reduce((s, p) => s + p.likes, 0);
    const totalComments = postAnalytics.reduce((s, p) => s + p.comments, 0);
    const totalShares = postAnalytics.reduce((s, p) => s + p.shares, 0);

    res.json({
      merchant: parsePostImages(merchant),
      kpis: {
        totalCoupons,
        totalClaimed,
        totalRedeemed,
        claimRate,
        redeemRate,
        reviewCount: posts.length,
        avgLikes: posts.length > 0 ? totalLikes / posts.length : 0,
        engagementBreakdown: {
          views: totalViews,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        },
      },
      couponAnalytics,
      postAnalytics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard/overview', auth, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalMerchants = await prisma.merchant.count({ where: { status: 'APPROVED' } });
    const totalPosts = await prisma.post.count();
    const pendingAudit = await prisma.post.count({ where: { status: 'PENDING' } });
    const auditPassRate = (await prisma.post.count({ where: { status: 'APPROVED' } })) / Math.max(1, totalPosts);
    const emergencyHelps = await prisma.helpRequest.count({
      where: { type: 'EMERGENCY', status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = await prisma.post.count({ where: { createdAt: { gte: today } } });

    const trend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = await prisma.post.count({ where: { createdAt: { gte: d, lt: next } } });
      trend.push({ date: `${d.getMonth() + 1}-${d.getDate()}`, count });
    }

    const statusStats = {
      approved: await prisma.post.count({ where: { status: 'APPROVED' } }),
      pending: pendingAudit,
      rejected: await prisma.post.count({ where: { status: 'REJECTED' } }),
    };

    const riskPosts = await prisma.post.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { isPitfall: 'desc' },
      take: 5,
    });

    const hotTopics = await prisma.topic.findMany({
      orderBy: [{ postCount: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });

    res.json({
      stats: {
        userCount: totalUsers,
        merchantCount: totalMerchants,
        postCount: totalPosts,
        todayPosts,
        emergencyRequests: emergencyHelps,
        approvalRate: auditPassRate * 100,
        approvedCount: statusStats.approved,
        pendingCount: statusStats.pending,
        rejectedCount: statusStats.rejected,
      },
      trendData: trend,
      hotTopics: hotTopics.map(t => ({
        ...t,
        heatScore: t.postCount * 10 + Math.floor(Math.random() * 50),
      })),
      riskPosts: riskPosts.map(r => parsePostWithAudit(r)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard/hotspots', auth, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const posts7d = await prisma.post.findMany({
      where: { status: 'APPROVED' },
      include: { topics: { include: { topic: true } }, _count: { select: { likes: true, comments: true } } },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });

    const colors = ['#2563eb', '#16a34a', '#f97316', '#db2777', '#7c3aed', '#0891b2'];
    const topicMap: Record<string, { name: string; color: string; posts: any[]; totalScore: number }> = {};

    posts7d.forEach(p => {
      const hotScore = calculateHotScore(
        (p as any)._count.likes,
        (p as any)._count.comments,
        p.shareCount || 0,
        p.viewCount || 0,
        p.createdAt
      );
      p.topics?.forEach(t => {
        if (!topicMap[t.topicId]) {
          const color = colors[Object.keys(topicMap).length % colors.length];
          topicMap[t.topicId] = { name: t.topic.name, color, posts: [], totalScore: 0 };
        }
        topicMap[t.topicId].posts.push(p);
        topicMap[t.topicId].totalScore += hotScore;
      });
    });

    const topicClusters = Object.entries(topicMap).map(([id, info]) => {
      const topPosts = info.posts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3)
        .map(parsePostImages);
      const level = info.totalScore > 500 ? 'FIRE' : info.totalScore > 100 ? 'STAR' : 'NORMAL';
      return {
        id,
        topic: info.name,
        color: info.color,
        postCount: info.posts.length,
        heatScore: info.totalScore,
        level,
        topPosts,
      };
    }).sort((a, b) => b.heatScore - a.heatScore).slice(0, 10);

    const risks = await prisma.auditLog.findMany({
      where: {
        riskLevel: { in: ['HIGH', 'CRITICAL'] },
        post: { status: 'PENDING' },
      },
      include: {
        auditor: { select: { id: true, nickname: true, avatar: true } },
        post: { include: { user: { select: { id: true, nickname: true, avatar: true, phone: true } } } },
      },
      orderBy: { aiScore: 'desc' },
      take: 10,
    });

    res.json({
      topicClusters,
      risks: risks.map(r => ({
        ...parseAuditLog(r),
        post: r.post ? parsePostImages(r.post) : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/merchants/list', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const merchants = await prisma.merchant.findMany({
      include: { user: { select: { id: true, nickname: true, phone: true } } },
      orderBy: { status: 'asc' },
      take: 100,
    });
    res.json({ merchants: merchants.map(parsePostImages) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/merchant-efficiency', auth, requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        coupons: true,
      },
      where: { status: 'APPROVED' },
      take: 50,
    });

    const result = await Promise.all(
      merchants.map(async (m) => {
        const coupons = m.coupons || [];
        const couponIds = coupons.map(c => c.id);
        const userCoupons = couponIds.length > 0 ? await prisma.userCoupon.findMany({
          where: { couponId: { in: couponIds } },
        }) : [];

        const posts = await prisma.post.findMany({
          where: { merchantId: m.id, status: 'APPROVED', type: 'REVIEW' },
          include: { _count: { select: { likes: true, comments: true } } },
        });

        const totalCoupons = coupons.length;
        const totalCouponQuantity = coupons.reduce((s: number, c: any) => s + (c.totalQuantity || 0), 0);
        const totalClaimed = userCoupons.length;
        const totalRedeemed = userCoupons.filter(uc => (uc as any).usedAt).length;

        const claimRate = totalCouponQuantity > 0 ? totalClaimed / totalCouponQuantity : 0;
        const redeemRate = totalClaimed > 0 ? totalRedeemed / totalClaimed : 0;

        const totalViews = posts.reduce((s: number, p: any) => s + (p.viewCount || 0), 0);
        const totalLikes = posts.reduce((s: number, p: any) => s + (p._count?.likes || 0), 0);
        const totalComments = posts.reduce((s: number, p: any) => s + (p._count?.comments || 0), 0);
        const totalShares = posts.reduce((s: number, p: any) => s + (p.shareCount || 0), 0);

        const conversionPath = {
          postViews: totalViews,
          postClicks: Math.floor(totalViews * 0.6),
          couponClaims: totalClaimed,
          couponRedeems: totalRedeemed,
          viewToClaimRate: totalViews > 0 ? totalClaimed / totalViews : 0,
          claimToRedeemRate: totalClaimed > 0 ? totalRedeemed / totalClaimed : 0,
        };

        return {
          id: m.id,
          businessName: m.businessName,
          category: m.category,
          licenseVerified: m.licenseVerified,
          rating: m.rating,
          reviewCount: m.reviewCount,
          address: m.address,
          status: m.status,
          stats: {
            totalCoupons,
            totalClaimed,
            totalRedeemed,
            claimRate: Math.round(claimRate * 100),
            redeemRate: Math.round(redeemRate * 100),
            reviewCount: posts.length,
            avgLikes: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
            engagement: {
              views: totalViews,
              likes: totalLikes,
              comments: totalComments,
              shares: totalShares,
            },
            conversionPath,
          },
        };
      })
    );

    const sorted = result.sort((a: any, b: any) =>
      (b.stats.redeemRate * 1000 + b.stats.claimRate * 100) -
      (a.stats.redeemRate * 1000 + a.stats.claimRate * 100)
    );

    res.json({
      merchants: sorted,
      summary: {
        totalMerchants: sorted.length,
        avgRedeemRate: sorted.length > 0
          ? Math.round(sorted.reduce((s: number, m: any) => s + m.stats.redeemRate, 0) / sorted.length)
          : 0,
        avgClaimRate: sorted.length > 0
          ? Math.round(sorted.reduce((s: number, m: any) => s + m.stats.claimRate, 0) / sorted.length)
          : 0,
        totalCouponClaims: sorted.reduce((s: number, m: any) => s + m.stats.totalClaimed, 0),
        totalCouponRedeems: sorted.reduce((s: number, m: any) => s + m.stats.totalRedeemed, 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
