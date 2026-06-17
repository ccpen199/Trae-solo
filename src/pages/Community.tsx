import { useState } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  Flame,
  Sparkles,
  Heart,
  Search as SearchIcon,
  CheckCircle,
  Clock,
  MapPin,
  Gift,
  Syringe,
  Bug,
  X,
  Send,
  Eye,
  PawPrint,
  HeartHandshake,
  FileText,
  ChevronRight,
  Star,
  User,
  Home,
  DollarSign,
  Award,
  AlertCircle,
  Check,
  XCircle,
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import type { CommunityPost, LostPetTask, LostPetClue } from '@shared/types';
import { cn } from '@/lib/utils';

interface HealthRecordPost extends CommunityPost {
  petName?: string;
  recordType: 'vaccine' | 'deworming';
  lastDate: string;
  nextDate: string;
  history: { date: string; description: string }[];
}

interface LostPetTaskWithClues extends LostPetTask {
  petPhoto?: string;
  breed: string;
  gender: 'male' | 'female';
  age: string;
  clueCount: number;
  followed: boolean;
  clues: LostPetClueWithStatus[];
}

interface LostPetClueWithStatus {
  id: string;
  taskId: string;
  reporterId: string;
  content: string;
  photos: string[];
  contact: string;
  status: 'pending' | 'verifying' | 'adopted' | 'rejected';
  verified: boolean;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
}

interface AdoptionPet {
  id: string;
  name: string;
  photo?: string;
  breed: string;
  gender: 'male' | 'female';
  age: string;
  healthStatus: string;
  requirements: string[];
  level: 'A' | 'B' | 'C';
  description: string;
  applied: boolean;
  applicationStatus?: string;
}

interface AdoptionApplication {
  petId: string;
  step: number;
  name: string;
  phone: string;
  city: string;
  hasExperience: boolean;
  experienceYears: string;
  reason: string;
  promise: string;
}

const mockPosts: CommunityPost[] = [
  {
    id: 'post1',
    ownerId: 'u1',
    petId: '1',
    content: '今天带豆豆去做了年度体检，各项指标都很正常！医生说它的毛发状态特别好，分享一下我平时的护理心得：\n\n1. 每天梳毛15分钟\n2. 每周洗澡一次，用宠物专用沐浴露\n3. 饮食以优质狗粮为主，偶尔加一些鸡胸肉\n4. 每天保证至少1小时的户外运动\n\n希望对大家有帮助～',
    images: [],
    tags: ['金毛', '宠物护理', '体检日记'],
    vaccineTag: '已接种狂犬疫苗',
    likes: 128,
    comments: 32,
    createdAt: '2025-06-14T10:30:00Z',
  },
  {
    id: 'post2',
    ownerId: 'u2',
    content: '新手养猫求助！我家猫咪最近总是抓耳朵，是不是有耳螨啊？有没有有经验的铲屎官分享一下治疗方法？',
    images: [],
    tags: ['猫咪', '求助', '耳螨'],
    likes: 45,
    comments: 18,
    createdAt: '2025-06-13T15:20:00Z',
  },
  {
    id: 'post3',
    ownerId: 'u3',
    petId: '2',
    content: '晒一下我家咪咪的新窝！她超级喜欢，一放好就钻进去不肯出来了哈哈～选了奶油色的，和我家装修风格也很搭！',
    images: [],
    tags: ['猫咪', '宠物用品', '晒宠'],
    dewormingTag: '已完成本月驱虫',
    likes: 256,
    comments: 48,
    createdAt: '2025-06-12T20:15:00Z',
  },
  {
    id: 'post4',
    ownerId: 'u4',
    content: '【科普】狗狗不能吃的食物清单\n\n1. 巧克力 - 含有可可碱，对狗狗有毒\n2. 葡萄/葡萄干 - 可能导致肾衰竭\n3. 洋葱/大蒜 - 会损伤红细胞\n4. 木糖醇 - 可能导致低血糖\n5. 煮熟的骨头 - 容易碎裂划伤消化道\n\n转发给身边养狗的朋友！',
    images: [],
    tags: ['科普', '养狗知识', '安全提醒'],
    likes: 589,
    comments: 87,
    createdAt: '2025-06-11T09:00:00Z',
  },
];

const healthRecordPosts: HealthRecordPost[] = [
  {
    id: 'health1',
    ownerId: 'u1',
    petId: '1',
    petName: '豆豆',
    content: '今天带豆豆去接种了年度狂犬疫苗，小家伙很勇敢，一声都没叫！医生说下次接种时间是明年的今天，记得提前预约哦～',
    images: [],
    tags: ['金毛', '疫苗接种', '宠物健康'],
    vaccineTag: '疫苗接种记录',
    likes: 86,
    comments: 12,
    createdAt: '2025-06-10T09:30:00Z',
    recordType: 'vaccine',
    lastDate: '2025-06-10',
    nextDate: '2026-06-10',
    history: [
      { date: '2025-06-10', description: '狂犬疫苗（年度加强）' },
      { date: '2024-06-08', description: '狂犬疫苗（年度加强）' },
      { date: '2023-06-05', description: '狂犬疫苗（首次接种）' },
      { date: '2022-09-15', description: '幼犬四联疫苗第三针' },
      { date: '2022-08-15', description: '幼犬四联疫苗第二针' },
      { date: '2022-07-15', description: '幼犬四联疫苗第一针' },
    ],
  },
  {
    id: 'health2',
    ownerId: 'u3',
    petId: '2',
    petName: '咪咪',
    content: '咪咪这个月的体内外驱虫都搞定啦！用的是上次医生推荐的那款，效果很不错。提醒大家夏天到了，驱虫频率要适当增加哦～',
    images: [],
    tags: ['猫咪', '驱虫', '宠物健康'],
    dewormingTag: '驱虫周期记录',
    likes: 64,
    comments: 8,
    createdAt: '2025-06-08T16:00:00Z',
    recordType: 'deworming',
    lastDate: '2025-06-08',
    nextDate: '2025-07-08',
    history: [
      { date: '2025-06-08', description: '体内外驱虫（月度）' },
      { date: '2025-05-05', description: '体内外驱虫（月度）' },
      { date: '2025-04-03', description: '体内外驱虫（月度）' },
      { date: '2025-03-01', description: '体内驱虫（季度）' },
      { date: '2025-01-05', description: '体内外驱虫（月度）' },
    ],
  },
];

const lostPetTasks: LostPetTaskWithClues[] = [
  {
    id: 'lost1',
    ownerId: 'u10',
    petName: '旺财',
    species: '狗',
    breed: '金毛',
    gender: 'male',
    age: '3岁',
    description: '金毛犬，名叫旺财，毛色金黄，脖子上有红色项圈，项圈上有狗牌。性格温顺，不咬人。于6月10日下午在小区附近走失，如有看到请联系主人，万分感谢！',
    lastSeenLocation: { lat: 39.9, lng: 116.4, address: '北京市朝阳区望京SOHO附近' },
    lastSeenTime: '2025-06-10T15:30:00Z',
    reward: 2000,
    status: 'searching',
    clueCount: 3,
    followed: false,
    clues: [
      {
        id: 'clue1',
        taskId: 'lost1',
        reporterId: 'u20',
        content: '昨天下午在望京地铁站附近好像看到过一只类似的金毛，在地铁站B口徘徊。',
        photos: [],
        contact: '138****1234',
        status: 'adopted',
        verified: true,
        createdAt: '2025-06-11T09:00:00Z',
      },
      {
        id: 'clue2',
        taskId: 'lost1',
        reporterId: 'u21',
        content: '今天早上在阜通东大街看到一只金毛，好像是流浪的，不敢确定是不是。',
        photos: [],
        contact: '139****5678',
        status: 'verifying',
        verified: false,
        createdAt: '2025-06-12T08:30:00Z',
      },
      {
        id: 'clue3',
        taskId: 'lost1',
        reporterId: 'u22',
        content: '我家小区有只流浪狗，不过好像是拉布拉多，不是金毛。',
        photos: [],
        contact: '137****9012',
        status: 'rejected',
        verified: true,
        createdAt: '2025-06-11T14:20:00Z',
      },
    ],
    adoptionIntents: [],
    createdAt: '2025-06-10T18:00:00Z',
  },
  {
    id: 'lost2',
    ownerId: 'u11',
    petName: '雪球',
    species: '猫',
    breed: '布偶猫',
    gender: 'female',
    age: '2岁',
    description: '布偶猫，名叫雪球，蓝眼睛，毛色灰白相间，左后腿有一小块白毛。性格胆小怕人，走丢时脖子上有粉色蝴蝶结项圈。',
    lastSeenLocation: { lat: 31.2, lng: 121.5, address: '上海市浦东新区陆家嘴花园小区' },
    lastSeenTime: '2025-06-12T20:00:00Z',
    reward: 3000,
    status: 'searching',
    clueCount: 1,
    followed: false,
    clues: [
      {
        id: 'clue4',
        taskId: 'lost2',
        reporterId: 'u23',
        content: '我们单元楼道里发现一只猫，看起来很像布偶，不知道是不是你家的。',
        photos: [],
        contact: '136****3456',
        status: 'pending',
        verified: false,
        createdAt: '2025-06-13T10:15:00Z',
      },
    ],
    adoptionIntents: [],
    createdAt: '2025-06-12T22:00:00Z',
  },
  {
    id: 'lost3',
    ownerId: 'u12',
    petName: '小黑',
    species: '狗',
    breed: '中华田园犬',
    gender: 'male',
    age: '1岁',
    description: '中华田园犬，名叫小黑，全身黑色，胸口有一撮白毛。耳朵直立，尾巴卷曲。非常聪明，会握手和坐下。',
    lastSeenLocation: { lat: 22.5, lng: 114.1, address: '深圳市南山区科技园附近' },
    lastSeenTime: '2025-06-05T12:00:00Z',
    reward: 500,
    status: 'found',
    clueCount: 5,
    followed: true,
    clues: [],
    adoptionIntents: [],
    createdAt: '2025-06-05T15:00:00Z',
  },
];

const adoptionPets: AdoptionPet[] = [
  {
    id: 'adopt1',
    name: '小白',
    breed: '萨摩耶',
    gender: 'female',
    age: '8个月',
    healthStatus: '健康，已完成全部疫苗接种',
    requirements: ['有稳定住所', '有养宠经验优先', '能接受定期回访', '家人同意养宠'],
    level: 'A',
    description: '小白是一只非常亲人的萨摩耶，性格温顺，喜欢和人互动。因为原主人过敏严重，不得不寻找新家。希望找到一个有爱心、有时间陪伴她的家庭。',
    applied: false,
  },
  {
    id: 'adopt2',
    name: '橘子',
    breed: '橘猫',
    gender: 'male',
    age: '2岁',
    healthStatus: '健康，已绝育，疫苗齐全',
    requirements: ['封窗封阳台', '不抛弃不放弃', '科学喂养'],
    level: 'B',
    description: '橘子是一只流浪猫，被救助后发现性格特别好，喜欢撒娇，会用猫砂盆。希望能找到一个温暖的家，给他一个安稳的后半生。',
    applied: false,
  },
  {
    id: 'adopt3',
    name: '豆豆',
    breed: '泰迪',
    gender: 'male',
    age: '5岁',
    healthStatus: '健康，老年犬，需要定期体检',
    requirements: ['有耐心', '有养犬经验', '能接受老年犬的照顾'],
    level: 'B',
    description: '豆豆是一只5岁的泰迪，原主人因工作调动无法继续饲养。他非常懂事，会定点上厕所，性格安静不拆家。适合喜欢安静的家庭。',
    applied: false,
  },
  {
    id: 'adopt4',
    name: '花花',
    breed: '三花猫',
    gender: 'female',
    age: '1岁',
    healthStatus: '健康，已绝育',
    requirements: ['有养猫经验', '能接受她的小脾气'],
    level: 'C',
    description: '花花是一只性格独立的三花猫，有点高冷，但是熟悉了之后也会撒娇。适合喜欢猫咪独立性格的铲屎官。',
    applied: false,
  },
];

const tabs = [
  { value: 'latest', label: '最新', Icon: Sparkles },
  { value: 'hot', label: '热门', Icon: Flame },
  { value: 'trending', label: '话题', Icon: TrendingUp },
  { value: 'lost-pet', label: '寻宠公益', Icon: SearchIcon },
  { value: 'adoption', label: '领养意向', Icon: HeartHandshake },
  { value: 'health', label: '健康记录', Icon: Syringe },
];

const hotTagCategories = [
  {
    title: '品种标签',
    icon: PawPrint,
    color: 'text-warm-500',
    bgColor: 'bg-warm-50',
    tags: ['金毛', '猫咪', '泰迪', '布偶猫', '哈士奇', '橘猫'],
  },
  {
    title: '健康标签',
    icon: Syringe,
    color: 'text-forest-500',
    bgColor: 'bg-forest-50',
    tags: ['疫苗', '驱虫', '体检', '宠物护理', '养狗知识', '养猫知识'],
  },
  {
    title: '话题标签',
    icon: TrendingUp,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50',
    tags: ['求助', '科普', '晒宠', '宠物用品', '狗粮推荐', '猫粮推荐'],
  },
  {
    title: '公益标签',
    icon: HeartHandshake,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    tags: ['寻宠', '领养', '流浪动物救助', '公益活动'],
  },
];

const clueStatusConfig = {
  pending: { label: '待核验', color: 'text-warm-600', bg: 'bg-warm-50', Icon: Clock },
  verifying: { label: '核验中', color: 'text-sky-600', bg: 'bg-sky-50', Icon: SearchIcon },
  adopted: { label: '已采纳', color: 'text-forest-600', bg: 'bg-forest-50', Icon: CheckCircle },
  rejected: { label: '未采纳', color: 'text-gray-600', bg: 'bg-gray-50', Icon: XCircle },
};

const levelConfig = {
  A: { label: 'A级优先匹配', color: 'text-forest-600', bg: 'bg-forest-50', border: 'border-forest-200' },
  B: { label: 'B级待评估', color: 'text-warm-600', bg: 'bg-warm-50', border: 'border-warm-200' },
  C: { label: 'C级一般意向', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
};

export default function Community() {
  const [tab, setTab] = useState('latest');
  const [search, setSearch] = useState('');
  const [selectedHealthPost, setSelectedHealthPost] = useState<HealthRecordPost | null>(null);
  const [showClueModal, setShowClueModal] = useState(false);
  const [selectedLostPet, setSelectedLostPet] = useState<LostPetTaskWithClues | null>(null);
  const [clueForm, setClueForm] = useState({ content: '', contact: '', photos: [] as string[] });
  const [showClueProgress, setShowClueProgress] = useState(false);
  const [lostPets, setLostPets] = useState(lostPetTasks);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [selectedAdoptionPet, setSelectedAdoptionPet] = useState<AdoptionPet | null>(null);
  const [adoptionApplication, setAdoptionApplication] = useState<AdoptionApplication>({
    petId: '',
    step: 1,
    name: '',
    phone: '',
    city: '',
    hasExperience: false,
    experienceYears: '',
    reason: '',
    promise: '',
  });
  const [adoptionSubmitted, setAdoptionSubmitted] = useState(false);
  const [adoptionPetsState, setAdoptionPetsState] = useState(adoptionPets);

  const handleFollow = (taskId: string) => {
    setLostPets((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, followed: !task.followed, adoptionIntents: task.followed ? [] : [{ id: 'new', taskId, applicantId: 'me', message: '', level: 'interested', createdAt: new Date().toISOString() }] }
          : task
      )
    );
  };

  const handleClueSubmit = () => {
    if (!selectedLostPet || !clueForm.content || !clueForm.contact) return;
    const newClue: LostPetClueWithStatus = {
      id: `clue-${Date.now()}`,
      taskId: selectedLostPet.id,
      reporterId: 'me',
      content: clueForm.content,
      photos: clueForm.photos,
      contact: clueForm.contact,
      status: 'pending',
      verified: false,
      createdAt: new Date().toISOString(),
    };
    setLostPets((prev) =>
      prev.map((task) =>
        task.id === selectedLostPet.id
          ? { ...task, clues: [...task.clues, newClue], clueCount: task.clueCount + 1 }
          : task
      )
    );
    setShowClueModal(false);
    setClueForm({ content: '', contact: '', photos: [] });
    setShowClueProgress(true);
  };

  const handleAdoptionClick = (pet: AdoptionPet) => {
    setSelectedAdoptionPet(pet);
    setAdoptionApplication({
      petId: pet.id,
      step: 1,
      name: '',
      phone: '',
      city: '',
      hasExperience: false,
      experienceYears: '',
      reason: '',
      promise: '',
    });
    setAdoptionSubmitted(false);
    setShowAdoptionModal(true);
  };

  const handleAdoptionSubmit = () => {
    if (!selectedAdoptionPet) return;
    setAdoptionPetsState((prev) =>
      prev.map((pet) =>
        pet.id === selectedAdoptionPet.id
          ? { ...pet, applied: true, applicationStatus: 'B级待评估' }
          : pet
      )
    );
    setAdoptionSubmitted(true);
  };

  const nextStep = () => {
    if (adoptionApplication.step < 3) {
      setAdoptionApplication((prev) => ({ ...prev, step: prev.step + 1 }));
    } else {
      handleAdoptionSubmit();
    }
  };

  const prevStep = () => {
    if (adoptionApplication.step > 1) {
      setAdoptionApplication((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'latest':
      case 'hot':
      case 'trending':
        return (
          <div className="space-y-4">
            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            {healthRecordPosts.map((post) => (
              <div key={post.id} className="card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-5 h-5 text-forest-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-gray-900">宠友用户</p>
                      <span
                        onClick={() => setSelectedHealthPost(post)}
                        className="tag tag-green flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {post.recordType === 'vaccine' ? (
                          <Syringe className="w-3 h-3" />
                        ) : (
                          <Bug className="w-3 h-3" />
                        )}
                        {post.recordType === 'vaccine' ? '疫苗接种记录' : '驱虫周期记录'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

                <div
                  onClick={() => setSelectedHealthPost(post)}
                  className="bg-forest-50 rounded-xl p-4 mb-4 cursor-pointer hover:bg-forest-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-forest-700 flex items-center gap-2">
                      {post.recordType === 'vaccine' ? (
                        <Syringe className="w-4 h-4" />
                      ) : (
                        <Bug className="w-4 h-4" />
                      )}
                      {post.petName}的{post.recordType === 'vaccine' ? '疫苗' : '驱虫'}记录
                    </h4>
                    <span className="text-sm text-forest-600 flex items-center gap-1">
                      查看完整历史
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">最近接种</p>
                      <p className="font-medium text-gray-900">{post.lastDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">下次到期</p>
                      <p className="font-medium text-warm-600">{post.nextDate}</p>
                    </div>
                  </div>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="text-sm text-forest-600 hover:text-forest-700 cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-forest-50">
                  <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-forest-600 transition-colors">
                    <FileText className="w-5 h-5" />
                    <span>{post.comments} 评论</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'lost-pet':
        const searchingCount = lostPets.filter((t) => t.status === 'searching').length;
        const pendingCluesCount = lostPets.reduce(
          (sum, t) => sum + t.clues.filter((c) => c.status === 'pending').length,
          0
        );
        const foundCount = lostPets.filter((t) => t.status === 'found').length;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warm-50 flex items-center justify-center">
                  <SearchIcon className="w-6 h-6 text-warm-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{searchingCount}</p>
                <p className="text-sm text-gray-500">寻宠中</p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sky-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-sky-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{pendingCluesCount}</p>
                <p className="text-sm text-gray-500">待核验线索</p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-forest-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-forest-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{foundCount}</p>
                <p className="text-sm text-gray-500">已找到</p>
              </div>
            </div>

            <div className="space-y-4">
              {lostPets.map((task) => (
                <div key={task.id} className="card overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-40 h-40 sm:h-auto rounded-xl bg-gradient-to-br from-warm-50 to-warm-100 flex items-center justify-center flex-shrink-0 relative">
                      <SearchIcon className="w-12 h-12 text-warm-300" />
                      <div className="absolute top-3 left-3">
                        <span
                          className={cn(
                            'tag flex items-center gap-1',
                            task.status === 'searching'
                              ? 'tag-orange'
                              : task.status === 'found'
                              ? 'tag-green'
                              : 'tag-gray'
                          )}
                        >
                          {task.status === 'searching' && <SearchIcon className="w-3 h-3" />}
                          {task.status === 'found' && <CheckCircle className="w-3 h-3" />}
                          {task.status === 'searching' ? '寻找中' : task.status === 'found' ? '已找到' : '已关闭'}
                        </span>
                      </div>
                      {task.reward > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-400 text-white text-sm font-bold shadow-soft">
                          <Gift className="w-3.5 h-3.5" />
                          ¥{task.reward}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-display font-bold text-lg text-gray-900">{task.petName}</h3>
                        <span className="tag tag-gray">{task.breed}</span>
                        <span className="tag tag-gray">{task.gender === 'male' ? '公' : '母'}</span>
                        <span className="tag tag-gray">{task.age}</span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-forest-500" />
                          <span className="truncate">{task.lastSeenLocation.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-forest-500" />
                          <span>
                            丢失时间:{' '}
                            {new Date(task.lastSeenTime).toLocaleDateString('zh-CN', {
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLostPet(task);
                            setShowClueModal(true);
                            setShowClueProgress(false);
                          }}
                          className="btn-primary flex-1 py-2 text-sm"
                        >
                          <Send className="w-4 h-4" />
                          提供线索
                        </button>
                        <button
                          onClick={() => handleFollow(task.id)}
                          className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5',
                            task.followed
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          <Eye className={cn('w-4 h-4', task.followed && 'fill-rose-500')} />
                          {task.followed ? '已关注' : '关注跟进'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLostPet(task);
                            setShowClueProgress(true);
                          }}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors"
                        >
                          {task.clueCount} 条线索
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'adoption':
        return (
          <div className="space-y-4">
            {adoptionPetsState.map((pet) => (
              <div key={pet.id} className="card overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-40 h-40 sm:h-auto rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center flex-shrink-0 relative">
                    <PawPrint className="w-12 h-12 text-cream-300" />
                    <div className="absolute top-3 left-3">
                      <span
                        className={cn(
                          'tag flex items-center gap-1 border',
                          levelConfig[pet.level].bg,
                          levelConfig[pet.level].color,
                          levelConfig[pet.level].border
                        )}
                      >
                        <Award className="w-3 h-3" />
                        {levelConfig[pet.level].label}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg text-gray-900">{pet.name}</h3>
                      <span className="tag tag-gray">{pet.breed}</span>
                      <span className="tag tag-gray">{pet.gender === 'male' ? '公' : '母'}</span>
                      <span className="tag tag-gray">{pet.age}</span>
                    </div>

                    <p className="text-sm text-forest-600 mb-2 flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {pet.healthStatus}
                    </p>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{pet.description}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pet.requirements.slice(0, 3).map((req, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {req}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAdoptionClick(pet)}
                      disabled={pet.applied}
                      className={cn(
                        'w-full py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                        pet.applied
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'btn-primary'
                      )}
                    >
                      <HeartHandshake className="w-4 h-4" />
                      {pet.applied ? `申请已提交（${pet.applicationStatus}）` : '我要领养'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">宠物社区</h1>
          <p className="section-subtitle">和铲屎官们一起交流分享</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-5 h-5" />
          发布动态
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索话题、内容..."
                  className="input-field pl-12"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((t) => {
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTab(t.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium transition-all flex-shrink-0',
                        tab === t.value
                          ? 'bg-forest-500 text-white shadow-soft'
                          : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {renderTabContent()}
        </div>

        <aside className="space-y-6">
          <div className="card">
            <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-warm-500" />
              热门标签
            </h3>
            <div className="space-y-4">
              {hotTagCategories.map((category, cIdx) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={cIdx}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', category.bgColor)}>
                        <CategoryIcon className={cn('w-3.5 h-3.5', category.color)} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{category.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {category.tags.map((tag, tIdx) => (
                        <button
                          key={tIdx}
                          className="px-2.5 py-1 rounded-full bg-cream-50 text-gray-600 text-xs hover:bg-cream-100 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="font-display font-bold text-gray-900 mb-4">社区公约</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  1
                </span>
                尊重他人，友善交流
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  2
                </span>
                分享真实养宠经验
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  3
                </span>
                拒绝广告和不实信息
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  4
                </span>
                保护宠物，反对虐待
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {selectedHealthPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                {selectedHealthPost.recordType === 'vaccine' ? (
                  <Syringe className="w-5 h-5 text-forest-500" />
                ) : (
                  <Bug className="w-5 h-5 text-forest-500" />
                )}
                {selectedHealthPost.petName}的{selectedHealthPost.recordType === 'vaccine' ? '疫苗' : '驱虫'}历史
              </h3>
              <button
                onClick={() => setSelectedHealthPost(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-forest-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">最近{selectedHealthPost.recordType === 'vaccine' ? '接种' : '驱虫'}</p>
                    <p className="font-medium text-gray-900">{selectedHealthPost.lastDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">下次到期</p>
                    <p className="font-medium text-warm-600">{selectedHealthPost.nextDate}</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-forest-100"></div>
                <div className="space-y-4">
                  {selectedHealthPost.history.map((item, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div
                        className={cn(
                          'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center',
                          idx === 0 ? 'bg-forest-500' : 'bg-forest-200'
                        )}
                      >
                        {idx === 0 ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClueModal && selectedLostPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900">提供线索</h3>
              <button
                onClick={() => setShowClueModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-warm-50 rounded-xl p-4">
                <p className="text-sm text-warm-700">
                  正在为 <span className="font-medium">{selectedLostPet.petName}</span> 提供线索
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">线索描述 *</label>
                <textarea
                  value={clueForm.content}
                  onChange={(e) => setClueForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="请描述您看到的情况，包括时间、地点、宠物状态等..."
                  className="input-field min-h-[120px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传照片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-forest-300 transition-colors cursor-pointer">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">点击或拖拽上传照片</p>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系方式 *</label>
                <input
                  type="tel"
                  value={clueForm.contact}
                  onChange={(e) => setClueForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="请输入您的手机号"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClueModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClueSubmit}
                  disabled={!clueForm.content || !clueForm.contact}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    clueForm.content && clueForm.contact
                      ? 'btn-primary'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                  提交线索
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClueProgress && selectedLostPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900">线索核验进度</h3>
              <button
                onClick={() => setShowClueProgress(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-forest-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-forest-700">
                  <span className="font-medium">{selectedLostPet.petName}</span> 的线索列表
                </p>
                <p className="text-xs text-forest-500 mt-1">
                  共 {selectedLostPet.clues.length} 条线索
                </p>
              </div>

              {selectedLostPet.clues.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无线索</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedLostPet.clues.map((clue) => {
                    const config = clueStatusConfig[clue.status];
                    const StatusIcon = config.Icon;
                    return (
                      <div key={clue.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('tag flex items-center gap-1', config.bg, config.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(clue.createdAt).toLocaleDateString('zh-CN', {
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{clue.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdoptionModal && selectedAdoptionPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900">
                {adoptionSubmitted ? '申请提交成功' : `领养 ${selectedAdoptionPet.name}`}
              </h3>
              <button
                onClick={() => setShowAdoptionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {adoptionSubmitted ? (
              <div className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-forest-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-forest-500" />
                </div>
                <h4 className="font-display font-bold text-xl text-gray-900 mb-2">领养申请已提交</h4>
                <p className="text-gray-500 mb-6">我们会尽快对您的申请进行评估，请耐心等待</p>

                <div className="bg-warm-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-warm-500" />
                    <span className="font-medium text-warm-700">当前分级：B级待评估</span>
                  </div>
                  <p className="text-xs text-warm-600">
                    分级依据：领养人资质、养宠经验、居住环境、经济条件
                  </p>
                </div>

                <button
                  onClick={() => setShowAdoptionModal(false)}
                  className="btn-primary w-full py-3"
                >
                  我知道了
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      第 {adoptionApplication.step} 步，共 3 步
                    </span>
                    <span className="text-sm text-forest-600">
                      {Math.round((adoptionApplication.step / 3) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest-500 rounded-full transition-all duration-300"
                      style={{ width: `${(adoptionApplication.step / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {adoptionApplication.step === 1 && (
                    <>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-forest-500" />
                        基本信息
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
                        <input
                          type="text"
                          value={adoptionApplication.name}
                          onChange={(e) =>
                            setAdoptionApplication((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="请输入您的真实姓名"
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">手机号 *</label>
                        <input
                          type="tel"
                          value={adoptionApplication.phone}
                          onChange={(e) =>
                            setAdoptionApplication((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="请输入您的手机号"
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">居住城市 *</label>
                        <input
                          type="text"
                          value={adoptionApplication.city}
                          onChange={(e) =>
                            setAdoptionApplication((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder="请输入您所在的城市"
                          className="input-field"
                        />
                      </div>
                    </>
                  )}

                  {adoptionApplication.step === 2 && (
                    <>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-warm-500" />
                        养宠经验
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">是否养过宠物 *</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              setAdoptionApplication((prev) => ({ ...prev, hasExperience: true }))
                            }
                            className={cn(
                              'flex-1 py-3 rounded-xl font-medium transition-all border-2',
                              adoptionApplication.hasExperience
                                ? 'border-forest-500 bg-forest-50 text-forest-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            有经验
                          </button>
                          <button
                            onClick={() =>
                              setAdoptionApplication((prev) => ({ ...prev, hasExperience: false }))
                            }
                            className={cn(
                              'flex-1 py-3 rounded-xl font-medium transition-all border-2',
                              !adoptionApplication.hasExperience
                                ? 'border-forest-500 bg-forest-50 text-forest-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            新手
                          </button>
                        </div>
                      </div>

                      {adoptionApplication.hasExperience && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">养宠年限</label>
                          <input
                            type="text"
                            value={adoptionApplication.experienceYears}
                            onChange={(e) =>
                              setAdoptionApplication((prev) => ({ ...prev, experienceYears: e.target.value }))
                            }
                            placeholder="例如：3年"
                            className="input-field"
                          />
                        </div>
                      )}

                      <div className="bg-cream-50 rounded-xl p-4">
                        <p className="text-sm text-cream-700">
                          💡 温馨提示：有养宠经验的申请人会获得更高的评级哦
                        </p>
                      </div>
                    </>
                  )}

                  {adoptionApplication.step === 3 && (
                    <>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <HeartHandshake className="w-5 h-5 text-rose-500" />
                        领养原因与承诺
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">领养原因 *</label>
                        <textarea
                          value={adoptionApplication.reason}
                          onChange={(e) =>
                            setAdoptionApplication((prev) => ({ ...prev, reason: e.target.value }))
                          }
                          placeholder="请说说您为什么想领养这只宠物..."
                          className="input-field min-h-[100px] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">领养承诺 *</label>
                        <textarea
                          value={adoptionApplication.promise}
                          onChange={(e) =>
                            setAdoptionApplication((prev) => ({ ...prev, promise: e.target.value }))
                          }
                          placeholder="请描述您将如何照顾这只宠物..."
                          className="input-field min-h-[100px] resize-none"
                        />
                      </div>

                      <div className="bg-forest-50 rounded-xl p-4">
                        <p className="text-sm text-forest-700">
                          📋 提交后我们将根据您的信息进行分级评估
                        </p>
                        <div className="flex gap-2 mt-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-forest-100 text-forest-700">
                            A级 优先匹配
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-warm-100 text-warm-700">
                            B级 待评估
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            C级 一般意向
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    {adoptionApplication.step > 1 ? (
                      <button
                        onClick={prevStep}
                        className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        上一步
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowAdoptionModal(false)}
                        className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                    )}
                    <button
                      onClick={nextStep}
                      disabled={
                        (adoptionApplication.step === 1 && (!adoptionApplication.name || !adoptionApplication.phone || !adoptionApplication.city)) ||
                        (adoptionApplication.step === 3 && (!adoptionApplication.reason || !adoptionApplication.promise))
                      }
                      className={cn(
                        'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                        (adoptionApplication.step === 1 && adoptionApplication.name && adoptionApplication.phone && adoptionApplication.city) ||
                        (adoptionApplication.step === 2) ||
                        (adoptionApplication.step === 3 && adoptionApplication.reason && adoptionApplication.promise)
                          ? 'btn-primary'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {adoptionApplication.step === 3 ? '提交申请' : '下一步'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
