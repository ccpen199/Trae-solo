import { db } from '../data/database';
import type { PropagationNode } from '../../shared/types';

export interface PropagationTreeNode extends PropagationNode {
  children: PropagationTreeNode[];
}

export class PropagationRepository {
  async findByContentId(contentId: string): Promise<PropagationNode[]> {
    return db.propagationNodes.get(contentId) || [];
  }

  async getPropagationTree(contentId: string): Promise<PropagationTreeNode | null> {
    const nodes = await this.findByContentId(contentId);
    if (nodes.length === 0) return null;

    const nodeMap = new Map<string, PropagationTreeNode>();
    
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    let root: PropagationTreeNode | null = null;
    
    nodeMap.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else if (node.level === 1 || !node.parentId) {
        if (!root) {
          root = node;
        }
      }
    });

    if (!root) {
      const level1Nodes = Array.from(nodeMap.values()).filter(n => n.level === 1);
      if (level1Nodes.length > 0) {
        root = level1Nodes[0];
        level1Nodes.slice(1).forEach(node => {
          root!.children.push(node);
        });
      }
    }

    return root;
  }

  async getPropagationNodes(contentId: string): Promise<PropagationNode[]> {
    return this.findByContentId(contentId);
  }

  async getPlatformStats(contentId: string): Promise<Record<string, { shareCount: number; viewCount: number; nodeCount: number }>> {
    const nodes = await this.findByContentId(contentId);
    const stats: Record<string, { shareCount: number; viewCount: number; nodeCount: number }> = {};

    nodes.forEach(node => {
      if (!stats[node.platform]) {
        stats[node.platform] = { shareCount: 0, viewCount: 0, nodeCount: 0 };
      }
      stats[node.platform].shareCount += node.shareCount;
      stats[node.platform].viewCount += node.viewCount;
      stats[node.platform].nodeCount += 1;
    });

    return stats;
  }

  async getLevelStats(contentId: string): Promise<Record<number, { shareCount: number; viewCount: number; nodeCount: number }>> {
    const nodes = await this.findByContentId(contentId);
    const stats: Record<number, { shareCount: number; viewCount: number; nodeCount: number }> = {};

    nodes.forEach(node => {
      if (!stats[node.level]) {
        stats[node.level] = { shareCount: 0, viewCount: 0, nodeCount: 0 };
      }
      stats[node.level].shareCount += node.shareCount;
      stats[node.level].viewCount += node.viewCount;
      stats[node.level].nodeCount += 1;
    });

    return stats;
  }

  async getTopInfluencers(contentId: string, limit: number = 10): Promise<PropagationNode[]> {
    const nodes = await this.findByContentId(contentId);
    return nodes
      .sort((a, b) => (b.shareCount + b.viewCount) - (a.shareCount + a.viewCount))
      .slice(0, limit);
  }
}

export const propagationRepository = new PropagationRepository();
