import { Document, DocumentVersion, DocumentCollaborator, PermissionType } from '@/types/document';
import { mockDocuments, mockDocumentVersions, mockCollaborators } from '@/data/mockDocument';

export const documentService = {
  async getDocumentList(params: {
    type?: string;
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: Document[]; total: number }> {
    console.log('[DocumentService] Get document list:', params);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { type, status, keyword, page = 1, pageSize = 10 } = params;
    
    let list = [...mockDocuments];
    
    if (type && type !== 'all') {
      list = list.filter(d => d.type === type);
    }
    
    if (status && status !== 'all') {
      list = list.filter(d => d.status === status);
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      list = list.filter(d => 
        d.name.toLowerCase().includes(lowerKeyword) ||
        d.tags.some(t => t.toLowerCase().includes(lowerKeyword))
      );
    }
    
    return {
      list: list.slice((page - 1) * pageSize, page * pageSize),
      total: list.length
    };
  },

  async getDocumentDetail(documentId: string): Promise<Document> {
    console.log('[DocumentService] Get document detail:', documentId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const doc = mockDocuments.find(d => d.id === documentId);
    if (!doc) throw new Error('文档不存在');
    return doc;
  },

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    console.log('[DocumentService] Get document versions:', documentId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockDocumentVersions.filter(v => v.documentId === documentId);
  },

  async getCollaborators(documentId: string): Promise<DocumentCollaborator[]> {
    console.log('[DocumentService] Get collaborators:', documentId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockCollaborators;
  },

  async addCollaborator(documentId: string, userIds: string[], permission: PermissionType): Promise<void> {
    console.log('[DocumentService] Add collaborator:', documentId, userIds, permission);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  async updatePermission(documentId: string, userId: string, permission: PermissionType): Promise<void> {
    console.log('[DocumentService] Update permission:', documentId, userId, permission);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async removeCollaborator(documentId: string, userId: string): Promise<void> {
    console.log('[DocumentService] Remove collaborator:', documentId, userId);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async createDocument(name: string, type: string, _content?: string): Promise<Document> {
    console.log('[DocumentService] Create document:', name, type);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newDoc: Document = {
      id: 'doc_' + Date.now(),
      name,
      type: type as any,
      status: 'draft',
      size: 0,
      creatorId: 'u001',
      creatorName: '张明',
      departmentId: 'org002',
      departmentName: '信息中心',
      currentVersion: 1,
      lastEditorId: 'u001',
      lastEditorName: '张明',
      lastEditTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      createTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      watermarkEnabled: true,
      permission: 'owner',
      tags: [],
      viewCount: 0,
      isConfidential: false
    };
    
    return newDoc;
  },

  async updateDocument(documentId: string, data: Partial<Document>): Promise<void> {
    console.log('[DocumentService] Update document:', documentId, data);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  async uploadVersion(documentId: string, _file: any, remark: string, changeLog: string): Promise<DocumentVersion> {
    console.log('[DocumentService] Upload version:', documentId, remark);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const version: DocumentVersion = {
      id: 'v_' + Date.now(),
      documentId,
      version: 4,
      name: '',
      size: 0,
      creatorId: 'u001',
      creatorName: '张明',
      createTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
      remark,
      changeLog,
      downloadUrl: '',
      isCurrent: true
    };
    
    return version;
  },

  async downloadVersion(versionId: string): Promise<string> {
    console.log('[DocumentService] Download version:', versionId);
    await new Promise(resolve => setTimeout(resolve, 200));
    return '';
  },

  async restoreVersion(documentId: string, versionId: string): Promise<void> {
    console.log('[DocumentService] Restore version:', documentId, versionId);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  async deleteDocument(documentId: string): Promise<void> {
    console.log('[DocumentService] Delete document:', documentId);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  async updateWatermarkConfig(documentId: string, enabled: boolean): Promise<void> {
    console.log('[DocumentService] Update watermark:', documentId, enabled);
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async getDocumentStats(): Promise<{ total: number; published: number; draft: number; archived: number }> {
    console.log('[DocumentService] Get document stats');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      total: mockDocuments.length,
      published: mockDocuments.filter(d => d.status === 'published').length,
      draft: mockDocuments.filter(d => d.status === 'draft').length,
      archived: mockDocuments.filter(d => d.status === 'archived').length
    };
  }
};

export default documentService;
