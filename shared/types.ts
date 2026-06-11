export type EntityType = 'company' | 'person' | 'institution' | 'concept' | 'industry';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  metadata?: Record<string, any>;
  riskTags?: string[];
  hotScore?: number;
  updatedAt: string;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  predicate: string;
  confidence: number;
  sourceDocId?: string;
  sourceText?: string;
  verified: boolean;
  createdAt: string;
}

export interface Triple {
  id: string;
  subject: Entity;
  predicate: string;
  object: Entity;
  confidence: number;
  sourceText: string;
  sourceUrl?: string;
  sourceName?: string;
  extractedAt?: string;
  verified: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewHistory?: TripleReviewRecord[];
}

export interface TripleReviewRecord {
  id: string;
  tripleId: string;
  action: 'approve' | 'reject';
  reviewerId: string;
  reviewerName: string;
  comment?: string;
  timestamp: string;
}

export interface GraphData {
  nodes: Entity[];
  links: Relation[];
}

export type SubscriptionType = 'entity' | 'concept' | 'event';
export type NotifyLevel = 'all' | 'important' | 'risk';

export interface Subscription {
  id: string;
  type: SubscriptionType;
  targetId: string;
  targetName: string;
  notifyLevel: NotifyLevel;
  createdAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface PushItem {
  id: string;
  subscriptionId: string;
  title: string;
  summary: string;
  riskLevel: RiskLevel;
  sourceUrl: string;
  sourceName: string;
  highlightedText: string;
  relatedEntities: string[];
  publishedAt: string;
  read: boolean;
}

export type SummaryStatus = 'pending' | 'generating' | 'reviewing' | 'finalized';

export interface Report {
  id: string;
  title: string;
  author: string;
  publishDate: string;
  industry?: string;
  fileUrl: string;
  pageCount: number;
  collaborators: string[];
  summary?: string;
  summaryStatus: SummaryStatus;
  createdAt: string;
}

export type AnnotationType = 'highlight' | 'underline' | 'comment';

export interface Annotation {
  id: string;
  reportId: string;
  pageNumber: number;
  type: AnnotationType;
  color?: string;
  text?: string;
  comment?: string;
  annotatorId: string;
  annotatorName: string;
  position: { x: number; y: number; width: number; height: number };
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  entityId: string;
  title: string;
  description: string;
  date: string;
  type: 'announcement' | 'research' | 'news' | 'event';
  riskLevel?: RiskLevel;
  sourceUrl?: string;
}

export interface LineageNode {
  id: string;
  type: 'triple' | 'document' | 'source' | 'extraction_task';
  label: string;
  timestamp: string;
}

export interface LineageEdge {
  sourceId: string;
  targetId: string;
  relation: string;
}

export interface LineageData {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface SourceScore {
  sourceId: string;
  sourceName: string;
  dimensions: {
    authority: number;
    timeliness: number;
    accuracy: number;
    completeness: number;
  };
  overall: number;
  history: { date: string; score: number }[];
}

export type ReviewStatus = 'pending' | 'approved' | 'revised';

export interface SummaryReview {
  id: string;
  reportId: string;
  reportTitle: string;
  originalText: string;
  generatedSummary: string;
  reviewerId?: string;
  reviewerComment?: string;
  status: ReviewStatus;
  version: number;
  createdAt: string;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  relatedEntities: string[];
  hotScore: number;
}
