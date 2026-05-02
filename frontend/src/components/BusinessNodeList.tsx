import React from 'react';
import { useAppStore } from '../store/appStore';
import { BusinessNode } from '../types';
import { Server, User, Activity, Clock, Link2, ArrowRight } from 'lucide-react';

const getStatusColor = (status: string): { bg: string; text: string; border: string; dot: string } => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('异常') || statusLower.includes('告警') || statusLower.includes('紧急')) {
    return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' };
  }
  if (statusLower.includes('运行') || statusLower.includes('正常') || statusLower.includes('活跃')) {
    return { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' };
  }
  if (statusLower.includes('等待') || statusLower.includes('待命') || statusLower.includes('待审批')) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500' };
  }
  if (statusLower.includes('分析') || statusLower.includes('评估') || statusLower.includes('执行')) {
    return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' };
  }
  return { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-500' };
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

const BusinessNodeList: React.FC = () => {
  const businessNodes = useAppStore((state) => state.businessNodes);
  const [selectedNode, setSelectedNode] = React.useState<BusinessNode | null>(null);

  if (businessNodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">暂无业务节点数据</p>
        <p className="text-gray-400 text-sm mt-2">等待后端连接获取数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          业务节点状态
        </h3>
        <span className="text-sm text-gray-500">共 {businessNodes.length} 个节点</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businessNodes.map((node) => {
          const colors = getStatusColor(node.currentStatus);
          const isSelected = selectedNode?.id === node.id;
          
          return (
            <div
              key={node.id}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 overflow-hidden ${
                isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-transparent'
              }`}
              onClick={() => setSelectedNode(isSelected ? null : node)}
            >
              <div className={`p-5 ${colors.bg}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shadow-sm`}>
                      <Activity className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${colors.dot === 'bg-red-500' ? 'animate-pulse' : ''}`}></span>
                        <h4 className="font-semibold text-gray-800">{node.name}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{node.description}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`} />
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <Server className="w-3 h-3" />
                      <span className="text-xs">来源</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{node.source}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-xs">责任人</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{node.responsiblePerson}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <Activity className="w-3 h-3" />
                      <span className="text-xs">状态</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {node.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="p-5 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <ArrowRight className="w-4 h-4" />
                        <span className="font-medium text-sm">下一步动作</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-white px-4 py-3 rounded-lg border border-gray-200">
                        {node.nextAction}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>更新时间: {formatTime(node.lastUpdateTime)}</span>
                    </div>
                    
                    {node.dependencies.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Link2 className="w-4 h-4" />
                          <span className="font-medium text-sm">依赖节点</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {node.dependencies.map((dep) => (
                            <span key={dep} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {node.affectedNodes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Link2 className="w-4 h-4" />
                          <span className="font-medium text-sm">影响节点</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {node.affectedNodes.map((aff) => (
                            <span key={aff} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              {aff}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessNodeList;
