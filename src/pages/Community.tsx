import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageCircle,
  Eye,
  Clock,
  User,
  ThumbsUp,
  MessageSquare,
  Filter,
  ChevronUp,
  Coins,
  Award,
  TrendingUp,
  Crown,
  Medal,
  Trophy,
  X,
  Image as ImageIcon,
  Send,
  Flag,
  ChevronDown,
  Check,
  AlertCircle,
  Upload,
  Sparkles,
  FileQuestion,
  Calendar,
  HelpCircle,
  ScrollText,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { Category, ExpertLevel } from '../../shared/types';

// ========== 类型定义 ==========

interface Author {
  id: string;
  name: string;
  avatar?: string;
  isExpert?: boolean;
  expertLevel?: ExpertLevel;
  expertCategories?: Category[];
}

interface Answer {
  id: string;
  questionId: string;
  content: string;
  author: Author;
  isExpert: boolean;
  isAdopted: boolean;
  likes: number;
  dislikes: number;
  images?: string[];
  createdAt: string;
}

interface Question {
  id: string;
  title: string;
  content: string;
  category: Category;
  author: Author;
  views: number;
  answers: Answer[];
  likes: number;
  bounty?: number;
  hasExpertAnswer: boolean;
  images?: string[];
  tags: string[];
  createdAt: string;
}

interface FAQItem {
  id: string;
  number: string;
  title: string;
  category: '陶瓷鉴定' | '玉器鉴定' | '书画鉴定' | '钱币收藏' | '保存保养' | '交易纠纷' | '综合';
  content: string[];
  compareImages?: { real: string; fake: string; realLabel: string; fakeLabel: string };
  sourceQuestionId: string;
  sourceQuestionTitle: string;
  reviewer: Author;
  reviewedAt: string;
  helpedCount: number;
  tags: string[];
}

interface WeeklyStar {
  rank: number;
  expert: Author;
  weeklyAnswers: number;
  adoptionRate: number;
}

interface HotTopic {
  rank: number;
  tag: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
}

interface BountyQuestion {
  id: string;
  title: string;
  bounty: number;
  answers: number;
}

// ========== 热门搜索词 ==========

const HOT_SEARCH_WORDS = [
  '青花瓷鉴别',
  '和田玉籽料',
  '齐白石真迹',
  '五帝钱',
  '紫砂壶开壶',
  '宣德炉',
  '宋代建盏',
  '翡翠A货',
  '小叶紫檀',
  '古钱币包浆',
];

// ========== 分类与排序选项 ==========

const CATEGORY_FILTERS = ['全部品类', '陶瓷', '玉器', '书画', '铜器', '钱币', '杂项'] as const;
const SORT_OPTIONS = ['最新', '最热', '悬赏高', '零回答'] as const;
const FAQ_CATEGORIES = [
  '全部分类',
  '陶瓷鉴定 FAQ',
  '玉器鉴定 FAQ',
  '书画鉴定 FAQ',
  '钱币收藏 FAQ',
  '保存保养 FAQ',
  '交易纠纷 FAQ',
] as const;

// ========== 图片占位URL ==========

const placeholderImg = (seed: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(seed)}&image_size=square`;

// ========== 构造作者数据 ==========

const authors: Author[] = [
  { id: 'u1', name: '藏友小张' },
  { id: 'u2', name: '古韵堂主' },
  { id: 'u3', name: '青瓷爱好者' },
  { id: 'u4', name: '玉石新人' },
  { id: 'u5', name: '泉友老李' },
  { id: 'u6', name: '书画收藏家' },
  { id: 'u7', name: '紫砂玩家' },
  { id: 'u8', name: '铜器迷' },
];

const expertAuthors: Author[] = [
  {
    id: 'e1',
    name: '张明德',
    isExpert: true,
    expertLevel: ExpertLevel.NATIONAL,
    expertCategories: [Category.CERAMIC, Category.JADE],
  },
  {
    id: 'e2',
    name: '李雅琴',
    isExpert: true,
    expertLevel: ExpertLevel.NATIONAL,
    expertCategories: [Category.CALLIGRAPHY_PAINTING],
  },
  {
    id: 'e3',
    name: '王建国',
    isExpert: true,
    expertLevel: ExpertLevel.PROVINCIAL,
    expertCategories: [Category.BRONZE, Category.COIN],
  },
  {
    id: 'e4',
    name: '刘长根',
    isExpert: true,
    expertLevel: ExpertLevel.SENIOR,
    expertCategories: [Category.ZISHA, Category.MISCELLANEOUS],
  },
  {
    id: 'e5',
    name: '陈美玲',
    isExpert: true,
    expertLevel: ExpertLevel.PROVINCIAL,
    expertCategories: [Category.JADE],
  },
];

// ========== 构造 mockCommunityQuestions（8条） ==========

const mockCommunityQuestions: Question[] = [
  {
    id: 'q_001',
    title: '请各位老师帮忙看看这件青花瓷是什么年代的？有无收藏价值？',
    content:
      '家里老人传下来的青花梅瓶，高约35厘米，底径12厘米。釉色莹润，纹饰是缠枝莲纹，底有款识模糊不清。请各位专家帮忙断代，有无收藏价值？市场价大概多少？',
    category: Category.CERAMIC,
    author: authors[0],
    views: 3520,
    likes: 128,
    bounty: 500,
    hasExpertAnswer: true,
    images: [placeholderImg('antique blue and white porcelain vase Ming dynasty'), placeholderImg('ceramic vase bottom mark')],
    tags: ['青花瓷', '断代', '梅瓶'],
    createdAt: '2小时前',
    answers: [
      {
        id: 'a_001',
        questionId: 'q_001',
        content:
          '从照片来看，这件青花梅瓶有以下几个特征值得注意：\n\n一、青花发色：发色沉稳偏灰蓝，有铁锈斑痕迹，符合明代空白期（正统、景泰、天顺）青花的典型特征。苏麻离青料在此时期使用渐少，但仍有部分官窑产品使用。\n\n二、纹饰布局：缠枝莲纹画法疏朗流畅，叶片留有空白，是明中期的风格特点。肩部的蕉叶纹也较为写实。\n\n三、器型：梅瓶丰肩瘦底，造型端庄稳重，比例协调，符合明代器型特征。\n\n四、底足：从底足图来看，修足规整，足端平切，胎质略显粗糙但坚实，有火石红痕迹。\n\n综合判断：这件器物初步看应为明代空白期景德镇民窑精品。建议进一步做微观老化痕迹分析，确认无疑后收藏价值较高，市场参考价约8-15万元区间。',
        author: expertAuthors[0],
        isExpert: true,
        isAdopted: true,
        likes: 256,
        dislikes: 3,
        createdAt: '1小时前',
      },
      {
        id: 'a_002',
        questionId: 'q_001',
        content:
          '我也有一件类似的，去年在保利拍了9万多，楼主这件品相更好，应该能卖个好价钱！不过建议找专家上手看看，照片鉴定总有偏差。',
        author: authors[1],
        isExpert: false,
        isAdopted: false,
        likes: 18,
        dislikes: 0,
        createdAt: '30分钟前',
      },
    ],
  },
  {
    id: 'q_002',
    title: '和田玉籽料和山料怎么区分？求老司机带路',
    content:
      '新手入门，最近在看和田玉，市场上各种"籽料"满天飞，价格从几千到几十万都有。想请教一下各位老师，和田玉籽料和山料在外观、手感上有什么区别？怎么避免买到假货？',
    category: Category.JADE,
    author: authors[3],
    views: 5680,
    likes: 289,
    hasExpertAnswer: true,
    tags: ['和田玉', '籽料', '山料', '鉴别'],
    createdAt: '5小时前',
    answers: [
      {
        id: 'a_003',
        questionId: 'q_002',
        content:
          '和田玉籽料与山料的鉴别是新手入门的第一课，我从几个维度详细讲解：\n\n一、外形：籽料是河水搬运冲刷形成，外形圆润如鹅卵石，表面有天然的"毛孔"（类似人体皮肤的汗毛孔），这是最重要的鉴别特征。山料则棱角分明，表面粗糙，无毛孔。\n\n二、皮色：籽料多有天然皮色，秋梨皮、枣红皮、洒金皮等，皮色深入肌理，过渡自然。假皮色多浮于表面，颜色过于鲜艳。\n\n三、玉质：籽料因为长期受河水浸润，玉质更细腻油润，"温润如玉"说的就是籽料的质感。山料相对较干，油性差。\n\n四、重量：同等体积下，籽料密度略高，手感更压手。\n\n五、结构：打灯看内部，籽料结构细腻均匀，云絮状纹理小而密。山料结构相对粗松。\n\n新手建议：多看少买，先从价格适中的小籽料标本入手培养感觉，切勿贪便宜买"洒金皮羊脂玉"那种几千块的，99%是假的。',
        author: expertAuthors[4],
        isExpert: true,
        isAdopted: true,
        likes: 428,
        dislikes: 5,
        createdAt: '4小时前',
      },
    ],
  },
  {
    id: 'q_003',
    title: '这幅齐白石的虾图是真迹吗？求鉴定！',
    content:
      '朋友转让一幅齐白石的虾图，尺寸是68cmx45cm，有款"齐璜"，印章两方。要价28万，说是早年在荣宝斋买的。请专家帮忙看看是否开门，这个价位合理吗？',
    category: Category.CALLIGRAPHY_PAINTING,
    author: authors[5],
    views: 8960,
    likes: 456,
    bounty: 1000,
    hasExpertAnswer: true,
    images: [placeholderImg('Qi Baishi shrimp painting Chinese ink art')],
    tags: ['齐白石', '书画鉴定', '虾图'],
    createdAt: '昨天',
    answers: [
      {
        id: 'a_004',
        questionId: 'q_003',
        content:
          '齐白石的虾是市场上仿品最多的品类之一，从这张照片来看，我提几点看法供参考：\n\n问题一：虾身墨色。齐白石画虾，虾身是由淡墨到浓墨的渐变过渡，中间的虾腹部分墨色最重，然后向头尾渐淡。此图虾身墨色平板，缺少层次感，尤其是第二节的墨色变化不足。\n\n问题二：虾腿与虾钳。真迹虾腿劲挺有力，每一条都有"写"的笔意，不是描画出来的。虾钳开合自然有力。此图虾腿偏软，线条犹豫。\n\n问题三：虾眼。齐白石的虾眼是浓墨横点，不是点圆点，这是他成熟期的典型特征。\n\n问题四：落款书法。"齐璜"二字的写法，齐白石的书法是学何绍基再参以己意，字形偏长，笔画遒劲。此款写法过于拘谨。\n\n结论：从图片看，此画大概率是仿品，不建议以28万购入。如确有兴趣，建议做专业的科技鉴定（纸绢碳十四测年+笔墨成分分析），并要求提供来源佐证材料。',
        author: expertAuthors[1],
        isExpert: true,
        isAdopted: true,
        likes: 612,
        dislikes: 8,
        createdAt: '昨天',
      },
    ],
  },
  {
    id: 'q_004',
    title: '五帝钱怎么辨别真假？现在市价多少？',
    content:
      '想请一套五帝钱挂在家里镇宅，淘宝上几十到几百的都有，还有标价几千的"公博评级"。请问专家五帝钱的辨别方法和合理价位，什么是大开门？',
    category: Category.COIN,
    author: authors[4],
    views: 2340,
    likes: 98,
    hasExpertAnswer: true,
    bounty: 200,
    tags: ['五帝钱', '古钱币', '辨别'],
    createdAt: '1天前',
    answers: [
      {
        id: 'a_005',
        questionId: 'q_004',
        content:
          '五帝钱指顺治、康熙、雍正、乾隆、嘉庆五个清帝的铜钱，是收藏入门的热门品种。\n\n辨别要点：\n\n一、铜质：清钱多用黄铜，黄中微带青色。假钱多为杂铜或锌合金，颜色过黄或偏红。\n\n二、文字：每朝钱文有固定的书法风格。如顺治通宝早期仿明式，康熙通宝满汉文，雍正通宝工整规范，乾隆通宝山底隆、缶隆等版别，嘉庆通宝写法多样。\n\n三、包浆：真品包浆自然，有层次感，从地张到字口深浅不一。假包浆要么轻浮易掉，要么乌黑死板。\n\n四、磨损：真品流通痕迹自然，字口和边缘磨损均匀。假币多无磨损或人工做旧。\n\n五、穿口：方孔边缘应有自然的拔模痕迹和流通磨损，假币穿口多尖锐或毛糙。\n\n市价参考（2024年）：\n- 普通品大全套（传世美品）：300-600元\n- 好品大全套（无裂无漏）：600-1500元\n- 公博评级85分以上：1500-3000元\n- 稀有版别：单枚就可能上千甚至上万\n\n新手建议直接买评级币，公博、华夏、保粹这几家都比较靠谱，虽然贵点但省心。几十块一套的不用看了，百分百是假的。',
        author: expertAuthors[2],
        isExpert: true,
        isAdopted: true,
        likes: 356,
        dislikes: 2,
        createdAt: '1天前',
      },
    ],
  },
  {
    id: 'q_005',
    title: '新买的紫砂壶怎么开壶？求详细步骤',
    content:
      '刚入手一把宜兴原矿紫泥石瓢壶，容量280ml，底款是"范某某制"。听说需要开壶才能用，有人说用豆腐煮，有人说用茶叶煮，还有说直接用就行的。请教正确的开壶方法和注意事项。',
    category: Category.ZISHA,
    author: authors[6],
    views: 1560,
    likes: 76,
    hasExpertAnswer: true,
    tags: ['紫砂壶', '开壶', '保养'],
    createdAt: '2天前',
    answers: [
      {
        id: 'a_006',
        questionId: 'q_005',
        content:
          '紫砂壶开壶是把玩紫砂的第一步，方法很多，我推荐最稳妥的传统方法：\n\n第一步：温壶洗尘。先用温水内外冲洗干净，用软布轻擦表面灰尘和窑灰，注意不要用任何洗涤剂。\n\n第二步：冷水下锅。将壶和壶盖分开（用纱布包裹防止磕碰），冷水放入无油的锅中，水要没过壶身3-5厘米。\n\n第三步：小火煮沸。开小火慢慢烧开，水沸后转小火保持30分钟。让壶身气孔慢慢打开，杂质析出。\n\n第四步：自然冷却。关火后让水自然冷却到室温，不要捞出用冷水冲，避免热胀冷缩导致裂壶。\n\n第五步：茶叶定味。再次加水，放入你以后准备用这把壶泡的茶叶（建议普洱或红茶，定味效果好），煮20分钟。一壶不事二茶，定味后就不要换茶类了。\n\n第六步：阴干备用。捞出用温水冲洗干净，壶内留少许水分，壶盖错开搁置，放在通风无异味处阴干24小时即可使用。\n\n常见误区：\n1. 不要用豆腐、甘蔗等乱七八糟的东西煮，容易窜味甚至堵气孔。\n2. 不要开水直接浇冷壶，温差过大容易裂。\n3. 不要用洗洁精等化学洗剂，紫砂吸味后很难去除。\n4. 开壶后第一泡倒掉不喝，称为"养壶茶"。',
        author: expertAuthors[3],
        isExpert: true,
        isAdopted: true,
        likes: 289,
        dislikes: 1,
        createdAt: '2天前',
      },
    ],
  },
  {
    id: 'q_006',
    title: '这面铜镜是汉代的吗？求专家看看',
    content:
      '古玩市场淘的铜镜，直径15厘米，厚度0.5厘米，背面有四乳四神纹（青龙白虎朱雀玄武），边缘有铭文一圈但大多锈蚀不清。花了6800元，买贵了吗？',
    category: Category.BRONZE,
    author: authors[7],
    views: 1820,
    likes: 62,
    hasExpertAnswer: true,
    bounty: 300,
    images: [placeholderImg('Han dynasty bronze mirror with animal motifs')],
    tags: ['铜镜', '汉代', '青铜器'],
    createdAt: '3天前',
    answers: [
      {
        id: 'a_007',
        questionId: 'q_006',
        content:
          '汉代铜镜是青铜镜收藏的热门品类，四乳四神纹是西汉中晚期到新莽时期的典型纹饰。从图片看，我提几点：\n\n一、铜质：汉镜铜质为高锡青铜，色泽偏银白，打磨后光亮可鉴。此镜铜色偏红，值得注意。\n\n二、纹饰：四神纹的画法，汉代朱雀造型挺拔有力，龙纹矫健，线条流畅有力度。此图纹饰线条略显软弱，神兽造型不够灵动。\n\n三、锈色：汉代铜镜埋藏两千余年，锈层应有层次：表层浮锈（绿锈）、中层硬锈（红斑绿锈）、内层入骨锈。此镜锈色过于均匀单一，有化学做旧之嫌。\n\n四、铭文：汉镜铭文多为吉语（如"见日之光天下大明"），字体是典型的汉隶或小篆变体。\n\n综合建议：仅从图片看，此物存疑较大。建议上手看锈层是否坚硬（用针挑，真锈挑不动，假锈易脱落），有无刺鼻气味。如无法确认，建议送专业机构做铜质成分分析。6800元如果是真品西汉四神镜，不贵；如果是仿品，就贵了。',
        author: expertAuthors[2],
        isExpert: true,
        isAdopted: false,
        likes: 145,
        dislikes: 3,
        createdAt: '3天前',
      },
    ],
  },
  {
    id: 'q_007',
    title: '古钱币清洗有什么讲究？洗坏了是不是就不值钱了？',
    content:
      '家里有一些出土的古钱币，宋钱和清钱都有，锈迹比较重，有的字都看不清了。想清洗一下方便把玩和收藏，请问有什么需要注意的？什么能洗什么不能洗？',
    category: Category.COIN,
    author: authors[4],
    views: 1120,
    likes: 45,
    hasExpertAnswer: false,
    tags: ['古钱币', '清洗', '保养'],
    createdAt: '4天前',
    answers: [],
  },
  {
    id: 'q_008',
    title: '小叶紫檀手串怎么盘玩才能包浆漂亮？',
    content:
      '刚入手一串小叶紫檀2.0手串，说是老料金星的。朋友说要先用手套盘，有人说要放密封袋"醒"，还有说不能上手的。求正确的盘玩步骤和时间表！',
    category: Category.MISCELLANEOUS,
    author: authors[0],
    views: 980,
    likes: 52,
    hasExpertAnswer: false,
    bounty: 100,
    tags: ['小叶紫檀', '盘玩', '包浆'],
    createdAt: '5天前',
    answers: [],
  },
];

// ========== 构造 FAQ 结构化数据（15条） ==========

const faqData: FAQItem[] = [
  {
    id: 'faq_001',
    number: '#FAQ-0001',
    title: '元青花与明青花的核心鉴别要点是什么？',
    category: '陶瓷鉴定',
    content: [
      '元青花与明初青花是陶瓷鉴定的重点和难点，二者在胎釉、用料、纹饰等方面既有继承又有演变，核心鉴别要点如下：',
      '一、青花用料：元青花绝大多数使用进口"苏麻离青"料，发色浓艳深翠，铁锈斑明显凹陷，呈"锡光"状。明洪武时期苏料使用减少，发色偏灰暗；永乐宣德时期苏料使用达到顶峰，铁锈斑自然晕散，形成"永乐宣德不分家"的现象；成化以后基本改用国产平等青料，发色淡雅。',
      '二、胎质底足：元青花胎质较粗，胎色灰白，底足多为砂底，有粘砂和火石红，足端多斜削。明初洪武底足仍有元代遗风；永乐时期胎质细腻洁白，细砂底光滑如"糯米胎"；宣德底足多为直墙，修足规整。',
      '三、纹饰画法：元青花纹饰繁密，层次多（可达七八层），龙纹头小颈细，三爪为主。明洪武纹饰渐疏；永乐宣德纹饰疏朗清新，折枝花果纹增多，龙纹变粗壮，五爪龙成为皇家专用。',
      '四、器型特征：元青花大件多（大罐、梅瓶、大盘），器型雄浑厚重。明初器型逐渐向俊秀演变，永乐压手杯、宣德香炉都是经典器型。',
      '特别提醒：元青花存世量极少（公认馆藏约400件左右），民间收藏需格外谨慎，遇到"元青花大罐"标价几十万的要高度警惕。',
    ],
    compareImages: {
      real: placeholderImg('Yuan dynasty blue white porcelain authentic detail Su Ma Li Qing'),
      fake: placeholderImg('fake Yuan blue white porcelain modern imitation'),
      realLabel: '元青花真品铁锈斑',
      fakeLabel: '现代仿品人工铁锈斑',
    },
    sourceQuestionId: 'q_001',
    sourceQuestionTitle: '请各位老师帮忙看看这件青花瓷是什么年代的？',
    reviewer: expertAuthors[0],
    reviewedAt: '2024-03-15',
    helpedCount: 12856,
    tags: ['元青花', '明青花', '苏麻离青', '断代'],
  },
  {
    id: 'faq_002',
    number: '#FAQ-0002',
    title: '和田玉籽料的"毛孔"如何鉴别真假？',
    category: '玉器鉴定',
    content: [
      '"毛孔"是和田玉籽料的身份证，也是目前造假最集中的环节。掌握毛孔鉴别，是籽料收藏的基本功：',
      '一、真毛孔的特征：天然籽料的毛孔是亿万年河水冲刷、砂石撞击形成，大小不一、深浅不一、疏密不均、形状各异，如同人体皮肤的汗毛孔。观察要点：①毛孔边缘圆润自然，无尖锐棱角；②毛孔内部有包浆和皮色渗透；③放大观察，毛孔内部可见次生矿物结晶；④毛孔分布不均匀，凸起处毛孔多且深，凹陷处少而浅。',
      '二、假毛孔的类型：①喷砂毛孔：用高压喷砂机喷砂形成，特点是毛孔大小均匀、深浅一致、过于密集，毛孔边缘尖锐。②酸蚀毛孔：用氢氟酸腐蚀，特点是表面整体坑洼不平，毛孔过于密集，颜色发白无神，有刺鼻残留气味。③滚筒仿毛孔：山料放入滚筒加砂石打磨，特点是表面过于光滑，毛孔少且均为平行擦痕，无自然撞击坑。',
      '三、鉴别工具：必备10倍以上放大镜，有条件配50-100倍显微镜。手机微距镜头+手电筒侧光也是常用方法。',
      '四、经验总结："毛孔太好看的必假"——天然的东西永远不完美。如果一件"籽料"每一颗毛孔都圆润漂亮、大小一致，基本可以判定为假货。',
    ],
    compareImages: {
      real: placeholderImg('authentic Hetian jade seed material pores closeup'),
      fake: placeholderImg('fake Hetian jade sandblasted imitation pores'),
      realLabel: '籽料真毛孔（100倍放大）',
      fakeLabel: '喷砂假毛孔',
    },
    sourceQuestionId: 'q_002',
    sourceQuestionTitle: '和田玉籽料和山料怎么区分？',
    reviewer: expertAuthors[4],
    reviewedAt: '2024-03-20',
    helpedCount: 9642,
    tags: ['和田玉', '籽料毛孔', '假皮鉴别'],
  },
  {
    id: 'faq_003',
    number: '#FAQ-0003',
    title: '齐白石书画鉴定的"五步法"是什么？',
    category: '书画鉴定',
    content: [
      '齐白石是近现代书画市场流通量最大、仿品最多的画家之一。经过几十年的鉴定实践，业内总结出一套系统的鉴定方法：',
      '第一步：看笔墨——"厚"是关键。齐白石笔墨最大特点是"浑厚华滋"，笔力雄健如"金刚杵"。画虾的虾身是一笔"写"出来的，中间浓两边淡，有立体感。假品多为"涂"和"描"，墨色平板单薄。',
      '第二步：看造型——"似与不似之间"。齐白石主张"太似媚俗，不似欺世"。画虾真实但又有艺术夸张（虾身六节变五节），画蟹壳硬而不僵，画花木繁而不乱。假品要么过于写实如同标本，要么变形离谱。',
      '第三步：看印章——"齐氏三印"是重点。齐白石常用印："齐璜""白石翁""寄萍堂"等，其印风源于汉印又参以赵之谦、吴昌硕，刀法猛利爽健。假印要么线条软弱，要么过于工整，缺少"猛"味。',
      '第四步：看落款——"书法即画法"。齐白石书法初学何绍基，后学金冬心、郑板桥，最终形成"衰年变法"后的独特书风：字形偏长、结构夸张、笔力扛鼎、纵横排奡。假款多工整拘谨，缺少气势。',
      '第五步：看传承——"流传有序"加分项。著录情况（是否出版于权威画册）、题跋情况（名家题跋）、来源渠道（是否来自拍卖行、名家旧藏），都是重要参考。',
      '以上五步法需综合运用，单一特征不足以定真假。',
    ],
    compareImages: {
      real: placeholderImg('authentic Qi Baishi shrimp painting detail brushstroke'),
      fake: placeholderImg('fake Qi Baishi shrimp modern forgery comparison'),
      realLabel: '真迹虾身笔墨层次',
      fakeLabel: '仿品墨色平板',
    },
    sourceQuestionId: 'q_003',
    sourceQuestionTitle: '这幅齐白石的虾图是真迹吗？',
    reviewer: expertAuthors[1],
    reviewedAt: '2024-03-25',
    helpedCount: 15328,
    tags: ['齐白石', '书画鉴定', '印章', '落款'],
  },
  {
    id: 'faq_004',
    number: '#FAQ-0004',
    title: '如何辨别古钱币的"包浆"真伪？',
    category: '钱币收藏',
    content: [
      '包浆是古钱币经过千百年自然氧化、埋藏、流通形成的表面状态，是鉴定古钱币的核心依据之一。',
      '一、真包浆的类型：①生坑包浆：出土品，红斑绿锈层次分明，绿锈有"结晶感"，硬如石子，指甲扣不动。②熟坑包浆：传世品，表面光滑温润，呈深褐或黑漆古色，有玻璃光泽。③水坑包浆：水中出土，钱体光洁，包浆呈水银沁色或灰黑色。',
      '二、真包浆的共性：①层次感——从地张到字口再到边缘，包浆深浅厚薄不同，如同天然生长。②附着力——真包浆与钱体结合紧密，沸水浸泡不掉，指甲抠不动。③自然过渡——颜色过渡自然，没有明显的分界线。',
      '三、假包浆的识别：①胶粘锈：用胶水混合铜粉、颜料做的假锈，指甲一抠就掉，热水浸泡发软发黏。②化学锈：用盐酸、硫酸铜等腐蚀做锈，颜色过于鲜艳（翠绿或鲜红），结构疏松，有刺鼻气味。③染色包浆：用鞋油、墨汁、蜡等涂抹，表面浮于一层，擦拭即掉，缝隙处有积色。④火烧包浆：用火烤做旧，表面发乌发黑，有烟熏痕迹，局部有爆裂。',
      '四、实战技巧："一摸二泡三抠四看"。摸手感是否温润不扎手；开水煮5分钟看是否掉色掉锈；指甲用力抠看是否能抠动；放大镜下看结构和层次。',
    ],
    compareImages: {
      real: placeholderImg('authentic ancient Chinese coin patina red and green rust'),
      fake: placeholderImg('fake coin artificial chemical patina comparison'),
      realLabel: '真品生坑红斑绿锈',
      fakeLabel: '化学假锈颜色过于鲜艳',
    },
    sourceQuestionId: 'q_004',
    sourceQuestionTitle: '五帝钱怎么辨别真假？',
    reviewer: expertAuthors[2],
    reviewedAt: '2024-04-01',
    helpedCount: 8721,
    tags: ['古钱币', '包浆', '生坑', '熟坑'],
  },
  {
    id: 'faq_005',
    number: '#FAQ-0005',
    title: '青铜器锈色辨伪全攻略',
    category: '综合',
    content: [
      '青铜器锈色是鉴定的第一道关口，做伪者也在此下足了功夫。掌握锈色辨伪，可以过滤掉80%的低仿品。',
      '一、真锈的生成原理：青铜器埋藏地下，与土壤中的水、二氧化碳、硫化物等发生化学反应，经数百上千年形成。真锈由表及里分为四层：浮锈（最外层，易脱落）、硬锈（坚硬，结晶状）、入骨锈（深入胎骨，与铜体融为一体）、地子（铜器本体氧化层）。',
      '二、八大锈色特征：①绿锈：碱式碳酸铜，最常见，有孔雀石结晶者为真。②红锈：氧化亚铜，分布于绿锈之下，与绿锈自然过渡。③蓝锈：硫酸铜，结晶如蓝宝石般闪亮。④黑漆古：锡析出表面形成的富锡层，光亮如漆，耐腐蚀。⑤水银沁：表面呈银灰色，是铅锡析出的结果。⑥红斑：红铜氧化层，真品自然，伪品生硬。⑦土沁：器物表面粘附的土垢，与锈层结合紧密。⑧金底：部分铜器清洗后露出的铜本色，多为黄铜或红铜。',
      '三、伪锈的六大类：①粉末锈：用铜粉、颜料、胶水混合涂抹，一碰就掉。②浸泡锈：放入化学溶液浸泡生成，锈层均匀单调，无结晶。③移植锈：从真品上刮下真锈粘到伪品上，仔细看边缘有接缝。④电解锈：用电解法在伪品表面镀上一层锈，结构过于均匀细密。⑤漆皮锈：用油漆或树脂做的假锈，表面光滑，无层次感，敲击声发闷。⑥埋土锈：将伪品埋入土中数月甚至数年，这种锈有一定迷惑性，但时间不够，锈层薄，结构松散。',
    ],
    compareImages: {
      real: placeholderImg('authentic bronze ware multi layer patina crystallization'),
      fake: placeholderImg('fake bronze artificial patina modern reproduction'),
      realLabel: '真锈多层结晶结构',
      fakeLabel: '伪锈表面光滑无层次',
    },
    sourceQuestionId: 'q_006',
    sourceQuestionTitle: '这面铜镜是汉代的吗？',
    reviewer: expertAuthors[2],
    reviewedAt: '2024-04-05',
    helpedCount: 6534,
    tags: ['青铜器', '锈色辨伪', '红斑绿锈'],
  },
  {
    id: 'faq_006',
    number: '#FAQ-0006',
    title: '紫砂壶泥料如何鉴别原矿与化工料？',
    category: '综合',
    content: [
      '紫砂壶泥料是壶的根本，目前市场上化工壶泛滥，学会鉴别原矿泥料是玩壶第一课。',
      '一、看颜色：原矿泥料颜色"不艳不亮"——朱泥不似朱红，紫泥不似深紫，段泥不似杏黄。凡是颜色过于鲜艳、表面过于光亮如新的，基本都是加了氧化金属（铁红粉、氧化钴、氧化锰等）的化工料。',
      '二、看颗粒：原矿紫砂含有石英、云母、赤铁矿等多种矿物颗粒。放大镜下可见：①白色颗粒（石英、云母）；②黑色颗粒（赤铁矿、锰矿）；③红色颗粒（铁矿）。三种颗粒自然分布，大小不一。化工壶颗粒均匀单一，或无任何颗粒（添加玻璃水）。',
      '三、闻气味：开水注入壶内，原矿壶散发泥土的清香或无异味。化工壶则有刺鼻的化学气味、塑料味或浓重的"土腥味"。',
      '四、看泡茶效果：原矿壶泡出的茶汤口感醇厚，茶香高扬，隔夜不馊（夏天）。化工壶泡出的茶汤口感寡淡，甚至有异味，隔夜茶汤浑浊发黑。',
      '五、听声音：原矿壶敲击声"沉闷"，如木石相击。化工壶添加玻璃水过多，敲击声清脆如瓷器。',
      '六、养壶变化：原矿壶越养越润，包浆自然内敛。化工壶要么养不出变化，要么表面浮光一层，"贼光"刺眼。',
    ],
    compareImages: {
      real: placeholderImg('authentic Yixing zisha clay mineral particles closeup'),
      fake: placeholderImg('fake Yixing teapot chemical clay bright color'),
      realLabel: '原矿紫泥颗粒丰富',
      fakeLabel: '化工料颜色过于鲜亮',
    },
    sourceQuestionId: 'q_005',
    sourceQuestionTitle: '新买的紫砂壶怎么开壶？',
    reviewer: expertAuthors[3],
    reviewedAt: '2024-04-10',
    helpedCount: 7825,
    tags: ['紫砂壶', '泥料鉴别', '化工壶'],
  },
  {
    id: 'faq_007',
    number: '#FAQ-0007',
    title: '书画保存环境的温湿度标准是多少？',
    category: '保存保养',
    content: [
      '书画是有机质文物，对环境变化极为敏感。不恰当的保存环境是书画损坏的首要原因。',
      '一、温度标准：最佳保存温度为18-22℃。温度过高会加速纸张纤维老化、墨迹褪色、颜料变质；温度过低（低于5℃）纸张会变脆。日常保存要避免阳光直射（紫外线伤害极大）、靠近暖气或空调出风口。',
      '二、湿度标准：最佳相对湿度为50-60%RH。湿度过高（>70%）容易滋生霉菌、发生虫蛀、纸张粘连；湿度过低（<40%）纸张脱水变脆，绢本开裂。南方梅雨季节要特别注意除湿，北方冬季要注意加湿。',
      '三、保存材料：①画盒：首选樟木盒（防虫）或无酸纸盒，避免用普通纸箱（含酸）和塑料箱（不透气易发霉）。②画袋：使用无酸纸套或蚕丝袋，避免用塑料袋。③卷画方法：画心朝外，以画轴为中心从尾向首卷，松紧适度，外包宣纸一层。',
      '四、存放位置：①存放于距地面50cm以上的书架或柜子中，避免地面潮气和积水。②远离厨房、卫生间等潮湿区域。③每年春秋季（3-4月、9-10月）各取出检查一次，通风阴晾（切勿暴晒！）。',
      '五、应急处理：①不慎遇水：立即用干净宣纸吸干水分，阴干，切勿烘烤或暴晒。②发现霉斑：用软毛笔轻轻拂去表面霉斑，再用75%酒精棉签点除（先在边角试验），严重者送专业修复机构。',
    ],
    sourceQuestionId: 'q_008',
    sourceQuestionTitle: '古钱币清洗有什么讲究？',
    reviewer: expertAuthors[1],
    reviewedAt: '2024-04-12',
    helpedCount: 5421,
    tags: ['书画保存', '温湿度', '防霉防虫'],
  },
  {
    id: 'faq_008',
    number: '#FAQ-0008',
    title: '翡翠A货、B货、C货、D货是什么意思？',
    category: '玉器鉴定',
    content: [
      '翡翠市场术语繁多，A/B/C/D货是对翡翠品质和处理方式的国家标准划分，与翡翠的品质等级（冰种、玻璃种）无关。',
      '一、A货翡翠：天然翡翠，除了切割、雕刻、抛光等物理加工外，未经过任何化学处理。A货是唯一具有收藏价值和保值功能的翡翠。特征：①内部结构自然，有"翠性"（苍蝇翅闪光）；②颜色分布自然，有色根；③敲击声清脆悦耳；④证书标注"翡翠（A货）"或"天然翡翠"。',
      '二、B货翡翠：经过酸洗充填处理。将种水差的翡翠用强酸浸泡，溶解内部杂质，使结构疏松，然后注入树脂或硅胶充填。B货外观看起来又透又绿，但：①重量偏轻（密度低）；②敲击声发闷；③表面有"酸蚀纹"（放大镜下可见网状裂纹）；④颜色发散，无色根；⑤几年后会老化变黄、龟裂。',
      '三、C货翡翠：人工染色处理。将无色或浅色翡翠通过加热、浸泡等方式，使染料渗入翡翠内部裂隙。C货颜色过于鲜艳、均匀，像浮在表面，放大镜下可见染料沿裂隙分布呈"蛛网状"，佩戴久了会褪色。',
      '四、B+C货：酸洗+染色+充填，是目前市场上最常见的处理方式，外观欺骗性最强。',
      '五、D货：根本不是翡翠，是其他玉石（水沫子、独山玉、马来玉）或玻璃、塑料仿冒品。',
      '购买建议：翡翠价格与品质挂钩，"冰种满绿手镯几千元"必是假货。务必索取权威机构（NGTC、GIA等）出具的鉴定证书，并扫码验证。',
    ],
    compareImages: {
      real: placeholderImg('authentic jadeite grade A natural green translucent'),
      fake: placeholderImg('fake jadeite grade B acid treated resin filled'),
      realLabel: 'A货翡翠翠性特征',
      fakeLabel: 'B货酸蚀纹网状结构',
    },
    sourceQuestionId: 'q_002',
    sourceQuestionTitle: '和田玉籽料和山料怎么区分？',
    reviewer: expertAuthors[4],
    reviewedAt: '2024-04-15',
    helpedCount: 18632,
    tags: ['翡翠', 'A货B货', '鉴别方法'],
  },
  {
    id: 'faq_009',
    number: '#FAQ-0009',
    title: '宋官窑"金丝铁线"开片如何鉴别？',
    category: '陶瓷鉴定',
    content: [
      '宋代官窑瓷器是五大名窑之一，开片是其最显著的特征。"金丝铁线"是明清以来对官窑开片的经典描述，也是鉴定的重要依据。',
      '一、开片的形成原理：官窑开片是胎釉膨胀系数不同导致的——釉的膨胀系数大于胎的膨胀系数，出窑冷却时釉层收缩率大，从而开裂。这种开裂原本是工艺缺陷，宋人化腐朽为神奇，成为独特的审美。',
      '二、什么是"金丝铁线"：①"铁线"——较粗较深的黑色大开片，是出窑时立刻形成的，因胎体含铁量高，开片处胎色透出，再经日久渗色而成。②"金丝"——较细较浅的黄色细碎开片，是出窑后很长时间内逐渐形成的，是空气中的灰尘、油污慢慢渗入开片所致。',
      '三、真开片的特征：①开片层次分明，大小相间，有疏有密，如同"冰裂纹"。②开片线条自然流畅，粗细变化自然，无人工刻划痕迹。③开片边缘微微凸起，手摸有涩感（久经把玩者除外）。④开片颜色由内向外逐渐变浅，有渗透感，不是画在表面的。⑤侧光观察，开片处有轻微凹陷。',
      '四、假开片的特征：①现代仿品开片均匀呆板，大小一致，无层次变化。②开片颜色是涂上去的，浮于表面，线条粗细一致，颜色均一。③用墨水、茶叶水浸泡做的假开片，颜色发黑发乌，开水浸泡会掉色。④人工刻划的开片，线条生硬，边缘尖锐，手摸有刮手感。',
    ],
    compareImages: {
      real: placeholderImg('Song dynasty Guan ware crackle glaze golden thread iron line'),
      fake: placeholderImg('fake Song Guan ware artificial crackle modern'),
      realLabel: '官窑真品金丝铁线层次',
      fakeLabel: '仿品人工开片均匀呆板',
    },
    sourceQuestionId: 'q_001',
    sourceQuestionTitle: '请各位老师帮忙看看这件青花瓷是什么年代的？',
    reviewer: expertAuthors[0],
    reviewedAt: '2024-04-18',
    helpedCount: 4567,
    tags: ['宋官窑', '开片', '金丝铁线', '五大名窑'],
  },
  {
    id: 'faq_010',
    number: '#FAQ-0010',
    title: '小叶紫檀的"金星"真假如何鉴别？',
    category: '综合',
    content: [
      '金星小叶紫檀是市场最热门的木种之一，金星造假也最为猖獗，从几块钱的胶磨金星到几万元的满金星手串，让人防不胜防。',
      '一、什么是真金星：金星是紫檀树在生长过程中，土壤中的矿物质通过导管运输，在导管中沉积形成的金色结晶物。本质上是"矿物质填充"。',
      '二、真金星的特征：①金星是断续的、点状的，如同夜空中的星星，不是连续的线条。②金星大小不一，疏密不均，有粗有细。③金星存在于导管内部，与棕眼凹陷一致，手摸有凹感，不是浮在表面。④颜色从金黄到暗红都有（老料金星多呈暗红），不是单一的闪闪发光的金黄色。⑤侧光观察，金星有"猫眼效应"——不同角度亮度不同。',
      '三、假金星的类型：①胶磨金星：用金粉或铜粉混合胶水填充棕眼，表面抛光后金光闪闪。特点：金星过于密集均匀，是连续的线条，颜色过于明亮，用指甲或针可以刮掉。②画金星：用金色漆笔在表面画点，特点是浮于表面，棕眼内反而没有，酒精一擦就掉。③电镀金星：在手串表面电镀一层金色，特点是全覆盖，没有棕眼，颜色亮得晃眼，完全没有木质感。④假木冒充：用血檀、科檀、红酸枝等染色后做金星，密度、纹理与紫檀不同。',
      '四、鉴别方法：放大镜看形态、酒精棉擦拭（假的掉色）、测量密度（真紫檀气干密度1.05-1.26g/cm³，沉水）、盘玩变化（真金星盘玩后更明显，假金星盘玩后脱落）。',
    ],
    compareImages: {
      real: placeholderImg('authentic lobular red sandalwood golden stars closeup'),
      fake: placeholderImg('fake red sandalwood artificial gold dust filled'),
      realLabel: '真金星断续点状',
      fakeLabel: '胶磨假金星连续线条',
    },
    sourceQuestionId: 'q_008',
    sourceQuestionTitle: '小叶紫檀手串怎么盘玩才能包浆漂亮？',
    reviewer: expertAuthors[3],
    reviewedAt: '2024-04-20',
    helpedCount: 9345,
    tags: ['小叶紫檀', '金星', '木材鉴别'],
  },
  {
    id: 'faq_011',
    number: '#FAQ-0011',
    title: '宣德炉鉴别中的"六大要素"是什么？',
    category: '陶瓷鉴定',
    content: [
      '明代宣德炉是铜器收藏的皇冠，后世仿品从明晚期到现代从未间断，鉴别难度极大。以下六大要素是业内公认的鉴定框架：',
      '一、铜质："真宣用铜，如用黄金"。宣德炉用的是暹逻进贡的"风磨铜"，经过十二炼（甚至说"斤铜拣取四两"），铜质极纯，密度极高。特点：①掂手感极重，同体积比普通铜器重1/3以上。②打磨后表面光泽温润，呈"紫红色"或"深栗壳色"，内含细密的黄金、白银闪烁光泽（史料记载配料中加入了金、银等贵金属）。③底足露铜处，可见铜质细腻如婴儿肌肤。',
      '二、包浆："宣炉之妙，在宝色内涵，珠光外现"。真宣包浆浑厚，古朴温润，有"玉质感"，颜色从藏经纸色、鳝鱼黄、枣红到黑漆古都有，但无论什么颜色都"静而不嚣，沉而不浮"。假包浆多为贼光刺眼，或乌黑死板。',
      '三、款式：宣德炉款识有"宣""宣德""宣德年制""大明宣德年制"四种。真款字体方正有力，楷书仿沈度台阁体，篆书古朴端庄。"德"字"心"上少一横（虽非绝对，但真宣多如此）。款字嵌入炉底，如同"印"上去的，与炉身浑然一体。',
      '四、造型：真宣造型端庄典雅，比例协调，"增一分则肥，减一分则瘦"。耳、足、腹、口各部位比例精准。如冲耳炉两耳对称外撇，三足鼎立均匀稳定。假品多比例失调，造型笨拙。',
      '五、皮色：宣炉有"五色"——藏经纸色、棠梨色、枣红色、茄皮紫色、黑漆古色。真品皮色是"养"出来的，内透外润，越擦越亮。假品皮色是"做"出来的，或浮于表面，或颜色发死。',
      '六、重量：真宣因铜质精纯，异常压手。同样尺寸的冲耳炉，真宣重可达1.5-2kg，仿品多不足1kg。',
    ],
    sourceQuestionId: 'q_006',
    sourceQuestionTitle: '这面铜镜是汉代的吗？',
    reviewer: expertAuthors[2],
    reviewedAt: '2024-04-22',
    helpedCount: 3872,
    tags: ['宣德炉', '铜器', '风磨铜', '款识'],
  },
  {
    id: 'faq_012',
    number: '#FAQ-0012',
    title: '古玩交易中如何防范"掉包"骗局？',
    category: '交易纠纷',
    content: [
      '古玩交易中"掉包"是最恶劣的诈骗行为之一，藏友尤其是新手务必高度警惕。以下是常见的掉包手法及防范措施：',
      '一、常见掉包场景：①看货掉包：卖家拿出真品让你看，你看完递回时已经被掉包成仿品（手法：桌下有暗格、身上有备仿品、同伙配合转移）。②鉴定掉包：送"鉴定机构"或"专家"鉴定，真品被说成赝品低价收购，或以"需要留观"为由掉包。③拍卖掉包：送拍公司接收藏品后，流拍返还时已掉包。④快递掉包：邮寄古玩途中被掉包，签收时未验货。',
      '二、掉包防范十五条：①"物不离眼，手不离物"——看货时全程盯住自己的藏品，不要让物品离开视线。②做暗记——交易前在藏品隐蔽处做只有自己知道的特殊记号（如用针尖在底部刻一个微点）。③拍照留证——多角度、带参照物（放一把尺子、一枚硬币）拍照，包括细节特写。④当面验货——无论买入卖出，必须当面仔细核对物品与暗记、照片。⑤快递必保价——古玩邮寄必须保价（保价金额按实际价值），签收时必须拆包验货再签字。⑥鉴定选正规——鉴定选择有资质、有口碑的机构，鉴定时全程在场。⑦不轻信上门——拒绝"上门收购""高价收购"等电话营销，这些几乎都是骗局。⑧大额走平台——大额交易走正规平台或当面交易，不要先打款。⑨多人陪同——大额交易时带朋友陪同，人多对方不好下手。⑩录音录像——交易时可以录音录像（不侵犯对方隐私前提下）留证。⑪不喝酒交易——交易时不要饮酒，酒后判断力下降容易中招。⑫地点选公开——交易地点选公共场所、茶馆、银行等有监控的地方。⑬不贪便宜——对方出价远高于市场价，必有猫腻。⑭合同写清楚——委托拍卖、鉴定时合同中写清物品细节和照片。⑮出问题立即报警——发现掉包立即报警，不要私下解决。',
    ],
    sourceQuestionId: 'q_004',
    sourceQuestionTitle: '五帝钱怎么辨别真假？',
    reviewer: expertAuthors[0],
    reviewedAt: '2024-04-25',
    helpedCount: 12456,
    tags: ['交易风险', '掉包防骗', '维权'],
  },
  {
    id: 'faq_013',
    number: '#FAQ-0013',
    title: '宋代建盏"曜变"与普通油滴如何区分？',
    category: '陶瓷鉴定',
    content: [
      '宋代建盏是黑釉瓷的巅峰，其中"曜变天目"被誉为"碗中宇宙"，存世仅三件半（日本三件，中国半件残器），是国宝级文物。',
      '一、什么是曜变：曜变是建盏窑变中的极品，其特征是"黑釉之上有大小不一的圆形斑点，斑点周围有彩虹般的光晕，随光线角度变化而变幻颜色"。日本人形容为"万匹珠光""笼聚星斗"。',
      '二、曜变与油滴的本质区别：①油滴（鹧鸪斑）：釉面分布大小均匀的银灰色金属光泽圆点，是釉料中氧化铁析出并富集形成的晶体。斑点是平面的，无彩虹光晕。②曜变：斑点是"立体"的，斑点周围有蓝、紫、金等彩虹干涉色（称为"曜变环"），这是釉层中极薄的干涉膜对光线衍射的结果。',
      '三、存世曜变的特征：①日本静嘉堂文库"稻叶天目"——斑点最大最清晰，光晕最绚丽，被誉为"天下第一碗"。②日本藤田美术馆"曜变天目"——斑点较小但密集，整体偏蓝紫色。③日本龙光院"曜变天目"——斑点最细最少，偏内敛。④杭州出土残件——中国唯一一件，斑点特征与日本三件类似。',
      '四、仿品曜变的识别：①现代仿品多是在釉料中添加稀土元素或用激光打标，斑点过于规则均匀。②仿品曜变环颜色是"涂"上去的，不是衍射色，不会随光线变化。③仿品价格——如果有人卖"宋曜变建盏"几千几万，100%是假的。2019年一件半残曜变建盏拍卖价就达4200万港元。',
    ],
    compareImages: {
      real: placeholderImg('Song dynasty Jian ware Yohen tenmoku tea bowl iridescent'),
      fake: placeholderImg('fake Jian ware modern oil滴 imitation'),
      realLabel: '真品曜变环彩虹干涉色',
      fakeLabel: '仿品油滴斑点平面无光晕',
    },
    sourceQuestionId: 'q_001',
    sourceQuestionTitle: '请各位老师帮忙看看这件青花瓷是什么年代的？',
    reviewer: expertAuthors[0],
    reviewedAt: '2024-04-28',
    helpedCount: 5621,
    tags: ['建盏', '曜变', '油滴', '天目'],
  },
  {
    id: 'faq_014',
    number: '#FAQ-0014',
    title: '古玩交易纠纷如何举证和维权？',
    category: '交易纠纷',
    content: [
      '古玩交易"不保真"是行规，但不等于"可以欺诈"。如果遭遇以假充真、隐瞒瑕疵、掉包等诈骗行为，完全可以通过法律途径维权。',
      '一、哪些情况可以维权：①卖家明确承诺"真品"而实际为假（有聊天记录、录音为证）。②卖家虚构来源、虚构鉴定证书。③交易过程中发生掉包。④拍卖公司以"虚假鉴定""虚假拍卖"骗取费用。⑤卖家故意隐瞒重大瑕疵（如修复过的瓷器隐瞒修复情况）。',
      '二、维权的核心——证据：①交易凭证：转账记录、收据、发票、合同、聊天记录（微信/支付宝/短信）、通话录音。②物品证据：交易前后的对比照片、视频、暗记证明（这就是为什么要做暗记拍照！）。③鉴定证据：找权威机构出具鉴定报告，作为诉讼证据。④证人证言：如果有第三方在场，证人证言也是证据。',
      '三、维权步骤：①协商——先与卖家或平台协商退款退货，态度明确，同时准备好证据。②平台投诉——如果是第三方平台交易，向平台客服投诉，要求平台介入。注意平台维权有时间窗口，不要错过。③消协投诉——拨打12315，向消费者协会投诉。④工商举报——如果对方是公司主体，向当地市场监督管理局举报。⑤报警立案——如果涉及金额较大（一般3000元以上可立案）、有诈骗嫌疑，携带证据到公安机关报案。⑥法院诉讼——以上途径都无效时，向法院提起民事诉讼。保留好所有证据原件。',
      '四、关键提醒：①古玩交易前务必约定"如假包退"并留文字记录。②选择正规渠道和有信誉的商家，不要在路边摊、朋友圈买高价货。③维权要及时——民事诉讼时效是3年。',
    ],
    sourceQuestionId: 'q_003',
    sourceQuestionTitle: '这幅齐白石的虾图是真迹吗？',
    reviewer: expertAuthors[1],
    reviewedAt: '2024-05-01',
    helpedCount: 7823,
    tags: ['交易纠纷', '维权', '法律常识'],
  },
  {
    id: 'faq_015',
    number: '#FAQ-0015',
    title: '古钱币入藏前的消毒与除锈规范',
    category: '保存保养',
    content: [
      '新入手的古钱币可能携带有害锈、细菌、虫卵等，入藏前的消毒和科学除锈是必须的。但除锈要"适度"，过度清洗会毁掉钱币的收藏价值。',
      '一、消毒处理：①物理消毒：用超声波清洗机（功率不要太大，时间不要超过5分钟），可去除表面浮土和有害物。②酒精消毒：用75%医用酒精浸泡30分钟，可杀灭大多数细菌和虫卵，取出后晾干。③高温消毒：不适用于所有钱币，仅限干坑、无有害锈的铜钱——用烤箱低温（120℃以下）烘烤1小时，可杀除虫卵。④绝不能用84消毒液、漂白粉等强氧化剂，会严重腐蚀钱币！',
      '二、除锈的原则：①"锈不掩字不除"——如果锈层不影响文字和图案的辨认，就不要除锈。带有漂亮红斑绿锈的生坑品，除锈后价值大减。②"有害锈必须除"——"粉状锈"（又称青铜病，呈浅绿色粉末状）是有害锈，会不断蔓延，必须清除。③"除锈留底"——除锈只除浮锈和有害锈，保留紧贴钱体的"地张锈"和"硬锈"。',
      '三、安全除锈方法：①物理法：用不锈钢针、刻刀轻轻剔除浮锈和粉状锈（放大镜下操作），适用于较硬的浮锈。②醋泡法：用白醋或米醋浸泡数小时至数天，可溶解疏松的锈层。取出后用清水冲洗，再用小苏打水浸泡中和。③柠檬酸法：5-10%柠檬酸溶液浸泡，除锈速度比醋快，除锈后务必清水反复冲洗。④钱币专用除锈剂：购买正规品牌的钱币除锈剂（如D70除锈液），按说明使用。⑤超声波法：加少量中性洗涤剂，短时间（1-3分钟）超声清洗，适用于批量处理普通品。',
      '四、除锈后的保护：①除锈后用蒸馏水冲洗干净，无水乙醇脱水，吹风机冷风吹干。②涂抹一层微量的石蜡或B72保护剂，防止重新氧化。③入藏后定期检查，发现有害锈立即隔离处理。',
    ],
    sourceQuestionId: 'q_004',
    sourceQuestionTitle: '五帝钱怎么辨别真假？',
    reviewer: expertAuthors[2],
    reviewedAt: '2024-05-05',
    helpedCount: 4567,
    tags: ['古钱币', '除锈', '消毒', '保存'],
  },
];

// ========== 本周问答之星 ==========

const weeklyStars: WeeklyStar[] = [
  { rank: 1, expert: expertAuthors[0], weeklyAnswers: 58, adoptionRate: 96 },
  { rank: 2, expert: expertAuthors[1], weeklyAnswers: 46, adoptionRate: 94 },
  { rank: 3, expert: expertAuthors[4], weeklyAnswers: 39, adoptionRate: 91 },
];

// ========== 热议话题榜 ==========

const hotTopics: HotTopic[] = [
  { rank: 1, tag: '#青花瓷鉴别', heat: 128560, trend: 'up' },
  { rank: 2, tag: '#齐白石真迹', heat: 98230, trend: 'up' },
  { rank: 3, tag: '#和田玉籽料', heat: 87650, trend: 'up' },
  { rank: 4, tag: '#宋代建盏', heat: 76420, trend: 'stable' },
  { rank: 5, tag: '#紫砂壶开壶', heat: 65890, trend: 'down' },
  { rank: 6, tag: '#五帝钱真伪', heat: 54320, trend: 'up' },
  { rank: 7, tag: '#宣德炉鉴别', heat: 43210, trend: 'up' },
  { rank: 8, tag: '#翡翠A货', heat: 38760, trend: 'stable' },
  { rank: 9, tag: '#小叶紫檀金星', heat: 32450, trend: 'up' },
  { rank: 10, tag: '#古钱币包浆', heat: 28760, trend: 'down' },
];

// ========== 悬赏问题 ==========

const bountyQuestions: BountyQuestion[] = [
  { id: 'b_001', title: '祖传宣德炉求鉴定，底款"大明宣德年制"', bounty: 2000, answers: 0 },
  { id: 'b_002', title: '汝窑天青釉洗，是否到代？18cm口径', bounty: 3000, answers: 1 },
  { id: 'b_003', title: '张大千山水立轴求断代估价，有藏家印', bounty: 5000, answers: 2 },
];

// ========== 社区数据看板 ==========

const communityStats = {
  totalQuestions: 286542,
  totalAnswers: 958721,
  expertParticipation: 1286,
  todayNew: 486,
};

// ========== 数字递增动画 Hook ==========

function useCountUp(target: number, duration = 2000, start = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ========== 工具：专家等级徽章文字 ==========

function getExpertLevelBadge(level?: ExpertLevel) {
  switch (level) {
    case ExpertLevel.NATIONAL:
      return { text: '国家级专家', variant: 'gold' as const };
    case ExpertLevel.PROVINCIAL:
      return { text: '省级专家', variant: 'jade' as const };
    case ExpertLevel.SENIOR:
      return { text: '资深专家', variant: 'outline' as const };
    default:
      return null;
  }
}

// ========== 主组件 ==========

export default function Community() {
  // 搜索
  const [searchKeyword, setSearchKeyword] = useState('');
  // 主 Tab
  const [mainTab, setMainTab] = useState<'all' | 'expert' | 'pending' | 'faq'>('all');
  // 全部问题 - 筛选
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_FILTERS)[number]>('全部品类');
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>('最新');
  // FAQ 分类
  const [faqCategory, setFaqCategory] = useState<(typeof FAQ_CATEGORIES)[number]>('全部分类');
  // FAQ 展开
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set(['faq_001', 'faq_002']));
  // 问题详情弹窗
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  // 问题详情 - 图片轮播
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // 提问弹窗
  const [showAskModal, setShowAskModal] = useState(false);
  // FAQ 有用计数
  const [faqHelpfulCounts, setFaqHelpfulCounts] = useState<Record<string, number>>(
    Object.fromEntries(faqData.map((f) => [f.id, f.helpedCount])),
  );
  const [faqHelped, setFaqHelped] = useState<Set<string>>(new Set());
  // 回答支持/反对
  const [answerVotes, setAnswerVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  // 新增回答
  const [newAnswerContent, setNewAnswerContent] = useState('');

  // ========== 过滤后的问题列表 ==========

  const filteredQuestions = useMemo(() => {
    let list = [...mockCommunityQuestions];

    if (mainTab === 'expert') {
      list = list.filter((q) => q.hasExpertAnswer);
    } else if (mainTab === 'pending') {
      list = list.filter((q) => q.answers.length === 0);
    }

    if (categoryFilter !== '全部品类') {
      list = list.filter((q) => {
        const catMap: Record<string, Category[]> = {
          陶瓷: [Category.CERAMIC],
          玉器: [Category.JADE],
          书画: [Category.CALLIGRAPHY_PAINTING],
          铜器: [Category.BRONZE],
          钱币: [Category.COIN],
          杂项: [Category.ZISHA, Category.MISCELLANEOUS, Category.WOOD, Category.LACQUER, Category.TEXTILE, Category.STATIONERY, Category.SEAL],
        };
        return catMap[categoryFilter]?.includes(q.category);
      });
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.title.toLowerCase().includes(kw) ||
          q.content.toLowerCase().includes(kw) ||
          q.tags.some((t) => t.toLowerCase().includes(kw)),
      );
    }

    switch (sortBy) {
      case '最热':
        list.sort((a, b) => b.views - a.views);
        break;
      case '悬赏高':
        list.sort((a, b) => (b.bounty ?? 0) - (a.bounty ?? 0));
        break;
      case '零回答':
        list = list.filter((q) => q.answers.length === 0);
        break;
      default:
        break;
    }

    return list;
  }, [mainTab, categoryFilter, sortBy, searchKeyword]);

  // ========== FAQ 过滤 ==========

  const filteredFaqs = useMemo(() => {
    let list = faqData;
    if (faqCategory !== '全部分类') {
      const cat = faqCategory.replace(' FAQ', '');
      list = list.filter((f) => f.category === cat);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(kw) ||
          f.content.some((c) => c.toLowerCase().includes(kw)) ||
          f.tags.some((t) => t.toLowerCase().includes(kw)),
      );
    }
    return list.slice(0, 10);
  }, [faqCategory, searchKeyword]);

  const expertQuestions = useMemo(
    () => mockCommunityQuestions.filter((q) => q.hasExpertAnswer).slice(0, 6),
    [],
  );
  const pendingQuestions = useMemo(
    () => mockCommunityQuestions.filter((q) => q.answers.length === 0).slice(0, 4),
    [],
  );

  // ========== 事件处理 ==========

  const toggleFaqExpand = (id: string) => {
    setExpandedFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFaqHelpful = (id: string) => {
    if (faqHelped.has(id)) return;
    setFaqHelped((prev) => new Set(prev).add(id));
    setFaqHelpfulCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleVoteAnswer = (answerId: string, vote: 'up' | 'down') => {
    setAnswerVotes((prev) => ({ ...prev, [answerId]: prev[answerId] === vote ? null : vote }));
  };

  const handleOpenQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setCurrentImageIndex(0);
    setNewAnswerContent('');
  };

  const handleHotSearch = (word: string) => {
    setSearchKeyword(word);
    setMainTab('all');
  };

  // ========== 数字动画 ==========

  const countQuestions = useCountUp(communityStats.totalQuestions);
  const countAnswers = useCountUp(communityStats.totalAnswers);
  const countExperts = useCountUp(communityStats.expertParticipation);
  const countToday = useCountUp(communityStats.todayNew);

  // ========== 子组件：Avatar ==========

  const renderAvatar = (author: Author, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }[size];
    const iconSize = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }[size];
    return (
      <div
        className={cn(
          sizeClass,
          'rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
          author.isExpert
            ? 'bg-gold-gradient border-2 border-gold-400 shadow-gold-glow'
            : 'bg-ink-gradient border border-gold-200',
        )}
      >
        {author.avatar ? (
          <img src={author.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <User
            className={cn(
              iconSize,
              author.isExpert ? 'text-white' : 'text-gold-300',
            )}
          />
        )}
      </div>
    );
  };

  // ========== 渲染：问题卡片 ==========

  const renderQuestionCard = (q: Question, index: number, showExpertPreview = false) => {
    const expertAnswer = q.answers.find((a) => a.isExpert);
    return (
      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
      >
        <Card hoverable className="cursor-pointer" onClick={() => handleOpenQuestion(q)}>
          <Card.Content>
            <div className="flex items-start gap-4">
              {renderAvatar(q.author)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="success">{q.category}</Badge>
                  {q.bounty ? (
                    <Badge variant="warning" dot>
                      <Coins className="w-3 h-3" />
                      {q.bounty} 金币
                    </Badge>
                  ) : null}
                  {q.hasExpertAnswer && <Tag variant="jade">专家已答</Tag>}
                  {q.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded bg-rice-100 text-jade-600 border border-gold-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif text-lg font-semibold text-jade-700 mb-2 hover:text-gold-500 transition-colors line-clamp-2">
                  {q.title}
                </h3>
                <p className="text-jade-500 text-sm mb-3 line-clamp-1">{q.content}</p>

                {showExpertPreview && expertAnswer && (
                  <div className="mb-3 p-3 bg-gold-50/50 border border-gold-300 rounded-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gold-gradient opacity-10 rounded-bl-full" />
                    <div className="flex items-center gap-2 mb-2">
                      {renderAvatar(expertAnswer.author, 'sm')}
                      <span className="text-sm font-medium text-gold-700">
                        {expertAnswer.author.name}
                      </span>
                      {getExpertLevelBadge(expertAnswer.author.expertLevel) && (
                        <Tag variant={getExpertLevelBadge(expertAnswer.author.expertLevel)!.variant}>
                          {getExpertLevelBadge(expertAnswer.author.expertLevel)!.text}
                        </Tag>
                      )}
                    </div>
                    <p className="text-sm text-jade-600 line-clamp-3">
                      {expertAnswer.content.slice(0, 200)}...
                      <span className="text-gold-600 font-medium ml-1">展开查看 →</span>
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-jade-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {q.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {q.createdAt}
                    </span>
                  </div>
                  {q.images && q.images.length > 0 && (
                    <div className="flex -space-x-2">
                      {q.images.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-12 h-12 rounded-md border-2 border-rice-50 overflow-hidden bg-rice-100',
                          )}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-jade-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {q.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {q.answers.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {q.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    );
  };

  // ========== 渲染：待回答卡片 ==========

  const renderPendingCard = (q: Question, index: number) => (
    <motion.div
      key={q.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card hoverable className="cursor-pointer border-cinnabar-200" onClick={() => handleOpenQuestion(q)}>
        <Card.Content className="relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-br from-cinnabar-400 to-cinnabar-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
            零回答
          </div>
          <div className="flex items-start gap-4">
            {renderAvatar(q.author)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="success">{q.category}</Badge>
                {q.bounty && (
                  <Badge variant="warning" dot>
                    <Coins className="w-3 h-3" />
                    {q.bounty} 金币
                  </Badge>
                )}
              </div>
              <h3 className="font-serif text-lg font-semibold text-jade-700 mb-2 line-clamp-2 hover:text-gold-500 transition-colors">
                {q.title}
              </h3>
              <p className="text-jade-500 text-sm mb-4 line-clamp-2">{q.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-jade-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {q.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {q.views.toLocaleString()}
                  </span>
                </div>
                <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenQuestion(q); }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  成为第一个回答者
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </motion.div>
  );

  // ========== 渲染：FAQ 卡片 ==========

  const renderFaqCard = (faq: FAQItem, index: number) => {
    const isExpanded = expandedFaqs.has(faq.id);
    const levelBadge = getExpertLevelBadge(faq.reviewer.expertLevel);
    return (
      <motion.div
        key={faq.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
      >
        <Card hoverable className="h-full flex flex-col">
          <Card.Content className="flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="font-mono text-xs bg-ink-gradient text-gold-300 px-2 py-1 rounded font-medium tracking-wide">
                {faq.number}
              </span>
              <Tag variant="outline">{faq.category}</Tag>
            </div>

            <h3 className="font-serif text-lg font-semibold text-jade-700 mb-3 leading-snug">
              {faq.title}
            </h3>

            <AnimatePresence initial={false}>
              <motion.div
                key={isExpanded ? 'expanded' : 'collapsed'}
                initial={{ height: 'auto', opacity: 1 }}
                animate={{
                  height: isExpanded ? 'auto' : 72,
                  opacity: 1,
                }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden relative"
              >
                <div className="space-y-2">
                  {faq.content.map((p, i) => (
                    <p key={i} className="text-sm text-jade-600 leading-relaxed whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>

                {faq.compareImages && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="aspect-square rounded-md overflow-hidden border-2 border-jade-400">
                        <img
                          src={faq.compareImages.real}
                          alt={faq.compareImages.realLabel}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center text-jade-600 font-medium flex items-center justify-center gap-1">
                        <Check className="w-3 h-3 text-jade-600" />
                        {faq.compareImages.realLabel}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="aspect-square rounded-md overflow-hidden border-2 border-cinnabar-400">
                        <img
                          src={faq.compareImages.fake}
                          alt={faq.compareImages.fakeLabel}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center text-cinnabar-600 font-medium flex items-center justify-center gap-1">
                        <X className="w-3 h-3 text-cinnabar-600" />
                        {faq.compareImages.fakeLabel}
                      </p>
                    </div>
                  </div>
                )}

                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-rice-50 to-transparent pointer-events-none" />
                )}
              </motion.div>
            </AnimatePresence>

            <button
              onClick={() => toggleFaqExpand(faq.id)}
              className="mt-3 text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1 self-start transition-colors"
            >
              {isExpanded ? '收起内容' : '展开全文'}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <div className="mt-4 pt-4 border-t border-gold-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-jade-500 whitespace-nowrap flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    来源：
                  </span>
                  <button
                    className="text-xs text-gold-600 hover:underline truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      const srcQ = mockCommunityQuestions.find((q) => q.id === faq.sourceQuestionId);
                      if (srcQ) handleOpenQuestion(srcQ);
                    }}
                  >
                    原始问题 #{faq.sourceQuestionId.slice(-4)}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {renderAvatar(faq.reviewer, 'sm')}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-medium text-jade-700 truncate">
                        {faq.reviewer.name}
                      </span>
                      {levelBadge && (
                        <Tag variant={levelBadge.variant} className="whitespace-nowrap">
                          {levelBadge.text}
                        </Tag>
                      )}
                    </div>
                    <p className="text-xs text-jade-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      审核于 {faq.reviewedAt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-jade-500">
                  <HelpCircle className="w-3 h-3" />
                  已帮助 <span className="font-semibold text-gold-600">{(faqHelpfulCounts[faq.id] ?? faq.helpedCount).toLocaleString()}</span> 人
                </div>
                <button
                  onClick={() => handleFaqHelpful(faq.id)}
                  disabled={faqHelped.has(faq.id)}
                  className={cn(
                    'flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all',
                    faqHelped.has(faq.id)
                      ? 'bg-jade-600 text-white cursor-default'
                      : 'bg-jade-50 text-jade-600 hover:bg-jade-100 border border-jade-200',
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                  {faqHelped.has(faq.id) ? '已标记有用' : '有用'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {faq.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded bg-rice-100 text-jade-600 border border-gold-200 cursor-pointer hover:bg-gold-50 hover:text-gold-600 transition-colors"
                    onClick={() => handleHotSearch(t)}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    );
  };

  // ========== 渲染：右侧边栏 ==========

  const renderSidebar = () => (
    <div className="lg:col-span-1 space-y-4">
      <Card className="sticky top-24">
        <Card.Content className="space-y-6">
          {/* 本周问答之星 */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold-500" />
              本周问答之星
            </h3>
            <div className="space-y-3">
              {weeklyStars.map((star) => {
                const levelBadge = getExpertLevelBadge(star.expert.expertLevel);
                const rankIcon = {
                  1: <Crown className="w-4 h-4 text-yellow-500" />,
                  2: <Medal className="w-4 h-4 text-gray-400" />,
                  3: <Award className="w-4 h-4 text-amber-700" />,
                }[star.rank];
                const rankBg = {
                  1: 'bg-gradient-to-br from-yellow-400 to-amber-500',
                  2: 'bg-gradient-to-br from-gray-300 to-gray-500',
                  3: 'bg-gradient-to-br from-amber-600 to-amber-800',
                }[star.rank];
                return (
                  <div key={star.expert.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0',
                        rankBg,
                      )}
                    >
                      {star.rank}
                    </div>
                    {renderAvatar(star.expert, 'sm')}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm font-medium text-jade-700 truncate">
                          {star.expert.name}
                        </span>
                        {rankIcon}
                      </div>
                      {levelBadge && (
                        <p className="text-xs text-gold-600 truncate">{levelBadge.text}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-jade-700">{star.weeklyAnswers}答</p>
                      <p className="text-xs text-gold-600">{star.adoptionRate}%采纳</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 热议话题榜 */}
          <div className="pt-4 border-t border-gold-200">
            <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-500" />
              热议话题榜
            </h3>
            <div className="space-y-2">
              {hotTopics.map((topic) => (
                <div
                  key={topic.rank}
                  className="flex items-center gap-2 text-sm cursor-pointer group py-1 rounded hover:bg-rice-100 px-1 transition-colors"
                  onClick={() => handleHotSearch(topic.tag.replace('#', ''))}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0',
                      topic.rank <= 3 ? 'bg-cinnabar-400 text-white' : 'bg-rice-200 text-jade-500',
                    )}
                  >
                    {topic.rank}
                  </span>
                  <span className="flex-1 min-w-0 text-jade-600 group-hover:text-gold-600 transition-colors truncate">
                    {topic.tag}
                  </span>
                  <span className="text-xs text-jade-500 whitespace-nowrap">
                    {(topic.heat / 1000).toFixed(1)}k
                  </span>
                  {topic.trend === 'up' && (
                    <ChevronUp className="w-3 h-3 text-cinnabar-500 flex-shrink-0" />
                  )}
                  {topic.trend === 'down' && (
                    <ChevronDown className="w-3 h-3 text-jade-400 flex-shrink-0" />
                  )}
                  {topic.trend === 'stable' && (
                    <span className="w-3 h-0.5 bg-jade-300 flex-shrink-0 rounded" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 悬赏问题 */}
          <div className="pt-4 border-t border-gold-200">
            <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold-500" />
              高悬赏问题
            </h3>
            <div className="space-y-3">
              {bountyQuestions.map((bq) => (
                <div
                  key={bq.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-gold-50 to-transparent border border-gold-200 hover:border-gold-400 transition-colors cursor-pointer group"
                  onClick={() => setShowAskModal(true)}
                >
                  <p className="text-sm text-jade-700 font-medium mb-2 line-clamp-2 group-hover:text-gold-600 transition-colors">
                    {bq.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gold-700 font-medium bg-gold-gradient/10 px-2 py-0.5 rounded">
                      <Coins className="w-3 h-3 text-gold-600" />
                      {bq.bounty} 金币
                    </div>
                    <Button variant="primary" size="sm" className="!py-1 !px-3 text-xs">
                      快回答
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 社区数据看板 */}
          <div className="pt-4 border-t border-gold-200">
            <h3 className="font-serif text-lg font-semibold text-jade-700 mb-4 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-gold-500" />
              社区数据看板
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-ink-gradient/5 border border-gold-200 text-center">
                <p className="text-2xl font-bold text-jade-700 font-serif">
                  {(countQuestions / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-jade-500 mt-1">累计问题</p>
              </div>
              <div className="p-3 rounded-lg bg-ink-gradient/5 border border-gold-200 text-center">
                <p className="text-2xl font-bold text-jade-700 font-serif">
                  {(countAnswers / 10000).toFixed(1)}w
                </p>
                <p className="text-xs text-jade-500 mt-1">累计回答</p>
              </div>
              <div className="p-3 rounded-lg bg-gold-gradient/10 border border-gold-300 text-center">
                <p className="text-2xl font-bold text-gold-700 font-serif">
                  {countExperts}+
                </p>
                <p className="text-xs text-jade-500 mt-1">认证专家</p>
              </div>
              <div className="p-3 rounded-lg bg-jade-50 border border-jade-200 text-center">
                <p className="text-2xl font-bold text-jade-700 font-serif">
                  {countToday}+
                </p>
                <p className="text-xs text-jade-500 mt-1">今日新增</p>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  // ========== 主 Tab 配置 ==========

  const mainTabs = [
    { key: 'all' as const, label: '全部问题', count: mockCommunityQuestions.length, icon: MessageCircle },
    { key: 'expert' as const, label: '专家答过', count: expertQuestions.length, icon: Award },
    { key: 'pending' as const, label: '待回答', count: pendingQuestions.length, icon: AlertCircle },
    { key: 'faq' as const, label: '已沉淀 FAQ', count: faqData.length, icon: FileQuestion },
  ];

  // ========== JSX 返回 ==========

  return (
    <div className="min-h-screen bg-paper">
      {/* 顶部横幅：问答检索中心 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-ink-gradient opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gold-500/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-400/20 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative container py-16 md:py-20">
          <div className="text-center mb-10">
            <Tag variant="gold" className="mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              百万藏友问答社区
            </Tag>
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold leading-tight">
              百万藏友问答 · 专家实时答疑
            </h1>
            <p className="text-jade-200 text-lg max-w-2xl mx-auto">
              汇聚国家级鉴定专家，沉淀结构化收藏知识，让每一个收藏疑问都有专业答案
            </p>
          </div>

          {/* 超级搜索框 */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gold-gradient rounded-lg blur opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center bg-rice-50 rounded-lg overflow-hidden" style={{ height: '56px' }}>
                <Search className="w-6 h-6 text-gold-600 ml-5 flex-shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索问题标题、内容、标签或专家姓名..."
                  className="flex-1 h-full px-4 bg-transparent text-jade-800 placeholder-jade-400 text-base outline-none"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="p-2 mr-2 text-jade-400 hover:text-jade-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <Button
                  variant="primary"
                  className="m-1.5 h-11 !px-6"
                  onClick={() => setShowAskModal(true)}
                >
                  <MessageCircle className="w-5 h-5" />
                  我要提问
                </Button>
              </div>
            </div>
          </div>

          {/* 热门搜索词 */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs text-jade-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                热门搜索：
              </span>
              {HOT_SEARCH_WORDS.map((word, i) => (
                <motion.button
                  key={word}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => handleHotSearch(word)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-gold-400/40 text-gold-200 hover:bg-gold-500/20 hover:border-gold-300 hover:text-gold-100 transition-all backdrop-blur-sm"
                >
                  {word}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 主体内容区 */}
      <div className="container py-10">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* 主内容区 80% */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tab 切换 */}
            <Card>
              <Card.Content className="!p-2">
                <div className="flex items-center gap-1 bg-rice-100 rounded-lg p-1 overflow-x-auto scrollbar-thin">
                  {mainTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setMainTab(tab.key)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center',
                        mainTab === tab.key
                          ? 'bg-ink-gradient text-white shadow-md'
                          : 'text-jade-600 hover:text-gold-600 hover:bg-rice-50',
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          mainTab === tab.key
                            ? 'bg-white/20 text-gold-200'
                            : 'bg-jade-100 text-jade-600',
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* 全部问题 Tab */}
            <AnimatePresence mode="wait">
              {mainTab === 'all' && (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* 筛选条 */}
                  <Card>
                    <Card.Content className="!py-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-jade-500 flex-shrink-0" />
                          <span className="text-sm text-jade-600 whitespace-nowrap">品类：</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {CATEGORY_FILTERS.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setCategoryFilter(cat)}
                              className={cn(
                                'text-sm px-3 py-1 rounded-full transition-all',
                                categoryFilter === cat
                                  ? 'bg-gold-gradient text-white shadow-md'
                                  : 'bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600',
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-sm text-jade-600 whitespace-nowrap">排序：</span>
                          {SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setSortBy(opt)}
                              className={cn(
                                'text-sm px-3 py-1 rounded-md transition-all',
                                sortBy === opt
                                  ? 'bg-jade-600 text-white'
                                  : 'text-jade-500 hover:bg-jade-50',
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card.Content>
                  </Card>

                  {/* 问题列表 */}
                  {filteredQuestions.length === 0 ? (
                    <EmptyState
                      icon={<MessageCircle className="w-12 h-12 text-gold-500" />}
                      title="暂无匹配问题"
                      description="试试更换筛选条件或搜索关键词"
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.map((q, i) => renderQuestionCard(q, i))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 专家答过 Tab */}
              {mainTab === 'expert' && (
                <motion.div
                  key="expert"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gold-gradient/10 border border-gold-300">
                    <Award className="w-5 h-5 text-gold-600 flex-shrink-0" />
                    <p className="text-sm text-jade-700">
                      <span className="font-semibold text-gold-700">{expertQuestions.length}</span> 个问题已由国家级/省级专家权威解答
                    </p>
                  </div>
                  {expertQuestions.map((q, i) => renderQuestionCard(q, i, true))}
                </motion.div>
              )}

              {/* 待回答 Tab */}
              {mainTab === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-cinnabar-50 border border-cinnabar-200">
                    <AlertCircle className="w-5 h-5 text-cinnabar-500 flex-shrink-0" />
                    <p className="text-sm text-cinnabar-700">
                      <span className="font-semibold">{pendingQuestions.length}</span> 个问题等待解答，成为第一个回答者，悬赏金币等你拿！
                    </p>
                  </div>
                  {pendingQuestions.map((q, i) => renderPendingCard(q, i))}
                </motion.div>
              )}

              {/* 已沉淀 FAQ Tab */}
              {mainTab === 'faq' && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-gradient-to-r from-jade-50 via-gold-50/50 to-jade-50 border border-gold-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold-glow">
                        <ScrollText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-serif font-semibold text-jade-700 mb-1">结构化 FAQ 知识库</h4>
                        <p className="text-sm text-jade-600 leading-relaxed">
                          以下为平台从优质问答中提炼的结构化 FAQ，由专家最终审核确认。
                          每条内容均经过真伪对比、专业论证，可作为收藏参考依据。
                          目前已沉淀 <span className="font-semibold text-gold-700">{faqData.length}</span> 篇专业知识
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FAQ 分类横向滚动 */}
                  <Card>
                    <Card.Content className="!py-3">
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
                        {FAQ_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFaqCategory(cat)}
                            className={cn(
                              'text-sm px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0',
                              faqCategory === cat
                                ? 'bg-ink-gradient text-gold-300 shadow-md border border-gold-400'
                                : 'bg-rice-100 text-jade-600 hover:bg-gold-50 hover:text-gold-600 border border-transparent',
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>

                  {/* FAQ 两列瀑布流 */}
                  {filteredFaqs.length === 0 ? (
                    <EmptyState
                      icon={<FileQuestion className="w-12 h-12 text-gold-500" />}
                      title="暂无匹配 FAQ"
                      description="该分类下暂无 FAQ，试试其他分类或搜索关键词"
                    />
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4 items-start">
                      {filteredFaqs.map((faq, i) => renderFaqCard(faq, i))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 右侧边栏 20% */}
          {renderSidebar()}
        </div>
      </div>

      {/* 问题详情 Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-jade-900/70 backdrop-blur-sm"
              onClick={() => setSelectedQuestion(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[90vh] card flex flex-col"
            >
              {/* 头部 */}
              <div className="px-6 py-4 border-b border-gold-200 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="success">{selectedQuestion.category}</Badge>
                    {selectedQuestion.bounty && (
                      <Badge variant="warning" dot>
                        <Coins className="w-3 h-3" />
                        {selectedQuestion.bounty} 金币
                      </Badge>
                    )}
                    {selectedQuestion.hasExpertAnswer && <Tag variant="jade">专家已答</Tag>}
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-jade-700 leading-snug">
                    {selectedQuestion.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-1.5 -m-1.5 text-jade-500 hover:text-jade-700 hover:bg-jade-50 rounded-md transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容滚动区 */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="px-6 py-4">
                  {/* OP 信息 */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gold-100">
                    {renderAvatar(selectedQuestion.author)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-jade-700">{selectedQuestion.author.name}</p>
                      <p className="text-xs text-jade-500 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedQuestion.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {selectedQuestion.views.toLocaleString()} 浏览
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {selectedQuestion.likes} 点赞
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 问题正文 */}
                  <p className="text-jade-700 leading-relaxed mb-4 whitespace-pre-line">
                    {selectedQuestion.content}
                  </p>

                  {/* 图片轮播 */}
                  {selectedQuestion.images && selectedQuestion.images.length > 0 && (
                    <div className="mb-6 rounded-lg overflow-hidden bg-rice-100 border border-gold-200">
                      <div className="relative aspect-[4/3]">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={currentImageIndex}
                            src={selectedQuestion.images[currentImageIndex]}
                            alt=""
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full object-contain"
                          />
                        </AnimatePresence>
                        {selectedQuestion.images.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setCurrentImageIndex(
                                  (i) => (i - 1 + selectedQuestion.images!.length) % selectedQuestion.images!.length,
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink-gradient/80 text-white flex items-center justify-center hover:bg-ink-gradient transition-colors"
                            >
                              ‹
                            </button>
                            <button
                              onClick={() =>
                                setCurrentImageIndex(
                                  (i) => (i + 1) % selectedQuestion.images!.length,
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-ink-gradient/80 text-white flex items-center justify-center hover:bg-ink-gradient transition-colors"
                            >
                              ›
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                              {selectedQuestion.images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentImageIndex(i)}
                                  className={cn(
                                    'w-2 h-2 rounded-full transition-all',
                                    i === currentImageIndex
                                      ? 'bg-gold-400 w-4'
                                      : 'bg-white/60 hover:bg-white',
                                  )}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {selectedQuestion.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded bg-rice-100 text-jade-600 border border-gold-200 cursor-pointer hover:bg-gold-50 hover:text-gold-600 transition-colors"
                        onClick={() => handleHotSearch(t)}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 回答列表头部 */}
                <div className="px-6 py-3 border-y border-gold-200 bg-rice-50/50 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gold-600" />
                  <h3 className="font-serif font-semibold text-jade-700">
                    全部回答 ({selectedQuestion.answers.length})
                  </h3>
                </div>

                {/* 回答列表 */}
                <div className="px-6 py-4 space-y-4">
                  {selectedQuestion.answers.length === 0 ? (
                    <EmptyState
                      icon={<MessageSquare className="w-10 h-10 text-gold-500" />}
                      title="暂无回答"
                      description="快来成为第一个回答者吧！"
                      className="!py-8"
                    />
                  ) : (
                    [...selectedQuestion.answers]
                      .sort((a, b) => {
                        if (a.isExpert !== b.isExpert) return a.isExpert ? -1 : 1;
                        if (a.isAdopted !== b.isAdopted) return a.isAdopted ? -1 : 1;
                        return 0;
                      })
                      .map((answer) => {
                        const vote = answerVotes[answer.id] ?? null;
                        const levelBadge = getExpertLevelBadge(answer.author.expertLevel);
                        return (
                          <motion.div
                            key={answer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              'p-4 rounded-lg relative',
                              answer.isAdopted
                                ? 'border-2 border-jade-400 bg-jade-50/50'
                                : answer.isExpert
                                ? 'border-2 border-gold-400 bg-gradient-to-br from-gold-50/50 to-rice-50 shadow-gold-glow/40'
                                : 'border border-gold-200 bg-rice-50',
                            )}
                          >
                            {answer.isAdopted && (
                              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-cinnabar-500 text-white flex items-center justify-center rotate-12 shadow-seal animate-seal-stamp">
                                <div className="text-center leading-tight">
                                  <Check className="w-4 h-4 mx-auto" />
                                  <span className="text-[10px] font-bold">最佳</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-3 mb-3">
                              {renderAvatar(answer.author)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium text-jade-700">
                                    {answer.author.name}
                                  </span>
                                  {answer.isExpert && levelBadge && (
                                    <Tag variant={levelBadge.variant}>
                                      {levelBadge.text}
                                    </Tag>
                                  )}
                                  {answer.isExpert && !levelBadge && (
                                    <Tag variant="jade">专家认证</Tag>
                                  )}
                                </div>
                                <p className="text-xs text-jade-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {answer.createdAt}
                                </p>
                              </div>
                            </div>

                            <p className="text-jade-700 leading-relaxed whitespace-pre-line mb-4">
                              {answer.content}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-gold-100">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleVoteAnswer(answer.id, 'up')}
                                  className={cn(
                                    'flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all',
                                    vote === 'up'
                                      ? 'bg-jade-600 text-white'
                                      : 'text-jade-600 hover:bg-jade-50 border border-gold-200',
                                  )}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  支持 ({answer.likes + (vote === 'up' ? 1 : 0)})
                                </button>
                                <button
                                  onClick={() => handleVoteAnswer(answer.id, 'down')}
                                  className={cn(
                                    'flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all',
                                    vote === 'down'
                                      ? 'bg-cinnabar-500 text-white'
                                      : 'text-jade-600 hover:bg-jade-50 border border-gold-200',
                                  )}
                                >
                                  <ThumbsUp className="w-3 h-3 rotate-180" />
                                  反对 ({answer.dislikes + (vote === 'down' ? 1 : 0)})
                                </button>
                              </div>
                              <button className="flex items-center gap-1 text-xs text-jade-500 hover:text-cinnabar-500 transition-colors">
                                <Flag className="w-3 h-3" />
                                举报
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                  )}
                </div>

                {/* 回答输入框 */}
                <div className="px-6 py-4 border-t border-gold-200 bg-rice-50">
                  <p className="text-sm font-medium text-jade-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-500" />
                    撰写你的回答
                  </p>
                  <div className="rounded-lg border border-gold-300 bg-white overflow-hidden focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400 transition-all">
                    <textarea
                      value={newAnswerContent}
                      onChange={(e) => setNewAnswerContent(e.target.value)}
                      placeholder="分享你的专业见解，帮助更多藏友..."
                      rows={4}
                      className="w-full p-4 bg-transparent text-jade-700 placeholder-jade-400 outline-none resize-none text-sm leading-relaxed"
                    />
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gold-100 bg-rice-50/50">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-jade-600 hover:bg-jade-50 border border-gold-200 transition-colors">
                          <ImageIcon className="w-3.5 h-3.5" />
                          上传图片
                        </button>
                        <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-jade-600 hover:bg-jade-50 border border-gold-200 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          附件
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-jade-400">
                          {newAnswerContent.length} 字
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!newAnswerContent.trim()}
                        >
                          <Send className="w-4 h-4" />
                          提交回答
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 我要提问 Modal */}
      <AnimatePresence>
        {showAskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-jade-900/70 backdrop-blur-sm"
              onClick={() => setShowAskModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[90vh] card flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gold-200 flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-jade-700 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-gold-500" />
                    发布新问题
                  </h2>
                  <p className="text-sm text-jade-500 mt-1">详细描述你的问题，让专家和藏友更好地帮助你</p>
                </div>
                <button
                  onClick={() => setShowAskModal(false)}
                  className="p-1.5 -m-1.5 text-jade-500 hover:text-jade-700 hover:bg-jade-50 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
                <div>
                  <label className="label-field">问题标题 *</label>
                  <input
                    type="text"
                    placeholder="一句话描述你的收藏疑问..."
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">所属品类 *</label>
                    <select className="input-field">
                      <option>请选择品类</option>
                      {Object.values(Category).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-field">悬赏金币（选填）</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
                      <input
                        type="number"
                        placeholder="0"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-field">问题详情 *</label>
                  <textarea
                    rows={5}
                    placeholder="详细描述：年代、来源、尺寸、特征、已做过的鉴定、具体疑问点..."
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="label-field">添加标签（便于检索）</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['青花瓷', '断代', '估价', '鉴别', '保养'].map((t) => (
                      <button
                        key={t}
                        className="text-xs px-3 py-1 rounded-full bg-rice-100 text-jade-600 border border-gold-200 hover:bg-gold-50 hover:text-gold-600 transition-colors"
                      >
                        + #{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-field">上传图片（最多6张）</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg border-2 border-dashed border-gold-300 flex flex-col items-center justify-center text-jade-400 hover:border-gold-500 hover:text-gold-600 hover:bg-gold-50 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs">添加图片</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-jade-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    建议多角度拍摄：整体图、底款、纹饰细节、瑕疵特写等
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gold-200 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowAskModal(false)}>
                  取消
                </Button>
                <Button variant="primary">
                  <Sparkles className="w-4 h-4" />
                  发布问题
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}