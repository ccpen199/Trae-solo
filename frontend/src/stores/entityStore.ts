import { create } from 'zustand';
import { db, generateId } from '@/db';
import type { Entity, EntityRelation, EntityType } from '@/types';
import dayjs from 'dayjs';

interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  description?: string;
  noteCount: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  noteId: string;
}

interface EntityStore {
  entities: Entity[];
  relations: EntityRelation[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  selectedEntity: Entity | null;
  filterType: EntityType | 'all';
  filterBookId: string | null;
  loading: boolean;

  loadEntities: () => Promise<void>;
  loadRelations: () => Promise<void>;
  buildGraphData: () => Promise<void>;
  selectEntity: (id: string | null) => void;
  setFilterType: (type: EntityType | 'all') => void;
  setFilterBookId: (bookId: string | null) => void;
  addEntity: (name: string, type: EntityType, description?: string) => Promise<string>;
  addRelation: (sourceId: string, targetId: string, relationType: string, noteId: string) => Promise<string>;
  extractEntitiesFromText: (text: string, noteId: string) => Promise<void>;
  getFilteredGraph: () => { nodes: GraphNode[]; edges: GraphEdge[] };
}

const KNOWN_PERSONS = [
  '卡尼曼', '冯诺依曼', '图灵', '马尔克斯', '布恩迪亚',
  '丹尼尔', '冯·诺依曼', '加西亚',
];

const KNOWN_CONCEPTS = [
  '缓存', '局部性', '锚定', '系统1', '系统2', '魔幻现实',
  '启发法', '可得性', '认知偏差', '局部性原理',
];

const KNOWN_EVENTS = [
  '诺贝尔', '科技革命', '起义',
];

function matchEntities(text: string): { name: string; type: EntityType }[] {
  const found: { name: string; type: EntityType }[] = [];

  for (const p of KNOWN_PERSONS) {
    if (text.includes(p)) {
      found.push({ name: p, type: 'person' });
    }
  }
  for (const c of KNOWN_CONCEPTS) {
    if (text.includes(c)) {
      found.push({ name: c, type: 'concept' });
    }
  }
  for (const e of KNOWN_EVENTS) {
    if (text.includes(e)) {
      found.push({ name: e, type: 'event' });
    }
  }

  return found;
}

export const useEntityStore = create<EntityStore>((set, get) => ({
  entities: [],
  relations: [],
  graphNodes: [],
  graphEdges: [],
  selectedEntity: null,
  filterType: 'all',
  filterBookId: null,
  loading: false,

  loadEntities: async () => {
    set({ loading: true });
    const entities = await db.entities.toArray();
    set({ entities, loading: false });
  },

  loadRelations: async () => {
    const relations = await db.entityRelations.toArray();
    set({ relations });
  },

  buildGraphData: async () => {
    await get().loadEntities();
    await get().loadRelations();
    const { entities, relations } = get();

    const nodes: GraphNode[] = entities.map(e => ({
      id: e.id,
      label: e.name,
      type: e.type,
      description: e.description,
      noteCount: e.noteIds.length,
    }));

    const edges: GraphEdge[] = relations.map(r => ({
      id: r.id,
      source: r.sourceEntityId,
      target: r.targetEntityId,
      relation: r.relationType,
      noteId: r.noteId,
    }));

    set({ graphNodes: nodes, graphEdges: edges });
  },

  selectEntity: (id) => {
    if (!id) {
      set({ selectedEntity: null });
      return;
    }
    const entity = get().entities.find(e => e.id === id) || null;
    set({ selectedEntity: entity });
  },

  setFilterType: (type) => set({ filterType: type }),
  setFilterBookId: (bookId) => set({ filterBookId: bookId }),

  addEntity: async (name, type, description) => {
    const existing = get().entities.find(e => e.name === name && e.type === type);
    if (existing) return existing.id;

    const id = generateId();
    const entity: Entity = {
      id,
      name,
      type,
      description,
      noteIds: [],
      createdAt: dayjs().toISOString(),
    };
    await db.entities.add(entity);
    set(state => ({ entities: [...state.entities, entity] }));
    return id;
  },

  addRelation: async (sourceId, targetId, relationType, noteId) => {
    const id = generateId();
    const relation: EntityRelation = {
      id,
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      relationType,
      noteId,
    };
    await db.entityRelations.add(relation);
    set(state => ({ relations: [...state.relations, relation] }));
    return id;
  },

  extractEntitiesFromText: async (text, noteId) => {
    const found = matchEntities(text);
    for (const f of found) {
      const entityId = await get().addEntity(f.name, f.type);

      const entity = await db.entities.get(entityId);
      if (entity && !entity.noteIds.includes(noteId)) {
        await db.entities.update(entityId, {
          noteIds: [...entity.noteIds, noteId],
        });
      }
    }
    await get().buildGraphData();
  },

  getFilteredGraph: () => {
    const { graphNodes, graphEdges, filterType, filterBookId } = get();

    let filteredNodes = graphNodes;
    if (filterType !== 'all') {
      filteredNodes = filteredNodes.filter(n => n.type === filterType);
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphEdges.filter(
      e => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  },
}));
