const KnowledgeNode = require('../models/KnowledgeNode');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { v4: uuidv4 } = require('uuid');

class KnowledgeGraphEngine {
  constructor(options = {}) {
    this.config = {
      similarityThreshold: options.similarityThreshold || 0.7,
      maxRelatedNodes: options.maxRelatedNodes || 10,
      relationshipWeightDecay: options.relationshipWeightDecay || 0.9
    };
  }

  extractKeywords(content, limit = 20) {
    if (!content) return [];

    const words = content.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const stopWords = ['的', '是', '在', '有', '和', '与', '或', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'this', 'that', 'these', 'those', 'am', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'if', 'because', 'until', 'while', 'about', 'against', 'any', 'if', 'because', 'until', 'while', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under'];

    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  calculateSimilarity(keywords1, keywords2) {
    if (!keywords1.length || !keywords2.length) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  inferNodeType(contentType, qualityScore = 0) {
    const typeMapping = {
      'Question': 'question',
      'Answer': 'answer',
      'Article': 'article'
    };

    const baseType = typeMapping[contentType] || 'reference';

    if (qualityScore >= 0.8 && baseType === 'answer') {
      return 'tutorial';
    }

    return baseType;
  }

  inferDomain(tags, keywords) {
    const allTerms = [...(tags || []), ...(keywords || [])].map(t => t.toLowerCase());

    const domainMapping = {
      'programming': ['javascript', 'python', 'java', 'c++', 'react', 'vue', 'nodejs', '前端', '后端', '编程', '开发', '代码'],
      'data_science': ['机器学习', '深度学习', '人工智能', 'ai', '数据', '数据分析', 'data', 'machine', 'learning'],
      'business': ['商业', '投资', '金融', '市场', '营销', '管理', 'business', 'finance', 'marketing', 'management'],
      'health': ['健康', '医疗', '医学', '医生', '医院', 'health', 'medical', 'doctor', 'hospital'],
      'education': ['教育', '学习', '考试', '学校', '学生', 'education', 'learning', 'study', 'school', 'student'],
      'design': ['设计', 'ui', 'ux', '交互', '视觉', 'design', 'interface', 'visual'],
      'security': ['安全', '网络安全', '信息安全', '加密', 'security', 'cyber', 'encryption']
    };

    for (const [domain, terms] of Object.entries(domainMapping)) {
      const matches = terms.filter(t => 
        allTerms.some(at => at.includes(t) || t.includes(at))
      );
      if (matches.length >= 2) {
        return domain;
      }
    }

    return 'general';
  }

  async createNodeFromContent(contentType, contentId, options = {}) {
    let content;
    let title = '';
    let description = '';
    let tags = [];
    let author = null;

    if (contentType === 'Question') {
      content = await Question.findById(contentId).populate('author');
      if (!content) throw new Error('Question not found');
      title = content.title;
      description = content.content.substring(0, 200);
      tags = content.tags || [];
      author = content.author;
    } else if (contentType === 'Answer') {
      content = await Answer.findById(contentId).populate('author').populate('question');
      if (!content) throw new Error('Answer not found');
      title = `关于"${content.question?.title || '问题'}"的回答`;
      description = content.content.substring(0, 200);
      tags = content.question?.tags || [];
      author = content.author;
    }

    const keywords = this.extractKeywords(`${title} ${description} ${tags.join(' ')}`);
    const domain = this.inferDomain(tags, keywords);
    const qualityScore = content.stats?.voteCount ? 
      Math.min(content.stats.voteCount / 100, 1) : 0.5;
    const nodeType = this.inferNodeType(contentType, qualityScore);

    const nodeId = `KN-${uuidv4().substring(0, 12)}`;

    const existingNode = await KnowledgeNode.findOne({
      contentType,
      content: contentId
    });

    if (existingNode) {
      return this.updateNode(existingNode, {
        title,
        description,
        tags,
        keywords,
        domain
      });
    }

    const node = new KnowledgeNode({
      nodeId,
      title,
      description,
      nodeType,
      domain,
      tags,
      content: contentId,
      contentType,
      permanentLink: `/knowledge/${nodeId}`,
      seoInfo: {
        keywords: keywords.slice(0, 10),
        description: description.substring(0, 160)
      },
      createdBy: author?._id,
      statistics: {
        qualityScore
      }
    });

    const relatedNodes = await this.findRelatedNodes(node);
    relatedNodes.forEach(({ node: relatedNode, score, keywords: commonKeywords }) => {
      node.addRelated(relatedNode._id, 'similar', score, commonKeywords);
    });

    await node.save();

    if (contentType === 'Question') {
      await Question.findByIdAndUpdate(contentId, {
        isInKnowledgeBase: true,
        knowledgeBaseNode: node._id,
        workflowStatus: 'archived_record'
      });
    }

    return node;
  }

  async updateNode(node, updates) {
    if (updates.title) node.title = updates.title;
    if (updates.description) node.description = updates.description;
    if (updates.tags) node.tags = [...new Set([...node.tags, ...updates.tags])];
    if (updates.keywords) {
      node.seoInfo.keywords = [...new Set([
        ...(node.seoInfo.keywords || []),
        ...updates.keywords.slice(0, 10)
      ])];
    }
    if (updates.domain) node.domain = updates.domain;

    node.version += 1;

    await node.save();
    return node;
  }

  async findRelatedNodes(targetNode, limit = 10) {
    const targetKeywords = [
      ...(targetNode.tags || []),
      ...(targetNode.seoInfo?.keywords || [])
    ].map(k => k.toLowerCase());

    const candidates = await KnowledgeNode.find({
      _id: { $ne: targetNode._id },
      isPublished: true,
      isArchived: false,
      nodeType: { $in: ['question', 'answer', 'article', 'tutorial'] }
    }).limit(100);

    const scoredCandidates = candidates.map(candidate => {
      const candidateKeywords = [
        ...(candidate.tags || []),
        ...(candidate.seoInfo?.keywords || [])
      ].map(k => k.toLowerCase());

      const similarity = this.calculateSimilarity(targetKeywords, candidateKeywords);
      const commonKeywords = targetKeywords.filter(k => candidateKeywords.includes(k));

      let score = similarity;

      if (candidate.domain === targetNode.domain) {
        score += 0.2;
      }

      if (candidate.nodeType === targetNode.nodeType) {
        score += 0.1;
      }

      score += (candidate.statistics?.qualityScore || 0) * 0.2;

      return {
        node: candidate,
        score: Math.min(score, 1.0),
        keywords: commonKeywords
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    return scoredCandidates
      .filter(c => c.score >= this.config.similarityThreshold)
      .slice(0, limit);
  }

  async addNodeRelationship(sourceNodeId, targetNodeId, relationship, weight = 1.0) {
    const sourceNode = await KnowledgeNode.findById(sourceNodeId);
    const targetNode = await KnowledgeNode.findById(targetNodeId);

    if (!sourceNode || !targetNode) {
      throw new Error('Node not found');
    }

    if (relationship === 'parent' || relationship === 'prerequisite') {
      sourceNode.addParent(targetNodeId, relationship, weight);
      targetNode.addChild(sourceNodeId, relationship === 'parent' ? 'subtopic' : 'prerequisite', weight);
    } else if (relationship === 'child' || relationship === 'subtopic') {
      sourceNode.addChild(targetNodeId, relationship, weight);
      targetNode.addParent(sourceNodeId, relationship === 'child' ? 'parent' : 'subtopic', weight);
    } else {
      sourceNode.addRelated(targetNodeId, relationship, weight);
      targetNode.addRelated(sourceNodeId, relationship, weight);
    }

    await sourceNode.save();
    await targetNode.save();

    return { sourceNode, targetNode };
  }

  async generatePermanentLink(node) {
    return `/knowledge/${node.nodeId}`;
  }

  async getNodePath(node) {
    const path = [];
    let currentNode = node;
    const visited = new Set();

    while (currentNode && currentNode.parentNodes?.length > 0 && !visited.has(currentNode._id.toString())) {
      visited.add(currentNode._id.toString());
      path.unshift({
        nodeId: currentNode.nodeId,
        title: currentNode.title,
        nodeType: currentNode.nodeType
      });

      const primaryParent = currentNode.parentNodes
        .sort((a, b) => b.weight - a.weight)[0];
      
      if (primaryParent) {
        currentNode = await KnowledgeNode.findById(primaryParent.node);
      } else {
        break;
      }
    }

    return path;
  }

  async searchNodes(query, options = {}) {
    const {
      limit = 50,
      offset = 0,
      nodeType = null,
      domain = null,
      minQuality = 0
    } = options;

    const queryKeywords = this.extractKeywords(query);

    let searchQuery = {
      isPublished: true,
      isArchived: false
    };

    if (nodeType) {
      searchQuery.nodeType = nodeType;
    }

    if (domain) {
      searchQuery.domain = domain;
    }

    searchQuery['statistics.qualityScore'] = { $gte: minQuality };

    if (queryKeywords.length > 0) {
      searchQuery.$or = [
        { tags: { $in: queryKeywords } },
        { 'seoInfo.keywords': { $in: queryKeywords } },
        { title: { $regex: new RegExp(queryKeywords.join('|'), 'i') } },
        { description: { $regex: new RegExp(queryKeywords.join('|'), 'i') } }
      ];
    }

    const nodes = await KnowledgeNode.find(searchQuery)
      .sort({ 'statistics.qualityScore': -1, 'statistics.viewCount': -1 })
      .skip(offset)
      .limit(limit)
      .populate('createdBy', 'username profile.nickname');

    return nodes.map(node => ({
      ...node.toObject(),
      relevanceScore: this.calculateRelevanceScore(node, queryKeywords)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevanceScore(node, queryKeywords) {
    if (!queryKeywords.length) return 1;

    let score = 0;
    const nodeKeywords = [
      ...(node.tags || []),
      ...(node.seoInfo?.keywords || [])
    ].map(k => k.toLowerCase());

    const matches = queryKeywords.filter(k => 
      nodeKeywords.some(nk => nk.includes(k.toLowerCase()) || k.toLowerCase().includes(nk))
    );

    score += (matches.length / queryKeywords.length) * 0.6;
    score += (node.statistics?.qualityScore || 0) * 0.3;
    score += (node.isFeatured ? 0.1 : 0);

    return Math.min(score, 1);
  }

  async indexForSearch(node) {
    return {
      nodeId: node.nodeId,
      title: node.title,
      description: node.description,
      tags: node.tags,
      keywords: node.seoInfo?.keywords || [],
      domain: node.domain,
      nodeType: node.nodeType,
      permanentLink: node.permanentLink,
      qualityScore: node.statistics?.qualityScore || 0
    };
  }
}

module.exports = KnowledgeGraphEngine;
