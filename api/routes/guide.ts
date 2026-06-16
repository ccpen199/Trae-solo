import { Router, type Request, type Response } from 'express';
import { mockGuideResponses, mockServices, quickQuestions, type ApiResponse, type GuideResponse, type ChatMessage, type ServiceItem } from '../data/mockData.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

let chatHistory: ChatMessage[] = [];

router.get('/quick-questions', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: quickQuestions,
      message: '获取常见问题成功',
    } as ApiResponse<string[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取常见问题失败',
    } as ApiResponse);
  }
});

router.post('/ask', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question, sessionId } = req.body;
    const userId = req.user?.id || '1';

    if (!question) {
      res.status(400).json({
        success: false,
        message: '问题不能为空',
      } as ApiResponse);
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
      type: 'text',
    };

    chatHistory.push(userMessage);

    let matchedServices: ServiceItem[] = [];
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('社保') || lowerQuestion.includes('社保卡')) {
      matchedServices = mockServices.filter(s => s.category === '社会保障');
    } else if (lowerQuestion.includes('户口') || lowerQuestion.includes('迁移')) {
      matchedServices = mockServices.filter(s => s.id === '2');
    } else if (lowerQuestion.includes('出生') || lowerQuestion.includes('新生儿')) {
      matchedServices = mockServices.filter(s => s.id === '3');
    } else if (lowerQuestion.includes('公积金')) {
      matchedServices = mockServices.filter(s => s.id === '7');
    } else if (lowerQuestion.includes('企业') || lowerQuestion.includes('公司')) {
      matchedServices = mockServices.filter(s => s.id === '5');
    } else if (lowerQuestion.includes('结婚')) {
      matchedServices = mockServices.filter(s => s.id === '8');
    } else if (lowerQuestion.includes('房产') || lowerQuestion.includes('不动产')) {
      matchedServices = mockServices.filter(s => s.id === '4');
    } else {
      matchedServices = mockServices.slice(0, 3);
    }

    const guideResponse: GuideResponse = {
      intent: lowerQuestion,
      matchedServices,
      handlingPath: [
        { step: 1, title: '在线咨询', description: '通过智能导办了解办理流程', department: '政务服务中心', duration: '5分钟' },
        { step: 2, title: '准备材料', description: '按照指引准备相关材料', department: '申请人', duration: '1-3天' },
        { step: 3, title: '在线申报', description: '在线填写表单并提交材料', department: '政务服务中心', duration: '10分钟' },
        { step: 4, title: '审核办理', description: '相关部门审核并办理', department: '各业务部门', duration: '3-5个工作日' },
      ],
      materialList: matchedServices[0]?.requiredMaterials || [],
      estimatedTime: matchedServices[0]?.handlingTime || '3-5个工作日',
    };

    let answer = `根据您的问题"${question}"，为您推荐以下办理方式：\n\n`;
    if (matchedServices.length > 0) {
      answer += `推荐办理事项：${matchedServices.map(s => s.name).join('、')}\n\n`;
      answer += `办理流程：\n`;
      guideResponse.handlingPath.forEach(step => {
        answer += `${step.step}. ${step.title} - ${step.description} (${step.duration})\n`;
      });
      answer += `\n预计办理时间：${guideResponse.estimatedTime}`;
    } else {
      answer += '未找到完全匹配的事项，建议您拨打12345政务服务热线咨询。';
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
      type: 'card',
      data: guideResponse,
    };

    chatHistory.push(assistantMessage);

    res.status(200).json({
      success: true,
      data: {
        answer,
        guide: guideResponse,
        messages: [userMessage, assistantMessage],
      },
      message: '获取导办结果成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '智能导办失败，请稍后重试',
    } as ApiResponse);
  }
});

router.get('/chat-history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: chatHistory.slice(-50),
      message: '获取聊天记录成功',
    } as ApiResponse<ChatMessage[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取聊天记录失败',
    } as ApiResponse);
  }
});

router.delete('/chat-history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    chatHistory = [];
    res.status(200).json({
      success: true,
      message: '清空聊天记录成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清空聊天记录失败',
    } as ApiResponse);
  }
});

router.post('/recommend', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userProfile } = req.body;

    const recommended = mockServices
      .sort((a, b) => b.hotLevel - a.hotLevel)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: recommended,
      message: '获取推荐事项成功',
    } as ApiResponse<ServiceItem[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取推荐事项失败',
    } as ApiResponse);
  }
});

export default router;
