import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Entity, Relation } from '@/../shared/types';

interface Props {
  nodes: Entity[];
  links: Relation[];
  onNodeClick?: (entity: Entity) => void;
  highlightNodeId?: string;
  width?: number;
  height?: number;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: Entity['type'];
  hotScore?: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  predicate: string;
  confidence: number;
  verified: boolean;
}

const typeColors: Record<Entity['type'], { node: string; glow: string }> = {
  company: { node: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)' },
  person: { node: '#A855F7', glow: 'rgba(168, 85, 247, 0.5)' },
  institution: { node: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)' },
  concept: { node: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
  industry: { node: '#C9A962', glow: 'rgba(201, 169, 98, 0.5)' },
};

export default function KnowledgeGraph({
  nodes,
  links,
  onNodeClick,
  highlightNodeId,
  width = 800,
  height = 600,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dim, setDim] = useState({ width, height });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDim({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width: w, height: h } = dim;

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      hotScore: n.hotScore,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = links
      .filter((l) => nodeMap.has(l.sourceId) && nodeMap.has(l.targetId))
      .map((l) => ({
        source: nodeMap.get(l.sourceId)!,
        target: nodeMap.get(l.targetId)!,
        predicate: l.predicate,
        confidence: l.confidence,
        verified: l.verified,
      }));

    const defs = svg.append('defs');
    Object.entries(typeColors).forEach(([type, colors]) => {
      const grad = defs
        .append('radialGradient')
        .attr('id', `grad-${type}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', colors.node).attr('stop-opacity', 0.9);
      grad.append('stop').attr('offset', '100%').attr('stop-color', colors.node).attr('stop-opacity', 0.5);

      defs
        .append('filter')
        .attr('id', `glow-${type}`)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%')
        .append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur');
    });

    const container = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    svg.call(zoom as any);

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(130).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide().radius(45));

    const linkGroup = container.append('g').attr('class', 'links');
    const linkLabelGroup = container.append('g').attr('class', 'link-labels');
    const nodeGroup = container.append('g').attr('class', 'nodes');
    const labelGroup = container.append('g').attr('class', 'labels');

    const link = linkGroup
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => (d.verified ? 'rgba(201, 169, 98, 0.45)' : 'rgba(100, 116, 139, 0.3)'))
      .attr('stroke-width', (d) => 1 + d.confidence * 2.5)
      .attr('stroke-dasharray', (d) => (d.verified ? '' : '4 4'));

    const linkLabel = linkLabelGroup
      .selectAll('text')
      .data(simLinks)
      .join('text')
      .text((d) => d.predicate)
      .attr('font-size', 10)
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.8)');

    const node = nodeGroup
      .selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', (d) => (d.hotScore ? 10 + Math.min(d.hotScore / 10, 14) : 14))
      .attr('fill', (d) => `url(#grad-${d.type})`)
      .attr('stroke', (d) => typeColors[d.type].node)
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .style('filter', (d) => `drop-shadow(0 0 6px ${typeColors[d.type].glow})`)
      .on('mouseover', function (_e, d) {
        setHovered(d.id);
        d3.select(this).transition().duration(150).attr('stroke-width', 3).attr('r', (n: any) => n.r.baseVal.value + 3);
      })
      .on('mouseout', function (_e, d) {
        setHovered(null);
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 1.5)
          .attr('r', (n: any) => n.r.baseVal.value - 3);
      })
      .on('click', (_e, d) => {
        const full = nodes.find((n) => n.id === d.id);
        if (full && onNodeClick) onNodeClick(full);
      })
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    const label = labelGroup
      .selectAll('text')
      .data(simNodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', 12)
      .attr('font-weight', 500)
      .attr('fill', '#e2e8f0')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.hotScore ? -14 - Math.min(d.hotScore / 10, 14) - 4 : -20))
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 4px rgba(0,0,0,0.9)');

    if (highlightNodeId) {
      const hl = node.filter((d) => d.id === highlightNodeId);
      hl.attr('stroke', '#C9A962')
        .attr('stroke-width', 3.5)
        .style('filter', 'drop-shadow(0 0 12px rgba(201,169,98,0.8))');
    }

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 6);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    setTimeout(() => simulation.alpha(0.3).restart(), 50);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dim, highlightNodeId]);

  const hoveredEntity = hovered ? nodes.find((n) => n.id === hovered) : null;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        width={dim.width}
        height={dim.height}
        className="cursor-grab active:cursor-grabbing"
      />
      {hoveredEntity && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-gold-500/20 bg-finance-800/95 px-4 py-3 shadow-xl backdrop-blur-sm animate-fade-in-up">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: typeColors[hoveredEntity.type].node }}
            />
            <span className="text-xs uppercase tracking-wider text-slate-400">
              {hoveredEntity.type === 'company'
                ? '上市公司'
                : hoveredEntity.type === 'person'
                  ? '人物'
                  : hoveredEntity.type === 'institution'
                    ? '机构'
                    : hoveredEntity.type === 'concept'
                      ? '概念'
                      : '行业'}
            </span>
          </div>
          <p className="mt-1 font-serif text-base font-semibold text-gold-200">
            {hoveredEntity.name}
          </p>
          {hoveredEntity.description && (
            <p className="mt-1 max-w-xs text-xs text-slate-400">{hoveredEntity.description}</p>
          )}
          {hoveredEntity.metadata?.stockCode && (
            <p className="mt-1 text-xs text-gold-400">
              股票代码：{hoveredEntity.metadata.stockCode}
            </p>
          )}
        </div>
      )}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 rounded-md border border-gold-500/10 bg-finance-800/80 px-3 py-2 text-[11px] backdrop-blur-sm">
        {(['company', 'person', 'institution', 'concept', 'industry'] as Entity['type'][]).map(
          (t) => (
            <div key={t} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: typeColors[t].node }}
              />
              <span className="text-slate-400">
                {t === 'company'
                  ? '公司'
                  : t === 'person'
                    ? '人物'
                    : t === 'institution'
                      ? '机构'
                      : t === 'concept'
                        ? '概念'
                        : '行业'}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
