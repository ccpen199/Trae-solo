import { motion } from 'framer-motion';
import { Upload, Sparkles, Users, Shield, Camera, FileSearch, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Appraise() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <Tag variant="gold" className="mb-4">在线鉴定</Tag>
        <h1 className="section-title text-3xl md:text-4xl mb-3">藏品在线鉴定</h1>
        <p className="section-subtitle text-lg">AI 初筛 + 权威专家双重保障，专业可信</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Upload, title: '上传藏品图片', desc: '多角度拍摄，高清展示藏品细节', step: '01' },
          { icon: Sparkles, title: 'AI 智能初筛', desc: '图像识别快速分析年代品类', step: '02' },
          { icon: Users, title: '专家鉴定竞价', desc: '选择心仪专家，获取专业证书', step: '03' },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hoverable className="relative overflow-hidden h-full">
                <Card.Content className="pt-10">
                  <span className="absolute top-4 right-4 font-serif text-5xl font-bold text-gold-100">{item.step}</span>
                  <div className="w-14 h-14 rounded-full bg-ink-gradient flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-gold-300" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">{item.title}</h3>
                  <p className="text-jade-500">{item.desc}</p>
                </Card.Content>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="mb-12">
        <Card.Content className="py-16">
          <EmptyState
            icon={<Camera className="w-12 h-12 text-gold-500" />}
            title="开始您的第一次鉴定"
            description="上传藏品图片，AI 将为您提供初步分析，再由专家给出权威鉴定结果"
            action={{ label: '上传藏品图片', onClick: () => {} }}
          />
        </Card.Content>
      </Card>

      <div>
        <h2 className="font-serif text-2xl font-bold text-jade-700 mb-6">鉴定服务保障</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Shield, title: '权威认证', desc: '国家省级鉴定专家' },
            { icon: FileSearch, title: '专业证书', desc: '区块链存证可溯源' },
            { icon: CheckCircle2, title: '准确率高', desc: '99.9% 鉴定准确率' },
            { icon: Users, title: '隐私保护', desc: '严格保密藏家信息' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="text-center">
                <Card.Content>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gold-600" />
                  </div>
                  <h4 className="font-medium text-jade-700 mb-1">{item.title}</h4>
                  <p className="text-sm text-jade-500">{item.desc}</p>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Button size="lg" rightIcon={<Upload className="w-4 h-4" />}>立即开始鉴定</Button>
      </div>
    </div>
  );
}
