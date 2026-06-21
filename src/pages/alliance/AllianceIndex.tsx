import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/Empty';
import {
  Users, Shield, Building2, MapPin, Crown, ChevronDown, ChevronRight,
  Plus, RefreshCw, MoreHorizontal, Phone, Mail, Calendar, TrendingUp,
  Award, Target, DollarSign, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { allianceAPI } from '@/services/api';
import type { AllianceNode, AllianceLevel } from '../../../shared/types';

const AllianceIndex: React.FC = () => {
  const [structure, setStructure] = useState<AllianceNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await allianceAPI.getStructure();
        if (response.success && response.data) {
          setStructure(response.data.structure);
        }
      } catch (error) {
        console.error('获取联盟结构失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getLevelBadge = (level: AllianceLevel) => {
    switch (level) {
      case 'leader':
        return <Badge variant="gold" className="flex items-center gap-1"><Crown className="w-3 h-3" /> 盟主</Badge>;
      case 'branch':
        return <Badge variant="info" className="flex items-center gap-1"><Shield className="w-3 h-3" /> 分盟</Badge>;
      case 'station':
        return <Badge variant="success" className="flex items-center gap-1"><Building2 className="w-3 h-3" /> 站点</Badge>;
      default:
        return <Badge variant="default">{level}</Badge>;
    }
  };

  const getLevelColor = (level: AllianceLevel) => {
    switch (level) {
      case 'leader':
        return 'from-yellow-500 to-orange-500';
      case 'branch':
        return 'from-blue-500 to-cyan-500';
      case 'station':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const TreeNode: React.FC<{ node: AllianceNode; level: number; parentId?: string }> = ({ node, level, parentId }) => {
    const nodeId = `${parentId || 'root'}-${node.id}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="relative">
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
            isExpanded ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-green-300'
          }`}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getLevelColor(node.level)} flex items-center justify-center text-white flex-shrink-0`}>
            {node.level === 'leader' && <Crown className="w-5 h-5" />}
            {node.level === 'branch' && <Shield className="w-5 h-5" />}
            {node.level === 'station' && <Building2 className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-800">{node.name}</h4>
              {getLevelBadge(node.level)}
            </div>
            <p className="text-sm text-slate-500">
              负责人: {node.leaderName} · {node.members.length} 名成员
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {node.children?.length || 0} 个子节点
            </span>
            {hasChildren && (
              isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 mt-2 pl-4 border-l-2 border-slate-200 space-y-2">
            {node.children!.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} parentId={nodeId} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!structure) {
    return (
      <Layout requireAuth>
        <Empty
          title="暂无联盟结构"
          description="您还未加入任何联盟组织"
          action={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建联盟
            </Button>
          }
        />
      </Layout>
    );
  }

  const totalMembers = structure.members.length + 
    (structure.children?.reduce((sum, child) => sum + child.members.length + 
      (child.children?.reduce((s, c) => s + c.members.length, 0) || 0), 0) || 0);
  const totalStations = structure.children?.reduce((sum, child) => sum + (child.children?.length || 0), 0) || 0;
  const totalBranches = structure.children?.length || 0;

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">联盟管理</h1>
            <p className="text-slate-500 mt-1">盟主-分盟-站点三级管理体系</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加成员
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">盟主单位</p>
                <p className="text-xl font-bold text-slate-800">1</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">{structure.name}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">分盟数量</p>
                <p className="text-xl font-bold text-slate-800">{totalBranches}</p>
              </div>
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              较上月 +2
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">站点数量</p>
                <p className="text-xl font-bold text-slate-800">{totalStations}</p>
              </div>
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              较上月 +8
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">总成员数</p>
                <p className="text-xl font-bold text-slate-800">{totalMembers}</p>
              </div>
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              较上月 +15.2%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  组织架构
                </h2>
              </CardHeader>
              <CardContent>
                <TreeNode node={structure} level={0} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  盟主信息
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    {structure.leaderName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{structure.leaderName}</h4>
                    <p className="text-sm text-slate-500">{structure.name}</p>
                    <Badge variant="gold" className="mt-1"><Crown className="w-3 h-3 mr-1" /> 盟主</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>138****8888</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>leader@alliance.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>任期: 2024.01 - 2026.01</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-800">联盟权益</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">交易手续费减免</p>
                    <p className="text-xs text-slate-500">联盟成员享受8折优惠</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">精准商机推送</p>
                    <p className="text-xs text-slate-500">优先匹配区域采购需求</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">专属客服支持</p>
                    <p className="text-xs text-slate-500">7x24小时一对一服务</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllianceIndex;
