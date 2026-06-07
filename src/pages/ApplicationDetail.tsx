import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  User,
  Building2,
  Calendar,
  PenTool,
  Hash,
} from 'lucide-react';
import { applicationApi } from '../api';
import { Application, TimelineEvent } from '../types';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [appRes, timelineRes] = await Promise.all([
          applicationApi.getById(parseInt(id)),
          applicationApi.getTimeline(parseInt(id)),
        ]);

        if (appRes.success) {
          setApplication(appRes.data || null);
        }
        if (timelineRes.success) {
          setTimeline(timelineRes.data || []);
        }
      } catch (e) {
        console.error('Load application detail error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const statusConfig = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { label: '已提交', color: 'bg-blue-100 text-blue-600' },
    processing: { label: '审批中', color: 'bg-yellow-100 text-yellow-600' },
    approved: { label: '已批准', color: 'bg-green-100 text-green-600' },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  };

  const nodeStatusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500' },
    processing: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500' },
    pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-300' },
    rejected: { icon: CheckCircle, color: 'text-red-500', bg: 'bg-red-500' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">办件不存在</p>
        <button
          onClick={() => navigate('/applications')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const status = statusConfig[application.status];
  const formFields = application.formData ? Object.entries(application.formData) : [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/applications')}
        className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回办件列表
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-3">
              <h1 className="text-2xl font-bold text-gray-900 mr-4">
                {application.serviceItemName}
              </h1>
              <span className={`text-xs px-3 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-8 text-sm">
              <div className="flex items-center text-gray-500">
                <Hash className="w-4 h-4 mr-2 text-gray-400" />
                办件编号：
                <span className="ml-1 font-mono text-gray-900">{application.applicationNo}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                申请人：
                <span className="ml-1 text-gray-900">{application.userName}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                申请时间：
                <span className="ml-1 text-gray-900">
                  {new Date(application.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center text-gray-500">
                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                当前环节：
                <span className="ml-1 text-gray-900">{application.currentNode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">审批进度</h3>
            <div className="relative">
              {timeline.map((event, index) => {
                const nodeStatus = nodeStatusConfig[event.status];
                const StatusIcon = nodeStatus.icon;
                const isLast = index === timeline.length - 1;
                return (
                  <div key={event.id} className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.status === 'completed' || event.status === 'processing'
                            ? 'bg-primary-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <StatusIcon
                          className={`w-4 h-4 ${
                            event.status === 'completed'
                              ? 'text-green-500'
                              : event.status === 'processing'
                              ? 'text-yellow-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[40px] ${
                            event.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{event.nodeName}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {event.operator && (
                        <p className="text-sm text-gray-500 mb-1">处理人：{event.operator}</p>
                      )}
                      {event.remark && (
                        <p className="text-sm text-gray-600">{event.remark}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申报信息</h3>
            <div className="grid grid-cols-2 gap-4">
              {formFields.map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{key}</p>
                  <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申请材料</h3>
            <div className="space-y-3">
              {application.materials?.map((material: any, index: number) => (
                <div
                  key={material.code || index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{material.name}</p>
                      {material.autoFetched && (
                        <p className="text-xs text-green-600">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          证照库自动调取 · {material.licenseType}
                        </p>
                      )}
                      {material.source === 'manual' && (
                        <p className="text-xs text-gray-500">手动上传</p>
                      )}
                    </div>
                  </div>
                  {material.hash && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">材料哈希</p>
                      <p className="text-xs font-mono text-gray-500">{material.hash.slice(0, 16)}...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">办件信息</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">办件编号</span>
                <span className="text-sm font-mono text-gray-900">{application.applicationNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">事项名称</span>
                <span className="text-sm text-gray-900 text-right max-w-[180px]">
                  {application.serviceItemName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">当前状态</span>
                <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">当前环节</span>
                <span className="text-sm text-gray-900">{application.currentNode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">申请时间</span>
                <span className="text-sm text-gray-900">
                  {new Date(application.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <h4 className="font-medium text-primary-800 mb-2 flex items-center">
              <PenTool className="w-4 h-4 mr-2" />
              办理须知
            </h4>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• 请确保申报信息真实有效</li>
              <li>• 审批过程中请保持电话畅通</li>
              <li>• 如需补充材料请在3个工作日内提交</li>
              <li>• 办理结果将通过短信通知</li>
            </ul>
          </div>

          {application.status === 'processing' && (
            <button
              onClick={() => alert('签名功能演示')}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
            >
              电子签名确认
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
