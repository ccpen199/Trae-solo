import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, MapPin, Award, ShieldCheck, ShieldX, Info } from 'lucide-react';
import { Avatar, Tag, Badge, Modal, List, Tooltip, Button } from 'antd';
import { cn } from '@/lib/utils';
import TownshipTag from './TownshipTag';
import { Enterprise, TownshipCode } from '@shared/types';
import { TOWNSHIPS } from '@/mock/townships';

export interface EnterpriseCardProps {
  enterprise: Enterprise;
  className?: string;
  onClick?: (enterprise: Enterprise) => void;
  onAuthClick?: (enterprise: Enterprise) => void;
}

export default function EnterpriseCard({
  enterprise,
  className,
  onClick,
  onAuthClick,
}: EnterpriseCardProps) {
  const navigate = useNavigate();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(enterprise);
    } else {
      navigate(`/enterprise/${enterprise.id}`);
    }
  };

  const handleAuthClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAuthClick) {
      onAuthClick(enterprise);
    } else {
      setAuthModalVisible(true);
    }
  };

  const getInitial = (name: string) => {
    return name?.charAt(0) || '企';
  };

  const getCreditRatingColor = (rating?: string) => {
    switch (rating) {
      case 'A': return { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' };
      case 'B': return { bg: 'bg-industrial-blue-50', text: 'text-industrial-blue-600', border: 'border-industrial-blue-200' };
      case 'C': return { bg: 'bg-vital-orange-50', text: 'text-vital-orange-600', border: 'border-vital-orange-200' };
      case 'D': return { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-200' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
    }
  };

  return (
    <React.Fragment>
    <motion.div
      className={cn(
        'bg-white rounded-lg border border-gray-100 p-5 cursor-pointer',
        'group',
        className
      )}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ 
        y: -4, 
        boxShadow: '0 12px 32px rgba(22, 93, 255, 0.15)',
        borderColor: '#C9DCFF'
      }}
      style={{
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <Badge dot={enterprise.verified} color="#00B42A" offset={[-4, 4]}>
          <Avatar
            size={48}
            className="bg-industrial-gradient text-white font-medium"
            src={enterprise.logo}
          >
            {getInitial(enterprise.name)}
          </Avatar>
        </Badge>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={cn(
                'text-base font-semibold text-gray-900 truncate',
                'group-hover:text-industrial-blue-600 transition-colors'
              )}
            >
              {enterprise.name}
            </h3>
            <Tooltip title={enterprise.verified ? '已通过属地认证，点击查看详情' : '未完成属地认证，点击查看详情'}>
              <span
                onClick={handleAuthClick}
                className="flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
              >
                {enterprise.verified ? (
                  <ShieldCheck size={16} className="text-success-500" />
                ) : (
                  <ShieldX size={16} className="text-gray-400" />
                )}
              </span>
            </Tooltip>
            {enterprise.creditRating && (
              <span
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded border',
                  getCreditRatingColor(enterprise.creditRating).bg,
                  getCreditRatingColor(enterprise.creditRating).text,
                  getCreditRatingColor(enterprise.creditRating).border
                )}
              >
                {enterprise.creditRating}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tag color="blue" className="text-xs m-0">
              {enterprise.industry}
            </Tag>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={10} />
              {enterprise.scale}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MapPin size={12} className="text-gray-400" />
        <TownshipTag code={enterprise.township as TownshipCode} size="sm" showIcon={false} />
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
        {enterprise.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <Building2 size={14} className="text-industrial-blue-500" />
          <span className="text-sm text-gray-600">
            在招 <span className="font-semibold text-industrial-blue-600">{enterprise.openPositionCount}</span> 个职位
          </span>
        </div>
        <Tooltip title={enterprise.verified ? '已通过属地认证，点击查看详情' : '未完成属地认证'}>
          <span
            onClick={handleAuthClick}
            className={cn(
              'text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1',
              enterprise.verified
                ? 'text-success-600 bg-success-50'
                : 'text-gray-500 bg-gray-100'
            )}
          >
            {enterprise.verified ? (
              <>
                <ShieldCheck size={12} />
                属地认证
              </>
            ) : (
              <>
                <ShieldX size={12} />
                待认证
              </>
            )}
          </span>
        </Tooltip>
      </div>
    </motion.div>

    <Modal
      title={
        <div className="flex items-center gap-2">
          {enterprise.verified ? (
            <ShieldCheck size={20} className="text-success-500" />
          ) : (
            <ShieldX size={20} className="text-gray-400" />
          )}
          <span>企业属地认证信息</span>
        </div>
      }
      open={authModalVisible}
      onCancel={() => setAuthModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setAuthModalVisible(false)}>
          关闭
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-xl bg-industrial-gradient flex items-center justify-center text-white text-2xl font-bold">
            {getInitial(enterprise.name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{enterprise.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {enterprise.verified ? (
                <Tag color="success" icon={<ShieldCheck size={12} />}>
                  已通过属地认证
                </Tag>
              ) : (
                <Tag color="default" icon={<ShieldX size={12} />}>
                  待认证
                </Tag>
              )}
            </div>
          </div>
        </div>

        <List
          size="small"
          dataSource={[
            { label: '营业执照编号', value: enterprise.licenseNo },
            { label: '法定代表人', value: enterprise.legalRepresentative },
            { label: '成立年份', value: `${enterprise.establishedYear}年` },
            { label: '注册资本', value: enterprise.registeredCapital ? `${enterprise.registeredCapital}万元` : '未披露' },
            { label: '企业规模', value: enterprise.scale },
            { label: '所属行业', value: enterprise.industry },
            { label: '所在镇街', value: TOWNSHIPS.find(t => t.code === enterprise.township)?.name || enterprise.township },
            { label: '认证时间', value: enterprise.verifiedAt ? new Date(enterprise.verifiedAt).toLocaleDateString() : '未认证' },
            { label: '入驻时间', value: new Date(enterprise.createdAt).toLocaleDateString() },
          ]}
          renderItem={(item) => (
            <List.Item className="px-0">
              <span className="text-gray-500 text-sm w-28 flex-shrink-0">{item.label}</span>
              <span className="text-gray-800 text-sm font-mono-num">{item.value}</span>
            </List.Item>
          )}
        />

        {!enterprise.verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            <div className="flex items-center gap-2 font-medium mb-1">
              <span>⚠️</span>
              <span>认证说明</span>
            </div>
            <p className="text-xs text-amber-600">
              该企业尚未完成属地认证，建议求职时谨慎核实企业信息。认证企业需提供营业执照、法人身份证明等材料，经平台审核通过后方可获得认证标识。
            </p>
          </div>
        )}

        {enterprise.verified && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-sm text-success-700">
            <div className="flex items-center gap-2 font-medium mb-1">
              <ShieldCheck size={16} />
              <span>认证保障</span>
            </div>
            <p className="text-xs text-success-600">
              该企业已通过中山市人社局属地认证，信息真实可靠。求职过程中如遇问题，可向平台投诉维权。
            </p>
          </div>
        )}
      </div>
    </Modal>
    </React.Fragment>
  );
}
