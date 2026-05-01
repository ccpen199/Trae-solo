const ArchiveRecord = require('../models/ArchiveRecord');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');
const Notification = require('../models/Notification');
const KnowledgeGraphEngine = require('../engines/KnowledgeGraphEngine');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ArchiveService {
  constructor() {
    this.knowledgeGraphEngine = new KnowledgeGraphEngine();
  }

  generateArchiveId() {
    return `AR-${Date.now().toString(36)}-${uuidv4().substring(0, 8)}`.toUpperCase();
  }

  calculateContentHash(content) {
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  async archiveQuestion(questionId, reason = 'workflow_completion') {
    const question = await Question.findById(questionId)
      .populate('author')
      .populate('matchedExperts.expert');

    if (!question) {
      throw new Error('Question not found');
    }

    const existingArchive = await ArchiveRecord.findLatestBySource('questions', question._id);
    if (existingArchive && existingArchive.version >= 1) {
      return {
        isNewArchive: false,
        existingArchive,
        message: 'Question already archived'
      };
    }

    const content = question.toObject();
    delete content._id;
    delete content.__v;

    const archive = new ArchiveRecord({
      archiveId: this.generateArchiveId(),
      archiveType: 'question',
      sourceCollection: 'questions',
      sourceDocumentId: question._id,
      content,
      contentHash: this.calculateContentHash(content),
      version: 1,
      archivalReason: reason,
      retentionPolicy: 'permanent',
      archiveLocation: 'database',
      searchMetadata: {
        keywords: [
          ...(question.tags || []),
          ...(question.semanticAnalysis?.keywords || []),
          ...question.title.split(/\s+/)
        ].filter(Boolean).slice(0, 50),
        entities: (question.semanticAnalysis?.entities || []).map(e => e.name),
        dates: {
          originalCreated: question.createdAt,
          originalUpdated: question.updatedAt
        },
        users: [question.author?._id].filter(Boolean),
        amounts: {
          points: question.reward?.points || 0,
          money: question.reward?.money || 0
        }
      },
      auditInfo: {
        createdByType: 'system',
        createdAt: new Date()
      }
    });

    const relatedAnswers = await Answer.find({ question: question._id, isDeleted: false });
    if (relatedAnswers.length > 0) {
      for (const answer of relatedAnswers) {
        const answerArchive = await this.archiveAnswer(answer._id, reason);
        if (answerArchive?.archive) {
          archive.relatedRecords.push({
            archiveId: answerArchive.archive.archiveId,
            archiveType: 'answer',
            sourceDocumentId: answer._id,
            relationship: 'answer_to_question'
          });
        }
      }
    }

    const transactions = await Transaction.find({
      'relatedEntity.id': question._id,
      'relatedEntity.type': 'question'
    });
    for (const tx of transactions) {
      const txArchive = await this.archiveTransaction(tx._id, reason);
      if (txArchive?.archive) {
        archive.relatedRecords.push({
          archiveId: txArchive.archive.archiveId,
          archiveType: 'transaction',
          sourceDocumentId: tx._id,
          relationship: 'transaction_for_question'
        });
      }
    }

    await archive.save();

    question.archivedAt = new Date();
    question.archiveId = archive.archiveId;
    question.workflowStatus = 'archived_record';
    await question.save();

    return {
      isNewArchive: true,
      archive,
      relatedArchivesCount: archive.relatedRecords.length
    };
  }

  async archiveAnswer(answerId, reason = 'workflow_completion') {
    const answer = await Answer.findById(answerId)
      .populate('author')
      .populate('question');

    if (!answer) {
      throw new Error('Answer not found');
    }

    const existingArchive = await ArchiveRecord.findLatestBySource('answers', answer._id);
    if (existingArchive && existingArchive.version >= 1) {
      return {
        isNewArchive: false,
        existingArchive,
        message: 'Answer already archived'
      };
    }

    const content = answer.toObject();
    delete content._id;
    delete content.__v;

    const archive = new ArchiveRecord({
      archiveId: this.generateArchiveId(),
      archiveType: 'answer',
      sourceCollection: 'answers',
      sourceDocumentId: answer._id,
      content,
      contentHash: this.calculateContentHash(content),
      version: 1,
      archivalReason: reason,
      retentionPolicy: 'permanent',
      archiveLocation: 'database',
      searchMetadata: {
        keywords: [
          ...(answer.question?.tags || []),
          ...answer.content.substring(0, 500).split(/\s+/)
        ].filter(Boolean).slice(0, 50),
        dates: {
          originalCreated: answer.createdAt,
          originalUpdated: answer.updatedAt
        },
        users: [answer.author?._id].filter(Boolean),
        amounts: {
          points: 0,
          money: 0
        }
      },
      auditInfo: {
        createdByType: 'system',
        createdAt: new Date()
      }
    });

    if (answer.isAccepted) {
      const transactions = await Transaction.find({
        'relatedEntity.id': answer._id,
        'relatedEntity.type': 'answer'
      });
      for (const tx of transactions) {
        const txArchive = await this.archiveTransaction(tx._id, reason);
        if (txArchive?.archive) {
          archive.relatedRecords.push({
            archiveId: txArchive.archive.archiveId,
            archiveType: 'transaction',
            sourceDocumentId: tx._id,
            relationship: 'transaction_for_answer'
          });
        }
      }
    }

    await archive.save();

    return {
      isNewArchive: true,
      archive
    };
  }

  async archiveTransaction(transactionId, reason = 'system_maintenance') {
    const transaction = await Transaction.findById(transactionId)
      .populate('fromUser')
      .populate('toUser');

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const existingArchive = await ArchiveRecord.findLatestBySource('transactions', transaction._id);
    if (existingArchive && existingArchive.version >= 1) {
      return {
        isNewArchive: false,
        existingArchive,
        message: 'Transaction already archived'
      };
    }

    const content = transaction.toObject();
    delete content._id;
    delete content.__v;

    const archive = new ArchiveRecord({
      archiveId: this.generateArchiveId(),
      archiveType: 'transaction',
      sourceCollection: 'transactions',
      sourceDocumentId: transaction._id,
      content,
      contentHash: this.calculateContentHash(content),
      version: 1,
      archivalReason: reason,
      retentionPolicy: '10_years',
      archiveLocation: 'database',
      searchMetadata: {
        keywords: [
          transaction.transactionType,
          transaction.status,
          transaction.currency
        ].filter(Boolean),
        dates: {
          originalCreated: transaction.createdAt,
          originalUpdated: transaction.updatedAt,
          transactionDate: transaction.processedAt || transaction.completedAt
        },
        users: [transaction.fromUser?._id, transaction.toUser?._id].filter(Boolean),
        amounts: {
          points: transaction.points || 0,
          money: transaction.amount || 0
        }
      },
      auditInfo: {
        createdByType: 'system',
        createdAt: new Date()
      }
    });

    await archive.save();

    return {
      isNewArchive: true,
      archive
    };
  }

  async archiveCreditRecord(creditRecordId, reason = 'system_maintenance') {
    const creditRecord = await CreditRecord.findById(creditRecordId)
      .populate('user');

    if (!creditRecord) {
      throw new Error('Credit record not found');
    }

    const existingArchive = await ArchiveRecord.findLatestBySource('creditrecords', creditRecord._id);
    if (existingArchive && existingArchive.version >= 1) {
      return {
        isNewArchive: false,
        existingArchive,
        message: 'Credit record already archived'
      };
    }

    const content = creditRecord.toObject();
    delete content._id;
    delete content.__v;

    const archive = new ArchiveRecord({
      archiveId: this.generateArchiveId(),
      archiveType: 'credit_record',
      sourceCollection: 'creditrecords',
      sourceDocumentId: creditRecord._id,
      content,
      contentHash: this.calculateContentHash(content),
      version: 1,
      archivalReason: reason,
      retentionPolicy: '5_years',
      archiveLocation: 'database',
      searchMetadata: {
        keywords: [
          creditRecord.recordType,
          creditRecord.operation,
          creditRecord.source
        ].filter(Boolean),
        dates: {
          originalCreated: creditRecord.createdAt
        },
        users: [creditRecord.user?._id].filter(Boolean)
      },
      auditInfo: {
        createdByType: 'system',
        createdAt: new Date()
      }
    });

    await archive.save();

    return {
      isNewArchive: true,
      archive
    };
  }

  async addToKnowledgeBase(questionId, editorId) {
    const question = await Question.findById(questionId)
      .populate('author');

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.status !== 'solved') {
      throw new Error('Only solved questions can be added to knowledge base');
    }

    if (question.isInKnowledgeBase) {
      return {
        isNew: false,
        message: 'Question already in knowledge base',
        knowledgeNode: await this.knowledgeGraphEngine.getNodePath(
          await KnowledgeNode.findById(question.knowledgeBaseNode)
        )
      };
    }

    const knowledgeNode = await this.knowledgeGraphEngine.createNodeFromContent(
      'Question',
      question._id,
      { createdBy: editorId }
    );

    const acceptedAnswer = await Answer.findOne({
      question: question._id,
      isAccepted: true
    });

    if (acceptedAnswer) {
      await this.knowledgeGraphEngine.createNodeFromContent(
        'Answer',
        acceptedAnswer._id,
        { createdBy: editorId }
      );
    }

    question.isInKnowledgeBase = true;
    question.knowledgeBaseNode = knowledgeNode._id;
    question.isQualityContent = true;
    question.workflowStatus = 'archived_record';

    await question.save();

    await this.qualityCreditEngine.applyCreditRule(
      question.author._id,
      'knowledge_contribution',
      {
        reason: '内容被收录到知识库',
        relatedEntity: {
          type: 'question',
          id: question._id
        }
      }
    );

    const archiveResult = await this.archiveQuestion(question._id, 'workflow_completion');

    const notification = new Notification({
      notificationId: uuidv4(),
      recipient: question.author._id,
      notificationType: 'knowledge_update',
      priority: 'high',
      title: '恭喜！您的内容被收录到知识库',
      content: `您的问题"${question.title.substring(0, 50)}..."被知识编辑收录到知识库，获得了额外的信用分奖励！`,
      data: {
        questionId: question.questionId,
        knowledgeNodeId: knowledgeNode.nodeId,
        permanentLink: knowledgeNode.permanentLink
      },
      relatedEntity: {
        type: 'Question',
        id: question._id
      },
      channels: ['in_app', 'email'],
      source: 'system'
    });
    await notification.save();

    return {
      isNew: true,
      knowledgeNode,
      archiveResult,
      notificationSent: true,
      permanentLink: knowledgeNode.permanentLink
    };
  }

  async getArchiveRecord(archiveId) {
    const archive = await ArchiveRecord.findOne({ archiveId });
    if (!archive) {
      throw new Error('Archive record not found');
    }

    archive.integrityVerification = {
      ...archive.integrityVerification,
      lastVerifiedAt: new Date(),
      verificationStatus: archive.verifyIntegrity() ? 'valid' : 'corrupted'
    };

    await archive.save();

    return archive;
  }

  async searchArchives(query, options = {}) {
    const {
      limit = 50,
      offset = 0,
      archiveType = null,
      userId = null,
      startDate = null,
      endDate = null
    } = options;

    const searchQuery = { isDeleted: false };

    if (archiveType) {
      searchQuery.archiveType = archiveType;
    }

    if (userId) {
      searchQuery['searchMetadata.users'] = userId;
    }

    if (startDate || endDate) {
      searchQuery.createdAt = {};
      if (startDate) searchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) searchQuery.createdAt.$lte = new Date(endDate);
    }

    if (query) {
      searchQuery.$or = [
        { 'searchMetadata.keywords': { $regex: query, $options: 'i' } },
        { archiveId: { $regex: query, $options: 'i' } }
      ];
    }

    const archives = await ArchiveRecord.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await ArchiveRecord.countDocuments(searchQuery);

    return {
      archives,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  async verifyArchiveIntegrity(archiveId) {
    const archive = await ArchiveRecord.findOne({ archiveId });
    if (!archive) {
      throw new Error('Archive record not found');
    }

    const isValid = archive.verifyIntegrity();

    await archive.save();

    return {
      archiveId: archive.archiveId,
      isValid,
      verificationStatus: archive.integrityVerification.verificationStatus,
      lastVerifiedAt: archive.integrityVerification.lastVerifiedAt,
      contentHash: archive.contentHash,
      lastChecksum: archive.integrityVerification.lastChecksum
    };
  }

  async getArchiveStats() {
    const stats = await ArchiveRecord.aggregate([
      {
        $group: {
          _id: {
            archiveType: '$archiveType',
            archivalReason: '$archivalReason',
            verificationStatus: '$integrityVerification.verificationStatus'
          },
          count: { $sum: 1 },
          totalSize: { $sum: { $bsonSize: '$$ROOT' } }
        }
      }
    ]);

    const totalArchives = await ArchiveRecord.countDocuments({ isDeleted: false });
    const validArchives = await ArchiveRecord.countDocuments({
      'integrityVerification.verificationStatus': 'valid'
    });
    const corruptedArchives = await ArchiveRecord.countDocuments({
      'integrityVerification.verificationStatus': 'corrupted'
    });

    return {
      total: totalArchives,
      valid: validArchives,
      corrupted: corruptedArchives,
      pending: totalArchives - validArchives - corruptedArchives,
      byType: stats.reduce((acc, s) => {
        const type = s._id.archiveType;
        if (!acc[type]) acc[type] = { count: 0, size: 0 };
        acc[type].count += s.count;
        acc[type].size += s.totalSize;
        return acc;
      }, {})
    };
  }

  async processWorkflowArchive(questionId) {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.workflowStatus !== 'result_confirmation') {
      throw new Error('Workflow must be in result_confirmation stage to archive');
    }

    if (question.status !== 'solved') {
      throw new Error('Question must be solved before archiving');
    }

    const archiveResult = await this.archiveQuestion(questionId, 'workflow_completion');

    question.workflowStatus = 'archived_record';
    question.archivedAt = new Date();
    if (archiveResult.archive) {
      question.archiveId = archiveResult.archive.archiveId;
    }
    await question.save();

    return {
      question,
      archiveResult,
      workflowComplete: true,
      message: 'Workflow completed successfully. All records archived.'
    };
  }
}

module.exports = ArchiveService;
