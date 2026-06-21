import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShoppingCart,
  Hammer,
  Rocket,
  BookOpen,
  LayoutDashboard,
  Boxes,
  ChevronRight,
  ChevronDown,
  Send,
  Copy,
  Check,
  Plus,
  Trash2,
  ImagePlus,
  Phone,
  Calendar,
  Key,
  ArrowRight,
  Terminal,
  Github,
  Download,
  ExternalLink,
  Clock,
  Zap,
  Shield,
  Code2,
  Star,
  TrendingUp,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  UserCheck,
  Upload,
  Award,
  FileCheck,
  Database,
  Network,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type TabKey = 'quickstart' | 'docs' | 'scenarios' | 'sdk';

const sampleImages = [
  { id: '1', name: '宋代青釉瓷瓶.jpg', category: '陶瓷', url: 'https://picsum.photos/seed/ceramic1/200/200' },
  { id: '2', name: '和田白玉挂件.jpg', category: '玉器', url: 'https://picsum.photos/seed/jade1/200/200' },
  { id: '3', name: '齐白石水墨虾.jpg', category: '书画', url: 'https://picsum.photos/seed/painting1/200/200' },
  { id: '4', name: '清代五帝钱.jpg', category: '钱币', url: 'https://picsum.photos/seed/coin1/200/200' },
  { id: '5', name: '顾景舟紫砂壶.jpg', category: '紫砂', url: 'https://picsum.photos/seed/zisha1/200/200' },
];

const apiEndpoints = [
  {
    id: 'screen',
    method: 'POST',
    path: '/openapi/v1/ai/screen',
    name: '单图AI初筛',
    desc: '上传单张藏品图片，AI自动识别品类、年代、真伪倾向',
    responseTime: '~200ms',
    rate: '0.8元/次',
  },
  {
    id: 'batch-screen',
    method: 'POST',
    path: '/openapi/v1/ai/batch-screen',
    name: '批量初鉴',
    desc: '批量上传藏品图片，最多20张同时处理（博物馆重点）',
    responseTime: '~1.2s',
    rate: '0.6元/张',
  },
  {
    id: 'cert-verify',
    method: 'GET',
    path: '/openapi/v1/certificate/verify',
    name: '证书验真',
    desc: '根据证书编号验真，返回区块链存证信息',
    responseTime: '~50ms',
    rate: '免费',
  },
  {
    id: 'cert-gen',
    method: 'POST',
    path: '/openapi/v1/certificate/generate',
    name: '生成电子证书',
    desc: '基于鉴定结果生成电子证书，支持区块链存证',
    responseTime: '~500ms',
    rate: '2元/张',
  },
  {
    id: 'experts',
    method: 'GET',
    path: '/openapi/v1/experts',
    name: '查询专家列表',
    desc: '获取平台认证专家，支持按品类、级别筛选',
    responseTime: '~80ms',
    rate: '免费',
  },
];

const docCategories = [
  {
    id: 'auth',
    name: '认证授权',
    expanded: true,
    items: [
      { id: 'auth-1', name: '获取 Access Token' },
      { id: 'auth-2', name: '刷新 Token' },
      { id: 'auth-3', name: '签名验证机制' },
    ],
  },
  {
    id: 'ai',
    name: 'AI 智能识别',
    expanded: true,
    items: [
      { id: 'ai-1', name: '单图初筛', featured: true },
      { id: 'ai-2', name: '批量初鉴（博物馆重点）', featured: true },
      { id: 'ai-3', name: '品类分类' },
      { id: 'ai-4', name: '年代检测' },
    ],
  },
  {
    id: 'cert',
    name: '鉴定证书',
    expanded: false,
    items: [
      { id: 'cert-1', name: '证书生成' },
      { id: 'cert-2', name: '证书查询' },
      { id: 'cert-3', name: '证书验真' },
      { id: 'cert-4', name: '批量生成证书' },
    ],
  },
  {
    id: 'expert',
    name: '专家服务',
    expanded: false,
    items: [
      { id: 'expert-1', name: '专家列表' },
      { id: 'expert-2', name: '专家详情' },
      { id: 'expert-3', name: '预约专家' },
    ],
  },
  {
    id: 'data',
    name: '数据接口',
    expanded: false,
    items: [
      { id: 'data-1', name: '拍卖成交参考' },
      { id: 'data-2', name: '估值模型' },
      { id: 'data-3', name: '知识库检索' },
    ],
  },
];

const sdkList = [
  { name: 'Python SDK', version: 'v2.3.1', date: '2024-12-10', install: 'pip install jianzhenge-sdk', pkg: 'PyPI', stars: 128 },
  { name: 'Node.js SDK', version: 'v3.1.0', date: '2024-12-15', install: 'npm install @jianzhenge/sdk', pkg: 'npm', stars: 96 },
  { name: 'Java SDK', version: 'v1.8.2', date: '2024-11-28', install: 'implementation com.jianzhenge:sdk:1.8.2', pkg: 'Maven', stars: 74 },
  { name: 'PHP SDK', version: 'v1.5.0', date: '2024-10-22', install: 'composer require jianzhenge/sdk', pkg: 'Composer', stars: 52 },
  { name: 'Go SDK', version: 'v2.0.1', date: '2024-12-05', install: 'go get github.com/jianzhenge/sdk-go', pkg: 'GitHub', stars: 88 },
  { name: '.NET SDK', version: 'v1.3.0', date: '2024-11-15', install: 'dotnet add package JianZhenGe.SDK', pkg: 'NuGet', stars: 41 },
];

const codeSnippets = {
  curl: `curl -X POST https://api.jianzhenge.com/openapi/v1/ai/batch-screen \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  -H "Content-Type: multipart/form-data" \\\n  -F "images=@./batch/*.jpg" \\\n  -F "accuracy_threshold=0.85" \\\n  -F "include_features=true"`,
  python: `import jianzhenge\n\nclient = jianzhenge.Client(api_key="YOUR_API_KEY")\n\nresult = client.ai.batch_screen(\n    image_paths=["./img1.jpg", "./img2.jpg", "./img3.jpg"],\n    accuracy_threshold=0.85,\n    include_features=True\n)\n\nfor item in result.images:\n    print(f"{item.id}: {item.category} ({item.confidence:.2%})")`,
  node: `const { JianZhenGeClient } = require('@jianzhenge/sdk');\n\nconst client = new JianZhenGeClient({ apiKey: 'YOUR_API_KEY' });\n\nasync function main() {\n  const result = await client.ai.batchScreen({\n    imagePaths: ['./img1.jpg', './img2.jpg', './img3.jpg'],\n    accuracyThreshold: 0.85,\n    includeFeatures: true\n  });\n  \n  result.images.forEach(item => {\n    console.log(\`\${item.id}: \${item.category} (\${(item.confidence*100).toFixed(1)}%)\`);\n  });\n}\n\nmain();`,
  java: `import com.jianzhenge.sdk.*;\nimport com.jianzhenge.sdk.model.*;\n\nJZGClient client = JZGClient.builder()\n    .apiKey("YOUR_API_KEY")\n    .build();\n\nBatchScreenRequest request = BatchScreenRequest.builder()\n    .imagePaths(Arrays.asList("./img1.jpg", "./img2.jpg"))\n    .accuracyThreshold(0.85)\n    .includeFeatures(true)\n    .build();\n\nBatchScreenResponse response = client.ai().batchScreen(request);\n\nfor (ImageResult item : response.getImages()) {\n    System.out.printf("%s: %s (%.2f%%)%n", \n        item.getId(), item.getCategory(), item.getConfidence()*100);\n}`,
};

function JSONHighlight({ json }: { json: string }) {
  const lines = json.split('\n');
  return (
    <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
      {lines.map((line, idx) => {
        const highlighted = line
          .replace(/("[\w\u4e00-\u9fa5]+")\s*:/g, '<span class="text-jade-400">$1</span>:')
          .replace(/:\s*(".*?")/g, ': <span class="text-gold-300">$1</span>')
          .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-cinnabar-300">$1</span>')
          .replace(/:\s*(true|false|null)/g, ': <span class="text-porcelain-300">$1</span>')
          .replace(/(\/\/.*$)/gm, '<span class="text-jade-600 italic">$1</span>');
        return (
          <div key={idx} className="flex">
            <span className="text-jade-800 select-none w-8 text-right pr-4 flex-shrink-0">{idx + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: highlighted }} className="flex-1" />
          </div>
        );
      })}
    </pre>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-jade-400 hover:text-gold-400 transition-colors p-1.5 rounded hover:bg-jade-900/50"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function OpenApi() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('quickstart');
  const [selectedApi, setSelectedApi] = useState(apiEndpoints[1]);
  const [isSending, setIsSending] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [responseTab, setResponseTab] = useState<'result' | 'req' | 'res'>('result');
  const [threshold, setThreshold] = useState(0.85);
  const [includeFeatures, setIncludeFeatures] = useState(true);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [activeDocCategory, setActiveDocCategory] = useState(docCategories);
  const [activeDoc, setActiveDoc] = useState('ai-2');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node' | 'java'>('curl');
  const [scenarioTab, setScenarioTab] = useState<'museum' | 'ecom' | 'auction'>('museum');

  const toggleDocCategory = useCallback((id: string) => {
    setActiveDocCategory((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)),
    );
  }, []);

  const toggleImage = (id: string) => {
    setSelectedImages((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const addSampleImages = () => {
    setSelectedImages(sampleImages.map((i) => i.id));
    toast.success('已添加 5 张示例图片');
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((i) => i !== id));
  };

  const generateMockResponse = () => {
    const imgs = sampleImages.filter((i) => selectedImages.includes(i.id));
    const categories = [
      { name: '陶瓷', era: '宋代', probability: 0.92 },
      { name: '玉器', era: '清代中期', probability: 0.87 },
      { name: '书画', era: '近现代', probability: 0.78 },
      { name: '钱币', era: '清代', probability: 0.94 },
      { name: '紫砂', era: '文革时期', probability: 0.81 },
    ];
    const results = imgs.map((img, idx) => {
      const cat = categories[idx % categories.length];
      const rand = Math.random();
      const authenticity = rand > 0.7 ? 'GENUINE' : rand > 0.3 ? 'SUSPICIOUS' : 'FAKE';
      return {
        image_id: `IMG_${(10000 + idx).toString()}`,
        file_name: img.name,
        category: cat.name,
        category_confidence: +(cat.probability - Math.random() * 0.1).toFixed(4),
        era: cat.era,
        era_confidence: +(0.7 + Math.random() * 0.25).toFixed(4),
        authenticity_prediction: authenticity,
        authenticity_score: +(0.65 + Math.random() * 0.3).toFixed(4),
        features: includeFeatures
          ? {
              material: ['高岭土', '青花料', '和田玉', '宣纸', '紫泥'][idx % 5],
              style: ['官窑风格', '苏作工艺', '海派', '乾隆工', '曼生式'][idx % 5],
              condition_score: +(0.75 + Math.random() * 0.23).toFixed(2),
              damage_flags: authenticity === 'FAKE' ? ['做旧痕迹明显'] : [],
            }
          : undefined,
        recommendation:
          authenticity === 'GENUINE'
            ? '建议归档'
            : authenticity === 'SUSPICIOUS'
              ? '建议专家复核'
              : '疑似仿品，标记存疑',
      };
    });

    return {
      code: 200,
      message: 'success',
      request_id: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      data: {
        batch_id: `BATCH_${Date.now().toString()}`,
        total_images: imgs.length,
        processed_count: imgs.length,
        accuracy_threshold: threshold,
        summary: {
          genuine: results.filter((r) => r.authenticity_prediction === 'GENUINE').length,
          suspicious: results.filter((r) => r.authenticity_prediction === 'SUSPICIOUS').length,
          fake: results.filter((r) => r.authenticity_prediction === 'FAKE').length,
          avg_processing_ms: 180 + Math.floor(Math.random() * 80),
        },
        results,
      },
    };
  };

  const generateCertVerifyResponse = () => ({
    code: 200,
    message: 'success',
    request_id: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    data: {
      certificate_no: 'JD-2024-1201-008956',
      status: 'VALID',
      blockchain: {
        chain: '长安链',
        block_height: 8925634,
        tx_hash: '0x7a3f9e2c5b8d1a4f6e0c9a2d5f8b1e3c7a9d2f5e8b1c4a7d0f3e9c2a5b8d1f4',
        timestamp: '2024-12-01T14:28:56+08:00',
        previous_hash: '0x1c8e4d7b2a5f9e3c6d0b8a2f4e7c1a9d3f5b8e2c6a0d4f7b1e8c3a5d9f2b7e0',
        hash_match: true,
      },
      certificate: {
        artifact_name: '清代青花缠枝莲纹赏瓶',
        category: '陶瓷',
        conclusion: '真品',
        expert_name: '张明德',
        expert_title: '国家级古陶瓷鉴定专家',
        issue_date: '2024-12-01',
        valid_until: '永久',
      },
    },
  });

  const handleSendRequest = () => {
    setIsSending(true);
    setResponseData(null);
    const startTime = Date.now();

    setTimeout(() => {
      let data: any;
      if (selectedApi.id === 'cert-verify') {
        data = generateCertVerifyResponse();
      } else {
        data = generateMockResponse();
      }
      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      setResponseData(data);
      setIsSending(false);
    }, 800 + Math.random() * 600);
  };

  const heroScenarios = [
    { icon: Building2, title: '文博机构', desc: '博物馆 / 档案馆 藏品普查批量鉴定', color: 'from-jade-500 to-jade-600' },
    { icon: ShoppingCart, title: '电商平台', desc: '文玩类目 商品上架真品核验', color: 'from-gold-500 to-gold-600' },
    { icon: Hammer, title: '拍卖行', desc: '拍品 前置筛查 + 证书批量生成', color: 'from-cinnabar-400 to-cinnabar-500' },
  ];

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'quickstart', label: '快速体验', icon: Rocket },
    { key: 'docs', label: '接口文档', icon: BookOpen },
    { key: 'scenarios', label: 'B端场景方案', icon: LayoutDashboard },
    { key: 'sdk', label: 'SDK 与工具', icon: Boxes },
  ];

  const pricingPlans = [
    {
      level: '免费版',
      price: '¥0',
      period: '/月',
      calls: '100 次/月',
      features: ['AI 图像初筛', '证书验真查询', '社区论坛支持', '标准 API 文档'],
      button: '立即开通',
    },
    {
      level: '专业版',
      price: '¥2,999',
      period: '/月',
      calls: '10,000 次/月',
      features: [
        '全部 API 接口',
        '批量初鉴（20张/次）',
        '电子证书生成',
        '邮件 + 工单支持',
        'SLA 99.9% 可用性',
        '5 个 API Key',
      ],
      button: '立即开通',
      featured: true,
    },
    {
      level: '定制版',
      price: '咨询定价',
      period: '',
      calls: '无限次调用',
      features: [
        '全部 API 接口',
        '定制化接口开发',
        '1 对 1 架构师对接',
        '私有化部署支持',
        '7x24 专属响应',
        '博物馆级别 SLA',
      ],
      button: '联系销售',
    },
  ];

  return (
    <div className="bg-rice-100 min-h-screen">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-ink-gradient min-h-[620px] flex items-center"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(201, 169, 97, 0.08) 50px, rgba(201, 169, 97, 0.08) 100px)`,
            }}
          />
        </div>
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-jade-400/10 blur-3xl" />

        <div className="container relative z-10 py-20">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Tag variant="gold" className="mb-6 px-4 py-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  鉴真阁 B 端开放能力
                </Tag>
                <h1 className="font-serif text-4xl md:text-6xl font-bold text-gold-300 mb-6 leading-tight">
                  鉴真阁
                  <span className="text-gold-400"> B 端开放平台</span>
                </h1>
                <p className="text-jade-200 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
                  将专业鉴定能力集成到您的业务系统，支持博物馆藏品批量初鉴、电商平台品控、拍卖行前置筛查等场景
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid sm:grid-cols-3 gap-4 mb-10"
              >
                {heroScenarios.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.title} className="bg-jade-800/30 border-jade-600/40 backdrop-blur-sm overflow-hidden">
                      <Card.Content className="p-5">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br',
                            s.color,
                          )}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-serif text-lg font-semibold text-gold-200 mb-1.5">{s.title}</h3>
                        <p className="text-sm text-jade-300 leading-relaxed">{s.desc}</p>
                      </Card.Content>
                    </Card>
                  );
                })}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="bg-rice-50/95 backdrop-blur-sm border-gold-400/60 overflow-hidden">
                <div className="bg-gold-gradient/10 px-6 py-4 border-b border-gold-200">
                  <h3 className="font-serif text-xl font-semibold text-jade-700 text-center">立即开启合作</h3>
                </div>
                <Card.Content className="p-6 space-y-4">
                  <Button size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />} className="py-4">
                    免费申请 API Key
                  </Button>
                  <Button variant="secondary" size="lg" fullWidth leftIcon={<Calendar className="w-4 h-4" />}>
                    预约商务演示
                  </Button>
                  <div className="pt-4 border-t border-gold-200">
                    <a href="tel:400-888-8928" className="flex items-center justify-center gap-3 text-jade-600 hover:text-gold-600 transition-colors py-2">
                      <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gold-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-jade-500">合作咨询热线</div>
                        <div className="font-serif text-xl font-bold text-gold-600">400-888-8928</div>
                      </div>
                    </a>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { icon: Zap, label: '毫秒响应' },
                      { icon: Shield, label: '银行级加密' },
                      { icon: Activity, label: '99.99%可用' },
                    ].map((i) => {
                      const I = i.icon;
                      return (
                        <div key={i.label} className="text-center py-2">
                          <I className="w-5 h-5 text-jade-500 mx-auto mb-1" />
                          <div className="text-xs text-jade-600">{i.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="container py-16">
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 p-1.5 bg-jade-100 rounded-lg w-fit mx-auto mb-12">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    'px-6 py-3 rounded-md font-medium text-sm transition-all duration-300 flex items-center gap-2',
                    activeTab === t.key
                      ? 'bg-ink-gradient text-white shadow-gold-glow'
                      : 'text-jade-600 hover:text-jade-800 hover:bg-rice-50',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'quickstart' && (
              <motion.div
                key="quickstart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="font-serif text-3xl font-bold text-jade-700 mb-3">快速体验 API 能力</h2>
                  <p className="text-jade-500">无需申请 Key，在线调试，限定额度免费体验</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="overflow-hidden">
                    <Card.Header className="bg-jade-50/50">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-gold-500" />
                          <Card.Title>API 调试面板</Card.Title>
                        </div>
                        <Badge variant="warning" dot>
                          演示模式
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Content className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-jade-700 mb-2">选择接口</label>
                        <select
                          value={selectedApi.id}
                          onChange={(e) => {
                            const api = apiEndpoints.find((a) => a.id === e.target.value);
                            if (api) setSelectedApi(api);
                            setResponseData(null);
                          }}
                          className="w-full px-4 py-3 rounded-md border border-gold-300 bg-rice-50 text-jade-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                        >
                          {apiEndpoints.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.method} {a.path} — {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-jade-50 rounded-lg p-4 border border-jade-200">
                        <p className="text-sm text-jade-600 mb-2">{selectedApi.desc}</p>
                        <div className="flex gap-4 text-xs">
                          <span className="flex items-center gap-1 text-jade-500">
                            <Clock className="w-3.5 h-3.5" />
                            响应 {selectedApi.responseTime}
                          </span>
                          <span className="flex items-center gap-1 text-gold-600 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {selectedApi.rate}
                          </span>
                        </div>
                      </div>

                      {(selectedApi.id === 'screen' || selectedApi.id === 'batch-screen') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-jade-700">
                              测试图片 {selectedApi.id === 'batch-screen' && <span className="text-jade-500 ml-1">（已选 {selectedImages.length} 张，最多 20 张）</span>}
                            </label>
                            <button
                              onClick={addSampleImages}
                              className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-gold-50 transition-colors"
                            >
                              <ImagePlus className="w-3.5 h-3.5" />
                              添加示例图片
                            </button>
                          </div>
                          <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-jade-50 rounded-lg border border-jade-200">
                            {sampleImages.map((img) => {
                              const active = selectedImages.includes(img.id);
                              return (
                                <div
                                  key={img.id}
                                  onClick={() => toggleImage(img.id)}
                                  className={cn(
                                    'relative rounded-md overflow-hidden cursor-pointer transition-all group border-2',
                                    active ? 'border-gold-500 shadow-gold-glow scale-[1.02]' : 'border-transparent opacity-70 hover:opacity-100',
                                  )}
                                >
                                  <img src={img.url} alt={img.name} className="w-full aspect-square object-cover" />
                                  {active && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-jade-900/90 to-transparent p-1.5">
                                    <p className="text-[10px] text-white truncate">{img.category}</p>
                                  </div>
                                  {active && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(img.id);
                                      }}
                                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-cinnabar-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-2.5 h-2.5 text-white" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            <button className="aspect-square rounded-md border-2 border-dashed border-jade-300 bg-rice-50 hover:border-gold-400 hover:bg-gold-50 transition-colors flex flex-col items-center justify-center text-jade-400 hover:text-gold-500">
                              <Plus className="w-5 h-5 mb-0.5" />
                              <span className="text-[10px]">上传</span>
                            </button>
                          </div>
                          {selectedApi.id === 'batch-screen' && selectedImages.length > 0 && (
                            <div className="mt-2 p-2 bg-rice-50 rounded border border-gold-200 max-h-24 overflow-y-auto">
                              {sampleImages
                                .filter((i) => selectedImages.includes(i.id))
                                .map((i) => (
                                  <div key={i.id} className="text-xs text-jade-600 py-0.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-jade-400" />
                                    {i.name}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {(selectedApi.id === 'screen' || selectedApi.id === 'batch-screen') && (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-jade-700">置信度阈值 accuracy_threshold</label>
                              <span className="text-sm font-mono text-gold-600 font-bold">{threshold.toFixed(2)}</span>
                            </div>
                            <input
                              type="range"
                              min={0.5}
                              max={0.99}
                              step={0.01}
                              value={threshold}
                              onChange={(e) => setThreshold(+e.target.value)}
                              className="w-full h-2 bg-jade-200 rounded-lg appearance-none cursor-pointer accent-gold-500"
                            />
                            <div className="flex justify-between text-xs text-jade-400 mt-1">
                              <span>0.50 宽松</span>
                              <span>0.75 标准</span>
                              <span>0.99 严格</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-jade-50 rounded-lg border border-jade-200">
                            <div>
                              <div className="text-sm font-medium text-jade-700">include_features</div>
                              <div className="text-xs text-jade-500">返回材质、工艺等详细特征</div>
                            </div>
                            <button
                              onClick={() => setIncludeFeatures(!includeFeatures)}
                              className={cn(
                                'w-12 h-6 rounded-full transition-colors relative',
                                includeFeatures ? 'bg-gold-500' : 'bg-jade-300',
                              )}
                            >
                              <span
                                className={cn(
                                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                                  includeFeatures ? 'translate-x-6' : 'translate-x-0.5',
                                )}
                              />
                            </button>
                          </div>
                        </>
                      )}

                      {selectedApi.id !== 'experts' && selectedApi.id !== 'cert-verify' && (
                        <div>
                          <label className="block text-sm font-medium text-jade-700 mb-2">callback_url（可选）</label>
                          <Input
                            placeholder="https://your-domain.com/api/callback"
                            value={callbackUrl}
                            onChange={(e) => setCallbackUrl(e.target.value)}
                          />
                        </div>
                      )}

                      <Button
                        size="lg"
                        fullWidth
                        loading={isSending}
                        leftIcon={<Send className="w-4 h-4" />}
                        className="py-4 !bg-gold-gradient !border-gold-400 hover:!shadow-gold-glow"
                        onClick={handleSendRequest}
                      >
                        发送请求
                      </Button>
                    </Card.Content>
                  </Card>

                  <Card className="overflow-hidden">
                    <Card.Header className="bg-jade-50/50">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-gold-500" />
                          <Card.Title>响应结果</Card.Title>
                        </div>
                        <div className="flex gap-1 p-0.5 bg-jade-100 rounded-md">
                          {[
                            { k: 'result', l: '响应结果' },
                            { k: 'req', l: '请求头' },
                            { k: 'res', l: '响应头' },
                          ].map((t) => (
                            <button
                              key={t.k}
                              onClick={() => setResponseTab(t.k as any)}
                              className={cn(
                                'px-3 py-1 rounded text-xs font-medium transition-colors',
                                responseTab === t.k ? 'bg-ink-gradient text-white' : 'text-jade-600 hover:text-jade-800',
                              )}
                            >
                              {t.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Content className="p-0">
                      {responseTab === 'result' && (
                        <div className="h-[560px] flex flex-col">
                          {!responseData && !isSending && (
                            <div className="flex-1 flex items-center justify-center p-8">
                              <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-jade-100 flex items-center justify-center mx-auto mb-4">
                                  <Eye className="w-10 h-10 text-jade-400" />
                                </div>
                                <p className="text-jade-600 font-medium mb-1">等待请求</p>
                                <p className="text-sm text-jade-400">点击「发送请求」查看模拟响应结果</p>
                              </div>
                            </div>
                          )}
                          {isSending && (
                            <div className="flex-1 flex items-center justify-center p-8">
                              <div className="text-center">
                                <div className="w-16 h-16 rounded-full border-4 border-gold-300 border-t-transparent animate-spin mx-auto mb-4" />
                                <p className="text-jade-600 font-medium mb-1">正在处理请求...</p>
                                <p className="text-sm text-jade-400">AI 模型识别中，请稍候</p>
                              </div>
                            </div>
                          )}
                          {responseData && !isSending && (
                            <>
                              <div className="flex items-center gap-4 px-6 py-4 border-b border-gold-200 bg-jade-50/50 flex-wrap">
                                <Badge variant="success" dot className="px-3 py-1">
                                  HTTP 200 OK
                                </Badge>
                                <Badge variant="info" className="px-3 py-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  耗时 {responseTime}ms
                                </Badge>
                                {responseData.data?.batch_id && (
                                  <Badge variant="warning" className="px-3 py-1">
                                    Batch {responseData.data.batch_id}
                                  </Badge>
                                )}
                                {responseData.data?.blockchain && (
                                  <Badge variant="success" className="px-3 py-1">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    链上哈希匹配
                                  </Badge>
                                )}
                                <div className="ml-auto">
                                  <CopyButton text={JSON.stringify(responseData, null, 2)} />
                                </div>
                              </div>
                              <div className="flex-1 overflow-auto bg-jade-900 p-5">
                                <JSONHighlight json={JSON.stringify(responseData, null, 2)} />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {responseTab === 'req' && (
                        <div className="h-[560px] overflow-auto bg-jade-900 p-5">
                          <JSONHighlight
                            json={`POST ${selectedApi.path} HTTP/1.1
Host: api.jianzhenge.com
Authorization: Bearer demo_token_********
Content-Type: multipart/form-data
User-Agent: JianZhenGe-Console/1.0
X-Request-ID: req_demo_${Date.now()}
X-API-Version: v1

{
  "accuracy_threshold": ${threshold},
  "include_features": ${includeFeatures},
  "callback_url": "${callbackUrl || '(未设置)'}",
  "image_count": ${selectedImages.length}
}`}
                          />
                        </div>
                      )}
                      {responseTab === 'res' && (
                        <div className="h-[560px] overflow-auto bg-jade-900 p-5">
                          <JSONHighlight
                            json={`HTTP/1.1 200 OK
Date: ${new Date().toUTCString()}
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: ${new Date(Date.now() + 3600000).toISOString()}
Server: JZG-Gateway/2.1
X-Request-ID: req_demo_${Date.now()}
X-Response-Time: ${responseTime || '~'}ms

{
  "server": "production-cn-east-1",
  "latency_breakdown": {
    "routing": "2ms",
    "auth": "3ms",
    "model_inference": "${responseTime ? responseTime - 20 : '~'}ms",
    "post_process": "5ms"
  }
}`}
                          />
                        </div>
                      )}
                    </Card.Content>
                    <div className="border-t border-gold-200 px-6 py-3 bg-jade-50/30 flex justify-end">
                      <a href="#" className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1 font-medium">
                        查看完整文档
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="font-serif text-3xl font-bold text-jade-700 mb-3">API 接口文档</h2>
                  <p className="text-jade-500">完整的 RESTful 接口说明，支持多种语言接入</p>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                  <Card className="lg:col-span-1 h-fit sticky top-4 overflow-hidden">
                    <Card.Header className="bg-jade-50/50">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-gold-500" />
                        <Card.Title>接口目录</Card.Title>
                      </div>
                    </Card.Header>
                    <Card.Content className="p-3">
                      {activeDocCategory.map((cat) => (
                        <div key={cat.id} className="mb-1">
                          <button
                            onClick={() => toggleDocCategory(cat.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-jade-50 text-left transition-colors"
                          >
                            {cat.expanded ? (
                              <ChevronDown className="w-4 h-4 text-jade-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-jade-500" />
                            )}
                            <span className="font-medium text-jade-700 text-sm">{cat.name}</span>
                          </button>
                          <AnimatePresence>
                            {cat.expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-5 border-l border-gold-200 pl-2 py-1 space-y-0.5">
                                  {cat.items.map((item: any) => (
                                    <button
                                      key={item.id}
                                      onClick={() => setActiveDoc(item.id)}
                                      className={cn(
                                        'w-full text-left px-3 py-1.5 rounded text-sm transition-all flex items-center gap-2',
                                        activeDoc === item.id
                                          ? 'bg-gold-gradient text-white shadow-sm'
                                          : 'text-jade-600 hover:bg-jade-50 hover:text-jade-800',
                                      )}
                                    >
                                      {item.featured && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-cinnabar-400" />
                                      )}
                                      {item.name}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </Card.Content>
                  </Card>

                  <Card className="lg:col-span-3 overflow-hidden">
                    <Card.Header className="bg-jade-50/50">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="success" className="px-3 py-1">POST</Badge>
                        <code className="font-mono text-sm text-jade-700 bg-rice-50 px-3 py-1 rounded border border-gold-200 flex-1 min-w-[300px] overflow-x-auto whitespace-nowrap">
                          https://api.jianzhenge.com/openapi/v1/ai/batch-screen
                        </code>
                        <CopyButton text="https://api.jianzhenge.com/openapi/v1/ai/batch-screen" />
                      </div>
                    </Card.Header>
                    <Card.Content className="p-6 space-y-8">
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-jade-700 mb-3">批量初鉴（博物馆重点）</h3>
                        <p className="text-jade-600 leading-relaxed mb-4">
                          批量上传藏品图片进行 AI 初筛，支持单次最多 20 张图片并行处理。适用于博物馆藏品普查、电商平台批量品控等场景。
                          识别内容包括品类分类、年代推断、真伪倾向评估，支持返回详细特征分析。
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="gold">批量处理</Tag>
                          <Tag variant="jade">AI 识别</Tag>
                          <Tag variant="outline">博物馆推荐</Tag>
                          <Tag variant="outline">500件/小时</Tag>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
                          <Database className="w-5 h-5 text-gold-500" />
                          请求参数
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gold-200">
                          <table className="w-full text-sm">
                            <thead className="bg-jade-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">字段名</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">类型</th>
                                <th className="px-4 py-3 text-center font-semibold text-jade-700 border-b border-gold-200">必填</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">说明</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">示例</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { name: 'images', type: 'File[]', req: '是', desc: '藏品图片文件数组（JPG/PNG，单张≤10MB）', ex: 'multipart/form-data' },
                                { name: 'accuracy_threshold', type: 'float', req: '否', desc: '置信度阈值 0.5~0.99，默认 0.85', ex: '0.85' },
                                { name: 'include_features', type: 'boolean', req: '否', desc: '是否返回详细特征信息', ex: 'true' },
                                { name: 'callback_url', type: 'string', req: '否', desc: '异步结果回调地址（POST）', ex: 'https://.../callback' },
                                { name: 'priority', type: 'string', req: '否', desc: '处理优先级：normal/high，默认 normal', ex: 'high' },
                              ].map((r, idx) => (
                                <tr key={r.name} className={idx % 2 ? 'bg-jade-50/20' : ''}>
                                  <td className="px-4 py-3 border-b border-gold-100 font-mono text-jade-700 font-medium">{r.name}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-porcelain-600 font-mono text-xs">{r.type}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-center">
                                    {r.req === '是' ? (
                                      <Badge variant="error">必填</Badge>
                                    ) : (
                                      <Badge variant="default">选填</Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-jade-600">{r.desc}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 font-mono text-xs text-gold-700">{r.ex}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-serif text-lg font-semibold text-jade-700 flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-gold-500" />
                            请求体示例
                          </h4>
                          <CopyButton text={codeSnippets.curl} />
                        </div>
                        <div className="bg-jade-900 rounded-lg p-5 overflow-x-auto">
                          <JSONHighlight json={codeSnippets.curl} />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-gold-500" />
                          响应参数（节选）
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gold-200">
                          <table className="w-full text-sm">
                            <thead className="bg-jade-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">字段名</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">类型</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">说明</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { name: 'data.batch_id', type: 'string', desc: '本次批处理唯一编号' },
                                { name: 'data.results[]', type: 'array', desc: '各图片识别结果数组' },
                                { name: 'results[].category', type: 'string', desc: '识别品类（陶瓷/玉器/书画等12类）' },
                                { name: 'results[].authenticity_prediction', type: 'enum', desc: '真伪倾向：GENUINE/SUSPICIOUS/FAKE' },
                                { name: 'data.summary', type: 'object', desc: '批处理汇总统计' },
                              ].map((r, idx) => (
                                <tr key={r.name} className={idx % 2 ? 'bg-jade-50/20' : ''}>
                                  <td className="px-4 py-3 border-b border-gold-100 font-mono text-jade-700 text-xs">{r.name}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-porcelain-600 font-mono text-xs">{r.type}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-jade-600">{r.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
                          <Network className="w-5 h-5 text-gold-500" />
                          各语言代码示例
                        </h4>
                        <div className="border border-gold-200 rounded-lg overflow-hidden">
                          <div className="flex gap-1 p-1.5 bg-jade-50 border-b border-gold-200 flex-wrap">
                            {[
                              { k: 'curl', l: 'cURL' },
                              { k: 'python', l: 'Python' },
                              { k: 'node', l: 'Node.js' },
                              { k: 'java', l: 'Java' },
                            ].map((t) => (
                              <button
                                key={t.k}
                                onClick={() => setActiveCodeTab(t.k as any)}
                                className={cn(
                                  'px-4 py-1.5 rounded text-sm font-medium transition-colors',
                                  activeCodeTab === t.k
                                    ? 'bg-ink-gradient text-white'
                                    : 'text-jade-600 hover:text-jade-800 hover:bg-rice-50',
                                )}
                              >
                                {t.l}
                              </button>
                            ))}
                            <div className="ml-auto">
                              <CopyButton text={codeSnippets[activeCodeTab]} />
                            </div>
                          </div>
                          <div className="bg-jade-900 p-5 overflow-x-auto max-h-[360px] overflow-y-auto">
                            <JSONHighlight json={codeSnippets[activeCodeTab]} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-gold-500" />
                          错误码说明
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gold-200">
                          <table className="w-full text-sm">
                            <thead className="bg-jade-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">错误码</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">HTTP 状态</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">说明</th>
                                <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">解决方案</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { code: '10001', http: '400', msg: '参数错误', sol: '检查必填参数是否完整，格式是否正确' },
                                { code: '10002', http: '401', msg: '认证失败', sol: '检查 Access Token 是否有效' },
                                { code: '10003', http: '403', msg: '配额超限', sol: '升级套餐或稍后重试' },
                                { code: '10004', http: '413', msg: '图片过大', sol: '单张图片不超过 10MB' },
                                { code: '10005', http: '429', msg: '请求频率超限', sol: '降低调用频率或申请更高 QPS' },
                                { code: '50001', http: '500', msg: '服务内部错误', sol: '重试或联系技术支持' },
                              ].map((r, idx) => (
                                <tr key={r.code} className={idx % 2 ? 'bg-jade-50/20' : ''}>
                                  <td className="px-4 py-3 border-b border-gold-100 font-mono text-cinnabar-600 font-medium">{r.code}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 font-mono text-porcelain-600">{r.http}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-jade-600">{r.msg}</td>
                                  <td className="px-4 py-3 border-b border-gold-100 text-jade-500 text-sm">{r.sol}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'scenarios' && (
              <motion.div
                key="scenarios"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="font-serif text-3xl font-bold text-jade-700 mb-3">B 端场景方案</h2>
                  <p className="text-jade-500">针对文博、电商、拍卖行业的深度定制化解决方案</p>
                </div>

                <div className="flex flex-wrap gap-2 p-1.5 bg-jade-100 rounded-lg w-fit mx-auto mb-10">
                  {[
                    { k: 'museum', l: '博物馆藏品普查', icon: Building2, featured: true },
                    { k: 'ecom', l: '电商品控', icon: ShoppingCart },
                    { k: 'auction', l: '拍卖行前置筛查', icon: Hammer },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.k}
                        onClick={() => setScenarioTab(s.k as any)}
                        className={cn(
                          'px-6 py-3 rounded-md font-medium text-sm transition-all duration-300 flex items-center gap-2',
                          scenarioTab === s.k
                            ? 'bg-ink-gradient text-white shadow-gold-glow'
                            : 'text-jade-600 hover:text-jade-800 hover:bg-rice-50',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {s.l}
                        {s.featured && <Tag variant="seal" className="!py-0 !px-1.5 !text-[10px]">重点</Tag>}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {scenarioTab === 'museum' && (
                    <motion.div
                      key="museum"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <Card className="overflow-hidden">
                        <Card.Header className="bg-gold-gradient/10 border-b border-gold-300">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-12 h-12 rounded-lg bg-ink-gradient flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-gold-300" />
                            </div>
                            <div>
                              <Card.Title className="text-2xl">博物馆藏品普查批量初鉴方案</Card.Title>
                              <Card.Description>面向省级/市级博物馆、档案馆的藏品数字化鉴定解决方案</Card.Description>
                            </div>
                            <div className="ml-auto">
                              <Tag variant="gold" className="px-3 py-1">推荐方案</Tag>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Content className="p-6 space-y-8">
                          <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                              <h4 className="font-serif text-lg font-semibold text-jade-700 mb-3">项目背景</h4>
                              <p className="text-jade-600 leading-relaxed mb-4">
                                某省级博物馆拥有<span className="font-semibold text-gold-600"> 50,000+ </span>件在册藏品，由于历史原因，其中仅不到 10% 有完整的鉴定记录。
                                在推进「全国博物馆藏品数字化普查」工作中，面临<span className="font-semibold text-cinnabar-500">鉴定专家短缺、周期长、成本高</span>的核心瓶颈。
                              </p>
                              <div className="grid sm:grid-cols-3 gap-3">
                                {[
                                  { n: '50,000+', l: '在册藏品总数', c: 'text-jade-600' },
                                  { n: '< 10%', l: '有鉴定记录', c: 'text-cinnabar-500' },
                                  { n: '∞', l: '人工鉴定成本', c: 'text-gold-600' },
                                ].map((s) => (
                                  <div key={s.l} className="p-4 rounded-lg bg-jade-50 border border-gold-200">
                                    <div className={cn('font-serif text-2xl font-bold mb-1', s.c)}>{s.n}</div>
                                    <div className="text-xs text-jade-500">{s.l}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Card className="bg-gradient-to-br from-jade-50 to-rice-50 border-gold-300">
                              <Card.Content className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-10 h-10 rounded-lg bg-cinnabar-400/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-cinnabar-500" />
                                  </div>
                                  <h5 className="font-serif font-semibold text-jade-700">核心痛点</h5>
                                </div>
                                <ul className="space-y-2 text-sm text-jade-600">
                                  {['专家资源匮乏，排队周期长', '人工鉴定成本高（500元/件起）', '标准不统一，结论因人而异', '纸质档案不易检索与溯源'].map((t) => (
                                    <li key={t} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cinnabar-400 mt-1.5 flex-shrink-0" />
                                      {t}
                                    </li>
                                  ))}
                                </ul>
                              </Card.Content>
                            </Card>
                          </div>

                          <div>
                            <h4 className="font-serif text-lg font-semibold text-jade-700 mb-5 flex items-center gap-2">
                              <Network className="w-5 h-5 text-gold-500" />
                              方案架构流程
                            </h4>
                            <div className="relative p-6 bg-gradient-to-r from-jade-50 via-rice-50 to-jade-50 rounded-xl border border-gold-200">
                              <div className="grid md:grid-cols-5 gap-4 items-stretch">
                                {[
                                  { n: 1, t: '批量上传', d: 'Excel/CSV清单导入，支持1000张/批', icon: Upload },
                                  { n: 2, t: 'AI初筛流水线', d: '12类分类+年代+真伪倾向，500件/小时', icon: Sparkles },
                                  { n: 3, t: '可疑人工复核', d: 'AI标记存疑→推送专家二次鉴定', icon: UserCheck },
                                  { n: 4, t: '电子档案生成', d: '带区块链存证哈希，永久溯源', icon: FileCheck },
                                  { n: 5, t: '系统对接', d: 'RESTful/Webhook对接藏品系统', icon: RefreshCw },
                                ].map((step, idx) => {
                                  const Icon = step.icon;
                                  return (
                                    <div key={step.n} className="relative">
                                      <Card className="h-full bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-gold-glow transition-all duration-300 border-gold-300">
                                        <Card.Content className="p-4 text-center">
                                          <div className="relative w-12 h-12 mx-auto mb-3">
                                            <div className="absolute inset-0 rounded-full bg-gold-gradient" />
                                            <div className="absolute inset-0.5 rounded-full bg-rice-50 flex items-center justify-center">
                                              <span className="font-serif font-bold text-gold-600 text-sm">{step.n}</span>
                                            </div>
                                          </div>
                                          <div className="w-10 h-10 rounded-lg bg-ink-gradient/10 flex items-center justify-center mx-auto mb-3">
                                            <Icon className="w-5 h-5 text-jade-600" />
                                          </div>
                                          <h5 className="font-serif font-semibold text-jade-700 text-sm mb-1">{step.t}</h5>
                                          <p className="text-xs text-jade-500 leading-relaxed">{step.d}</p>
                                        </Card.Content>
                                      </Card>
                                      {idx < 4 && (
                                        <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                                          <ChevronRight className="w-6 h-6 text-gold-400" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-serif text-lg font-semibold text-jade-700 mb-5 flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-gold-500" />
                              效能对比
                            </h4>
                            <div className="grid md:grid-cols-5 gap-4">
                              <Card className="md:col-span-1 bg-jade-50 border-jade-200">
                                <Card.Content className="p-5 text-center">
                                  <p className="font-serif font-semibold text-jade-700 mb-4">对比维度</p>
                                </Card.Content>
                              </Card>
                              <Card className="md:col-span-2 bg-cinnabar-50/50 border-cinnabar-200">
                                <Card.Content className="p-5">
                                  <div className="flex items-center justify-center gap-2 mb-4">
                                    <XCircle className="w-4 h-4 text-cinnabar-500" />
                                    <p className="font-serif font-semibold text-cinnabar-600">传统人工鉴定</p>
                                  </div>
                                </Card.Content>
                              </Card>
                              <Card className="md:col-span-2 bg-jade-500 border-jade-500">
                                <Card.Content className="p-5">
                                  <div className="flex items-center justify-center gap-2 mb-4">
                                    <CheckCircle2 className="w-4 h-4 text-gold-300" />
                                    <p className="font-serif font-semibold text-gold-300">鉴真阁 B 端方案</p>
                                  </div>
                                </Card.Content>
                              </Card>
                            </div>
                            {[
                              { label: '单处理耗时', old: '2 小时', new: '7 秒', diff: '提升 1000x' },
                              { label: '单件成本', old: '¥500', new: '¥8', diff: '降低 98%' },
                              { label: '5万件周期', old: '6 个月', new: '15 天', diff: '缩短 92%' },
                              { label: '鉴定覆盖率', old: '8%', new: '100%', diff: '全覆盖' },
                            ].map((row) => (
                              <div key={row.label} className="grid md:grid-cols-5 gap-4 mt-2">
                                <Card className="md:col-span-1 border-gold-200 bg-rice-50">
                                  <Card.Content className="p-4 text-center">
                                    <p className="text-sm font-medium text-jade-700">{row.label}</p>
                                  </Card.Content>
                                </Card>
                                <Card className="md:col-span-2 border-cinnabar-200/50">
                                  <Card.Content className="p-4 text-center">
                                    <p className="font-mono font-bold text-cinnabar-500 text-lg">{row.old}</p>
                                  </Card.Content>
                                </Card>
                                <Card className="md:col-span-2 border-gold-300 bg-gold-gradient/5">
                                  <Card.Content className="p-4 text-center flex items-center justify-center gap-3 flex-wrap">
                                    <p className="font-mono font-bold text-jade-600 text-lg">{row.new}</p>
                                    <Badge variant="success" dot>{row.diff}</Badge>
                                  </Card.Content>
                                </Card>
                              </div>
                            ))}
                          </div>

                          <div className="grid lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 overflow-hidden bg-gradient-to-br from-rice-50 via-gold-50/30 to-rice-50 border-gold-400">
                              <Card.Content className="p-6">
                                <div className="flex items-start gap-4 flex-wrap">
                                  <div className="w-14 h-14 rounded-lg bg-ink-gradient flex items-center justify-center flex-shrink-0">
                                    <Award className="w-7 h-7 text-gold-300" />
                                  </div>
                                  <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <h5 className="font-serif text-xl font-semibold text-jade-700">某省博物馆合作案例</h5>
                                      <Tag variant="gold">标杆案例</Tag>
                                    </div>
                                    <p className="text-jade-600 leading-relaxed mb-4">
                                      2024 年 Q3 完成<span className="font-semibold text-gold-600"> 32,000 件瓷器类藏品</span>的批量初鉴建卡工作，
                                      原计划 6 个月的工作量，实际仅用时 12 天完成。AI 初筛准确率达 94.6%，存疑推送专家复核 5.4%。
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                      {[
                                        { n: '32,000', l: '完成鉴定件数' },
                                        { n: '12 天', l: '实际交付周期' },
                                        { n: '94.6%', l: 'AI 初筛准确率' },
                                      ].map((s) => (
                                        <div key={s.l} className="p-3 rounded-lg bg-white/70 border border-gold-200 text-center">
                                          <p className="font-serif font-bold text-gold-600 text-lg mb-0.5">{s.n}</p>
                                          <p className="text-xs text-jade-500">{s.l}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </Card.Content>
                            </Card>
                            <div className="flex flex-col justify-center space-y-4">
                              <Button size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />} className="py-4">
                                获取博物馆定制方案
                              </Button>
                              <Button variant="secondary" size="lg" fullWidth leftIcon={<Phone className="w-4 h-4" />}>
                                拨打方案咨询专线
                              </Button>
                              <div className="p-4 rounded-lg bg-jade-50 border border-jade-200">
                                <div className="flex items-center gap-2 text-sm text-jade-600">
                                  <Shield className="w-4 h-4 text-jade-500" />
                                  <span>博物馆公益项目享 <b className="text-gold-600">5折优惠</b></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card.Content>
                      </Card>
                    </motion.div>
                  )}

                  {scenarioTab === 'ecom' && (
                    <motion.div
                      key="ecom"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 overflow-hidden">
                          <Card.Header className="bg-gold-gradient/10 border-b border-gold-300">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="w-12 h-12 rounded-lg bg-ink-gradient flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-gold-300" />
                              </div>
                              <div>
                                <Card.Title className="text-2xl">电商平台文玩品控方案</Card.Title>
                                <Card.Description>为文玩类电商平台提供上架品控、打假溯源、纠纷仲裁一站式能力</Card.Description>
                              </div>
                            </div>
                          </Card.Header>
                          <Card.Content className="p-6 space-y-6">
                            <div className="overflow-x-auto rounded-lg border border-gold-200">
                              <table className="w-full text-sm">
                                <thead className="bg-jade-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">维度</th>
                                    <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">电商平台痛点</th>
                                    <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">鉴真阁方案</th>
                                    <th className="px-4 py-3 text-left font-semibold text-jade-700 border-b border-gold-200">成效</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { k: '假货纠纷', a: '文玩类目投诉率 15%+，仲裁难', b: 'AI初筛+证书链上存证', r: '纠纷率下降 87%' },
                                    { k: '商家合规', a: '假货入驻损害平台信誉', b: '入驻商户强制AI验真对接', r: '退货率下降 62%' },
                                    { k: '买家信任', a: '图文描述与实物不符', b: '电子证书嵌入商品详情页', r: '转化率提升 35%' },
                                    { k: '审核成本', a: '人工品控团队庞大', b: 'API批量自动验真', r: '品控成本降低 74%' },
                                  ].map((row, idx) => (
                                    <tr key={row.k} className={idx % 2 ? 'bg-jade-50/20' : ''}>
                                      <td className="px-4 py-3 border-b border-gold-100 font-medium text-jade-700">{row.k}</td>
                                      <td className="px-4 py-3 border-b border-gold-100 text-cinnabar-600">{row.a}</td>
                                      <td className="px-4 py-3 border-b border-gold-100 text-jade-600">{row.b}</td>
                                      <td className="px-4 py-3 border-b border-gold-100">
                                        <Badge variant="success" dot>{row.r}</Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div>
                              <h5 className="font-serif font-semibold text-jade-700 mb-4 flex items-center gap-2">
                                <Network className="w-4 h-4 text-gold-500" />
                                对接流程
                              </h5>
                              <div className="grid sm:grid-cols-4 gap-3">
                                {[
                                  { n: 1, t: '商家入驻', d: '平台触发API调用' },
                                  { n: 2, t: '自动验真', d: '商品图AI批量筛查' },
                                  { n: 3, t: '存疑拦截', d: '高风险商品下架审核' },
                                  { n: 4, t: '证书绑定', d: '通过商品生成证书' },
                                ].map((s) => (
                                  <div key={s.n} className="p-4 rounded-lg bg-jade-50 border border-gold-200 text-center">
                                    <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-2">
                                      <span className="text-white font-bold text-sm">{s.n}</span>
                                    </div>
                                    <p className="font-medium text-jade-700 text-sm mb-1">{s.t}</p>
                                    <p className="text-xs text-jade-500">{s.d}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Card.Content>
                        </Card>

                        <div className="space-y-6">
                          <Card className="bg-gradient-to-br from-gold-50/50 to-rice-50 border-gold-300">
                            <Card.Content className="p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-jade-500 flex items-center justify-center">
                                  <Activity className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <p className="font-serif font-bold text-jade-700">接入成效</p>
                                  <p className="text-xs text-jade-500">某头部文玩电商数据</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {[
                                  { n: '87%', l: '客诉纠纷率下降', c: 'text-jade-600' },
                                  { n: '35%', l: '单品转化率提升', c: 'text-gold-600' },
                                  { n: '2.1x', l: '复购率增长', c: 'text-cinnabar-500' },
                                ].map((s) => (
                                  <div key={s.l} className="flex items-end justify-between p-3 rounded-lg bg-white/60 border border-gold-200">
                                    <span className="text-sm text-jade-600">{s.l}</span>
                                    <span className={cn('font-serif font-bold text-2xl', s.c)}>{s.n}</span>
                                  </div>
                                ))}
                              </div>
                            </Card.Content>
                          </Card>
                          <Button size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />} className="py-4">
                            接入电商品控方案
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {scenarioTab === 'auction' && (
                    <motion.div
                      key="auction"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 overflow-hidden">
                          <Card.Header className="bg-cinnabar-400/10 border-b border-cinnabar-300/50">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="w-12 h-12 rounded-lg bg-ink-gradient flex items-center justify-center">
                                <Hammer className="w-6 h-6 text-gold-300" />
                              </div>
                              <div>
                                <Card.Title className="text-2xl">拍卖行前置筛查方案</Card.Title>
                                <Card.Description>拍品预鉴 + 证书批量生成，提升拍卖行公信力与成交溢价</Card.Description>
                              </div>
                            </div>
                          </Card.Header>
                          <Card.Content className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                              <Card className="bg-rice-50 border-gold-200">
                                <Card.Content className="p-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-5 h-5 text-gold-500" />
                                    <h5 className="font-serif font-semibold text-jade-700">拍品预鉴</h5>
                                  </div>
                                  <ul className="space-y-2 text-sm text-jade-600">
                                    {['征集期批量AI初筛', '高仿真品推送专家复核', '自动生成拍品估值区间', '疑似仿品提前拦截过滤'].map((t) => (
                                      <li key={t} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-jade-500 mt-0.5 flex-shrink-0" />
                                        {t}
                                      </li>
                                    ))}
                                  </ul>
                                </Card.Content>
                              </Card>
                              <Card className="bg-rice-50 border-gold-200">
                                <Card.Content className="p-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileCheck className="w-5 h-5 text-gold-500" />
                                    <h5 className="font-serif font-semibold text-jade-700">证书批量生成</h5>
                                  </div>
                                  <ul className="space-y-2 text-sm text-jade-600">
                                    {['批量生成链上存证证书', 'PDF/图片多格式导出', '嵌入拍卖图录及线上展页', '扫码查看完整鉴定报告'].map((t) => (
                                      <li key={t} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-jade-500 mt-0.5 flex-shrink-0" />
                                        {t}
                                      </li>
                                    ))}
                                  </ul>
                                </Card.Content>
                              </Card>
                            </div>

                            <div className="p-5 rounded-xl bg-gradient-to-r from-jade-500 to-jade-700 text-white">
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                  <p className="font-serif text-xl font-bold mb-1 text-gold-300">溢价提升</p>
                                  <p className="text-jade-100 text-sm">接入证书后，平均成交价提升 <b className="text-gold-300">28%</b></p>
                                </div>
                                <div className="text-right">
                                  <p className="font-serif text-4xl font-bold text-gold-300">+28%</p>
                                  <p className="text-xs text-jade-200">平均成交溢价</p>
                                </div>
                              </div>
                            </div>
                          </Card.Content>
                        </Card>

                        <div className="space-y-6">
                          <Card className="overflow-hidden">
                            <Card.Content className="p-0">
                              <div className="p-5 bg-ink-gradient">
                                <p className="font-serif font-bold text-gold-300 text-lg">行业痛点</p>
                              </div>
                              <div className="p-5 space-y-3">
                                {[
                                  { i: AlertTriangle, t: '拍品真伪存疑', d: '赝品上拍损害信誉', c: 'text-cinnabar-500' },
                                  { i: Clock, t: '鉴定周期长', d: '赶不上拍卖档期', c: 'text-gold-600' },
                                  { i: BarChart3, t: '估值无依据', d: '起拍价难以确定', c: 'text-porcelain-500' },
                                ].map((p) => {
                                  const I = p.i;
                                  return (
                                    <div key={p.t} className="flex gap-3 p-3 rounded-lg bg-jade-50">
                                      <I className={cn('w-5 h-5 flex-shrink-0 mt-0.5', p.c)} />
                                      <div>
                                        <p className="font-medium text-jade-700 text-sm">{p.t}</p>
                                        <p className="text-xs text-jade-500">{p.d}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </Card.Content>
                          </Card>
                          <Button size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />} className="py-4">
                            获取拍卖行定制方案
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'sdk' && (
              <motion.div
                key="sdk"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="font-serif text-3xl font-bold text-jade-700 mb-3">SDK 与开发工具</h2>
                  <p className="text-jade-500">多语言 SDK、命令行工具、Postman 集合，让集成更简单</p>
                </div>

                <div className="mb-12">
                  <h3 className="font-serif text-xl font-semibold text-jade-700 mb-5 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-gold-500" />
                    官方 SDK 下载
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sdkList.map((s, idx) => (
                      <motion.div
                        key={s.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <Card hoverable className="h-full overflow-hidden group">
                          <Card.Content className="p-5 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-serif text-lg font-semibold text-jade-700 mb-1">{s.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-jade-500">
                                  <Tag variant="outline">{s.version}</Tag>
                                  <span>{s.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-gold-600 bg-gold-50 px-2 py-1 rounded">
                                <Star className="w-3.5 h-3.5 fill-gold-400" />
                                <span className="text-xs font-medium">{s.stars}</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-jade-900 text-xs font-mono overflow-x-auto relative group">
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={s.install} />
                              </div>
                              <code className="text-jade-300">$ {s.install}</code>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="info">{s.pkg}</Badge>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="secondary" fullWidth leftIcon={<Github className="w-3.5 h-3.5" />}>
                                源码
                              </Button>
                              <Button size="sm" fullWidth leftIcon={<Download className="w-3.5 h-3.5" />}>
                                文档
                              </Button>
                            </div>
                          </Card.Content>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-12">
                  <Card className="overflow-hidden">
                    <Card.Header className="bg-jade-50/50">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-gold-500" />
                        <Card.Title>jzg-cli 命令行工具</Card.Title>
                      </div>
                    </Card.Header>
                    <Card.Content className="p-0">
                      <div className="bg-jade-900 p-5 space-y-4 font-mono text-sm">
                        <div>
                          <p className="text-jade-500 text-xs mb-2"># 安装命令行工具</p>
                          <div className="relative group">
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text="npm install -g @jianzhenge/cli" />
                            </div>
                            <p><span className="text-gold-400">$</span> <span className="text-jade-200">npm install -g @jianzhenge/cli</span></p>
                          </div>
                        </div>
                        <div>
                          <p className="text-jade-500 text-xs mb-2"># 批量初鉴示例（输出 CSV）</p>
                          <div className="relative group">
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text="jzg batch-screen ./images --csv output.csv --threshold 0.8" />
                            </div>
                            <p className="break-all"><span className="text-gold-400">$</span> <span className="text-jade-200">jzg batch-screen ./images --csv output.csv --threshold 0.8</span></p>
                          </div>
                        </div>
                        <div className="border-t border-jade-700 pt-4">
                          <p className="text-jade-500 text-xs mb-2"># 运行输出示例</p>
                          <div className="space-y-1 text-xs">
                            <p className="text-jade-400">[16:42:08] <span className="text-jade-300">读取目录...</span> 发现 156 张图片</p>
                            <p className="text-jade-400">[16:42:09] <span className="text-gold-300">初始化模型</span> batch-screen v1</p>
                            <p className="text-jade-400">[16:42:10] <span className="text-jade-300">进度 32/156</span> ▓▓▓▓▓▓░░░░░ 20.5%</p>
                            <p className="text-jade-400">[16:43:45] <span className="text-jade-500">完成</span> 156 张已处理 | 真品 112 | 存疑 38 | 仿品 6</p>
                            <p className="text-jade-400">[16:43:45] <span className="text-jade-300">CSV 已写入</span> output.csv (耗时 96.7s)</p>
                          </div>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>

                  <div className="space-y-6">
                    <Card className="overflow-hidden">
                      <Card.Content className="p-6">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="w-12 h-12 rounded-lg bg-porcelain-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-6 h-6 text-porcelain-500" />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <h4 className="font-serif text-lg font-semibold text-jade-700 mb-1">Postman 集合</h4>
                            <p className="text-sm text-jade-500 mb-4">一键导入 40+ 接口，开箱即用，包含完整示例参数</p>
                            <div className="flex gap-3 flex-wrap">
                              <Button leftIcon={<Download className="w-4 h-4" />}>下载 JSON</Button>
                              <Button variant="secondary" leftIcon={<ExternalLink className="w-4 h-4" />}>一键导入</Button>
                            </div>
                          </div>
                        </div>
                      </Card.Content>
                    </Card>

                    <Card className="overflow-hidden">
                      <Card.Content className="p-6">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="w-12 h-12 rounded-lg bg-gold-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-gold-600" />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <h4 className="font-serif text-lg font-semibold text-jade-700 mb-1">开发者资源</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {[
                                { l: 'API 变更日志', i: ExternalLink },
                                { l: '错误码排查', i: AlertTriangle },
                                { l: '对接最佳实践', i: CheckCircle2 },
                                { l: 'Webhook 事件', i: RefreshCw },
                              ].map((r) => {
                                const I = r.i;
                                return (
                                  <a key={r.l} href="#" className="flex items-center gap-1.5 text-jade-600 hover:text-gold-600 transition-colors py-1">
                                    <I className="w-3.5 h-3.5" />
                                    <span>{r.l}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </Card.Content>
                    </Card>
                  </div>
                </div>

                <Card className="overflow-hidden">
                  <Card.Header className="bg-gold-gradient/10 border-b border-gold-300">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gold-500" />
                        <Card.Title>API 状态看板（实时）</Card.Title>
                      </div>
                      <Badge variant="success" dot>全部服务正常运行</Badge>
                    </div>
                  </Card.Header>
                  <Card.Content className="p-6">
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                      {[
                        { n: '1,284,596', l: '今日调用量', i: BarChart3, c: 'text-jade-600' },
                        { n: '489/s', l: 'QPS 峰值', i: Zap, c: 'text-gold-600' },
                        { n: '186ms', l: '平均响应时间', i: Clock, c: 'text-porcelain-500' },
                        { n: '0.02%', l: '错误率', i: AlertTriangle, c: 'text-jade-500' },
                      ].map((s) => {
                        const I = s.i;
                        return (
                          <div key={s.l} className="p-5 rounded-xl bg-gradient-to-br from-rice-50 to-jade-50/50 border border-gold-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                <I className={cn('w-4.5 h-4.5', s.c)} />
                              </div>
                              <span className="text-sm text-jade-500">{s.l}</span>
                            </div>
                            <p className={cn('font-serif font-bold text-2xl', s.c)}>{s.n}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mb-6">
                      <h5 className="font-medium text-jade-700 mb-3">各接口可用性</h5>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {apiEndpoints.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-jade-50 border border-gold-200">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-jade-700 truncate">{a.name}</p>
                              <p className="text-xs font-mono text-jade-500 truncate">{a.method} {a.path}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="w-2 h-2 rounded-full bg-jade-500 animate-pulse" />
                              <span className="text-xs font-mono text-jade-600 font-medium">99.99%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-jade-700 mb-3 flex items-center justify-between">
                        <span>最近 7 天调用量趋势</span>
                        <span className="text-xs text-jade-500">单位：万次</span>
                      </h5>
                      <div className="flex items-end justify-between gap-2 h-48 px-2">
                        {[
                          { d: '周一', v: 62 },
                          { d: '周二', v: 78 },
                          { d: '周三', v: 85 },
                          { d: '周四', v: 72 },
                          { d: '周五', v: 95 },
                          { d: '周六', v: 88 },
                          { d: '周日', v: 54 },
                        ].map((d, idx) => (
                          <div key={d.d} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full relative flex flex-col justify-end" style={{ height: '160px' }}>
                              <div
                                className={cn(
                                  'w-full rounded-t-md transition-all duration-700 relative group',
                                  idx === 4 ? 'bg-gold-gradient' : 'bg-gradient-to-t from-jade-500 to-jade-400',
                                )}
                                style={{ height: `${d.v}%`, animationDelay: `${idx * 0.1}s` }}
                              >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink-gradient text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {d.v}.8 万
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-jade-500">{d.d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-24">
          <div className="mb-12 text-center">
            <Tag variant="gold" className="mb-4 px-4 py-1.5">
              <Key className="w-3.5 h-3.5" />
              灵活定价 · 按需选择
            </Tag>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-jade-700 mb-3">API 定价套餐</h2>
            <p className="text-jade-500 max-w-2xl mx-auto">从免费体验到企业级定制，满足不同规模的业务需求</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, idx) => {
              const animations = [
                { opacity: 0, x: -30 },
                { opacity: 0, y: 30 },
                { opacity: 0, x: 30 },
              ];
              return (
                <motion.div
                  key={plan.level}
                  initial={animations[idx]}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card
                    className={cn(
                      'h-full relative overflow-hidden',
                      plan.featured && 'md:-mt-4 md:mb-4 border-2 border-gold-400 shadow-gold-glow',
                    )}
                  >
                    {plan.featured && (
                      <div className="absolute top-0 left-0 right-0 bg-gold-gradient py-2 text-center">
                        <span className="text-white text-sm font-medium flex items-center justify-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          最受欢迎
                        </span>
                      </div>
                    )}
                    <Card.Content className={cn('p-6 text-center', plan.featured && 'pt-14')}>
                      <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">{plan.level}</h3>
                      <div className="mb-4">
                        <span className="font-serif text-4xl md:text-5xl font-bold text-gold-600">{plan.price}</span>
                        <span className="text-jade-500 ml-1">{plan.period}</span>
                      </div>
                      <p className="text-sm text-jade-500 mb-6 pb-6 border-b border-gold-200">
                        <span className="font-medium">{plan.calls}</span> API 调用
                      </p>
                      <ul className="space-y-3 mb-8 text-left">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-jade-600">
                            <CheckCircle2 className="w-4 h-4 text-jade-500 mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        fullWidth
                        size="lg"
                        variant={plan.featured ? 'primary' : 'secondary'}
                        rightIcon={plan.level === '定制版' ? <Phone className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      >
                        {plan.button}
                      </Button>
                    </Card.Content>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-jade-50 via-gold-50/30 to-jade-50 border border-gold-300">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-xl bg-ink-gradient flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-gold-300" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-jade-700 mb-1">需要更多定制？</h4>
                  <p className="text-jade-500">私有化部署、行业专项方案、专属架构师 1 对 1 服务</p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button variant="secondary" leftIcon={<Calendar className="w-4 h-4" />}>预约技术交流</Button>
                <Button size="lg" leftIcon={<Phone className="w-4 h-4" />}>400-888-8928</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
