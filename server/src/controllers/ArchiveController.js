const ArchiveService = require('../services/ArchiveService');
const KnowledgeGraphEngine = require('../engines/KnowledgeGraphEngine');

class ArchiveController {
  constructor() {
    this.archiveService = new ArchiveService();
    this.knowledgeGraphEngine = new KnowledgeGraphEngine();
  }

  async addToKnowledgeBase(req, res) {
    try {
      const editorId = req.user._id;
      const { questionId } = req.params;

      const result = await this.archiveService.addToKnowledgeBase(questionId, editorId);

      res.status(200).json({
        success: true,
        data: {
          isNew: result.isNew,
          knowledgeNode: result.knowledgeNode ? {
            nodeId: result.knowledgeNode.nodeId,
            title: result.knowledgeNode.title,
            permanentLink: result.knowledgeNode.permanentLink,
            domain: result.knowledgeNode.domain,
            nodeType: result.knowledgeNode.nodeType
          } : null,
          archiveResult: result.archiveResult ? {
            archiveId: result.archiveResult.archive?.archiveId,
            relatedArchivesCount: result.archiveResult.relatedArchivesCount
          } : null,
          notificationSent: result.notificationSent,
          permanentLink: result.permanentLink
        }
      });
    } catch (error) {
      console.error('Error adding to knowledge base:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add to knowledge base'
      });
    }
  }

  async searchKnowledgeBase(req, res) {
    try {
      const {
        query,
        limit = 50,
        offset = 0,
        nodeType,
        domain,
        minQuality = 0
      } = req.query;

      const results = await this.knowledgeGraphEngine.searchNodes(query || '', {
        limit: parseInt(limit),
        offset: parseInt(offset),
        nodeType,
        domain,
        minQuality: parseFloat(minQuality)
      });

      res.status(200).json({
        success: true,
        data: {
          results: results.map(node => ({
            nodeId: node.nodeId,
            title: node.title,
            description: node.description,
            nodeType: node.nodeType,
            domain: node.domain,
            tags: node.tags,
            permanentLink: node.permanentLink,
            qualityScore: node.statistics?.qualityScore,
            createdBy: node.createdBy,
            createdAt: node.createdAt
          })),
          total: results.length
        }
      });
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search knowledge base'
      });
    }
  }

  async getKnowledgeNode(req, res) {
    try {
      const { nodeId } = req.params;

      const node = await this.knowledgeGraphEngine.getNodePath(
        await require('../models/KnowledgeNode').findOne({ nodeId })
      );

      if (!node) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge node not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          node: {
            nodeId: node.nodeId,
            title: node.title,
            description: node.description,
            nodeType: node.nodeType,
            domain: node.domain,
            tags: node.tags,
            permanentLink: node.permanentLink,
            isPublished: node.isPublished,
            isFeatured: node.isFeatured,
            version: node.version,
            statistics: node.statistics,
            parentNodes: node.parentNodes,
            childNodes: node.childNodes,
            relatedNodes: node.relatedNodes
          }
        }
      });
    } catch (error) {
      console.error('Error getting knowledge node:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get knowledge node'
      });
    }
  }

  async getArchiveRecord(req, res) {
    try {
      const { archiveId } = req.params;

      const archive = await this.archiveService.getArchiveRecord(archiveId);

      res.status(200).json({
        success: true,
        data: {
          archiveId: archive.archiveId,
          archiveType: archive.archiveType,
          sourceCollection: archive.sourceCollection,
          sourceDocumentId: archive.sourceDocumentId,
          content: archive.content,
          contentHash: archive.contentHash,
          version: archive.version,
          archivalReason: archive.archivalReason,
          retentionPolicy: archive.retentionPolicy,
          relatedRecords: archive.relatedRecords,
          searchMetadata: archive.searchMetadata,
          auditInfo: archive.auditInfo,
          integrityVerification: archive.integrityVerification,
          createdAt: archive.createdAt
        }
      });
    } catch (error) {
      console.error('Error getting archive record:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get archive record'
      });
    }
  }

  async searchArchives(req, res) {
    try {
      const {
        query,
        limit = 50,
        offset = 0,
        archiveType,
        userId,
        startDate,
        endDate
      } = req.query;

      const result = await this.archiveService.searchArchives(query, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        archiveType,
        userId,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error searching archives:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search archives'
      });
    }
  }

  async verifyArchiveIntegrity(req, res) {
    try {
      const { archiveId } = req.params;

      const result = await this.archiveService.verifyArchiveIntegrity(archiveId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error verifying archive integrity:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify archive integrity'
      });
    }
  }

  async getArchiveStats(req, res) {
    try {
      const stats = await this.archiveService.getArchiveStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting archive stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get archive stats'
      });
    }
  }

  async processWorkflowArchive(req, res) {
    try {
      const { questionId } = req.params;

      const result = await this.archiveService.processWorkflowArchive(questionId);

      res.status(200).json({
        success: true,
        data: {
          questionId: result.question.questionId,
          workflowStatus: result.question.workflowStatus,
          archivedAt: result.question.archivedAt,
          archiveId: result.question.archiveId,
          workflowComplete: result.workflowComplete,
          message: result.message
        }
      });
    } catch (error) {
      console.error('Error processing workflow archive:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process workflow archive'
      });
    }
  }

  async getRelatedKnowledge(req, res) {
    try {
      const { nodeId } = req.params;
      const { limit = 10 } = req.query;

      const KnowledgeNode = require('../models/KnowledgeNode');
      const node = await KnowledgeNode.findOne({ nodeId });

      if (!node) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge node not found'
        });
      }

      const relatedNodes = await this.knowledgeGraphEngine.findRelatedNodes(node, parseInt(limit));

      res.status(200).json({
        success: true,
        data: {
          currentNode: {
            nodeId: node.nodeId,
            title: node.title
          },
          relatedNodes: relatedNodes.map(r => ({
            nodeId: r.node.nodeId,
            title: r.node.title,
            nodeType: r.node.nodeType,
            domain: r.node.domain,
            score: r.score,
            commonKeywords: r.keywords
          }))
        }
      });
    } catch (error) {
      console.error('Error getting related knowledge:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get related knowledge'
      });
    }
  }
}

module.exports = ArchiveController;
