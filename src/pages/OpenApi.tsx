import { motion } from 'framer-motion';
import { Code2, Shield, Zap, BookOpen, Key, ArrowRight, Terminal, Copy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function OpenApi() {
  const toast = useToast();

  const handleCopy = () => {
    toast.success('代码已复制');
  };

  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-20 px-4">
          <div className="container text-center">
            <Tag variant="gold" className="mb-4">API 开放平台</Tag>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4">鉴真阁开放 API</h1>
            <p className="text-jade-200 text-lg mb-8 max-w-2xl mx-auto">
              将专业的文玩艺术品鉴定能力集成到您的应用中。AI 图像识别、专家鉴定、证书验证，一站式接入。
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>免费申请 API Key</Button>
              <Button variant="secondary" size="lg" leftIcon={<BookOpen className="w-4 h-4" />}>查看文档</Button>
            </div>
          </div>
        </div>

        <div className="container py-16">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Zap,
                title: '高性能接口',
                desc: '毫秒级响应，支持高并发调用，全年 99.9% 可用性保障',
              },
              {
                icon: Shield,
                title: '安全可靠',
                desc: '多重签名验证，HTTPS 加密传输，严格的访问权限控制',
              },
              {
                icon: Code2,
                title: '易于集成',
                desc: 'RESTful API 设计，完善的 SDK 支持，多种编程语言示例',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card hoverable className="h-full">
                    <Card.Content>
                      <div className="w-14 h-14 rounded-lg bg-ink-gradient flex items-center justify-center mb-4 border border-gold-400">
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

          <div className="mb-16">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-8 text-center">核心 API 能力</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: 'AI 图像识别',
                  method: 'POST',
                  path: '/api/v1/ai/screen',
                  desc: '上传藏品图片，AI 自动识别品类、年代、真伪概率',
                  tags: ['图像识别', 'AI初筛'],
                },
                {
                  name: '证书验证',
                  method: 'GET',
                  path: '/api/v1/certificates/:id/verify',
                  desc: '验证鉴定证书真伪，查询区块链存证信息',
                  tags: ['证书', '区块链'],
                },
                {
                  name: '价值评估',
                  method: 'POST',
                  path: '/api/v1/valuation/calculate',
                  desc: '基于拍卖大数据，智能估算藏品市场价值',
                  tags: ['估价', '大数据'],
                },
                {
                  name: '专家列表',
                  method: 'GET',
                  path: '/api/v1/experts',
                  desc: '获取平台认证专家列表，支持按品类、级别筛选',
                  tags: ['专家', '检索'],
                },
              ].map((api, index) => (
                <motion.div
                  key={api.name}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card hoverable>
                    <Card.Content>
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                        <h3 className="font-serif text-lg font-semibold text-jade-700">{api.name}</h3>
                        <div className="flex gap-1.5">
                          <Badge variant={api.method === 'GET' ? 'info' : 'success'}>{api.method}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-jade-900 rounded-md mb-3 font-mono text-sm overflow-x-auto">
                        <span className="text-jade-300">{api.path}</span>
                        <button
                          onClick={handleCopy}
                          className="ml-auto text-gold-400 hover:text-gold-300 transition-colors flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-jade-500 mb-3">{api.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {api.tags.map((t) => (
                          <Tag key={t} variant="outline">{t}</Tag>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Card className="mb-16">
            <Card.Content className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-gold-500" />
                <h3 className="font-serif text-xl font-semibold text-jade-700">快速开始</h3>
              </div>
              <div className="bg-jade-900 rounded-lg p-4 overflow-x-auto font-mono text-sm">
                <p className="text-jade-400 mb-2"># 获取 Access Token</p>
                <p className="text-gold-300">
                  curl -X POST https://api.jianzhenge.com/v1/oauth/token \
                </p>
                <p className="text-jade-200 pl-4">
                  -H "Content-Type: application/json" \
                </p>
                <p className="text-jade-200 pl-4">
                  -d &apos;{'{"client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_SECRET"}'}&apos;
                </p>
                <p className="text-jade-400 mt-4 mb-2"># 调用 AI 图像识别</p>
                <p className="text-gold-300">
                  curl -X POST https://api.jianzhenge.com/v1/ai/screen \
                </p>
                <p className="text-jade-200 pl-4">
                  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
                </p>
                <p className="text-jade-200 pl-4">
                  -F "file=@artwork.jpg"
                </p>
              </div>
            </Card.Content>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { level: '免费版', price: '¥0', period: '/月', calls: '100 次/月', features: ['AI 图像识别', '证书验证', '社区支持'] },
              { level: '专业版', price: '¥999', period: '/月', calls: '10,000 次/月', features: ['全部 API', '优先响应', '专属客服', 'SLA 保障'], featured: true },
              { level: '企业版', price: '联系我们', period: '', calls: '定制', features: ['全部 API', '定制化开发', '一对一技术支持', '私有部署可选'] },
            ].map((plan, index) => (
              <motion.div
                key={plan.level}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={cn('h-full relative', plan.featured && 'border-2 border-gold-400 shadow-gold-glow')}>
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Tag variant="gold">推荐</Tag>
                    </div>
                  )}
                  <Card.Content className="text-center pt-8">
                    <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">{plan.level}</h3>
                    <div className="mb-4">
                      <span className="font-serif text-4xl font-bold text-gold-600">{plan.price}</span>
                      <span className="text-jade-500">{plan.period}</span>
                    </div>
                    <p className="text-sm text-jade-500 mb-6 pb-6 border-b border-gold-200">{plan.calls} API 调用</p>
                    <ul className="space-y-3 mb-8 text-left">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-jade-600">
                          <Key className="w-4 h-4 text-gold-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button fullWidth variant={plan.featured ? 'primary' : 'secondary'}>
                      {plan.level === '企业版' ? '联系销售' : '立即开通'}
                    </Button>
                  </Card.Content>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
