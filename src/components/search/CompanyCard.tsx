import React from 'react';
import { Avatar, Tag, Tooltip } from 'antd';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMoney, formatDate } from '@/utils/format';
import RiskBadge from '@/components/common/RiskBadge';
import type { Company } from '@/types';

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="lc-card p-5 cursor-pointer hover:border-primary-300 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg primary-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white font-serif text-lg font-bold">
              {company.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-semibold text-lg text-primary-900 truncate" title={company.name}>
              {company.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-neutral-ink-500">
                法定代表人：{company.legalPerson}
              </span>
              <span className="text-xs text-neutral-ink-300">|</span>
              <span className="text-xs text-neutral-ink-500">
                {company.province} · {company.city}
              </span>
            </div>
          </div>
        </div>
        <RiskBadge level={company.riskLevel} score={company.riskScore} showScore size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-neutral-ink-50">
        <div>
          <div className="text-xs text-neutral-ink-500 mb-1">注册资本</div>
          <div className="text-sm font-semibold text-neutral-ink-900">{company.registeredCapital}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-ink-500 mb-1">成立日期</div>
          <div className="text-sm font-semibold text-neutral-ink-900">{formatDate(company.establishDate)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-ink-500 mb-1">统一社会信用代码</div>
          <div className="text-sm font-mono text-neutral-ink-900 truncate" title={company.creditCode}>
            {company.creditCode}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Tag color="blue">
          裁判文书 <span className="font-semibold ml-1">{company.lawsuits.length}</span>
        </Tag>
        <Tag color={company.executions.length > 0 ? 'red' : 'default'}>
          被执行 <span className="font-semibold ml-1">{company.executions.length}</span>
        </Tag>
        <Tag color="purple">
          招投标 <span className="font-semibold ml-1">{company.bids.length}</span>
        </Tag>
        <Tag color="cyan">
          股东 <span className="font-semibold ml-1">{company.shareholders.length}</span>
        </Tag>
      </div>
    </div>
  );
};

export default CompanyCard;
