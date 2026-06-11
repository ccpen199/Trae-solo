import { create } from 'zustand';
import type {
  Entity,
  Relation,
  Subscription,
  PushItem,
  Report,
  Annotation,
  TimelineEvent,
  Concept,
  SourceScore,
  SummaryReview,
  LineageData,
  Triple,
} from '@/../shared/types';
import {
  mockEntities,
  mockRelations,
  mockSubscriptions,
  mockPushes,
  mockReports,
  mockAnnotations,
  mockTimelineEvents,
  mockConcepts,
  mockSourceScores,
  mockSummaryReviews,
  mockTriples,
  mockLineageData,
} from '@/mock/data';

interface AppState {
  entities: Entity[];
  relations: Relation[];
  subscriptions: Subscription[];
  pushes: PushItem[];
  reports: Report[];
  annotations: Annotation[];
  timelineEvents: TimelineEvent[];
  concepts: Concept[];
  sourceScores: SourceScore[];
  summaryReviews: SummaryReview[];
  triples: Triple[];
  lineageData: LineageData | null;
  selectedEntity: Entity | null;
  searchQuery: string;

  setSelectedEntity: (entity: Entity | null) => void;
  setSearchQuery: (query: string) => void;
  markPushRead: (id: string) => void;
  markAllPushesRead: () => void;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  removeSubscription: (id: string) => void;
  searchEntities: (query: string) => Entity[];
  getEntityRelations: (entityId: string, depth?: number) => { nodes: Entity[]; links: Relation[] };
  getEntityTimeline: (entityId: string) => TimelineEvent[];
  getReportAnnotations: (reportId: string) => Annotation[];
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  verifyTriple: (tripleId: string, verified: boolean) => void;
  updateSummaryReview: (id: string, status: SummaryReview['status'], comment?: string) => void;
  getUnreadPushCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  entities: mockEntities,
  relations: mockRelations,
  subscriptions: mockSubscriptions,
  pushes: mockPushes,
  reports: mockReports,
  annotations: mockAnnotations,
  timelineEvents: mockTimelineEvents,
  concepts: mockConcepts,
  sourceScores: mockSourceScores,
  summaryReviews: mockSummaryReviews,
  triples: mockTriples,
  lineageData: mockLineageData,
  selectedEntity: null,
  searchQuery: '',

  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  markPushRead: (id) =>
    set((state) => ({
      pushes: state.pushes.map((p) => (p.id === id ? { ...p, read: true } : p)),
    })),

  markAllPushesRead: () =>
    set((state) => ({
      pushes: state.pushes.map((p) => ({ ...p, read: true })),
    })),

  addSubscription: (sub) =>
    set((state) => ({
      subscriptions: [
        ...state.subscriptions,
        { ...sub, id: `sub-${Date.now()}`, createdAt: new Date().toISOString() },
      ],
    })),

  removeSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    })),

  searchEntities: (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return get()
      .entities.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      )
      .slice(0, 10);
  },

  getEntityRelations: (entityId, depth = 2) => {
    const { entities, relations } = get();
    const nodeIds = new Set<string>([entityId]);
    const collectedLinks: Relation[] = [];

    let currentLayer = [entityId];
    for (let d = 0; d < depth; d++) {
      const nextLayer = new Set<string>();
      for (const id of currentLayer) {
        for (const rel of relations) {
          if (rel.sourceId === id && !nodeIds.has(rel.targetId)) {
            collectedLinks.push(rel);
            nextLayer.add(rel.targetId);
          }
          if (rel.targetId === id && !nodeIds.has(rel.sourceId)) {
            collectedLinks.push(rel);
            nextLayer.add(rel.sourceId);
          }
        }
      }
      nextLayer.forEach((id) => nodeIds.add(id));
      currentLayer = Array.from(nextLayer);
      if (currentLayer.length === 0) break;
    }

    const collectedNodes = entities.filter((e) => nodeIds.has(e.id));
    return { nodes: collectedNodes, links: collectedLinks };
  },

  getEntityTimeline: (entityId) => {
    return get()
      .timelineEvents.filter((e) => e.entityId === entityId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getReportAnnotations: (reportId) => {
    return get().annotations.filter((a) => a.reportId === reportId);
  },

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [
        ...state.annotations,
        { ...annotation, id: `ann-${Date.now()}`, createdAt: new Date().toISOString() },
      ],
    })),

  verifyTriple: (tripleId, verified) =>
    set((state) => ({
      triples: state.triples.map((t) =>
        t.id === tripleId ? { ...t, verified } : t
      ),
    })),

  updateSummaryReview: (id, status, comment) =>
    set((state) => ({
      summaryReviews: state.summaryReviews.map((r) =>
        r.id === id ? { ...r, status, reviewerComment: comment ?? r.reviewerComment } : r
      ),
    })),

  getUnreadPushCount: () => get().pushes.filter((p) => !p.read).length,
}));
