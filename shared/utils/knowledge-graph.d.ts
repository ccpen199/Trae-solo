import type { Policy, KnowledgeQAPair, KnowledgeNode, CitizenProfile } from '../types';
export interface GraphSearchResult {
    node: KnowledgeNode;
    score: number;
    relatedNodes: KnowledgeNode[];
    path: string[];
}
export declare function buildKnowledgeGraph(policies: Policy[]): Map<string, KnowledgeNode>;
export declare function searchKnowledgeGraph(graph: Map<string, KnowledgeNode>, query: string, userProfile?: CitizenProfile, limit?: number): GraphSearchResult[];
export declare function generateQAMatches(qaPairs: KnowledgeQAPair[], query: string, threshold?: number): (KnowledgeQAPair & {
    score: number;
})[];
export declare function matchPoliciesToProfile(policies: Policy[], profile: CitizenProfile): (Policy & {
    matchScore: number;
    matchReasons: string[];
})[];
//# sourceMappingURL=knowledge-graph.d.ts.map