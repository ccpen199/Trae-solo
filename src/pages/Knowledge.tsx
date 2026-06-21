import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  User,
  RefreshCw,
  TrendingUp,
  Award,
  Flame,
  Star,
  Heart,
  Bookmark,
  ThumbsUp,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Microscope,
  BookOpen,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { mockKnowledgeArticles, mockExperts } from '@/lib/mockData';
import { Category } from '../../shared/types';
import { cn } from '@/lib/utils';

type AuthenticityFilterType = 'all' | 'genuine' | 'fake' | 'compare' | 'micro';
type SortType = 'latest' | 'hottest' | 'recommended';
type TabType = 'articles' | 'compare' | 'faq';

interface ExtendedArticle {
  id: string;
  title: string;
  category: Category;
  era: string;
  cover: string;
  author: string;
  expertId?: string;
  views: number;
  date: string;
  tags: string[];
  summary: string;
  authenticityType: AuthenticityFilterType;
  craftTags: string[];
  eraCategory: string;
}

interface CompareCase {
  id: string;
  title: string;
  category: string;
  genuineImage: string;
  fakeImage: string;
  genuineFeatures: string[];
  fakeFeatures: string[];
  conclusion: string[];
  expert: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string[];
  source: string;
  usefulCount: number;
}

interface FaqCategory {
  category: string;
  icon: string;
  items: FaqItem[];
}

const ERA_OPTIONS = [
  { label: '先秦', key: 'pre-qin' },
  { label: '秦汉', key: 'qin-han' },
  { label: '魏晋南北朝', key: 'wei-jin' },
  { label: '隋唐', key: 'sui-tang' },
  { label: '宋辽金', key: 'song' },
  { label: '元', key: 'yuan' },
  { label: '明', key: 'ming' },
  { label: '清', key: 'qing' },
  { label: '近现代', key: 'modern' },
  { label: '当代', key: 'contemporary' },
];

const CRAFT_CATEGORIES = {
  陶瓷类: ['青花', '釉里红', '粉彩', '珐琅彩', '单色釉', '开片'],
  玉器类: ['籽料', '山料', '沁色', '巧雕', '薄胎'],
  书画类: ['水墨', '设色', '工笔', '写意', '楷书', '行书'],
};

const AUTHENTICITY_TABS: { key: AuthenticityFilterType; label: string; icon: typeof BookOpen }[] = [
  { key: 'all', label: '全部文章', icon: BookOpen },
  { key: 'genuine', label: '真品鉴定要点', icon: CheckCircle2 },
  { key: 'fake', label: '常见仿品特征', icon: AlertTriangle },
  { key: 'compare', label: '真伪对比图鉴', icon: XCircle },
  { key: 'micro', label: '微观痕迹分析', icon: Microscope },
];

const EXTENDED_ARTICLES: ExtendedArticle[] = [
  {
    id: '1',
    title: '清乾隆青花瓷的官窑特征与鉴别',
    category: Category.CERAMIC,
    era: '清代乾隆',
    eraCategory: 'qing',
    cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop',
    author: '张明德',
    expertId: 'expert_001',
    views: 15680,
    date: '2024-03-15',
    tags: ['乾隆青花', '官窑', '青花瓷'],
    summary:
      '乾隆青花是清代青花瓷的巅峰之作，其发色沉稳典雅，纹饰繁缛精细。本文从青料、胎釉、纹饰、款识四个方面详细解读乾隆官窑青花的鉴定要点，帮助藏家区分真品与仿品。',
    authenticityType: 'genuine',
    craftTags: ['青花', '珐琅彩'],
  },
  {
    id: '2',
    title: '宋代官窑开片的金丝铁线特征解析',
    category: Category.CERAMIC,
    era: '宋代',
    eraCategory: 'song',
    cover: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=500&h=400&fit=crop',
    author: '张明德',
    expertId: 'expert_001',
    views: 12450,
    date: '2024-03-10',
    tags: ['官窑', '开片', '宋代五大名窑'],
    summary:
      '宋代官窑的开片被誉为"金丝铁线"，是鉴别真伪的关键。本文通过微观痕迹分析，揭示真仿开片的形成机理差异，从纹片形态、着色渗透、釉面老化等维度建立鉴定体系。',
    authenticityType: 'micro',
    craftTags: ['开片', '单色釉'],
  },
  {
    id: '3',
    title: '民国仿清三代青花的常见破绽',
    category: Category.CERAMIC,
    era: '民国',
    eraCategory: 'modern',
    cover: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&h=400&fit=crop',
    author: '张明德',
    expertId: 'expert_001',
    views: 18920,
    date: '2024-03-08',
    tags: ['民国仿品', '青花', '辨伪'],
    summary:
      '民国时期仿古之风盛行，大量仿清三代青花瓷器流入市场。本文总结民国仿品的十大典型破绽：青料发色漂浮、胎质过于细腻、纹饰线条生硬、款识书写失规等，附真伪对比图鉴。',
    authenticityType: 'fake',
    craftTags: ['青花'],
  },
  {
    id: '4',
    title: '和田玉籽料的皮色鉴别与仿籽识别',
    category: Category.JADE,
    era: '历代',
    eraCategory: 'qing',
    cover: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=400&fit=crop',
    author: '李玉山',
    views: 22340,
    date: '2024-03-05',
    tags: ['和田玉', '籽料', '皮色'],
    summary:
      '和田玉籽料以其温润的质地和自然的皮色深受藏家喜爱，但市场上俄料、韩料仿籽层出不穷。本文从皮色成因、毛孔特征、玉质结构三个层面，配合显微照片详解真仿籽料的本质区别。',
    authenticityType: 'compare',
    craftTags: ['籽料', '沁色'],
  },
  {
    id: '5',
    title: '沁色玉器的真仿鉴别：从入土到作假',
    category: Category.JADE,
    era: '秦汉',
    eraCategory: 'qin-han',
    cover: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=400&fit=crop',
    author: '李玉山',
    views: 9870,
    date: '2024-03-01',
    tags: ['古玉', '沁色', '辨伪'],
    summary:
      '古玉沁色千变万化，有土沁、水沁、血沁、铜沁等多种。然而现代作假手段层出不穷，火烧、酸蚀、染色、油炸无所不用其极。本文系统梳理真沁与假沁的表层与深层差异。',
    authenticityType: 'genuine',
    craftTags: ['沁色', '巧雕'],
  },
  {
    id: '6',
    title: '齐白石书画真迹的笔墨特征鉴定',
    category: Category.CALLIGRAPHY_PAINTING,
    era: '近现代',
    eraCategory: 'modern',
    cover: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500&h=400&fit=crop',
    author: '李雅琴',
    expertId: 'expert_002',
    views: 28560,
    date: '2024-02-28',
    tags: ['齐白石', '书画鉴定', '虾蟹图'],
    summary:
      '齐白石作品存世量大、市场价值高，仿品亦是重灾区。本文从齐白石衰年变法后的笔墨语言入手，分析其书法、篆刻、绘画三者的内在统一性，建立真迹鉴定的"三位一体"方法论。',
    authenticityType: 'genuine',
    craftTags: ['水墨', '写意', '行书'],
  },
  {
    id: '7',
    title: '海派仿齐白石的典型特征分析',
    category: Category.CALLIGRAPHY_PAINTING,
    era: '近现代',
    eraCategory: 'modern',
    cover: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=400&fit=crop',
    author: '李雅琴',
    expertId: 'expert_002',
    views: 16780,
    date: '2024-02-20',
    tags: ['仿品', '海派', '书画辨伪'],
    summary:
      '上世纪八九十年代，上海地区出现一批高水平仿齐白石作品，部分流入拍卖市场。本文通过对这批仿品的系统研究，归纳其在用笔习惯、设色习惯、印章风格上的共性破绽。',
    authenticityType: 'fake',
    craftTags: ['水墨', '设色', '写意'],
  },
  {
    id: '8',
    title: '康熙粉彩与雍正粉彩的工艺演变',
    category: Category.CERAMIC,
    era: '清代',
    eraCategory: 'qing',
    cover: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=500&h=400&fit=crop',
    author: '张明德',
    expertId: 'expert_001',
    views: 11230,
    date: '2024-02-15',
    tags: ['粉彩', '康雍瓷器', '工艺'],
    summary:
      '粉彩创烧于康熙晚期，成熟于雍正朝。本文从彩料配方、施彩工艺、纹饰风格、胎釉特征四个维度，对比康雍两朝粉彩的发展演变，为断代与辨伪提供科学依据。',
    authenticityType: 'all',
    craftTags: ['粉彩', '珐琅彩'],
  },
];

const COMPARE_CASES: CompareCase[] = [
  {
    id: 'case-1',
    title: '清乾隆青花缠枝莲纹梅瓶 · 真伪对比',
    category: '陶瓷',
    genuineImage:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=700&fit=crop',
    fakeImage:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=700&fit=crop',
    genuineFeatures: [
      '青花发色沉稳，层次分明，有铁锈斑深入胎骨',
      '胎质洁白细腻，底足泥鳅背修足规整',
      '缠枝莲纹线条流畅，花瓣层次丰富多达七层',
      '釉面莹润肥厚，呈橘皮纹特征，光泽柔和内敛',
      '款识"大清乾隆年制"六字篆书，字体方正有力',
      '圈足露胎处有自然火石红，分布深浅不一',
    ],
    fakeFeatures: [
      '青花发色过于鲜艳漂浮，无层次感，为化学料特征',
      '胎质过白过细，重量偏轻，现代球磨胎特征明显',
      '纹饰线条刻板生硬，莲瓣层数不足，缺乏韵味',
      '釉面火气重，光泽刺眼，无橘皮纹，为快速烧成',
      '款识书写无力，字体变形，篆法不规范',
      '圈足火石红人为涂抹，分布均匀，边缘整齐',
    ],
    conclusion: [
      '青料对比：乾隆青花使用国产浙料，呈色稳定，仿品多使用现代化学钴料，发色艳丽轻浮。',
      '胎质鉴别：真品胎土经过长时间陈腐淘洗，密度高、手感沉甸；仿品胎质疏松或过密，重量失衡。',
      '纹饰断代：乾隆官窑纹饰讲究"规矩方圆"，缠枝莲纹有固定程式；仿品常忽略细节，线条失准。',
      '款识辨伪：乾隆篆款每个字都有特定写法，"乾"字左下部、"制"字衣部是重点观察区域。',
    ],
    expert: '张明德',
  },
  {
    id: 'case-2',
    title: '和田玉籽料观音牌 · 俄料仿籽对比',
    category: '玉器',
    genuineImage:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop',
    fakeImage:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop',
    genuineFeatures: [
      '天然秋梨皮，皮色由深至浅自然过渡，深入玉理',
      '毛孔分布疏密不均，大小不一，形态自然不规则',
      '玉质温润细腻，打灯见内部絮状结构呈云絮状分布',
      '手触有明显油脂感，盘玩十分钟后油性显著增强',
      '整体密度2.95以上，手感沉甸，压手感明显',
      '皮色与玉肉交界处有过渡层，非截然分开',
    ],
    fakeFeatures: [
      '皮色为染色而成，颜色过于浓艳，浮于表面，深浅一致',
      '毛孔为人为喷砂制作，分布均匀规则，大小形态雷同',
      '玉质结构粗松，打灯见粥状结构，为俄料典型特征',
      '表面光泽为抛亮光产生，干涩无油润感，盘玩无变化',
      '密度约2.88，手感偏轻，压手感不足',
      '皮色与玉肉界限分明，无过渡层，边缘人工痕迹明显',
    ],
    conclusion: [
      '皮色鉴定：真籽皮色千年形成，沿裂隙渗透，有浓淡过渡；仿籽皮色化学染成，浮于表面，分布均匀。',
      '毛孔辨别：天然毛孔经亿万年水流冲刷，形态各异、疏密不均；喷砂毛孔刻意制造，整齐划一。',
      '玉质结构：和田籽料云絮状结构细密柔和；俄料结构粗大呈粥状，俗称"俄粥"。',
      '上手感受：籽料盘玩即油，越盘越润；俄料干涩，盘玩无明显变化，甚至越盘越干。',
    ],
    expert: '李玉山',
  },
  {
    id: 'case-3',
    title: '齐白石墨虾图 · 高仿真迹对比',
    category: '书画',
    genuineImage:
      'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600&h=700&fit=crop',
    fakeImage:
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=700&fit=crop',
    genuineFeatures: [
      '虾身以淡墨渲染，墨色通透有层次，虾壳透明感十足',
      '虾钳以浓墨写出，笔力雄健，有弹性和张力',
      '虾眼浓墨竖点，位置精准，呈"闭目"之态',
      '虾须以极细线条一气呵成，流畅自然有旋转之势',
      '笔墨间有"齐式"独特的水痕，墨色边缘自然晕散',
      '整幅画气韵贯通，虾群有游动之势，活灵活现',
    ],
    fakeFeatures: [
      '虾身墨色浑浊，层次不清，缺乏透明质感',
      '虾钳笔力软弱，无弹性，关节处描摹痕迹明显',
      '虾眼点法错误，多为横点或圆形，无竖笔力度',
      '虾须线条断续，有明显接笔、描摹痕迹',
      '墨色边缘过于整齐或过于模糊，无自然水痕',
      '整体画面呆板，虾群姿态僵硬，毫无生气',
    ],
    conclusion: [
      '笔墨功力：齐白石作画60余年，笔力入木三分，每一笔都是"写"出来的；仿品多为"描""摹"，笔力软弱。',
      '墨法玄妙：齐白石善用水，墨色干湿浓淡变化万千；仿品用水不当，要么过干要么过湿，缺乏层次。',
      '气韵生动：真迹虾图有"游动"之感，这是整体构图的节奏韵律；仿品只见单体不见整体，气韵全无。',
      '印鉴佐证：齐白石自用印有数十方，每方印的使用时期、钤盖位置都有规律，需结合印谱比对。',
    ],
    expert: '李雅琴',
  },
];

const FAQ_DATA: FaqCategory[] = [
  {
    category: '陶瓷 FAQ',
    icon: '🏺',
    items: [
      {
        id: 'faq-c-1',
        question: '元青花和明青花的核心区别是什么？',
        answer: [
          '元青花与明青花的区别可从以下四方面判断：首先是青料，元青花多使用进口苏麻离青，呈色浓艳带铁锈斑，锡光明显；明洪武、永乐早期仍有进口料，但宣德后逐渐掺用国产料，铁锈斑减少。',
          '其次是胎釉，元青花胎质较粗松，底足多有粘砂，釉面偏青白；明永乐、宣德胎质细腻洁白，釉面肥润呈亮青色。第三是纹饰，元青花纹饰繁密层次多，常见缠枝莲、牡丹、云龙纹；明青花纹饰渐趋疏朗，更注重画意。',
          '最后是器型和工艺，元青花大件较多，接胎痕明显；明青花器型更加规整，接胎处理更精细。最重要的是，鉴别时需多因素综合判断，不可仅凭单一特征下结论。',
        ],
        source: '来自社区 #128',
        usefulCount: 356,
      },
      {
        id: 'faq-c-2',
        question: '如何通过底足判断瓷器的新老？',
        answer: [
          '底足是瓷器鉴定的"生命线"，真仿差异在此最为明显。首先看修足工艺，古瓷修足手工操作，刀痕自然有力，有跳刀痕、竹丝刷痕等；现代仿品修足过于规整，有机器加工痕迹。',
          '其次看胎质老化，老瓷底足露胎处有自然的包浆、火石红、土沁等老化痕迹，这些痕迹深浅不一、分布自然；仿品的火石红多为人工涂抹，分布均匀刻板。',
          '第三看粘砂和磨损，古瓷尤其是民窑器底足常有自然粘砂，使用磨损痕迹也是长期形成的，有轻重过渡；仿品粘砂人为撒上，磨损统一做作。最后可闻气味，老瓷底足无异味，新瓷常有酸蚀味、土腥味等作假气味。',
        ],
        source: '来自社区 #215',
        usefulCount: 289,
      },
      {
        id: 'faq-c-3',
        question: '粉彩和珐琅彩怎么区分？',
        answer: [
          '粉彩和珐琅彩同属釉上彩，但有本质区别。首先看彩料质感，珐琅彩使用进口珐琅料，色彩浓艳透亮，有玻璃质感，手摸有凸起感；粉彩使用国产彩料，色彩柔和淡雅，呈乳浊状，凸起感较弱。',
          '其次看施彩工艺，珐琅彩用油调色，施彩薄而匀，色彩过渡自然；粉彩用水或胶调色，有洗染效果，能表现浓淡层次。第三看产地和用途，珐琅彩是康熙、雍正、乾隆三朝御用瓷，在京烧造，产量极少；粉彩雍正后景德镇大量生产，民窑亦有精品。',
          '简单的检测方法：用放大镜观察，珐琅彩表面有细小的开片纹和气泡，粉彩则不明显；用手轻弹，珐琅彩声音清脆，粉彩略显沉闷。',
        ],
        source: '来自社区 #097',
        usefulCount: 218,
      },
      {
        id: 'faq-c-4',
        question: '什么是"土吃釉"？是出土证据吗？',
        answer: [
          '"土吃釉"是指瓷器长期埋藏地下，土壤中的酸碱物质和微生物对釉面产生的侵蚀现象，表现为釉面失光、出现土锈斑点、釉层局部剥落等。这确实是出土古瓷的重要特征之一。',
          '但需注意，现代作伪也有人工"土吃釉"的方法，如酸蚀、埋土、化学反应等。鉴别要点在于：真土吃釉深浅不一、分布不均、形态自然，常与器形磨损、底足老化相呼应；人工土吃釉分布均匀刻板，侵蚀程度一致，且无配套的老化痕迹。',
          '另一个关键点是"土沁"的层次感，真土沁有由表及里的渗透过程，表面釉下有过渡；人工沁色浮于表面，无深度。建议结合其他特征综合判断，不要单一依据。',
        ],
        source: '来自社区 #342',
        usefulCount: 167,
      },
      {
        id: 'faq-c-5',
        question: '宋代五大名窑的典型特征各是什么？',
        answer: [
          '宋代五大名窑各具特色：汝窑以天青色釉著称，釉面有细密开片，胎呈香灰色，"雨过天青云破处"是其最高追求，传世仅约70件；官窑分北宋官窑和南宋修内司、郊坛下官窑，釉色粉青为主，开片有金丝铁线，紫口铁足是典型特征。',
          '哥窑最显著的特征是"金丝铁线"开片，黑黄两色纹片交织，釉色有粉青、月白、米黄等；定窑以白瓷闻名，胎质洁白，釉色白中闪黄，有"泪痕"和"竹丝刷痕"，芒口覆烧是其工艺特色；钧窑以窑变釉著称，"入窑一色，出窑万彩"，玫瑰紫、海棠红、天蓝月白交相辉映，蚯蚓走泥纹是鉴定要点。',
          '五大名窑鉴别难度极大，市场仿品极多，建议新手从标本入手，多观察真品实物，建立标准器印象后再涉足收藏。',
        ],
        source: '来自社区 #056',
        usefulCount: 423,
      },
    ],
  },
  {
    category: '玉器 FAQ',
    icon: '💎',
    items: [
      {
        id: 'faq-j-1',
        question: '和田玉、俄料、青海料、韩料怎么区分？',
        answer: [
          '这四种玉同属透闪石玉，但产地不同品质差异大。和田玉：产自新疆和田地区，玉质温润细腻，油脂感强，结构呈细密云絮状，盘玩后油性显著增加，是玉中上品。俄料：产自俄罗斯贝加尔湖地区，玉质白度高但偏"死白""僵白"，结构粗松呈粥状，油润度差，盘玩无明显变化。',
          '青海料：产自青海格尔木，玉质偏透，水性重，常有水线、石花，白中透灰或透黄，油润度一般，佩戴久了容易发灰变暗。韩料：产自韩国春川，品质最差，结构粗大，蜡质感强，颜色偏黄绿，硬度偏低，市场价值最低。',
          '最实用的方法：上手盘玩对比，和田玉越盘越油；俄料、青海料盘玩变化不大；韩料甚至越盘越干。打灯看结构也是可靠方法，和田玉结构最细最均匀。',
        ],
        source: '来自社区 #189',
        usefulCount: 512,
      },
      {
        id: 'faq-j-2',
        question: '古玉的沁色有哪些种类？如何辨伪？',
        answer: [
          '古玉沁色种类繁多，常见的有：土沁——黄褐色，受土壤中铁锰矿物沁染，最常见；水沁——白色雾状，受地下水中矿物质沁蚀；血沁——暗红色，学界多认为并非真由血沁而成，实为有机质分解沁染；铜沁——绿色，受邻近铜器锈蚀沁染；水银沁——黑色，古称"黑漆古"，成因有争议。',
          '辨伪关键在于"层次感"和"过渡性"。真沁色千百年形成，由表及里有自然过渡，深浅不一，沁入玉质肌理；假沁色多为染色、火烧、酸蚀而成，浮于表面，颜色过于均匀，边界生硬。',
          '另一方法是观察沁色与玉质裂纹的关系，真沁沿裂纹渗透有"根"；假沁裂纹中的颜色死板，无渗透痕迹。建议结合工痕、包浆、玉质老化等多维度判断。',
        ],
        source: '来自社区 #276',
        usefulCount: 345,
      },
      {
        id: 'faq-j-3',
        question: '什么是"乾隆工"？有什么特征？',
        answer: [
          '"乾隆工"是指清代乾隆时期宫廷玉器的工艺水平，代表了中国古代玉器制作的巅峰。乾隆帝酷爱玉器，亲自参与设计，召集天下能工巧匠，不惜成本制作，因此"乾隆工"成为精细、极致、典雅的代名词。',
          '乾隆工的主要特征：一是选料极精，以和田白玉、青玉为主，玉质纯净无瑕，如有瑕疵必以纹饰遮掩；二是工艺极细，无论是浮雕、透雕、阴线刻，均一丝不苟，线条流畅有力，打磨极其光滑，"入手温润"；三是设计典雅，纹饰繁缛而不乱，仿古青铜器、古玉器造型是其特色，常有御题诗文。',
          '鉴别乾隆工，要把握"精而不弱、繁而不乱"的度，后世仿品要么工艺不够精细，要么过于刻意媚俗，缺乏宫廷气韵。同时需注意，现代"乾隆工"仿品工艺也很高超，需结合包浆、工痕、玉质综合判断。',
        ],
        source: '来自社区 #421',
        usefulCount: 278,
      },
      {
        id: 'faq-j-4',
        question: '新玉需要盘玩吗？正确的盘玉方法是什么？',
        answer: [
          '新玉确实需要盘玩，和田玉的"温润"很大程度上是盘出来的。正确的盘玉方法有三：一是文盘，最推荐的方法，将玉件贴身佩戴，以人体的温度和油脂慢慢滋养，历时数月甚至数年，玉质会逐渐变得温润透亮，这是最安全的方法。',
          '二是武盘，即将玉件用干净白布反复摩擦，以产生热量加速玉质变化，此法见效快但需注意力度，避免损伤玉件，不适合新手。三是意盘，是文盘的更高境界，盘玩时静心凝神，把玩欣赏，达到人玉合一的精神境界。',
          '盘玉注意事项：保持清洁，定期用温水软刷清洗；避免接触化学品、香水、化妆品；避免碰撞摔落；避免忽冷忽热；玉怕油污，盘玩前洗净双手。坚持正确盘玩，新玉半年到一年即可显现明显变化。',
        ],
        source: '来自社区 #512',
        usefulCount: 234,
      },
      {
        id: 'faq-j-5',
        question: '玉雕的"南工"和"北工"各有什么特点？',
        answer: [
          '南工主要指以上海、苏州、扬州为代表的南方玉雕风格，北工以北京为代表。南工特点：精巧细腻，注重细节，线条流畅柔和，题材多为江南水乡、花鸟鱼虫，讲究"雅"和"精"，苏州工的"空、飘、细"三字诀是其精髓，海派玉雕则融合中西，造型新颖。',
          '北工特点：大气厚重，古朴典雅，线条粗犷有力，题材多为宫廷礼仪、瑞兽人物，追求雄浑之气，京派玉雕保留了大量宫廷技艺，器皿件、人物件是其强项。两大流派各有所长，并无高下之分。',
          '近年来，南北风格融合趋势明显，许多大师不拘一格，博采众长。鉴别流派需把握整体气韵，南工看细节处理，北工看整体气势。无论是南工北工，工料俱佳的都是好作品。',
        ],
        source: '来自社区 #387',
        usefulCount: 189,
      },
    ],
  },
  {
    category: '书画 FAQ',
    icon: '🖌️',
    items: [
      {
        id: 'faq-s-1',
        question: '书画鉴定的"目鉴"主要看什么？',
        answer: [
          '目鉴是书画鉴定的核心方法，主要看五个方面：一是"笔墨"，这是最根本的，每位书画家都有独特的笔墨语言，线条的力度、墨色的层次、用水的习惯，这些最能反映作者真实水平，仿品最难模仿的就是笔墨功力。',
          '二是"构图"，名家构图讲究章法，虚实、疏密、留白都有规律，仿品常常构图失衡、气韵不畅。三是"题跋与落款"，书法是书画家另一张名片，落款的位置、内容、书法风格都需仔细比对，注意避讳字、干支纪年等时代特征。',
          '四是"印章"，包括作者印、鉴藏印，印章的篆法、刀法、印泥颜色都有时代特征，可与已知印谱比对。五是"纸绢与装裱"，不同时代的纸绢有不同特征，装裱工艺也有时代性，这是辅助断代的重要依据。五者综合判断，才能得出可靠结论。',
        ],
        source: '来自社区 #078',
        usefulCount: 456,
      },
      {
        id: 'faq-s-2',
        question: '什么是"扬州八怪"？他们的艺术特色？',
        answer: [
          '"扬州八怪"是清康熙中期至乾隆末年活跃于扬州地区的一批书画家总称，人数不止八位，公认的有金农、郑燮（郑板桥）、黄慎、李鱓、李方膺、汪士慎、罗聘、高翔八人，故称"八怪"。他们艺术上主张创新，不拘泥于传统，画风独特，被正统派视为"怪"。',
          '艺术特色：一是师法自然，注重写生，取材广泛，除传统山水花鸟外，日常所见皆可入画；二是强调个性，"扬州八怪"每个人风格迥异，金农拙朴、板桥清劲、黄慎狂放、李鱓奔放；三是诗书画印四位一体，他们大多诗文造诣深厚，书法也自成一家，常以题诗抒发情感、针砭时弊。',
          '"扬州八怪"作品市场认知度高，但仿品也极多。鉴别要点：郑板桥的"六分半书"有独特章法；金农的"漆书"横粗竖细，极难模仿；黄慎的人物画线条飞动，草书入画。这些个性化特征是辨伪的突破口。',
        ],
        source: '来自社区 #156',
        usefulCount: 287,
      },
      {
        id: 'faq-s-3',
        question: '如何判断宣纸的年代？有什么实用方法？',
        answer: [
          '宣纸断代是书画鉴定的重要辅助手段。一看颜色，老纸自然老化呈米黄或暗黄色，色泽均匀柔和，有"包浆感"；新做旧纸颜色死板、发灰发暗，常有烟熏、茶水染色痕迹，颜色不均。',
          '二看帘纹，不同时代造纸工艺不同，帘纹（纸浆在竹帘上形成的纹路）有时代特征，宋代帘纹细密、元代偏粗、明代中期出现"罗纹纸"、清代康熙乾隆朝有特定的"粉白笺""蜡笺"等。三看纤维，老纸纤维经过自然老化，长短不一、色泽有差；新纸纤维整齐划一。',
          '四看损伤与痕迹，老纸经过几百年流传，自然折痕、磨损、虫蛀、霉斑等分布自然，有历史痕迹的"层叠感"；人为做旧的损伤痕迹刻意做作，分布不合理。实用方法：用放大镜观察纤维结构，老纸纤维杂乱有老化痕迹；闻气味，老纸有自然纸香，做旧纸有化学试剂味或烟熏味。',
        ],
        source: '来自社区 #234',
        usefulCount: 201,
      },
      {
        id: 'faq-s-4',
        question: '书画收藏如何防止做假的"套款"？',
        answer: [
          '"套款"是书画作伪的常见手段，即把无名家的画作添上名家款识印章，或将小名家款改大名家款，以牟取暴利。防范方法：首先看"款画是否一致"，即题款的书法风格、笔墨水平是否与画作匹配。如果画得很好但款识书法差，或款识与画气质不搭，就需警惕。',
          '其次看"款印位置与比例"，名家题款有固定习惯，位置、大小、间距都很讲究，套款的款识常因原画作位置限制而局促、比例失调。第三用放大镜看"款字的底层颜色"，如果款字下的墨色或设色被覆盖不匀，有"后加款"的叠层痕迹，就要小心。',
          '第四查"著录与来源"，名家作品多有著录、收藏印章、拍卖行记录等传承有序的证据，突然冒出来的"大名头"作品要高度警惕。最重要的是，不要贪便宜，大名头真迹价格极高，远低于市场价的"捡漏"几乎都是陷阱。',
        ],
        source: '来自社区 #312',
        usefulCount: 198,
      },
      {
        id: 'faq-s-5',
        question: '海派画家的代表人物和风格特点？',
        answer: [
          '海派是鸦片战争后在上海形成的画家群体，是中国近现代绘画史上影响最大的流派之一。代表人物："海上三任"——任熊、任薰、任颐（任伯年），其中任伯年成就最高；虚谷、蒲华、吴昌硕并称为"海派四杰"（一说包括赵之谦）；还有王一亭、程璋、冯超然等。',
          '风格特点：一是雅俗共赏，海派画家面向市民阶层，题材多为吉祥喜庆的花鸟人物，设色艳丽，符合上海商埠的审美；二是融合传统与创新，海派继承了陈淳、徐渭、八大山人的写意传统，又吸收西洋画的明暗色彩，画风清新活泼。',
          '三是金石入画，海派后劲吴昌硕以篆隶笔法入画，笔力雄健，气势磅礴，开创了大写意花鸟画的新境界；四是书画印结合，海派画家大多兼善书画篆刻，三者融为一体。海派作品流通量大，仿品也多，鉴别需注意海派画家的"市民气"和"金石气"两个核心特质。',
        ],
        source: '来自社区 #445',
        usefulCount: 245,
      },
    ],
  },
  {
    category: '钱币 FAQ',
    icon: '🪙',
    items: [
      {
        id: 'faq-m-1',
        question: '古钱币的"包浆"和"锈色"怎么辨别真伪？',
        answer: [
          '包浆和锈色是古钱币断代辨伪的重要依据。真品包浆：经过成百上千年的流通、埋藏形成，深沉稳定、温润内敛，不同坑口包浆不同，水坑钱呈黑漆古、生坑钱呈红斑绿锈、老生坑钱红绿锈兼有，这些包浆颜色分布自然、层次丰富。',
          '真品锈色：有层次感，表层浮锈疏松、中层硬锈坚硬、底层入骨锈深入钱体，用指甲不易抠掉。不同地区出土的锈色不同，西北干坑锈薄、南方水坑锈厚、中原生坑红绿相间，锈层晶体结构自然，放大镜下可见矿物质结晶。',
          '伪品包浆：制作方法有化学腐蚀、火烧、烟熏、埋土、胶粘等，特征是颜色单一均匀、浮于表面、没有层次感，指甲一抠就掉，有刺鼻的化学气味或胶粘味。伪锈多为颜料或化学合成，放大镜下无天然矿物质结晶，用针一挑即成粉末。实用方法：用开水煮10分钟，真锈不掉，伪锈脱落变色。',
        ],
        source: '来自社区 #067',
        usefulCount: 389,
      },
      {
        id: 'faq-m-2',
        question: '五帝钱有什么讲究？如何挑选真品？',
        answer: [
          '五帝钱指清代顺治、康熙、雍正、乾隆、嘉庆五个皇帝的铜钱，因这五代处于清朝国力最强盛的"康乾盛世"，民间认为有辟邪旺财的风水作用。挑选真品五帝钱要注意：一是五个都必须是真品，不能有一枚假钱，否则无效；二是年代坑口尽量接近，品相统一，视觉效果好。',
          '选择要点：品相方面，字口清晰、无裂无补无翘为佳；尺寸方面，五帝中雍正钱最稀少价最高，尺寸厚度要匹配，不必刻意追求大样；坑口方面，房梁钱、传世黄亮品最佳，品相美观，适合随身携带，生坑品也可但需清理干净。',
          '市场陷阱：雍正钱价高，仿品最多，注意"安"字写法、宝字结构、背面满文；整套五帝钱价格低于500元基本都是仿品，不要贪便宜；注意改刻，常见用康熙改顺治、乾隆改雍正。购买时最好找有信誉的商家，要求附鉴定评级盒子。',
        ],
        source: '来自社区 #223',
        usefulCount: 567,
      },
      {
        id: 'faq-m-3',
        question: '宋代钱币的版别怎么入门？从哪里开始？',
        answer: [
          '宋代钱币版别极其丰富，北宋钱币更是中国钱币版别的巅峰，仅元丰通宝就有数百种版别，新手入门建议循序渐进。第一步，建立基础框架，先按"对钱"概念入手，宋钱常以真、行、草、篆等多种书体成对铸造，先认识这些基本书体差异。',
          '第二步，学习"纲目钱"，先不要陷入细分版别，而是掌握名誉品和基础版：如宋元通宝的背星背月、太平通宝的大样铁范铜、淳化元宝的缩水淳化、元丰通宝的东坡元丰、崇宁通宝的大字版等等，这些是宋钱的骨架。',
          '第三步，掌握观察方法，版别差异主要在：文字大小（大字/小字）、位置（寄郭/离郭/接郭）、笔画粗细（粗字/细字）、局部变形（如元丰的"俯元""仰元"）、背面特征（星、月、甲痕、决文）。推荐工具书：《北宋铜钱》《南宋铜钱》，多对照图谱实物比对，半年即可入门。',
        ],
        source: '来自社区 #301',
        usefulCount: 178,
      },
      {
        id: 'faq-m-4',
        question: '什么是"雕母"、"母钱"、"样钱"？',
        answer: [
          '这是古钱币铸造流程中的三个等级，价值从高到低。雕母，又称"祖钱"，是雕制的钱币模型，多以优质铜、锡、牙、木等手工雕刻而成，文字深峻挺拔、地章光洁、极精美，是铸钱的源头，存世极罕，价值极高，是钱币收藏的顶级藏品。',
          '母钱，由雕母翻铸而成，再经精修后作为翻铸行用钱的模具，特征是文字清晰深峻、比同版行用钱稍大稍厚、铜质精良、有翻铸和修模痕迹，母钱存世稀少，价值是行用钱的数十至上百倍。',
          '样钱，由母钱初铸的第一批精品，用于进呈审核或选样，分"进呈样钱"和"部颁样钱"，特征是工艺精、品相好、文字规矩，比母钱多但比行用钱少。三者鉴别要点：雕母看刀痕、母钱看修痕、样钱看精整度。价值对比：雕母几十万至数百万、母钱数万至数十万、样钱数千至数万元。',
        ],
        source: '来自社区 #112',
        usefulCount: 312,
      },
      {
        id: 'faq-m-5',
        question: '王莽钱币的"六泉十布"收藏价值如何？',
        answer: [
          '王莽是中国历史上的"铸钱第一高手"，其在位期间进行四次币制改革，铸造的钱币品种繁多、工艺精湛、书法绝美，"六泉十布"是其币制改革的产物，历来为钱币收藏的热门。六泉：小泉直一、幺泉一十、幼泉二十、中泉三十、壮泉四十、大泉五十，面额递增。',
          '十布：小布一百、幺布二百、幼布三百、序布四百、差布五百、中布六百、壮布七百、第布八百、次布九百、大布黄千，每种面额递增一百。收藏价值：六泉中"壮泉四十""中泉三十"最少最珍贵，小泉直一、大泉五十较多；十布中"大布黄千"最常见，其余九布都稀少，成套极难。',
          '价格方面，普通品小泉直一几百元，中泉三十、壮泉四十数万元，十布中的稀有品单枚数十万。但因名气大，仿品极多，鉴定要点：王莽钱文字为"悬针篆"，笔画细如针尖却挺拔有力，仿品笔画软弱；工艺上莽钱范铸极精，字口深峻，内外郭规整，仿品工艺粗糙；重量尺寸严格，可用卡尺精密测量比对。',
        ],
        source: '来自社区 #409',
        usefulCount: 234,
      },
    ],
  },
  {
    category: '杂项 FAQ',
    icon: '🎭',
    items: [
      {
        id: 'faq-o-1',
        question: '紫砂壶的"泥料"等级怎么分？原矿和化工泥如何区别？',
        answer: [
          '紫砂壶泥料主要分为紫泥、红泥（朱泥）、绿泥三大类，每类又有细分。等级区分：顶级泥料有天青泥、大红袍朱泥、本山绿泥，这些是传说级泥料，存世极少；优质泥料有底槽清、清水泥、降坡泥、朱泥、段泥等，这些是市场主流高档料；普通泥料有普通紫泥、红泥等，适合日常实用。',
          '原矿泥与化工泥的区别：一看颜色，原矿泥颜色自然，有深浅变化和杂质颗粒感，不艳丽；化工泥颜色鲜艳均一，过于完美。二看光泽，原矿泥壶经养壶后温润内敛，呈"黯然之光"；化工泥壶表面光亮如镜，是玻璃相，养壶无变化。',
          '三看颗粒，原矿泥放大观察可见云母颗粒、铁黑点等天然矿物，分布自然；化工泥质地过于细腻均匀。四看吸水性，原矿壶透气性好，开水浇壶身水分快速均匀吸收；化工壶吸水性差，水凝成珠流下。实用测试：养壶一月，原矿壶包浆明显，化工壶无变化。',
        ],
        source: '来自社区 #178',
        usefulCount: 423,
      },
      {
        id: 'faq-o-2',
        question: '老家具的"包浆"和"做旧"怎么区分？',
        answer: [
          '老家具包浆是经年累月使用、擦拭、氧化形成的自然光泽层，是岁月留下的"皮壳"。真品包浆特征：层次感强，家具不同部位因使用频率不同包浆厚度色泽不同，扶手、桌面等常接触处包浆最厚最亮，角落缝隙处包浆较薄，过渡自然。',
          '真包浆温润柔和，"光而不亮、亮而不贼"，有一种琥珀般的透明感，放大镜下可见细密的使用划痕，深浅不一，分布自然。木材纹理透过包浆清晰可见，包浆与木材融为一体。',
          '做旧包浆的方法有：鞋油擦、蜡煮、漆刷、灰土闷、烟熏等。鉴别要点：做旧包浆通体一致、厚薄均匀，没有使用痕迹的差异；表面油腻发黏，手触有粘手感，气味异常；使用划痕刻意做作，均匀分布；包浆浮于表面，木材纹理模糊不清。实用方法：用热水沾布擦角落，做旧包浆会掉色溶化，真包浆不溶。',
        ],
        source: '来自社区 #256',
        usefulCount: 298,
      },
      {
        id: 'faq-o-3',
        question: '沉香、檀香的等级划分和鉴别入门？',
        answer: [
          '沉香是瑞香科植物结香而成，等级按产地和含油量划分。产地等级：海南沉香（奇楠最顶级）> 越南芽庄 > 柬埔寨菩萨 > 马来西亚 > 印尼，价格相差悬殊。含油量：沉水级（密度大于1沉入水）> 九分沉 > 八分沉，以此类推，沉水级沉香价格是黄金的数倍。',
          '沉香鉴别：一看，真沉香颜色深浅不一，油脂线自然弯曲分布；假沉香颜色均匀油黑。二摸，真沉香不粘手，微凉温润；假沉香油腻粘手。三闻，真沉香香气清雅通透，有层次感，嗅之舒适；假沉香香气浓烈刺鼻，多为香精勾兑。四烧，真沉香燃烧时香气浓郁纯净，油脂沸腾起泡明显；假沉香烧时冒黑烟，有化学焦味。',
          '檀香以印度老山檀为最佳，香气醇厚浓郁持久；其次是澳洲檀、东加檀；斐济檀等价值较低。鉴别：檀香有独特的奶香气息，越闻越醇；假檀香多为香精浸泡，香气单调不持久。两者鉴别难度都很大，新手建议从正规渠道购买小样开始学习。',
        ],
        source: '来自社区 #334',
        usefulCount: 356,
      },
      {
        id: 'faq-o-4',
        question: '铜炉（宣德炉）的鉴定要点有哪些？',
        answer: [
          '真正的明宣德炉存世极少，大多数"宣德炉"是后世仿品，鉴定要点有五：一是看铜质，宣德炉使用暹罗进口的"风磨铜"，经多次精炼，还掺入金银等贵金属，因此铜质极佳，手感沉甸，色泽温润如婴儿肌肤，露铜处呈精金色或紫红色。',
          '二是看形制，宣德炉谱载有百余种器型，以冲耳三足炉最经典，整体造型端庄典雅，比例协调，线条流畅圆润，有"大器小做、小器大做"的气韵。三是看皮壳包浆，宣德炉皮色有藏经纸色、枣红色、蟹壳青、鳝鱼黄、栗壳色等多种，真品皮壳深沉内蕴，假皮壳浮于表面易掉色。',
          '四是看款识，"大明宣德年制"款有楷书篆书两种，字体规整有力，"德"字有"省一横"和"不省一横"两种，需注意时代特征。五看使用痕迹，真品炉内长期焚香有厚积的香灰渍、炉底有炭火烧烤的痕迹，内外包浆一致。需强调的是，清三代仿宣德炉精品价值也很高，收藏不必盲目追求"真宣"。',
        ],
        source: '来自社区 #478',
        usefulCount: 267,
      },
      {
        id: 'faq-o-5',
        question: '文房四宝的"端砚"石品怎么欣赏？',
        answer: [
          '端砚产自广东肇庆端溪，位居四大名砚之首，"石品"是端砚石天然形成的纹理和特征，是鉴别坑口和欣赏价值的关键。名贵石品：第一是"石眼"，天然形成的圆形彩核，鸲鹆眼（绿色有瞳仁）最名贵，鹦哥眼、鸡眼次之，活眼胜死眼，有眼胜无眼。',
          '第二是"青花"，砚石中微细的青黑色斑点，如尘如雾，下墨发墨最好，分微尘青花、鹅毛青花、蚁脚青花等，需浸水观察才清晰。第三是"火捺"，似被火灼过的紫红色斑纹，分胭脂火捺、金钱火捺、猪肝冻等。第四是"金银线"，天然形成的黄白色线条。第五是"冰纹"，白色如冰裂的纹理，极为稀有。',
          '坑口价值排序：老坑（水岩）> 麻子坑 > 坑仔岩 > 宋坑 > 梅花坑 > 绿端 > 白端，老坑因已封坑禁采，价值最高，一方老坑上品动辄数十万。欣赏端砚要"以石为本、以艺为辅"，石质石品是第一位的，雕工次之。实用方法：砚石以"体重而轻、质刚而柔"为佳，叩之声木者上、声金者次。',
        ],
        source: '来自社区 #523',
        usefulCount: 187,
      },
    ],
  },
];

const HOT_TAGS = [
  { name: '青花瓷', count: 2340 },
  { name: '乾隆官窑', count: 1890 },
  { name: '和田籽料', count: 2100 },
  { name: '齐白石', count: 1750 },
  { name: '宋代官窑', count: 1320 },
  { name: '包浆鉴定', count: 1560 },
  { name: '五帝钱', count: 1980 },
  { name: '紫砂泥料', count: 1120 },
  { name: '书画辨伪', count: 1680 },
  { name: '开片鉴别', count: 890 },
  { name: '古玉沁色', count: 1230 },
  { name: '海派画家', count: 780 },
  { name: '汝窑天青', count: 650 },
  { name: '宣德炉', count: 940 },
  { name: '端砚石品', count: 560 },
  { name: '沉香分级', count: 820 },
  { name: '雕母钱', count: 450 },
  { name: '老家具包浆', count: 670 },
  { name: '粉彩珐琅彩', count: 890 },
  { name: '俄料仿籽', count: 1050 },
  { name: '扬州八怪', count: 520 },
  { name: '战国玉器', count: 480 },
  { name: '永乐甜白', count: 390 },
  { name: '紫砂大师', count: 760 },
  { name: '铜炉鉴定', count: 610 },
  { name: '老坑端砚', count: 340 },
  { name: '建盏兔毫', count: 580 },
  { name: '缂丝工艺', count: 290 },
  { name: '犀角雕刻', count: 320 },
  { name: '藏传天珠', count: 470 },
];

const SORT_OPTIONS: { key: SortType; label: string; icon: typeof Clock }[] = [
  { key: 'latest', label: '最新', icon: Clock },
  { key: 'hottest', label: '最热', icon: Flame },
  { key: 'recommended', label: '专家推荐', icon: Award },
];

const CONTENT_TABS: { key: TabType; label: string; icon: typeof BookOpen; badge?: string }[] = [
  { key: 'articles', label: '全部文章', icon: BookOpen, badge: '8' },
  { key: 'compare', label: '真伪图鉴', icon: Eye, badge: '3' },
  { key: 'faq', label: '精选 FAQ', icon: MessageCircle, badge: '25' },
];

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEras, setSelectedEras] = useState<string[]>([]);
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([]);
  const [authenticityFilter, setAuthenticityFilter] = useState<AuthenticityFilterType>('all');
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [sortType, setSortType] = useState<SortType>('latest');
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    era: true,
    craft: true,
    authenticity: true,
  });
  const [expandedFaqCategories, setExpandedFaqCategories] = useState<Record<string, boolean>>({
    '陶瓷 FAQ': true,
  });
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});
  const [currentCompareCase, setCurrentCompareCase] = useState(0);
  const [recentViews, setRecentViews] = useState<ExtendedArticle[]>([]);
  const [collectedFaqs, setCollectedFaqs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('knowledge_recent');
    if (saved) {
      try {
        setRecentViews(JSON.parse(saved));
      } catch {
        setRecentViews(EXTENDED_ARTICLES.slice(0, 3));
      }
    } else {
      setRecentViews(EXTENDED_ARTICLES.slice(0, 3));
    }
  }, []);

  const eraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    EXTENDED_ARTICLES.forEach((a) => {
      counts[a.eraCategory] = (counts[a.eraCategory] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredArticles = useMemo(() => {
    let result = [...EXTENDED_ARTICLES];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.author.toLowerCase().includes(q),
      );
    }

    if (selectedEras.length > 0) {
      result = result.filter((a) => selectedEras.includes(a.eraCategory));
    }

    if (selectedCrafts.length > 0) {
      result = result.filter((a) => a.craftTags.some((c) => selectedCrafts.includes(c)));
    }

    if (authenticityFilter !== 'all') {
      result = result.filter((a) => a.authenticityType === authenticityFilter);
    }

    switch (sortType) {
      case 'latest':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'hottest':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'recommended':
        result.sort((a, b) => (a.expertId ? -1 : 0) - (b.expertId ? -1 : 0));
        break;
    }

    return result;
  }, [searchQuery, selectedEras, selectedCrafts, authenticityFilter, sortType]);

  const recommendedExperts = mockExperts.slice(0, 3);

  const toggleEra = (era: string) => {
    setSelectedEras((prev) =>
      prev.includes(era) ? prev.filter((e) => e !== era) : [...prev, era],
    );
  };

  const toggleCraft = (craft: string) => {
    setSelectedCrafts((prev) =>
      prev.includes(craft) ? prev.filter((c) => c !== craft) : [...prev, craft],
    );
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedEras([]);
    setSelectedCrafts([]);
    setAuthenticityFilter('all');
    setSortType('latest');
  };

  const toggleFilterAccordion = (key: string) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFaqCategory = (cat: string) => {
    setExpandedFaqCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFaqCollect = (id: string) => {
    setCollectedFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAuthenticityBadge = (type: AuthenticityFilterType) => {
    switch (type) {
      case 'genuine':
        return <Badge variant="success" dot>真品鉴定</Badge>;
      case 'fake':
        return <Badge variant="error" dot>常见仿品</Badge>;
      case 'compare':
        return <Badge variant="warning" dot>真伪对比</Badge>;
      case 'micro':
        return <Badge variant="info" dot>微观分析</Badge>;
      default:
        return <Badge variant="default">综合</Badge>;
    }
  };

  const getTagFontSize = (count: number) => {
    const max = Math.max(...HOT_TAGS.map((t) => t.count));
    const min = Math.min(...HOT_TAGS.map((t) => t.count));
    const ratio = (count - min) / (max - min);
    return 12 + ratio * 10;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="container py-8 px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Tag variant="gold" className="mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            行家知识库
          </Tag>
          <h1 className="section-title text-3xl md:text-4xl mb-2">
            博古通今 · 鉴藏有道
          </h1>
          <p className="section-subtitle text-lg max-w-2xl mx-auto">
            权威专家撰写 · 系统知识沉淀 · 真伪对比图鉴 · 二十年鉴定经验结晶
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-12 lg:col-span-3 xl:col-span-2 space-y-4"
          >
            <div className="lg:sticky lg:top-4 space-y-4">
              <Card>
                <Card.Content className="p-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jade-400" />
                    <input
                      type="text"
                      placeholder="搜索知识、标签、作者..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-10 py-2 text-sm w-full"
                    />
                  </div>
                  <button
                    onClick={resetAllFilters}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gold-600 border border-gold-200 rounded-md hover:bg-gold-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重置全部筛选
                  </button>
                </Card.Content>
              </Card>

              <Card>
                <button
                  onClick={() => toggleFilterAccordion('era')}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-gold-100 hover:bg-rice-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium text-jade-700">
                    <Clock className="w-4 h-4 text-gold-500" />
                    按年代筛选
                  </span>
                  {expandedFilters.era ? (
                    <ChevronUp className="w-4 h-4 text-jade-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-jade-500" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {expandedFilters.era && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {ERA_OPTIONS.map((era) => {
                          const count = eraCounts[era.key] || 0;
                          const isSelected = selectedEras.includes(era.key);
                          return (
                            <label
                              key={era.key}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-all',
                                isSelected
                                  ? 'bg-gold-gradient text-white shadow-gold-glow'
                                  : count > 0
                                    ? 'bg-rice-100 text-jade-600 hover:bg-gold-50'
                                    : 'bg-rice-50 text-jade-300 cursor-not-allowed',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => count > 0 && toggleEra(era.key)}
                                disabled={count === 0}
                                className="sr-only"
                              />
                              <span
                                className={cn(
                                  'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                                  isSelected
                                    ? 'bg-white/20 border-white/40'
                                    : 'border-gold-300',
                                )}
                              >
                                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              </span>
                              <span className="flex-1 truncate">{era.label}</span>
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  isSelected
                                    ? 'text-white/80'
                                    : count > 0
                                      ? 'text-jade-400'
                                      : 'text-jade-200',
                                )}
                              >
                                ({count})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => toggleFilterAccordion('craft')}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-gold-100 hover:bg-rice-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium text-jade-700">
                    <Star className="w-4 h-4 text-gold-500" />
                    按工艺特征筛选
                  </span>
                  {expandedFilters.craft ? (
                    <ChevronUp className="w-4 h-4 text-jade-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-jade-500" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {expandedFilters.craft && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {Object.entries(CRAFT_CATEGORIES).map(([catName, crafts]) => (
                          <div key={catName}>
                            <p className="text-xs font-medium text-gold-600 mb-2">{catName}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {crafts.map((craft) => {
                                const isSelected = selectedCrafts.includes(craft);
                                return (
                                  <button
                                    key={craft}
                                    onClick={() => toggleCraft(craft)}
                                    className={cn(
                                      'px-2.5 py-1 text-xs rounded-full transition-all duration-200',
                                      isSelected
                                        ? 'bg-gold-gradient text-white shadow-gold-glow scale-105'
                                        : 'bg-rice-100 text-jade-600 hover:bg-gold-50 hover:scale-105',
                                    )}
                                  >
                                    {craft}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => toggleFilterAccordion('authenticity')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-rice-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium text-jade-700">
                    <TrendingUp className="w-4 h-4 text-gold-500" />
                    按真伪要点筛选
                  </span>
                  {expandedFilters.authenticity ? (
                    <ChevronUp className="w-4 h-4 text-jade-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-jade-500" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {expandedFilters.authenticity && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 grid grid-cols-1 gap-2">
                        {AUTHENTICITY_TABS.map((tab) => {
                          const Icon = tab.icon;
                          const isSelected = authenticityFilter === tab.key;
                          return (
                            <button
                              key={tab.key}
                              onClick={() => setAuthenticityFilter(tab.key)}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
                                isSelected
                                  ? 'bg-ink-gradient text-white shadow-scroll'
                                  : 'bg-rice-50 text-jade-600 hover:bg-gold-50 border border-gold-100',
                              )}
                            >
                              <Icon className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'text-gold-300' : 'text-gold-500')} />
                              <span className="text-left">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              <div className="hidden xl:block">
                <div className="bg-gradient-to-br from-jade-600 to-jade-700 rounded-lg p-4 border border-gold-300 shadow-scroll">
                  <p className="text-gold-300 text-xs font-medium mb-1.5">💡 鉴定小贴士</p>
                  <p className="text-white/90 text-sm leading-relaxed">
                    收藏之道，首在辨伪。多看真品、建立标准器印象，是入门的不二法门。
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-12 lg:col-span-6 xl:col-span-7 space-y-5"
          >
            <Card>
              <Card.Content className="p-3 border-b border-gold-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-rice-100 rounded-lg p-1">
                    {CONTENT_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={cn(
                            'relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300',
                            isActive
                              ? 'bg-ink-gradient text-white shadow-scroll'
                              : 'text-jade-600 hover:text-gold-600 hover:bg-gold-50',
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                          {tab.badge && (
                            <span
                              className={cn(
                                'ml-0.5 flex items-center justify-center w-5 h-5 text-xs rounded-full',
                                isActive ? 'bg-gold-500/30 text-gold-200' : 'bg-jade-200/60 text-jade-700',
                              )}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === 'articles' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-jade-500">排序：</span>
                      <div className="flex gap-1">
                        {SORT_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isActive = sortType === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => setSortType(opt.key)}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                                isActive
                                  ? 'bg-gold-gradient text-white'
                                  : 'bg-rice-100 text-jade-600 hover:bg-gold-50',
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            <AnimatePresence mode="wait">
              {activeTab === 'articles' && (
                <motion.div
                  key="articles"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-sm text-jade-500">
                      共找到 <span className="font-semibold text-gold-600">{filteredArticles.length}</span> 篇专业文章
                    </p>
                    {(selectedEras.length > 0 || selectedCrafts.length > 0 || authenticityFilter !== 'all') && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedEras.map((e) => (
                          <span
                            key={e}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gold-100 text-gold-700 rounded-full"
                          >
                            {ERA_OPTIONS.find((o) => o.key === e)?.label}
                            <button onClick={() => toggleEra(e)} className="hover:text-cinnabar-500">
                              <XCircle className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {selectedCrafts.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-jade-100 text-jade-700 rounded-full"
                          >
                            {c}
                            <button onClick={() => toggleCraft(c)} className="hover:text-cinnabar-500">
                              <XCircle className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {filteredArticles.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    >
                      {filteredArticles.map((article) => (
                        <motion.div key={article.id} variants={itemVariants}>
                          <Card hoverable className="h-full flex flex-col group">
                            <div className="relative overflow-hidden aspect-[16/10]">
                              <img
                                src={article.cover}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-jade-900/60 via-transparent to-transparent" />
                              <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                <Badge variant="success">{article.category}</Badge>
                                <Badge variant="info">{article.era}</Badge>
                              </div>
                              <div className="absolute top-3 right-3">
                                {getAuthenticityBadge(article.authenticityType)}
                              </div>
                              {article.expertId && (
                                <div className="absolute bottom-3 right-3">
                                  <Tag variant="gold" className="text-xs">
                                    <Award className="w-3 h-3" />
                                    专家认证
                                  </Tag>
                                </div>
                              )}
                            </div>
                            <Card.Content className="flex-1 flex flex-col">
                              <h3 className="font-serif text-lg font-semibold text-jade-700 mb-2 hover:text-gold-600 cursor-pointer transition-colors line-clamp-2 leading-snug">
                                {article.title}
                              </h3>
                              <p className="text-sm text-jade-500 mb-3 line-clamp-2 leading-relaxed">
                                {article.summary}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {article.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600 cursor-pointer transition-colors"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-auto pt-3 border-t border-gold-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 text-jade-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-gold-500" />
                                    {article.author}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5 text-gold-500" />
                                    {article.views.toLocaleString()}
                                  </span>
                                </div>
                                <span className="flex items-center gap-1 text-jade-400">
                                  <Clock className="w-3 h-3" />
                                  {article.date}
                                </span>
                              </div>
                            </Card.Content>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <Card>
                      <Card.Content className="py-16 text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-jade-200" />
                        <h3 className="font-serif text-xl text-jade-600 mb-2">未找到匹配的文章</h3>
                        <p className="text-jade-400 text-sm mb-4">
                          请尝试调整筛选条件，或重置所有筛选后重试
                        </p>
                        <button
                          onClick={resetAllFilters}
                          className="btn-secondary inline-flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          重置筛选条件
                        </button>
                      </Card.Content>
                    </Card>
                  )}
                </motion.div>
              )}

              {activeTab === 'compare' && (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {COMPARE_CASES.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => setCurrentCompareCase(idx)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300',
                          currentCompareCase === idx
                            ? 'bg-ink-gradient text-white shadow-gold-glow scale-105'
                            : 'bg-rice-100 text-jade-600 hover:bg-gold-50 border border-gold-100',
                        )}
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs"
                          style={{
                            background: currentCompareCase === idx
                              ? 'rgba(201, 169, 97, 0.3)'
                              : 'rgba(45, 74, 62, 0.1)',
                          }}
                        >
                          {idx + 1}
                        </span>
                        {c.category}
                        <span className="text-xs opacity-75">真伪对比</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCompareCase}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      {(() => {
                        const currentCase = COMPARE_CASES[currentCompareCase];
                        return (
                          <Card className="overflow-hidden">
                            <Card.Header>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Card.Title className="text-xl">{currentCase.title}</Card.Title>
                                  <Card.Description>
                                    鉴定专家：<span className="text-gold-600 font-medium">{currentCase.expert}</span> · 含6项真品特征 + 6项仿品破绽
                                  </Card.Description>
                                </div>
                                <Tag variant="gold" className="hidden sm:inline-flex">
                                  <Eye className="w-3 h-3" />
                                  专家图鉴
                                </Tag>
                              </div>
                            </Card.Header>
                            <Card.Content className="p-5 space-y-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="relative rounded-xl overflow-hidden border-2 border-jade-300 shadow-lg">
                                  <div className="relative aspect-[4/5]">
                                    <img
                                      src={currentCase.genuineImage}
                                      alt="真品"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-jade-900/70 via-transparent to-transparent" />
                                    <div className="absolute top-4 right-4 animate-seal-stamp">
                                      <div className="w-20 h-20 border-4 border-jade-500 bg-jade-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center rotate-6 shadow-seal">
                                        <span className="text-jade-600 font-serif font-black text-lg writing-mode-vertical">
                                          ✅ 真品
                                        </span>
                                      </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                      <Badge variant="success" dot className="text-sm px-3 py-1.5">
                                        6项真品特征
                                      </Badge>
                                    </div>
                                    {currentCase.genuineFeatures.map((_, i) => (
                                      <div
                                        key={i}
                                        className="absolute flex items-center justify-center"
                                        style={{
                                          top: `${18 + i * 13}%`,
                                          left: i % 2 === 0 ? '5%' : 'auto',
                                          right: i % 2 === 1 ? '5%' : 'auto',
                                        }}
                                      >
                                        <span className="w-7 h-7 rounded-full bg-jade-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white/80">
                                          {i + 1}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="p-4 bg-jade-50/80 space-y-2">
                                    {currentCase.genuineFeatures.map((feat, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-jade-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                                          {i + 1}
                                        </span>
                                        <span className="text-jade-700 leading-relaxed">{feat}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="relative rounded-xl overflow-hidden border-2 border-cinnabar-300 shadow-lg">
                                  <div className="relative aspect-[4/5]">
                                    <img
                                      src={currentCase.fakeImage}
                                      alt="仿品"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-cinnabar-900/70 via-transparent to-transparent" />
                                    <div className="absolute top-4 left-4 animate-seal-stamp">
                                      <div className="w-20 h-20 border-4 border-cinnabar-500 bg-cinnabar-500/10 backdrop-blur-sm rounded-lg flex items-center justify-center -rotate-6 shadow-seal">
                                        <span className="text-cinnabar-600 font-serif font-black text-lg">
                                          ❌ 仿品
                                        </span>
                                      </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                      <Badge variant="error" dot className="text-sm px-3 py-1.5">
                                        6项仿品破绽
                                      </Badge>
                                    </div>
                                    {currentCase.fakeFeatures.map((_, i) => (
                                      <div
                                        key={i}
                                        className="absolute flex items-center justify-center"
                                        style={{
                                          top: `${18 + i * 13}%`,
                                          right: i % 2 === 0 ? '5%' : 'auto',
                                          left: i % 2 === 1 ? '5%' : 'auto',
                                        }}
                                      >
                                        <span className="w-7 h-7 rounded-full bg-cinnabar-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white/80">
                                          {i + 1}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="p-4 bg-cinnabar-50/80 space-y-2">
                                    {currentCase.fakeFeatures.map((feat, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cinnabar-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                                          {i + 1}
                                        </span>
                                        <span className="text-cinnabar-700 leading-relaxed">{feat}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="relative py-3">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-gold-300" />
                                </div>
                                <div className="relative flex justify-center">
                                  <span className="bg-gold-gradient text-white px-6 py-2 rounded-full text-sm font-bold shadow-gold-glow">
                                    VS · 鉴别要点总结
                                  </span>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-rice-100 via-gold-50/70 to-rice-100 rounded-xl p-5 border border-gold-200">
                                <h4 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
                                  <Award className="w-5 h-5 text-gold-500" />
                                  专家鉴别要点
                                </h4>
                                <ul className="space-y-3">
                                  {currentCase.conclusion.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-gradient text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow">
                                        {i + 1}
                                      </span>
                                      <span className="text-jade-700 leading-relaxed text-sm">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </Card.Content>
                          </Card>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === 'faq' && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-jade-500">
                      精选社区问答沉淀 · 共 <span className="font-semibold text-gold-600">25</span> 个常见问题
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Tag variant="jade" className="cursor-pointer hover:opacity-80">
                        <MessageCircle className="w-3 h-3" />
                        社区问答来源
                      </Tag>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {FAQ_DATA.map((faqCat, catIdx) => (
                      <motion.div
                        key={faqCat.category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIdx * 0.06, duration: 0.3 }}
                      >
                        <Card className="overflow-hidden">
                          <button
                            onClick={() => toggleFaqCategory(faqCat.category)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-rice-50 transition-colors border-b border-gold-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{faqCat.icon}</span>
                              <div className="text-left">
                                <h3 className="font-serif text-lg font-semibold text-jade-700">
                                  {faqCat.category}
                                </h3>
                                <p className="text-xs text-jade-400">
                                  共 {faqCat.items.length} 个精选问题
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="info" className="hidden sm:inline-flex">
                                来自社区
                              </Badge>
                              {expandedFaqCategories[faqCat.category] ? (
                                <ChevronUp className="w-5 h-5 text-jade-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-jade-500" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {expandedFaqCategories[faqCat.category] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="divide-y divide-gold-100">
                                  {faqCat.items.map((item, itemIdx) => (
                                    <div key={item.id} className="px-5 py-1">
                                      <button
                                        onClick={() => toggleFaq(item.id)}
                                        className="w-full py-3 flex items-start justify-between gap-4 hover:bg-gold-50/50 -mx-3 px-3 rounded-md transition-colors"
                                      >
                                        <div className="flex items-start gap-3 text-left flex-1 min-w-0">
                                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-jade-100 to-gold-100 text-jade-600 text-sm font-bold flex items-center justify-center mt-0.5">
                                            Q{itemIdx + 1}
                                          </span>
                                          <h4 className="font-medium text-jade-700 leading-snug pt-1 line-clamp-2">
                                            {item.question}
                                          </h4>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <div className="hidden sm:flex items-center gap-2 text-xs text-jade-400">
                                            <span className="flex items-center gap-1">
                                              <ThumbsUp className="w-3 h-3 text-gold-500" />
                                              {item.usefulCount}
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFaqCollect(item.id);
                                              }}
                                              className={cn(
                                                'p-1 rounded transition-colors',
                                                collectedFaqs[item.id]
                                                  ? 'text-cinnabar-500 bg-cinnabar-50'
                                                  : 'hover:text-cinnabar-500 hover:bg-cinnabar-50/50',
                                              )}
                                            >
                                              <Bookmark className={cn('w-4 h-4', collectedFaqs[item.id] && 'fill-current')} />
                                            </button>
                                          </div>
                                          {expandedFaqs[item.id] ? (
                                            <ChevronUp className="w-4 h-4 text-gold-500 flex-shrink-0 mt-1" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-gold-500 flex-shrink-0 mt-1" />
                                          )}
                                        </div>
                                      </button>

                                      <AnimatePresence initial={false}>
                                        {expandedFaqs[item.id] && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="pl-10 pb-5 space-y-4">
                                              <div className="space-y-3">
                                                {item.answer.map((para, pIdx) => (
                                                  <p
                                                    key={pIdx}
                                                    className="text-sm text-jade-600 leading-7"
                                                  >
                                                    {para}
                                                  </p>
                                                ))}
                                              </div>
                                              <div className="flex items-center justify-between pt-3 border-t border-gold-100">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="inline-flex items-center gap-1.5 text-xs text-jade-400 bg-rice-100 px-2.5 py-1 rounded-full">
                                                    <ExternalLink className="w-3 h-3 text-gold-500" />
                                                    {item.source}
                                                    <ArrowRight className="w-3 h-3" />
                                                  </span>
                                                  <span className="inline-flex items-center gap-1 text-xs text-jade-400">
                                                    <User className="w-3 h-3" />
                                                    专家解答
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2 sm:hidden">
                                                  <span className="flex items-center gap-1 text-xs text-jade-400">
                                                    <ThumbsUp className="w-3 h-3 text-gold-500" />
                                                    {item.usefulCount}
                                                  </span>
                                                  <button
                                                    onClick={() => toggleFaqCollect(item.id)}
                                                    className={cn(
                                                      'p-1 rounded transition-colors',
                                                      collectedFaqs[item.id]
                                                        ? 'text-cinnabar-500 bg-cinnabar-50'
                                                        : 'hover:text-cinnabar-500 hover:bg-cinnabar-50/50',
                                                    )}
                                                  >
                                                    <Bookmark className={cn('w-4 h-4', collectedFaqs[item.id] && 'fill-current')} />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-12 lg:col-span-3 space-y-5"
          >
            <div className="lg:sticky lg:top-4 space-y-5">
              <Card>
                <Card.Header className="py-3">
                  <div className="flex items-center justify-between">
                    <Card.Title className="text-base flex items-center gap-2">
                      <Flame className="w-4 h-4 text-cinnabar-500" />
                      热门标签云
                    </Card.Title>
                    <Badge variant="warning">{HOT_TAGS.length}个</Badge>
                  </div>
                </Card.Header>
                <Card.Content className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {HOT_TAGS.map((tag, idx) => (
                      <motion.button
                        key={tag.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02, duration: 0.25 }}
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'rounded-full transition-all duration-200 hover:shadow-gold-glow',
                          idx % 4 === 0
                            ? 'bg-gradient-to-r from-jade-500 to-jade-600 text-white'
                            : idx % 4 === 1
                              ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-white'
                              : idx % 4 === 2
                                ? 'bg-rice-100 text-jade-700 hover:bg-jade-100'
                                : 'bg-gold-50 text-gold-700 hover:bg-gold-100',
                        )}
                        style={{
                          padding: `${getTagFontSize(tag.count) / 7}px ${getTagFontSize(tag.count) / 4.5}px`,
                          fontSize: `${getTagFontSize(tag.count)}px`,
                        }}
                        onClick={() => setSearchQuery(tag.name)}
                      >
                        #{tag.name}
                      </motion.button>
                    ))}
                  </div>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header className="py-3">
                  <div className="flex items-center justify-between">
                    <Card.Title className="text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-gold-500" />
                      专家专栏推荐
                    </Card.Title>
                    <Badge variant="success">权威</Badge>
                  </div>
                </Card.Header>
                <Card.Content className="p-4 space-y-4">
                  {recommendedExperts.map((expert, idx) => (
                    <motion.div
                      key={expert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                      whileHover={{ y: -2 }}
                      className="group p-3 rounded-lg bg-rice-50 border border-gold-100 hover:border-gold-300 hover:shadow-gold-glow transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white font-serif text-lg font-bold">
                            {expert.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold-gradient flex items-center justify-center text-[10px] text-white">
                            ✓
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-jade-700 truncate">{expert.name}</h4>
                            <Tag
                              variant={
                                expert.level === 'national'
                                  ? 'gold'
                                  : expert.level === 'provincial'
                                    ? 'jade'
                                    : 'outline'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {expert.level === 'national'
                                ? '国家级'
                                : expert.level === 'provincial'
                                  ? '省级'
                                  : '高级'}
                            </Tag>
                          </div>
                          <p className="text-xs text-jade-500 mt-0.5 line-clamp-1">
                            {expert.categories.slice(0, 2).join(' · ')}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-jade-400">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                              {expert.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gold-500" />
                              {expert.orderCount}单
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="mt-3 w-full py-1.5 text-xs font-medium rounded-md bg-ink-gradient text-white opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-1">
                        查看专栏
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </Card.Content>
              </Card>

              <Card>
                <Card.Header className="py-3">
                  <div className="flex items-center justify-between">
                    <Card.Title className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold-500" />
                      最近浏览
                    </Card.Title>
                    <Badge variant="info">Cookie</Badge>
                  </div>
                </Card.Header>
                <Card.Content className="p-3 space-y-2">
                  {recentViews.length > 0 ? (
                    recentViews.map((article, idx) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08, duration: 0.3 }}
                        className="flex gap-3 p-2 rounded-lg hover:bg-gold-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-rice-100">
                          <img
                            src={article.cover}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h5 className="text-sm font-medium text-jade-700 line-clamp-2 leading-snug group-hover:text-gold-600 transition-colors">
                            {article.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-jade-400">
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" />
                              {(article.views / 1000).toFixed(1)}k
                            </span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-jade-300">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      暂无浏览记录
                    </div>
                  )}
                </Card.Content>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
        