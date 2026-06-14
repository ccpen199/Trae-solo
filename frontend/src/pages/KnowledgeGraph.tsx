import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { useEntityStore } from '@/stores/entityStore';
import { useNoteStore } from '@/stores/noteStore';
import type { EntityType } from '@/types';

type FilterType = EntityType | 'all';

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: '全部', value: 'all' },
  { label: '人名', value: 'person' },
  { label: '概念', value: 'concept' },
  { label: '事件', value: 'event' },
];

const TYPE_BADGE_MAP: Record<string, string> = {
  person: 'badge-blue',
  concept: 'badge-green',
  event: 'badge-gold',
  place: 'badge-red',
  work: 'badge-gold',
};

const TYPE_LABEL_MAP: Record<string, string> = {
  person: '人名',
  concept: '概念',
  event: '事件',
  place: '地点',
  work: '作品',
};

export default function KnowledgeGraph() {
  const {
    getFilteredGraph,
    selectedEntity,
    selectEntity,
    filterType,
    setFilterType,
    buildGraphData,
    entities,
    relations,
  } = useEntityStore();

  const { notes, loadNotes } = useNoteStore();
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    buildGraphData();
    loadNotes();
  }, [buildGraphData, loadNotes]);

  const buildCytoscape = useCallback(() => {
    if (!cyRef.current) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
      cyInstance.current = null;
    }

    const { nodes, edges } = getFilteredGraph();

    const cyElements: cytoscape.ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: { id: n.id, label: n.label, type: n.type, description: n.description, noteCount: n.noteCount },
      })),
      ...edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, relation: e.relation },
      })),
    ];

    const cy = cytoscape({
      container: cyRef.current,
      elements: cyElements,
      style: [
        {
          selector: 'node[type="person"]',
          style: {
            'background-color': '#3B5998',
            shape: 'round-rectangle',
            width: 80,
            height: 40,
            'border-width': 2,
            'border-color': '#5B7BB8',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 12,
            color: '#fff',
            'text-outline-width': 1,
            'text-outline-color': '#3B5998',
            'text-wrap': 'ellipsis',
            'text-max-width': '70px',
          },
        },
        {
          selector: 'node[type="concept"]',
          style: {
            'background-color': '#4A8B7A',
            shape: 'ellipse',
            width: 60,
            height: 60,
            'border-width': 2,
            'border-color': '#6AAB9A',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 11,
            color: '#fff',
            'text-outline-width': 1,
            'text-outline-color': '#4A8B7A',
            'text-wrap': 'ellipsis',
            'text-max-width': '55px',
          },
        },
        {
          selector: 'node[type="event"]',
          style: {
            'background-color': '#B8860B',
            shape: 'diamond',
            width: 70,
            height: 70,
            'border-width': 2,
            'border-color': '#D4A843',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 11,
            color: '#fff',
            'text-outline-width': 1,
            'text-outline-color': '#B8860B',
            'text-wrap': 'ellipsis',
            'text-max-width': '60px',
          },
        },
        {
          selector: 'node[type="place"]',
          style: {
            'background-color': '#C41E3A',
            shape: 'round-rectangle',
            width: 75,
            height: 40,
            'border-width': 2,
            'border-color': '#E43E5A',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 11,
            color: '#fff',
            'text-outline-width': 1,
            'text-outline-color': '#C41E3A',
            'text-wrap': 'ellipsis',
            'text-max-width': '65px',
          },
        },
        {
          selector: 'node[type="work"]',
          style: {
            'background-color': '#B8860B',
            shape: 'round-rectangle',
            width: 80,
            height: 40,
            'border-width': 2,
            'border-color': '#D4A843',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 11,
            color: '#fff',
            'text-outline-width': 1,
            'text-outline-color': '#B8860B',
            'text-wrap': 'ellipsis',
            'text-max-width': '70px',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': 'rgba(184, 134, 11, 0.3)',
            'target-arrow-color': 'rgba(184, 134, 11, 0.5)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(relation)',
            'font-size': 9,
            color: '#9D9078',
            'text-rotation': 'autorotate',
            'text-background-color': '#FBF8F0',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
          },
        },
        {
          selector: 'node:active, node:grabbed',
          style: {
            'overlay-opacity': 0,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#B8860B',
            'z-index': 999,
          },
        },
        {
          selector: 'edge.hover-highlight',
          style: {
            width: 3,
            'line-color': 'rgba(184, 134, 11, 0.7)',
            'target-arrow-color': 'rgba(184, 134, 11, 0.8)',
          },
        },
      ],
      layout: {
        name: 'cose',
        padding: 40,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        gravity: 0.3,
        animate: true,
        animationDuration: 500,
      } as cytoscape.LayoutOptions,
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.id();
      setSelectedNodeId(nodeId);
      selectEntity(nodeId);

      cy.nodes().removeClass('highlighted');
      node.addClass('highlighted');
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNodeId(null);
        selectEntity(null);
        cy.nodes().removeClass('highlighted');
      }
    });

    cy.on('mouseover', 'edge', (evt) => {
      evt.target.addClass('hover-highlight');
    });

    cy.on('mouseout', 'edge', (evt) => {
      evt.target.removeClass('hover-highlight');
    });

    cyInstance.current = cy;
  }, [getFilteredGraph, selectEntity]);

  useEffect(() => {
    buildCytoscape();
    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [buildCytoscape, filterType]);

  const relatedNotes = selectedEntity
    ? notes.filter((n) => selectedEntity.noteIds.includes(n.id))
    : [];

  const relatedRelations = selectedEntity
    ? relations.filter(
        (r) =>
          r.sourceEntityId === selectedEntity.id ||
          r.targetEntityId === selectedEntity.id,
      )
    : [];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      <div className="flex items-center gap-4">
        <h1 className="title-serif text-xl">知识图谱</h1>
        <div className="flex gap-1 ml-4">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`tab-item ${filterType === opt.value ? 'tab-item-active' : ''}`}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-3/4 card-parchment-solid p-3">
          <div ref={cyRef} className="w-full h-full rounded-lg" />
        </div>

        <div className="w-1/4 card-parchment-solid p-4 overflow-y-auto flex flex-col gap-4">
          {!selectedEntity ? (
            <div className="flex-1 flex items-center justify-center text-ink-300 text-sm">
              点击图谱中的节点查看详情
            </div>
          ) : (
            <>
              <div>
                <h2 className="title-serif text-lg mb-2">
                  {selectedEntity.name}
                </h2>
                <span className={TYPE_BADGE_MAP[selectedEntity.type] || 'badge-gold'}>
                  {TYPE_LABEL_MAP[selectedEntity.type] || selectedEntity.type}
                </span>
              </div>

              {selectedEntity.description && (
                <div>
                  <h3 className="text-xs font-medium text-ink-400 mb-1">描述</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">
                    {selectedEntity.description}
                  </p>
                </div>
              )}

              {relatedNotes.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-ink-400 mb-2">关联笔记</h3>
                  <div className="flex flex-col gap-1.5">
                    {relatedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="text-sm text-ink-600 px-2 py-1.5 rounded bg-parchment-50 hover:bg-parchment-200/60 cursor-pointer transition-colors truncate"
                      >
                        {note.title || `笔记 ${note.id.slice(0, 8)}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedRelations.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-ink-400 mb-2">关系</h3>
                  <div className="flex flex-col gap-1.5">
                    {relatedRelations.map((rel) => {
                      const otherEntityId =
                        rel.sourceEntityId === selectedEntity.id
                          ? rel.targetEntityId
                          : rel.sourceEntityId;
                      const otherEntity = entities.find(
                        (e) => e.id === otherEntityId,
                      );
                      return (
                        <div
                          key={rel.id}
                          className="text-sm text-ink-600 px-2 py-1.5 rounded bg-parchment-50 truncate"
                        >
                          <span className="text-ink-800 font-medium">
                            {otherEntity?.name || otherEntityId.slice(0, 8)}
                          </span>
                          <span className="text-ink-300 mx-1">·</span>
                          <span className="text-classic-gold">
                            {rel.relationType}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
