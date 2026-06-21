import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Search, Filter, ZoomIn, ZoomOut, Maximize2, RefreshCw, User, Building2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { getMockGraphData, mockPersons, mockPositions, mockJudicialRisks, mockEquityRelations } from '../data/persons';
import type { GraphNode, GraphLink, Person } from '../types/person';
import { formatMoney } from '../utils/format';

export default function Relationship() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('position');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const graphData = getMockGraphData();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const nodes: GraphNode[] = graphData.nodes.map(d => ({ ...d }));
    const links: GraphLink[] = graphData.links.map(d => ({ ...d }));

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        if (d.type === 'judicial') return '#F59E0B';
        if (d.type === 'equity') return '#3B82F6';
        if (d.type === 'position') return '#8B5CF6';
        return '#475569';
      })
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => d.value ? d.value : 1.5)
      .attr('stroke-dasharray', d => d.type === 'indirect' ? '5,5' : 'none');

    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links.filter(l => l.label))
      .join('text')
      .text(d => d.label || '')
      .attr('font-size', '10px')
      .attr('fill', '#64748B')
      .attr('text-anchor', 'middle');

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
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
        })
      );

    node.append('circle')
      .attr('r', d => d.radius || 20)
      .attr('fill', d => d.color || '#3B82F6')
      .attr('fill-opacity', 0.2)
      .attr('stroke', d => d.color || '#3B82F6')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d.radius || 20) * 1.2)
          .attr('fill-opacity', 0.4);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius || 20)
          .attr('fill-opacity', 0.2);
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
      });

    node.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.radius || 20) + 14)
      .attr('font-size', '11px')
      .attr('fill', '#E2E8F0')
      .attr('font-weight', '500');

    node.append('text')
      .text(d => {
        if (d.type === 'company') return '🏢';
        if (d.type === 'person') return '👤';
        return '⚠️';
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => (d.radius || 20) * 0.8);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(d => {
        if (d.type === 'position') return 120;
        if (d.type === 'equity') return 180;
        if (d.type === 'judicial') return 100;
        return 150;
      }))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => ((d as any).radius || 20) + 10));

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node.attr('transform', d => `translate(${(d as any).x}, ${(d as any).y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  const getNodeDetail = (node: GraphNode) => {
    if (node.type === 'person') {
      return mockPersons.find(p => p.id === node.id);
    }
    return null;
  };

  const personDetail = selectedNode?.type === 'person' ? getNodeDetail(selectedNode) as Person : null;
  const personPositions = personDetail ? mockPositions.filter(p => p.personId === personDetail.id) : [];
  const personJudicial = personDetail ? mockJudicialRisks.filter(j => j.personId === personDetail.id) : [];

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom().scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom().scaleBy, 0.7);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(d3.zoom().transform, d3.zoomIdentity);
  };

  const legendItems = [
    { label: '企业', color: '#3B82F6', type: 'company' },
    { label: '人物', color: '#8B5CF6', type: 'person' },
    { label: '司法风险', color: '#F59E0B', type: 'judicial' },
  ];

  const relationTypes = [
    { label: '任职关系', color: '#8B5CF6' },
    { label: '股权关系', color: '#3B82F6' },
    { label: '司法关联', color: '#F59E0B' },
    { label: '行业关系', color: '#475569' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">人物关系图谱</h1>
            <p className="text-sm text-dark-400 mt-1">高管任职轨迹、股权穿透分析、司法风险关联</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="搜索企业、人物名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full h-9 pl-10 pr-4 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 transition-all"
              />
            </div>
            <Button variant="outline" size="md" icon={<Filter className="w-4 h-4" />}>
              筛选
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-6 pb-6 gap-5 min-h-0">
        <div className="flex-1 relative">
          <Card className="h-full overflow-hidden">
            <div ref={containerRef} className="h-full relative bg-gradient-to-br from-dark-900 to-dark-950">
              <svg ref={svgRef} className="w-full h-full" />
              
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button
                  onClick={handleZoomIn}
                  className="w-9 h-9 bg-dark-800/80 backdrop-blur-sm border border-dark-700/50 rounded-lg flex items-center justify-center text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-9 h-9 bg-dark-800/80 backdrop-blur-sm border border-dark-700/50 rounded-lg flex items-center justify-center text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="w-9 h-9 bg-dark-800/80 backdrop-blur-sm border border-dark-700/50 rounded-lg flex items-center justify-center text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute top-4 right-4 bg-dark-800/80 backdrop-blur-sm border border-dark-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-dark-300 mb-2">缩放: {Math.round(zoomLevel * 100)}%</p>
                <p className="text-[10px] text-dark-500">拖拽节点可调整位置</p>
              </div>

              <div className="absolute bottom-4 left-4 bg-dark-800/80 backdrop-blur-sm border border-dark-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-dark-300 mb-2">节点类型</p>
                <div className="space-y-1.5">
                  {legendItems.map((item) => (
                    <div key={item.type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}40` }}
                      />
                      <span className="text-xs text-dark-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-dark-800/80 backdrop-blur-sm border border-dark-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-dark-300 mb-2">关系类型</p>
                <div className="space-y-1.5">
                  {relationTypes.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-0.5" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-dark-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="w-80 flex flex-col gap-4">
          {selectedNode ? (
            <Card className="flex-shrink-0">
              <Card.Header>
                <Card.Title>节点详情</Card.Title>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-dark-500 hover:text-dark-300 transition-colors"
                >
                  关闭
                </button>
              </Card.Header>
              <Card.Body>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2"
                    style={{
                      backgroundColor: `${selectedNode.color}20`,
                      borderColor: selectedNode.color,
                      boxShadow: `0 0 15px ${selectedNode.color}30`,
                    }}
                  >
                    {selectedNode.type === 'company' ? '🏢' : selectedNode.type === 'person' ? '👤' : '⚠️'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedNode.name}</h3>
                    <Tag
                      variant={
                        selectedNode.type === 'company' ? 'primary' :
                        selectedNode.type === 'person' ? 'purple' : 'warning'
                      }
                      size="sm"
                    >
                      {selectedNode.type === 'company' ? '企业' : selectedNode.type === 'person' ? '人物' : '司法风险'}
                    </Tag>
                  </div>
                </div>

                {selectedNode.type === 'person' && personDetail && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-dark-500 text-xs">性别</p>
                        <p className="text-dark-200">{personDetail.gender === 'male' ? '男' : '女'}</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs">出生年份</p>
                        <p className="text-dark-200">{personDetail.birthYear}年</p>
                      </div>
                      <div>
                        <p className="text-dark-500 text-xs">学历</p>
                        <p className="text-dark-200">{personDetail.education}</p>
                      </div>
                    </div>
                    {personDetail.description && (
                      <div>
                        <p className="text-dark-500 text-xs mb-1">简介</p>
                        <p className="text-sm text-dark-300">{personDetail.description}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="divider -mx-5 my-4" />

                <Tabs
                  tabs={[
                    { key: 'position', label: '任职轨迹', count: personPositions.length },
                    { key: 'equity', label: '股权关联' },
                    { key: 'judicial', label: '司法风险', count: personJudicial.length },
                  ]}
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  variant="pills"
                  className="mb-4"
                />

                {activeTab === 'position' && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {personPositions.length > 0 ? (
                      personPositions.map((pos) => (
                        <div key={pos.id} className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/30">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{pos.title}</p>
                            <Tag variant={pos.isCurrent ? 'success' : 'default'} size="sm">
                              {pos.isCurrent ? '现任' : '曾任'}
                            </Tag>
                          </div>
                          <p className="text-xs text-brand-400 mt-1">{pos.companyName}</p>
                          <p className="text-xs text-dark-500 mt-1">
                            {pos.startDate} - {pos.endDate || '至今'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-dark-500 text-center py-4">暂无任职数据</p>
                    )}
                  </div>
                )}

                {activeTab === 'equity' && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {mockEquityRelations.slice(0, 5).map((eq) => (
                      <div key={eq.id} className="p-3 rounded-lg bg-dark-800/30 border border-dark-700/30">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-dark-200">{eq.toCompanyName}</p>
                          <Tag variant="primary" size="sm">
                            {(eq.shareRatio * 100).toFixed(1)}%
                          </Tag>
                        </div>
                        <p className="text-xs text-dark-500 mt-1">
                          {eq.type === 'direct' ? '直接持股' : '间接持股'} · {eq.level}级
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'judicial' && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {personJudicial.length > 0 ? (
                      personJudicial.map((jr) => (
                        <div key={jr.id} className="p-3 rounded-lg bg-dark-800/30 border border-warning-500/20">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning-500" />
                            <span className="text-sm font-medium text-warning-500">
                              {jr.type === 'lawsuit' ? '诉讼' : jr.type === 'execution' ? '执行' : jr.type === 'dishonest' ? '失信' : '冻结'}
                            </span>
                          </div>
                          <p className="text-xs text-dark-300 mt-2 line-clamp-2">{jr.description}</p>
                          {jr.amount && (
                            <p className="text-xs text-dark-500 mt-1">涉及金额: {formatMoney(jr.amount)}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-dark-500 text-center py-4">暂无司法风险</p>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card className="flex-shrink-0">
              <Card.Header>
                <Card.Title>操作提示</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3 text-sm text-dark-400">
                  <p>• 点击节点查看详细信息</p>
                  <p>• 拖拽节点可调整位置</p>
                  <p>• 滚轮缩放图谱</p>
                  <p>• 使用搜索快速定位</p>
                </div>
              </Card.Body>
            </Card>
          )}

          <Card className="flex-1 min-h-0 flex flex-col">
            <Card.Header>
              <Card.Title>热门人物</Card.Title>
              <Tag variant="outline">本周</Tag>
            </Card.Header>
            <Card.Body className="flex-1 overflow-y-auto py-3">
              <div className="space-y-2">
                {mockPersons.slice(0, 6).map((person, index) => (
                  <div
                    key={person.id}
                    onClick={() => {
                      const node = graphData.nodes.find(n => n.id === person.id);
                      if (node) setSelectedNode(node);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-800/50 cursor-pointer transition-colors group"
                  >
                    <span className="w-5 h-5 rounded-full bg-dark-700 flex items-center justify-center text-[10px] font-bold text-dark-400">
                      {index + 1}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-lg border border-purple-500/30">
                      {person.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-dark-500 truncate">{person.education}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-dark-400 transition-colors" />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
