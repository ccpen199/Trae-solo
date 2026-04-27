import React from 'react';
import { useAppStore } from '../store/appStore';
import { BusinessNode } from '../types';

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('异常') || statusLower.includes('告警') || statusLower.includes('紧急')) {
    return 'bg-red-100 text-red-800 border-red-300';
  }
  if (statusLower.includes('运行') || statusLower.includes('正常') || statusLower.includes('活跃')) {
    return 'bg-green-100 text-green-800 border-green-300';
  }
  if (statusLower.includes('等待') || statusLower.includes('待命') || statusLower.includes('待审批')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
  if (statusLower.includes('分析') || statusLower.includes('评估') || statusLower.includes('执行')) {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  }
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusDot = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('异常') || statusLower.includes('告警') || statusLower.includes('紧急')) {
    return 'bg-red-500 animate-pulse';
  }
  if (statusLower.includes('运行') || statusLower.includes('正常') || statusLower.includes('活跃')) {
    return 'bg-green-500';
  }
  if (statusLower.includes('等待') || statusLower.includes('待命') || statusLower.includes('待审批')) {
    return 'bg-yellow-500';
  }
  if (statusLower.includes('分析') || statusLower.includes('评估') || statusLower.includes('执行')) {
    return 'bg-blue-500';
  }
  return 'bg-gray-500';
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

export const BusinessNodeList: React.FC = () => {
  const businessNodes = useAppStore((state) => state.businessNodes);
  const [selectedNode, setSelectedNode] = React.useState<BusinessNode | null>(null);

  if (businessNodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        暂无业务节点数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        业务节点状态
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {businessNodes.map((node) => (
          <div
            key={node.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedNode?.id === node.id ? 'ring-2 ring-blue-400' : ''
            } ${getStatusColor(node.currentStatus)}`}
            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded-full ${getStatusDot(node.currentStatus)}`}></span>
                  <h4 className="font-medium">{node.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{node.description}</p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">来源:</span>
                    <span className="font-medium">{node.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">责任人:</span>
                    <span className="font-medium">{node.responsiblePerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">当前状态:</span>
                    <span className="font-medium">{node.currentStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedNode?.id === node.id && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500">下一步动作:</span>
                    <p className="font-medium mt-1 p-2 bg-white/50 rounded">
                      {node.nextAction}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">更新时间:</span>
                    <span className="font-medium">{formatTime(node.lastUpdateTime)}</span>
                  </div>
                  
                  {node.dependencies.length > 0 && (
                    <div>
                      <span className="text-gray-500">依赖节点:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.dependencies.map((dep) => (
                          <span key={dep} className="px-2 py-1 bg-white/50 rounded text-xs">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {node.affectedNodes.length > 0 && (
                    <div>
                      <span className="text-gray-500">影响节点:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.affectedNodes.map((aff) => (
                          <span key={aff} className="px-2 py-1 bg-white/50 rounded text-xs">
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
        ))}
      </div>
    </div>
  );
};

export default BusinessNodeList;
