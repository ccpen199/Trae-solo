import { Request, Response } from 'express';
import { AISummarizeService } from '../services/AISummarizeService.js';
import TicketRepository from '../repositories/TicketRepository.js';
import PostRepository from '../repositories/PostRepository.js';
import MerchantRepository from '../repositories/MerchantRepository.js';

const aiService = new AISummarizeService();
const ticketRepo = new TicketRepository();
const postRepo = new PostRepository();
const merchantRepo = new MerchantRepository();

export const AIController = {
  async summarizeContent(req: Request, res: Response): Promise<void> {
    try {
      const { content, type } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          error: 'Content is required',
        });
        return;
      }

      const summary = aiService.summarize(content, type || 'general');

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Summarize content error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to summarize content',
      });
    }
  },

  async getActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;

      const ticketsResult = ticketRepo.paginate(1, 50);
      const postsResult = postRepo.paginate(1, 50);

      const recentTickets = ticketsResult.items.filter((t: any) => {
        const ticketDate = new Date(t.created_at);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return ticketDate >= cutoff;
      });

      const recentPosts = postsResult.items.filter((p: any) => {
        const postDate = new Date(p.created_at);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return postDate >= cutoff;
      });

      const ticketSummaries = recentTickets.map((t: any) =>
        aiService.summarize(t.description || t.title, 'ticket')
      );

      const postSummaries = recentPosts.map((p: any) =>
        aiService.summarize(p.content || p.title, 'activity')
      );

      const allText = [
        ...recentTickets.map((t: any) => t.title + ' ' + (t.description || '')),
        ...recentPosts.map((p: any) => p.title + ' ' + (p.content || '')),
      ].join(' ');

      const overallSummary = aiService.summarize(allText, 'activity');

      const statusCounts: Record<string, number> = {};
      recentTickets.forEach((t: any) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });

      const categoryCounts: Record<string, number> = {};
      recentPosts.forEach((p: any) => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          period_days: days,
          overall_summary: overallSummary,
          tickets: {
            count: recentTickets.length,
            by_status: statusCounts,
            summaries: ticketSummaries.slice(0, 5),
          },
          posts: {
            count: recentPosts.length,
            by_category: categoryCounts,
            summaries: postSummaries.slice(0, 5),
          },
          key_points: overallSummary.key_points,
        },
      });
    } catch (error) {
      console.error('Get activity summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get activity summary',
      });
    }
  },

  async getTicketProgressSummary(req: Request, res: Response): Promise<void> {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = ticketRepo.findById(ticketId);

      if (!ticket) {
        res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
        return;
      }

      const timeline = [];
      timeline.push({
        time: ticket.created_at,
        event: '工单创建',
        description: `用户提交了"${ticket.title}"工单`,
      });

      if (ticket.assignee_id) {
        timeline.push({
          time: ticket.created_at,
          event: '工单分派',
          description: `工单已分派给维修人员处理`,
        });
      }

      if (ticket.started_at) {
        timeline.push({
          time: ticket.started_at,
          event: '开始处理',
          description: '维修人员已开始现场处理',
        });
      }

      if (ticket.completed_at) {
        timeline.push({
          time: ticket.completed_at,
          event: '处理完成',
          description: ticket.feedback || '工单已处理完成',
        });
      }

      const progressText = timeline.map((t) => `${t.event}: ${t.description}`).join('。');
      const summary = aiService.summarize(progressText, 'ticket');

      const statusMap: Record<string, string> = {
        pending: '待处理',
        assigned: '已分派',
        processing: '处理中',
        completed: '已完成',
        cancelled: '已取消',
      };

      const priorityMap: Record<string, string> = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急',
      };

      res.json({
        success: true,
        data: {
          ticket_id: ticketId,
          title: ticket.title,
          status: statusMap[ticket.status] || ticket.status,
          priority: priorityMap[ticket.priority] || ticket.priority,
          progress_summary: summary,
          timeline,
          estimated_completion: ticket.scheduled_at || null,
          current_step: timeline.length,
          total_steps: 4,
        },
      });
    } catch (error) {
      console.error('Get ticket progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get ticket progress summary',
      });
    }
  },

  async getCommunityHighlights(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 3;

      const postsResult = postRepo.paginate(1, 100);
      const recentPosts = postsResult.items.filter((p: any) => {
        const postDate = new Date(p.created_at);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return postDate >= cutoff && p.status === 'published';
      });

      const sortedPosts = [...recentPosts].sort(
        (a: any, b: any) => (b.views || 0) + (b.likes_count || 0) - ((a.views || 0) + (a.likes_count || 0))
      );

      const topPosts = sortedPosts.slice(0, 10);
      const summaries = topPosts.map((p: any) => ({
        post_id: p.id,
        title: p.title,
        summary: aiService.summarize(p.content || p.title, 'activity').summary,
        views: p.views || 0,
        category: p.category,
        created_at: p.created_at,
      }));

      const allText = topPosts.map((p: any) => p.title + ' ' + (p.content || '')).join(' ');
      const hotTopics = aiService.extractKeywords(allText, 8);

      const categoryMap: Record<string, string> = {
        notice: '公告通知',
        activity: '社区活动',
        news: '邻里动态',
        help: '互助求助',
      };

      const categoryCounts: Record<string, number> = {};
      recentPosts.forEach((p: any) => {
        const cat = categoryMap[p.category] || p.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          period_days: days,
          total_posts: recentPosts.length,
          hot_topics: hotTopics,
          category_distribution: categoryCounts,
          top_posts: summaries,
        },
      });
    } catch (error) {
      console.error('Get community highlights error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get community highlights',
      });
    }
  },

  async getSmartReply(req: Request, res: Response): Promise<void> {
    try {
      const { message, context } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          error: 'Message is required',
        });
        return;
      }

      const reply = aiService.generateReply(message, context);

      res.json({
        success: true,
        data: {
          reply,
          suggestions: [
            '感谢您的反馈，我们会尽快处理。',
            '已收到您的消息，请耐心等待回复。',
            '如需紧急帮助，请拨打物业服务热线。',
          ],
        },
      });
    } catch (error) {
      console.error('Get smart reply error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get smart reply',
      });
    }
  },
};

export default AIController;
