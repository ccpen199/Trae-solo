import { motion } from 'framer-motion';
import { Search, Shield, FileCheck, Copy, Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

export default function Certificate() {
  const [certificateNo, setCertificateNo] = useState('');
  const [searched, setSearched] = useState(false);
  const toast = useToast();

  const handleSearch = () => {
    if (certificateNo.trim()) {
      setSearched(true);
    }
  };

  const handleCopy = () => {
    toast.success('证书编号已复制');
  };

  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <Tag variant="gold" className="mb-4">鉴定证书</Tag>
        <h1 className="section-title text-3xl md:text-4xl mb-3">鉴定证书查询</h1>
        <p className="section-subtitle text-lg">区块链存证，权威可溯</p>
      </motion.div>

      <Card className="max-w-2xl mx-auto mb-12">
        <Card.Content>
          <label className="label-field text-base">证书编号</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
              <input
                type="text"
                value={certificateNo}
                onChange={(e) => setCertificateNo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="请输入证书编号，如 JZG20240100001"
                className="input-field pl-11"
              />
            </div>
            <Button onClick={handleSearch} rightIcon={<Search className="w-4 h-4" />}>
              查询证书
            </Button>
          </div>
        </Card.Content>
      </Card>

      {!searched ? (
        <EmptyState
          icon={<FileCheck className="w-12 h-12 text-gold-500" />}
          title="暂无查询结果"
          description="请输入证书编号查询鉴定证书详情"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="overflow-hidden border-2 border-gold-400 shadow-gold-glow">
            <div className="bg-ink-gradient px-8 py-6 text-center border-b-4 border-gold-400">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-jade-700/50 border-2 border-gold-400">
                <span className="font-serif text-3xl font-bold text-gold-300">鉴</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-gold-300 mb-1">鉴真阁鉴定证书</h2>
              <p className="text-gold-400 text-sm tracking-widest">AUTHENTICATION CERTIFICATE</p>
            </div>
            <Card.Content className="p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gold-200">
                <div>
                  <p className="text-sm text-jade-500 mb-1">证书编号</p>
                  <p className="font-mono text-lg font-semibold text-jade-700">{certificateNo || 'JZG20240100001'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy} rightIcon={<Copy className="w-3.5 h-3.5" />}>复制</Button>
                  <Button variant="secondary" size="sm" rightIcon={<Download className="w-3.5 h-3.5" />}>下载PDF</Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-jade-500 mb-1">藏品名称</p>
                  <p className="font-medium text-jade-700">清乾隆青花缠枝莲纹赏瓶</p>
                </div>
                <div>
                  <p className="text-sm text-jade-500 mb-1">藏品类别</p>
                  <p className="font-medium text-jade-700">陶瓷 · 瓷器</p>
                </div>
                <div>
                  <p className="text-sm text-jade-500 mb-1">鉴定年代</p>
                  <p className="font-medium text-jade-700">清代乾隆年间（约1736-1795年）</p>
                </div>
                <div>
                  <p className="text-sm text-jade-500 mb-1">鉴定结论</p>
                  <Tag variant="seal">真品</Tag>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-jade-500 mb-1">鉴定专家</p>
                  <p className="font-medium text-jade-700">张明清 国家级陶瓷鉴定专家</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-jade-500 mb-1">鉴定时间</p>
                  <p className="font-medium text-jade-700">2024年1月15日 14:30:00</p>
                </div>
              </div>

              <div className="bg-jade-50 rounded-md p-4 border border-gold-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-jade-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-jade-700 mb-1">区块链存证信息</p>
                    <p className="text-xs text-jade-500 mb-2 font-mono break-all">
                      0x8a9d2f5c7b3e1a4d6c8f0b2e5a7d9c1f3e5a7b9d2c4f6e8a0b1d3c5e7f9a2b4c
                    </p>
                    <button className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-500 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      查看区块链详情
                    </button>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
