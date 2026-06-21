import { Router, type Request, type Response } from 'express';
import { successResponse, paginationResult, mockWorkCases, mockTasks, mockUser } from '../mock/data.js';
import { generateId } from '../../src/utils/format.js';

const router = Router();

router.get('/cases', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20, keyword, status, priority } = req.query;
  
  let result = [...mockWorkCases];
  
  if (keyword) {
    result = result.filter(c => 
      c.title.includes(keyword as string) || 
      c.clientName.includes(keyword as string)
    );
  }
  
  if (status) {
    result = result.filter(c => c.status === status);
  }
  
  if (priority) {
    result = result.filter(c => c.priority === priority);
  }
  
  const pageResult = paginationResult(result, Number(page), Number(pageSize));
  res.json(successResponse(pageResult));
});

router.get('/cases/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const workCase = mockWorkCases.find(c => c.id === id) || mockWorkCases[0];
  res.json(successResponse(workCase));
});

router.post('/cases', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const newCase = {
    ...mockWorkCases[0],
    id: `wc-${generateId()}`,
    ...data,
    leadLawyerId: mockUser.id,
    leadLawyerName: mockUser.name,
    teamMembers: [
      {
        id: `tm-${generateId()}`,
        userId: mockUser.id,
        name: mockUser.name,
        avatar: mockUser.avatar,
        role: 'lead' as const,
        joinedAt: new Date().toISOString(),
      },
    ],
    nodes: [],
    evidence: [],
    createdAt: new Date().toISOString(),
  };
  res.json(successResponse(newCase, '案件已创建'));
});

router.put('/cases/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = req.body;
  const workCase = mockWorkCases.find(c => c.id === id) || mockWorkCases[0];
  res.json(successResponse({ ...workCase, ...data }, '案件已更新'));
});

router.post('/cases/:id/archive', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '案件已归档'));
});

router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20, status, assigneeId, caseId } = req.query;
  
  let result = [...mockTasks];
  
  if (status) {
    result = result.filter(t => t.status === status);
  }
  
  if (assigneeId) {
    result = result.filter(t => t.assigneeId === assigneeId);
  }
  
  if (caseId) {
    result = result.filter(t => t.caseId === caseId);
  }
  
  const pageResult = paginationResult(result, Number(page), Number(pageSize));
  res.json(successResponse(pageResult));
});

router.get('/tasks/all', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(mockTasks));
});

router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const assignee = mockUser;
  const newTask = {
    id: `task-${generateId()}`,
    ...data,
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    assigneeAvatar: assignee.avatar,
    status: 'todo' as const,
    comments: 0,
    attachments: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  res.json(successResponse(newTask, '任务已创建'));
});

router.put('/tasks/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const task = mockTasks.find(t => t.id === id) || mockTasks[0];
  res.json(successResponse({ ...task, status, updatedAt: new Date().toISOString() }, '状态已更新'));
});

router.put('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = req.body;
  const task = mockTasks.find(t => t.id === id) || mockTasks[0];
  res.json(successResponse({ ...task, ...data, updatedAt: new Date().toISOString() }, '任务已更新'));
});

router.delete('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '任务已删除'));
});

router.get('/evidence', async (req: Request, res: Response): Promise<void> => {
  const { caseId } = req.query;
  const workCase = mockWorkCases.find(c => c.id === caseId) || mockWorkCases[0];
  
  res.json(successResponse({
    items: workCase.evidence,
    folders: [
      { id: 'folder-001', caseId: caseId as string, name: '合同类', itemCount: 2, createdAt: '2024-03-10' },
      { id: 'folder-002', caseId: caseId as string, name: '沟通记录', itemCount: 1, createdAt: '2024-03-11' },
      { id: 'folder-003', caseId: caseId as string, name: '财务凭证', itemCount: 1, createdAt: '2024-03-12' },
    ],
  }));
});

router.post('/evidence/upload', async (req: Request, res: Response): Promise<void> => {
  const { caseId, folderId } = req.body;
  const newEvidence = {
    id: `ev-${generateId()}`,
    caseId,
    folderId,
    name: '上传文件.pdf',
    type: 'document' as const,
    fileUrl: '/evidence/uploaded.pdf',
    fileSize: 1024000,
    uploadedBy: mockUser.id,
    uploadedByName: mockUser.name,
    tags: [],
    createdAt: new Date().toISOString(),
  };
  res.json(successResponse(newEvidence, '文件上传成功'));
});

router.post('/evidence/folders', async (req: Request, res: Response): Promise<void> => {
  const { caseId, name, parentId } = req.body;
  const newFolder = {
    id: `folder-${generateId()}`,
    caseId,
    name,
    parentId,
    itemCount: 0,
    createdAt: new Date().toISOString(),
  };
  res.json(successResponse(newFolder, '文件夹已创建'));
});

router.delete('/evidence/:id', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '文件已删除'));
});

router.put('/cases/:caseId/nodes/:nodeId', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  res.json(successResponse({ id: req.params.nodeId, ...data }, '节点已更新'));
});

router.post('/cases/:caseId/nodes', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const newNode = {
    id: `node-${generateId()}`,
    caseId: req.params.caseId,
    ...data,
    completed: false,
  };
  res.json(successResponse(newNode, '节点已添加'));
});

router.get('/reminders', async (req: Request, res: Response): Promise<void> => {
  const reminders = mockWorkCases.flatMap(c => 
    c.nodes
      .filter(n => n.reminder && !n.completed)
      .map(n => ({
        caseId: c.id,
        caseTitle: c.title,
        nodeName: n.name,
        date: n.date,
        type: '诉讼节点',
      }))
  );
  res.json(successResponse(reminders));
});

export default router;
