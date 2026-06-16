import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, GraduationCap, Briefcase, ShieldCheck, ShieldX, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { Button, Tag, Modal } from 'antd';
import { cn } from '@/lib/utils';
import MatchScoreRing from './MatchScoreRing';
import TownshipTag from './TownshipTag';
import { JobPosition, TownshipCode } from '@shared/types';

export interface JobCardProps {
  job: JobPosition;
  matchScore?: number;
  className?: string;
  onViewDetail?: (job: JobPosition) => void;
  onVerifyClick?: (job: JobPosition) => void;
}

export default function JobCard({
  job,
  matchScore,
  className,
  onViewDetail,
  onVerifyClick,
}: JobCardProps) {
  const navigate = useNavigate();
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);

  const handleClick = () => {
    if (onViewDetail) {
      onViewDetail(job);
    } else if (job.id) {
      navigate(`/jobs/${job.id}`);
    }
  };

  const handleVerifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVerifyClick) {
      onVerifyClick(job);
    } else {
      setVerifyModalVisible(true);
    }
  };

  const formatSalary = () => {
    const min = job.salaryMin;
    const max = job.salaryMax;
    if (!min && !max) return '面议';
    if (min === max) return `${min}K`;
    return `${min}-${max}K`;
  };

  const benefits = job.benefits || [];
  const displayBenefits = benefits.slice(0, 5);

  const townshipName = job.townshipName || '';
  const verification = job.townshipVerification;
  const isVerified = verification?.overallResult;

  const getVerificationItems = () => {
    if (!verification) return [];
    return [
      { label: '企业注册地校验', pass: verification.registrationAddress, desc: `注册地位于 ${townshipName}` },
      { label: '税务登记地校验', pass: verification.taxRegistration, desc: `税务登记属于 ${townshipName}` },
      { label: '社保缴纳地校验', pass: verification.socialInsurance, desc: `员工社保缴纳在 ${townshipName}` },
      { label: '岗位实际工作地校验', pass: verification.workLocation, desc: `工作地点位于 ${townshipName}` },
    ];
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
      <div className="flex gap-4">
        {matchScore !== undefined && (
          <div className="flex-shrink-0">
            <MatchScoreRing score={matchScore} size="lg" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={cn(
                'text-base font-semibold text-gray-900 truncate',
                'group-hover:text-industrial-blue-600 transition-colors'
              )}
            >
              {job.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {job.urgent && (
                <Tag color="red" className="flex-shrink-0 text-xs !mb-0">
                  急招
                </Tag>
              )}
              {verification && (
                <Tag
                  color={isVerified ? 'success' : 'default'}
                  className="flex-shrink-0 text-xs !mb-0"
                  icon={isVerified ? <ShieldCheck size={10} /> : <ShieldX size={10} />}
                >
                  {townshipName}属地岗位
                </Tag>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3 truncate flex items-center gap-1">
            <Building2 size={12} className="text-gray-400" />
            {job.enterpriseName}
          </p>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl font-bold text-vital-orange-500">
              {formatSalary()}
            </span>
            <span className="text-xs text-gray-400">{job.salaryType || '月薪'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.township && (
              <TownshipTag code={job.township as TownshipCode} size="sm" />
            )}
            {job.experience && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                <Briefcase size={10} />
                {job.experience}
              </span>
            )}
            {job.education && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                <GraduationCap size={10} />
                {job.education}
              </span>
            )}
            {verification && (
              <motion.button
                onClick={handleVerifyClick}
                className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-all',
                  isVerified
                    ? 'text-success-600 bg-success-50 border-success-200 hover:bg-success-100'
                    : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isVerified ? <ShieldCheck size={10} /> : <ShieldX size={10} />}
                归属校验
              </motion.button>
            )}
          </div>

          {displayBenefits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {displayBenefits.map((benefit, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="text-xs px-2 py-0.5 bg-industrial-blue-50 text-industrial-blue-600 rounded"
                >
                  {benefit}
                </motion.span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 truncate max-w-[180px]">
                {job.address || job.townshipName}
              </span>
            </div>
            <Button
              type="primary"
              size="small"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              icon={<ArrowRight size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              查看详情
            </Button>
          </div>
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
      {verifyModalVisible && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              {isVerified ? (
                <ShieldCheck size={20} className="text-success-500" />
              ) : (
                <ShieldX size={20} className="text-gray-400" />
              )}
              <span>岗位归属镇街校验</span>
            </div>
          }
          open={verifyModalVisible}
          onCancel={() => setVerifyModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setVerifyModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={520}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-xl bg-industrial-gradient flex items-center justify-center text-white text-xl font-bold"
              >
                {job.title.charAt(0)}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{job.title}</h3>
                <p className="text-sm text-gray-500 truncate">{job.enterpriseName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Tag
                    color={isVerified ? 'success' : 'default'}
                    icon={isVerified ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                    className="!mb-0"
                  >
                    {townshipName}属地岗位
                  </Tag>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {getVerificationItems().map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.pass ? (
                      <CheckCircle2 size={18} className="text-success-500" />
                    ) : (
                      <XCircle size={18} className="text-danger-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      {item.pass ? (
                        <span className="text-xs text-success-600">✅ {item.desc}</span>
                      ) : (
                        <span className="text-xs text-danger-600">❌ {item.desc.replace('位于', '不位于').replace('属于', '不属于').replace('在', '不在')}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                'rounded-lg p-4 text-sm',
                isVerified
                  ? 'bg-success-50 border border-success-200 text-success-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              )}
            >
              <div className="flex items-center gap-2 font-medium mb-1">
                {isVerified ? (
                  <CheckCircle2 size={18} className="text-success-500" />
                ) : (
                  <XCircle size={18} className="text-amber-500" />
                )}
                <span>综合校验结果</span>
              </div>
              <p className={cn('text-xs', isVerified ? 'text-success-600' : 'text-amber-600')}>
                {isVerified
                  ? `✅ 该岗位归属 ${townshipName}，可享受镇街就业补贴政策`
                  : `⚠️ 该岗位不完全归属 ${townshipName}，需进一步核实岗位信息`}
              </p>
              {verification?.subsidyEligible && (
                <p className="text-xs text-success-600 mt-1">
                  💰 企业可申请镇街吸纳就业补贴、社保补贴等政策支持
                </p>
              )}
            </motion.div>

            <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
              数据来源：中山市人力资源和社会保障局 · 镇街人社分局
            </div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
    </React.Fragment>
  );
}
