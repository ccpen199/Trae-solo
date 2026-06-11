import { propagationRepository, type PropagationTreeNode } from '../repositories/PropagationRepository';
import type { PropagationNode } from '../../shared/types';

export interface PropagationPathResult {
  tree: PropagationTreeNode | null;
  totalNodes: number;
  maxDepth: number;
  totalShares: number;
  totalViews: number;
}

export interface PlatformStats {
  platform: string;
  shareCount: number;
  viewCount: number;
  nodeCount: number;
  shareRate: number;
}

export interface LevelStats {
  level: number;
  shareCount: number;
  viewCount: number;
  nodeCount: number;
  avgSharePerNode: number;
}

export interface InfluencerNode extends PropagationNode {
  influenceScore: number;
}

export class PropagationAnalysisService {
  async getPropagationPath(contentId: string): Promise<PropagationPathResult> {
    const tree = await propagationRepository.getPropagationTree(contentId);
    const nodes = await propagationRepository.getPropagationNodes(contentId);

    const calculateMaxDepth = (node: PropagationTreeNode | null): number => {
      if (!node) return 0;
      if (node.children.length === 0) return node.level;
      return Math.max(node.level, ...node.children.map(c => calculateMaxDepth(c)));
    };

    const totalShares = nodes.reduce((sum, n) => sum + n.shareCount, 0);
    const totalViews = nodes.reduce((sum, n) => sum + n.viewCount, 0);

    return {
      tree,
      totalNodes: nodes.length,
      maxDepth: calculateMaxDepth(tree),
      totalShares,
      totalViews,
    };
  }

  async getPropagationNodes(contentId: string): Promise<PropagationNode[]> {
    return propagationRepository.getPropagationNodes(contentId);
  }

  async getPlatformStats(contentId: string): Promise<PlatformStats[]> {
    const rawStats = await propagationRepository.getPlatformStats(contentId);
    const nodes = await propagationRepository.getPropagationNodes(contentId);
    const totalShares = nodes.reduce((sum, n) => sum + n.shareCount, 0);

    return Object.entries(rawStats).map(([platform, stats]) => ({
      platform,
      shareCount: stats.shareCount,
      viewCount: stats.viewCount,
      nodeCount: stats.nodeCount,
      shareRate: totalShares > 0 ? stats.shareCount / totalShares : 0,
    }));
  }

  async getLevelStats(contentId: string): Promise<LevelStats[]> {
    const rawStats = await propagationRepository.getLevelStats(contentId);

    return Object.entries(rawStats)
      .map(([level, stats]) => ({
        level: parseInt(level),
        shareCount: stats.shareCount,
        viewCount: stats.viewCount,
        nodeCount: stats.nodeCount,
        avgSharePerNode: stats.nodeCount > 0 ? stats.shareCount / stats.nodeCount : 0,
      }))
      .sort((a, b) => a.level - b.level);
  }

  async getTopInfluencers(contentId: string, limit: number = 10): Promise<InfluencerNode[]> {
    const nodes = await propagationRepository.getTopInfluencers(contentId, limit);

    return nodes.map(node => {
      const influenceScore = node.shareCount * 2 + node.viewCount * 0.1;
      return {
        ...node,
        influenceScore: Math.round(influenceScore * 100) / 100,
      };
    });
  }

  async getPropagationSummary(contentId: string): Promise<{
    totalNodes: number;
    totalShares: number;
    totalViews: number;
    avgSharePerNode: number;
    avgViewPerNode: number;
    viralIndex: number;
  }> {
    const nodes = await propagationRepository.getPropagationNodes(contentId);
    
    const totalNodes = nodes.length;
    const totalShares = nodes.reduce((sum, n) => sum + n.shareCount, 0);
    const totalViews = nodes.reduce((sum, n) => sum + n.viewCount, 0);
    const avgSharePerNode = totalNodes > 0 ? totalShares / totalNodes : 0;
    const avgViewPerNode = totalNodes > 0 ? totalViews / totalNodes : 0;
    
    const levelStats = await propagationRepository.getLevelStats(contentId);
    const levelCount = Object.keys(levelStats).length;
    const viralIndex = levelCount * avgSharePerNode * (totalViews / 1000);

    return {
      totalNodes,
      totalShares,
      totalViews,
      avgSharePerNode: Math.round(avgSharePerNode * 100) / 100,
      avgViewPerNode: Math.round(avgViewPerNode * 100) / 100,
      viralIndex: Math.round(viralIndex * 100) / 100,
    };
  }
}

export const propagationAnalysisService = new PropagationAnalysisService();
