import { now } from '../data/database';
import { contentRepository } from '../repositories/ContentRepository';
import type { 
  Content, 
  ContentType, 
  ContentStatus, 
  ContentSecurityCheckRequest, 
  ContentSecurityCheckResponse,
  PageResponse,
  WatermarkConfig
} from '../../shared/types';

export interface CreateContentData {
  title: string;
  type: ContentType;
  authorId: string;
  authorName: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  region: string;
  copyright?: {
    owner: string;
    registrationNo: string;
    authorizedUse: string[];
    watermarkEnabled: boolean;
  };
  watermark?: WatermarkConfig;
  scheduledPublishAt?: string;
}

export interface UpdateContentData {
  title?: string;
  type?: ContentType;
  summary?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  region?: string;
  copyright?: {
    owner: string;
    registrationNo: string;
    authorizedUse: string[];
    watermarkEnabled: boolean;
  };
  watermark?: WatermarkConfig;
  scheduledPublishAt?: string;
}

const SENSITIVE_WORDS = ['敏感词1', '敏感词2', '违规'];

export class ContentService {
  async getContentById(id: string): Promise<Content | undefined> {
    const content = await contentRepository.findById(id);
    if (content) {
      await contentRepository.incrementViews(id);
    }
    return content;
  }

  async getContentList(params: {
    page?: number;
    pageSize?: number;
    status?: ContentStatus;
    type?: ContentType;
    category?: string;
    region?: string;
    authorId?: string;
    keyword?: string;
  }): Promise<PageResponse<Content>> {
    return contentRepository.findAll(params);
  }

  async createContent(data: CreateContentData): Promise<Content> {
    return contentRepository.create({
      ...data,
      status: 'draft',
      tags: data.tags || [],
    });
  }

  async updateContent(id: string, data: UpdateContentData): Promise<Content | undefined> {
    const content = await contentRepository.findById(id);
    if (!content) return undefined;

    if (content.status === 'published') {
      throw new Error('已发布的内容不能编辑，请先下架');
    }

    return contentRepository.update(id, {
      ...data,
      status: content.status === 'pending_audit' || content.status === 'auditing' 
        ? 'draft' 
        : content.status,
    });
  }

  async deleteContent(id: string): Promise<boolean> {
    const content = await contentRepository.findById(id);
    if (!content) return false;

    if (content.status === 'published') {
      throw new Error('已发布的内容不能删除，请先下架');
    }

    return contentRepository.delete(id);
  }

  async checkContentSecurity(request: ContentSecurityCheckRequest): Promise<ContentSecurityCheckResponse> {
    const { content, type } = request;
    
    const foundSensitiveWords: string[] = [];
    for (const word of SENSITIVE_WORDS) {
      if (content.includes(word)) {
        foundSensitiveWords.push(word);
      }
    }

    let riskLevel: ContentSecurityCheckResponse['riskLevel'] = 'safe';
    const suggestions: string[] = [];

    if (foundSensitiveWords.length > 0) {
      riskLevel = foundSensitiveWords.length >= 2 ? 'high' : 'medium';
      suggestions.push(`检测到敏感词: ${foundSensitiveWords.join(', ')}，请修改后再提交`);
    }

    if (type === 'video' && content.length < 50) {
      riskLevel = riskLevel === 'safe' ? 'low' : riskLevel;
      suggestions.push('视频内容描述较短，建议补充详细说明');
    }

    if (type === 'vr' && !content.includes('全景')) {
      riskLevel = riskLevel === 'safe' ? 'low' : riskLevel;
      suggestions.push('VR内容建议包含全景体验描述');
    }

    const response: ContentSecurityCheckResponse = {
      passed: foundSensitiveWords.length === 0,
      riskLevel,
      sensitiveKeywords: foundSensitiveWords,
      suggestions,
      checkTime: now(),
    };

    return response;
  }

  async processWatermark(contentId: string, watermarkConfig: WatermarkConfig): Promise<{ success: boolean; message: string }> {
    const content = await contentRepository.findById(contentId);
    if (!content) {
      return { success: false, message: '内容不存在' };
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    if (watermarkConfig.type === 'text' && !watermarkConfig.text) {
      return { success: false, message: '文字水印必须提供水印文字' };
    }

    if (watermarkConfig.type === 'image' && !watermarkConfig.imageUrl) {
      return { success: false, message: '图片水印必须提供图片URL' };
    }

    if (watermarkConfig.opacity < 0 || watermarkConfig.opacity > 1) {
      return { success: false, message: '透明度必须在 0-1 之间' };
    }

    await contentRepository.update(contentId, {
      watermark: watermarkConfig,
    });

    return {
      success: true,
      message: `水印处理完成，类型: ${watermarkConfig.type}，位置: ${watermarkConfig.position}，透明度: ${watermarkConfig.opacity}`,
    };
  }

  async submitForAudit(id: string): Promise<Content | undefined> {
    const content = await contentRepository.findById(id);
    if (!content) return undefined;

    if (content.status !== 'draft' && content.status !== 'rejected') {
      throw new Error('只有草稿或已驳回的内容才能提交审核');
    }

    const securityCheck = await this.checkContentSecurity({
      contentId: id,
      content: content.content,
      type: content.type,
    });

    if (!securityCheck.passed) {
      throw new Error(`内容安全检测未通过: ${securityCheck.suggestions.join('; ')}`);
    }

    if (content.copyright?.watermarkEnabled && !content.watermark) {
      throw new Error('已启用版权水印，但未配置水印信息');
    }

    return contentRepository.updateStatus(id, 'pending_audit');
  }

  async publishContent(id: string): Promise<Content | undefined> {
    const content = await contentRepository.findById(id);
    if (!content) return undefined;

    if (content.status !== 'approved') {
      throw new Error('只有审核通过的内容才能发布');
    }

    if (content.scheduledPublishAt && new Date(content.scheduledPublishAt) > new Date()) {
      throw new Error('未到预定发布时间');
    }

    return contentRepository.publish(id);
  }

  async offlineContent(id: string, _reason: string): Promise<Content | undefined> {
    const content = await contentRepository.findById(id);
    if (!content) return undefined;

    if (content.status !== 'published') {
      throw new Error('只有已发布的内容才能下架');
    }

    return contentRepository.offline(id);
  }

  async likeContent(id: string): Promise<boolean> {
    const content = await contentRepository.findById(id);
    if (!content) return false;
    await contentRepository.incrementLikes(id);
    return true;
  }

  async shareContent(id: string): Promise<boolean> {
    const content = await contentRepository.findById(id);
    if (!content) return false;
    await contentRepository.incrementShares(id);
    return true;
  }

  async commentContent(id: string): Promise<boolean> {
    const content = await contentRepository.findById(id);
    if (!content) return false;
    await contentRepository.incrementComments(id);
    return true;
  }
}

export const contentService = new ContentService();
