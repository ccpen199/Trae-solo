import { Router, type Request, type Response } from 'express';
import type {
  ContractTemplate,
  Contract,
  SignRecord,
  FilingStatus,
  Dispute,
  DisputeMessage,
} from '../../shared/types.js';
import {
  mockContractTemplates,
  mockContracts,
  mockSignRecords,
  mockDisputes,
  mockCompanies,
} from '../mock/data.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateBlockchainHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

router.get('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry } = req.query;
    let templates = [...mockContractTemplates];
    if (industry && typeof industry === 'string') {
      templates = templates.filter(t => t.industry === industry);
    }
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取合同模板列表失败' });
  }
});

router.get('/templates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const template = mockContractTemplates.find(t => t.id === id);
    if (!template) {
      res.status(404).json({ success: false, error: '模板不存在' });
      return;
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取合同模板详情失败' });
  }
});

router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId, companyId, userId, companyName, userName, customFields } = req.body as {
      templateId: string;
      companyId: string;
      userId: string;
      companyName?: string;
      userName?: string;
      customFields?: Record<string, string>;
    };
    const template = mockContractTemplates.find(t => t.id === templateId);
    if (!template) {
      res.status(404).json({ success: false, error: '模板不存在' });
      return;
    }
    const company = mockCompanies.find(c => c.id === companyId);
    const newContract: Contract = {
      id: generateId('contract'),
      companyId,
      userId,
      templateId,
      templateName: template.name,
      content: template.content,
      status: 'draft',
      filingStatus: 'not_filed',
      createdAt: new Date().toISOString(),
      companyName: companyName ?? company?.name,
      userName,
    };
    mockContracts.push(newContract);
    res.status(201).json({ success: true, data: newContract, message: '合同已生成' });
  } catch (error) {
    res.status(500).json({ success: false, error: '生成合同失败' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contract = mockContracts.find(c => c.id === id);
    if (!contract) {
      res.status(404).json({ success: false, error: '合同不存在' });
      return;
    }
    const signRecords = mockSignRecords.filter(s => s.contractId === id);
    res.status(200).json({ success: true, data: { contract, signRecords } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取合同详情失败' });
  }
});

router.post('/:id/sign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { signerRole, signerName, signature } = req.body as {
      signerRole: 'employer' | 'jobseeker';
      signerName: string;
      signature: string;
    };
    const contractIndex = mockContracts.findIndex(c => c.id === id);
    if (contractIndex === -1) {
      res.status(404).json({ success: false, error: '合同不存在' });
      return;
    }
    const newSignRecord: SignRecord = {
      id: generateId('sign'),
      contractId: id,
      signerRole,
      signerName,
      signature,
      blockchainHash: generateBlockchainHash(),
      signedAt: new Date().toISOString(),
    };
    mockSignRecords.push(newSignRecord);
    const existingSigns = mockSignRecords.filter(s => s.contractId === id);
    if (existingSigns.length >= 2) {
      mockContracts[contractIndex].status = 'signed';
      mockContracts[contractIndex].signedAt = new Date().toISOString();
    } else if (mockContracts[contractIndex].status === 'draft') {
      mockContracts[contractIndex].status = 'pending_sign';
    }
    res.status(200).json({
      success: true,
      data: {
        contract: mockContracts[contractIndex],
        signRecord: newSignRecord,
      },
      message: '签署成功',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '签署合同失败' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, userId, companyId } = req.query;
    let contracts = [...mockContracts];
    if (role === 'employer' && companyId && typeof companyId === 'string') {
      contracts = contracts.filter(c => c.companyId === companyId);
    } else if (role === 'jobseeker' && userId && typeof userId === 'string') {
      contracts = contracts.filter(c => c.userId === userId);
    }
    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取合同列表失败' });
  }
});

router.get('/:id/filing', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contractIndex = mockContracts.findIndex(c => c.id === id);
    if (contractIndex === -1) {
      res.status(404).json({ success: false, error: '合同不存在' });
      return;
    }
    const currentStatus = mockContracts[contractIndex].filingStatus;
    if (currentStatus === 'not_filed') {
      mockContracts[contractIndex].filingStatus = 'filing';
      mockContracts[contractIndex].filingAt = new Date().toISOString();
      setTimeout(() => {
        const idx = mockContracts.findIndex(c => c.id === id);
        if (idx !== -1 && mockContracts[idx].filingStatus === 'filing') {
          mockContracts[idx].filingStatus = Math.random() > 0.1 ? 'filed' : 'failed';
        }
      }, 2000);
    }
    res.status(200).json({
      success: true,
      data: {
        filingStatus: mockContracts[contractIndex].filingStatus,
        filingAt: mockContracts[contractIndex].filingAt,
        blockchainHash: mockContracts[contractIndex].filingStatus === 'filed'
          ? generateBlockchainHash()
          : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取备案状态失败' });
  }
});

router.post('/dispute', async (req: Request, res: Response): Promise<void> => {
  try {
    const disputeData = req.body as Omit<Dispute, 'id' | 'status' | 'createdAt' | 'messages'>;
    const newDispute: Dispute = {
      ...disputeData,
      id: generateId('disp'),
      status: 'submitted',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    mockDisputes.push(newDispute);
    res.status(201).json({ success: true, data: newDispute, message: '争议已提交' });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交争议失败' });
  }
});

router.get('/dispute', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, contractId } = req.query;
    let disputes = [...mockDisputes];
    if (status && typeof status === 'string') {
      disputes = disputes.filter(d => d.status === status);
    }
    if (contractId && typeof contractId === 'string') {
      disputes = disputes.filter(d => d.contractId === contractId);
    }
    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取争议列表失败' });
  }
});

router.get('/dispute/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dispute = mockDisputes.find(d => d.id === id);
    if (!dispute) {
      res.status(404).json({ success: false, error: '争议不存在' });
      return;
    }
    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取争议详情失败' });
  }
});

router.post('/dispute/:id/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { senderRole, senderName, content } = req.body as {
      senderRole: 'employer' | 'jobseeker' | 'mediator';
      senderName: string;
      content: string;
    };
    const disputeIndex = mockDisputes.findIndex(d => d.id === id);
    if (disputeIndex === -1) {
      res.status(404).json({ success: false, error: '争议不存在' });
      return;
    }
    const newMessage: DisputeMessage = {
      id: generateId('msg'),
      senderRole,
      senderName,
      content,
      createdAt: new Date().toISOString(),
    };
    if (!mockDisputes[disputeIndex].messages) {
      mockDisputes[disputeIndex].messages = [];
    }
    mockDisputes[disputeIndex].messages!.push(newMessage);
    if (mockDisputes[disputeIndex].status === 'submitted') {
      mockDisputes[disputeIndex].status = 'mediating';
    }
    res.status(200).json({ success: true, data: mockDisputes[disputeIndex], message: '消息已发送' });
  } catch (error) {
    res.status(500).json({ success: false, error: '发送消息失败' });
  }
});

export default router;
