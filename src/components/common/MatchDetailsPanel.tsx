import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Target, Wrench, Lightbulb, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Progress, Descriptions, Tag, Tooltip } from 'antd';
import { MatchDetails, DifferentiationType } from '@shared/types';
import { cn } from '@/lib/utils';

export const DIFF_TYPE_CONFIG: Record<DifferentiationType, {
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
}> = {
  blue_collar: {
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    icon: '🔵',
  },
  skilled: {
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    icon: '🟠',
  },
  graduate: {
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    icon: '🟢',
  },
};

export interface MatchDetailsPanelProps {
  matchDetails: MatchDetails;
}

export default function MatchDetailsPanel({ matchDetails }: MatchDetailsPanelProps) {
  const { resumeParse, jdMatch, skillAlignment, differentiation } = matchDetails;
  const diffConfig = DIFF_TYPE_CONFIG[differentiation.type];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-50 border-t border-gray-100 mt-4 pt-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-industrial-blue-500" />
            <h4 className="font-semibold text-gray-800">📄 简历解析结果</h4>
          </div>
          <Descriptions column={2} size="small" className="text-sm">
            <Descriptions.Item label="工作经验">{resumeParse.yearsOfExperience}年</Descriptions.Item>
            <Descriptions.Item label="学历">{resumeParse.education}</Descriptions.Item>
            <Descriptions.Item label="期望地点">{resumeParse.location}</Descriptions.Item>
            <Descriptions.Item label="期望薪资">{resumeParse.targetSalary[0]}-{resumeParse.targetSalary[1]}K</Descriptions.Item>
          </Descriptions>
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">技能标签</div>
            <div className="flex flex-wrap gap-1">
              {resumeParse.skills.map((skill, idx) => (
                <Tag key={idx} color="blue" className="!text-xs">{skill}</Tag>
              ))}
            </div>
          </div>
          {resumeParse.certificates.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">持有证书</div>
              <div className="flex flex-wrap gap-1">
                {resumeParse.certificates.map((cert, idx) => (
                  <Tag key={idx} color="gold" className="!text-xs">{cert}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-vital-orange-500" />
            <h4 className="font-semibold text-gray-800">🎯 JD语义匹配</h4>
          </div>
          <div className="space-y-3">
            {Object.entries(jdMatch).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">{value.label}</span>
                  <span className="text-xs font-semibold text-gray-700">{value.score}%</span>
                </div>
                <Progress
                  percent={value.score}
                  size="small"
                  strokeColor={value.score >= 80 ? '#52c41a' : value.score >= 60 ? '#faad14' : '#ff4d4f'}
                  showInfo={false}
                />
                <Tooltip title={value.reason}>
                  <p className="text-xs text-gray-500 mt-0.5 truncate cursor-help">{value.reason}</p>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={18} className="text-purple-500" />
            <h4 className="font-semibold text-gray-800">🔧 技能图谱对齐</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                <CheckCircle size={12} /> 已匹配技能
              </div>
              {skillAlignment.matched.length > 0 ? (
                <div className="space-y-2">
                  {skillAlignment.matched.map((item, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-100 rounded p-2 text-xs">
                      <div className="font-medium text-green-700">{item.name}</div>
                      <div className="text-green-600 mt-0.5">掌握: {item.level} / 要求: {item.required}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">暂无匹配技能</div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                <Sparkles size={12} /> 相关技能
              </div>
              {skillAlignment.related.length > 0 ? (
                <div className="space-y-2">
                  {skillAlignment.related.map((item, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-100 rounded p-2 text-xs">
                      <div className="font-medium text-blue-700 flex items-center justify-between">
                        <span>{item.name}</span>
                        <span className="text-blue-500">加分 {item.bonus}</span>
                      </div>
                      <div className="text-blue-600 mt-0.5">掌握: {item.level}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">暂无相关技能</div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                <AlertCircle size={12} /> 待补技能
              </div>
              {skillAlignment.missing.length > 0 ? (
                <div className="space-y-2">
                  {skillAlignment.missing.map((item, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-100 rounded p-2 text-xs">
                      <div className="font-medium text-red-700">{item.name}</div>
                      <div className="text-red-600 mt-0.5">{item.suggestion || `建议补充${item.name}经验`}</div>
                      {item.learningPath && (
                        <div className="mt-2 pt-2 border-t border-red-200 space-y-1">
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-gray-500">📚 学习路径：</span>
                            <a href={item.learningPath.courseLink} className="text-red-600 underline hover:text-red-800">
                              查看课程
                            </a>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-gray-500">⏱️ 学习周期：</span>
                            <span>{item.learningPath.duration}</span>
                          </div>
                          <div className="flex items-start gap-1 text-gray-600">
                            <span className="text-gray-500">🎯 预期效果：</span>
                            <span>{item.learningPath.expectedOutcome}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">暂无明显短板</div>
              )}
            </div>
          </div>
        </div>

        <div className={cn('bg-white rounded-lg border p-4 lg:col-span-2', diffConfig.bgColor, diffConfig.borderColor)}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className={diffConfig.textColor} />
            <h4 className="font-semibold text-gray-800">
              {diffConfig.icon} {differentiation.typeLabel || '差异化匹配建议'}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {differentiation.highlights.map((item, idx) => (
              <div key={idx} className="text-sm text-gray-700 bg-white/70 rounded px-3 py-2">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
