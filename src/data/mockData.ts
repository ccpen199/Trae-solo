import type {
  User,
  SleepSession,
  MorningAssessment,
  AudioTrack,
  SleepImprovementPlan,
  RiskAssessment,
  ReferralRecord,
  HospitalInfo,
  SleepStage,
  BreathingMetrics,
  MovementMetrics,
  SnoringMetrics,
  ApneaEvent,
  CBTModule,
  DailyTask,
} from '@/types';
import dayjs from 'dayjs';

const generateId = () => Math.random().toString(36).slice(2, 10);

export const mockUser: User = {
  id: 'user-001',
  nickname: '星夜旅者',
  avatar: undefined,
  phone: '138****8888',
  email: 'sleeper@example.com',
  createdAt: '2025-09-15T10:30:00Z',
  settings: {
    micAuthorized: true,
    motionAuthorized: true,
    dataLocalOnly: false,
    medicalShareAllowed: true,
    notificationEnabled: true,
    targetSleepDuration: 480,
    targetBedTime: '23:30',
    targetWakeTime: '07:30',
  },
};

function generateSleepStages(totalMinutes: number, quality: 'good' | 'normal' | 'poor'): SleepStage[] {
  const stages: SleepStage[] = [];
  let offset = 600;
  const pattern =
    quality === 'good'
      ? [
          ['light', 15],
          ['deep', 45],
          ['light', 20],
          ['rem', 15],
          ['light', 25],
          ['deep', 40],
          ['light', 20],
          ['rem', 20],
          ['light', 30],
          ['deep', 30],
          ['light', 25],
          ['rem', 25],
          ['light', 20],
          ['rem', 20],
          ['light', 15],
        ]
      : quality === 'poor'
        ? [
            ['awake', 20],
            ['light', 30],
            ['deep', 20],
            ['awake', 10],
            ['light', 25],
            ['rem', 10],
            ['light', 20],
            ['deep', 20],
            ['awake', 15],
            ['light', 30],
            ['rem', 15],
            ['light', 25],
            ['deep', 15],
            ['light', 20],
            ['awake', 10],
          ]
        : [
            ['light', 20],
            ['deep', 35],
            ['light', 25],
            ['rem', 15],
            ['light', 30],
            ['deep', 30],
            ['light', 20],
            ['rem', 20],
            ['light', 25],
            ['deep', 25],
            ['light', 20],
            ['rem', 20],
            ['light', 15],
            ['rem', 15],
            ['light', 10],
          ];

  for (const [stage, dur] of pattern) {
    const durationNum = typeof dur === 'number' ? dur : parseInt(String(dur), 10);
    stages.push({
      stage: stage as SleepStage['stage'],
      startTime: offset,
      duration: durationNum * 60,
      confidence: 0.7 + Math.random() * 0.25,
    });
    offset += durationNum * 60;
    if (offset > totalMinutes * 60) break;
  }
  return stages;
}

function generateBreathingMetrics(durationMin: number, quality: 'good' | 'normal' | 'poor'): BreathingMetrics {
  const points = 72;
  const rateSeries = [];
  let base = quality === 'good' ? 15 : quality === 'poor' ? 20 : 17;
  for (let i = 0; i < points; i++) {
    rateSeries.push({
      time: Math.floor((i / points) * durationMin * 60),
      value: base + Math.sin(i * 0.3) * 2 + (Math.random() - 0.5) * 3,
    });
  }
  const values = rateSeries.map((r) => r.value);
  return {
    avgRate: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    minRate: Math.round(Math.min(...values)),
    maxRate: Math.round(Math.max(...values)),
    rateSeries,
    regularity: quality === 'good' ? 88 : quality === 'poor' ? 62 : 75,
  };
}

function generateMovementMetrics(durationMin: number, quality: 'good' | 'normal' | 'poor'): MovementMetrics {
  const points = 144;
  const movementIntensity = [];
  let totalTurns = quality === 'good' ? 8 : quality === 'poor' ? 22 : 14;
  for (let i = 0; i < points; i++) {
    movementIntensity.push({
      time: Math.floor((i / points) * durationMin * 60),
      value: Math.random() * (quality === 'good' ? 0.3 : quality === 'poor' ? 0.8 : 0.5),
    });
  }
  const restlessPeriods = [
    { start: 3600, end: 4200, intensity: 0.6 },
    { start: 10800, end: 11400, intensity: 0.5 },
  ];
  return { totalTurns, movementIntensity, restlessPeriods };
}

function generateSnoringMetrics(durationMin: number, hasApnea: boolean): SnoringMetrics {
  const freqBins = 16;
  const timeBins = 24;
  const heatmap: number[][] = [];
  for (let f = 0; f < freqBins; f++) {
    const row: number[] = [];
    for (let t = 0; t < timeBins; t++) {
      const base = hasApnea ? 0.4 : 0.15;
      row.push(Math.max(0, base + Math.sin(t * 0.4 + f * 0.3) * 0.15 + (Math.random() - 0.5) * 0.2));
    }
    heatmap.push(row);
  }
  return {
    totalEpisodes: hasApnea ? 18 : 5,
    totalDuration: hasApnea ? 14 * 60 : 3 * 60,
    avgLoudness: hasApnea ? 62 : 45,
    spectrumHeatmap: heatmap,
    frequencyBands: [
      { band: '60-100Hz', energy: hasApnea ? 0.7 : 0.3 },
      { band: '100-200Hz', energy: hasApnea ? 0.9 : 0.4 },
      { band: '200-300Hz', energy: hasApnea ? 0.6 : 0.25 },
      { band: '300-500Hz', energy: hasApnea ? 0.35 : 0.12 },
    ],
  };
}

function generateApneaEvents(count: number): ApneaEvent[] {
  const events: ApneaEvent[] = [];
  for (let i = 0; i < count; i++) {
    events.push({
      id: generateId(),
      startTime: 1800 + i * 1800 + Math.random() * 600,
      duration: 12 + Math.floor(Math.random() * 20),
      type: ['obstructive', 'central', 'mixed', 'suspected'][i % 4] as ApneaEvent['type'],
      severity: i < 2 ? 'mild' : 'moderate',
      oxygenDrop: 2 + Math.floor(Math.random() * 8),
      confidence: 0.55 + Math.random() * 0.35,
    });
  }
  return events;
}

export function generateSleepSessions(days = 14): SleepSession[] {
  const sessions: SleepSession[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const isApneaDay = i === 3 || i === 9;
    const quality: 'good' | 'normal' | 'poor' = i % 5 === 0 ? 'good' : i % 3 === 0 ? 'poor' : 'normal';
    const duration = quality === 'good' ? 470 : quality === 'poor' ? 320 : 410;
    const startTime = date.hour(23).minute(Math.floor(Math.random() * 30)).toISOString();
    const endTime = date.add(1, 'day').hour(7).minute(10 + Math.floor(Math.random() * 40)).toISOString();

    sessions.push({
      id: `session-${date.format('YYYYMMDD')}`,
      userId: 'user-001',
      startTime,
      endTime,
      totalDuration: duration * 60,
      sleepEfficiency: quality === 'good' ? 92 : quality === 'poor' ? 68 : 82,
      sleepLatency: quality === 'good' ? 8 * 60 : quality === 'poor' ? 35 * 60 : 18 * 60,
      sleepStages: generateSleepStages(duration, quality),
      breathingMetrics: generateBreathingMetrics(duration, quality),
      movementMetrics: generateMovementMetrics(duration, quality),
      snoringMetrics: generateSnoringMetrics(duration, isApneaDay),
      apneaEvents: isApneaDay ? generateApneaEvents(7) : generateApneaEvents(1),
      ahiIndex: isApneaDay ? 7.2 + Math.random() * 2 : 1.2 + Math.random() * 1.5,
      environmentNoise: 28 + Math.random() * 12,
      qualityScore: quality === 'good' ? 88 : quality === 'poor' ? 56 : 76,
    });
  }
  return sessions;
}

export const mockSleepSessions = generateSleepSessions(14);

export function generateMorningAssessments(sessions: SleepSession[]): MorningAssessment[] {
  return sessions.map((s, i) => ({
    id: `ma-${s.id}`,
    sessionId: s.id,
    userId: 'user-001',
    assessedAt: dayjs(s.endTime).add(30, 'minute').toISOString(),
    alertness: Math.max(1, Math.min(7, 4 + Math.sin(i * 0.8) * 2 + (Math.random() - 0.5))),
    sleepQuality: Math.max(1, Math.min(10, s.qualityScore / 10 + (Math.random() - 0.5))),
    mood: Math.max(0, Math.min(100, 65 + Math.sin(i * 0.6) * 20 + (Math.random() - 0.5) * 10)),
    thoughtInterference: Math.max(1, Math.min(5, 2.5 + Math.sin(i * 0.7) * 1.5 + (Math.random() - 0.5))),
    notes: i === 3 ? '昨晚感觉有点憋气，醒来几次口干' : undefined,
  }));
}

export const mockMorningAssessments = generateMorningAssessments(mockSleepSessions);

export const mockAudioTracks: AudioTrack[] = [
  {
    id: 'audio-001',
    title: '深海呼吸',
    description: '模拟深海潮声配合缓慢呼吸引导，4-7-8呼吸法节奏，适合快速缓解焦虑。',
    coverImage: 'linear-gradient(135deg,#0B1437,#1E2A5C,#7BC8A4)',
    duration: 600,
    category: 'anxiety',
    tags: ['呼吸引导', '自然音', '478呼吸'],
    author: '眠之声工作室',
    copyrightInfo: {
      contentId: 'CONT-ANX-001',
      watermarkId: 'WM-7A3F9E',
      licenseType: '独家授权',
      copyrightHolder: '眠之声文化传播',
      royaltyInfo: '按播放次数结算',
    },
    playCount: 12856,
    favorited: true,
    audioUrl: '/audio/deep-sea-breathing.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-002',
    title: '松树林间',
    description: '风吹松叶与远处鸟鸣，自然环境音，适合焦虑情绪平复。',
    coverImage: 'linear-gradient(135deg,#1E3A5F,#2D6A4F,#95D5B2)',
    duration: 480,
    category: 'anxiety',
    tags: ['自然音', '森林', '白噪音'],
    author: '自然声景',
    copyrightInfo: { contentId: 'CONT-ANX-002', watermarkId: 'WM-2B8D4C', licenseType: '商用授权', copyrightHolder: '自然声景实验室', royaltyInfo: '包月授权' },
    playCount: 8923,
    favorited: false,
    audioUrl: '/audio/pine-forest.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-003',
    title: '五感着陆练习',
    description: 'CBT接地技术引导，通过命名5-4-3-2-1感官体验快速拉回当下。',
    coverImage: 'linear-gradient(135deg,#4A1942,#7B2D75,#E07BE0)',
    duration: 540,
    category: 'anxiety',
    tags: ['CBT', '接地技术', '人声引导'],
    author: '陈医生心理工作室',
    copyrightInfo: { contentId: 'CONT-ANX-003', watermarkId: 'WM-9C1E7A', licenseType: '专家授权', copyrightHolder: '陈明心理咨询师', royaltyInfo: '分成合作' },
    playCount: 15672,
    favorited: false,
    audioUrl: '/audio/54321-grounding.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-004',
    title: '渐进式肌肉放松',
    description: '从头到脚逐组肌肉绷紧放松，配合缓慢呼吸，缓解身体紧张。',
    coverImage: 'linear-gradient(135deg,#2E4053,#5DADE2,#85C1E9)',
    duration: 720,
    category: 'anxiety',
    tags: ['身体扫描', '放松', '人声引导'],
    author: '悦心堂',
    copyrightInfo: { contentId: 'CONT-ANX-004', watermarkId: 'WM-4F6D2B', licenseType: '独家授权', copyrightHolder: '悦心堂心理中心', royaltyInfo: '按播放次数' },
    playCount: 21345,
    favorited: true,
    audioUrl: '/audio/progressive-relaxation.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-005',
    title: '山谷回响',
    description: '山间溪流与柔和的合成器旋律，轻柔过渡至内心平静。',
    coverImage: 'linear-gradient(135deg,#1B4F72,#2E86C1,#AED6F1)',
    duration: 900,
    category: 'anxiety',
    tags: ['环境音乐', '自然', '长时'],
    author: 'Dreamscape',
    copyrightInfo: { contentId: 'CONT-ANX-005', watermarkId: 'WM-7E9A3C', licenseType: '商用授权', copyrightHolder: 'Dreamscape Music', royaltyInfo: '月度授权' },
    playCount: 7821,
    favorited: false,
    audioUrl: '/audio/valley-echo.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-006',
    title: '心跳同步',
    description: '仿生慢速心跳音，引导心率逐渐下降到休息状态。',
    coverImage: 'linear-gradient(135deg,#78281F,#C0392B,#F1948A)',
    duration: 420,
    category: 'anxiety',
    tags: ['生物反馈', '降心率', '低频'],
    author: '生理声学实验室',
    copyrightInfo: { contentId: 'CONT-ANX-006', watermarkId: 'WM-1A5F8D', licenseType: '独家授权', copyrightHolder: '生理声学实验室', royaltyInfo: '分成合作' },
    playCount: 9456,
    favorited: false,
    audioUrl: '/audio/heartbeat-sync.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-007',
    title: '琥珀色黄昏',
    description: '温暖的低吟男声诵念，配合柔和钢琴，情绪舒缓流淌。',
    coverImage: 'linear-gradient(135deg,#7E5109,#D68910,#F9E79F)',
    duration: 600,
    category: 'anxiety',
    tags: ['人声', '钢琴', '情绪'],
    author: '林川',
    copyrightInfo: { contentId: 'CONT-ANX-007', watermarkId: 'WM-6B3E9F', licenseType: '独立音乐人授权', copyrightHolder: '林川', royaltyInfo: '五五分成' },
    playCount: 11234,
    favorited: false,
    audioUrl: '/audio/amber-dusk.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-008',
    title: '纸船放流',
    description: '意象引导：将烦恼写在纸船上放入河中漂走，释放焦虑。',
    coverImage: 'linear-gradient(135deg,#1A5276,#2980B9,#85C1E9)',
    duration: 660,
    category: 'anxiety',
    tags: ['意象引导', '释放', '人声'],
    author: '陈医生心理工作室',
    copyrightInfo: { contentId: 'CONT-ANX-008', watermarkId: 'WM-3D8B5E', licenseType: '专家授权', copyrightHolder: '陈明心理咨询师', royaltyInfo: '分成合作' },
    playCount: 13567,
    favorited: false,
    audioUrl: '/audio/paper-boat.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-009',
    title: '深夜咖啡厅',
    description: '低沉的环境人声、咖啡机声、轻柔爵士乐，解压背景音。',
    coverImage: 'linear-gradient(135deg,#6E2C00,#A04000,#E59866)',
    duration: 1200,
    category: 'stress',
    tags: ['环境音', '爵士', '白噪音'],
    author: '城市白噪音',
    copyrightInfo: { contentId: 'CONT-STR-001', watermarkId: 'WM-2A7C4D', licenseType: '商用授权', copyrightHolder: '城市声景项目', royaltyInfo: '包月授权' },
    playCount: 18765,
    favorited: true,
    audioUrl: '/audio/night-cafe.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-010',
    title: '山间溪谷',
    description: '潺潺溪水与山雀鸣叫，高保真自然录音，深度放松。',
    coverImage: 'linear-gradient(135deg,#145A32,#27AE60,#82E0AA)',
    duration: 900,
    category: 'stress',
    tags: ['自然音', '溪流', '高质量'],
    author: '自然声景',
    copyrightInfo: { contentId: 'CONT-STR-002', watermarkId: 'WM-9E4F6B', licenseType: '独家授权', copyrightHolder: '自然声景实验室', royaltyInfo: '分成合作' },
    playCount: 14321,
    favorited: false,
    audioUrl: '/audio/mountain-stream.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-011',
    title: '工作专注Lo-fi',
    description: '慢速低保真节拍，适合工作减压时的背景音乐。',
    coverImage: 'linear-gradient(135deg,#4A235A,#884EA0,#D2B4DE)',
    duration: 1800,
    category: 'stress',
    tags: ['Lo-fi', '专注', '节拍'],
    author: 'Chill Beats',
    copyrightInfo: { contentId: 'CONT-STR-003', watermarkId: 'WM-5C8A2D', licenseType: '独立音乐人授权', copyrightHolder: 'Chill Beats Collective', royaltyInfo: '五五分成' },
    playCount: 28934,
    favorited: false,
    audioUrl: '/audio/lofi-focus.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-012',
    title: '雨打芭蕉',
    description: '南国情调的雨声，柔和有节奏，解压助眠两相宜。',
    coverImage: 'linear-gradient(135deg,#0E6655,#1ABC9C,#A3E4D7)',
    duration: 1500,
    category: 'stress',
    tags: ['雨声', '自然音', '长时'],
    author: '雨的印记',
    copyrightInfo: { contentId: 'CONT-STR-004', watermarkId: 'WM-7F3D9E', licenseType: '独家授权', copyrightHolder: '雨声博物馆', royaltyInfo: '按播放次数' },
    playCount: 32456,
    favorited: true,
    audioUrl: '/audio/rain-on-leaves.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-013',
    title: '压力释放身体扫描',
    description: '10分钟身体扫描练习，从头顶到脚底逐一释放紧绷感。',
    coverImage: 'linear-gradient(135deg,#1F618D,#3498DB,#AED6F1)',
    duration: 600,
    category: 'stress',
    tags: ['身体扫描', '减压', '人声引导'],
    author: '悦心堂',
    copyrightInfo: { contentId: 'CONT-STR-005', watermarkId: 'WM-4B6E8C', licenseType: '专家授权', copyrightHolder: '悦心堂心理中心', royaltyInfo: '分成合作' },
    playCount: 16789,
    favorited: false,
    audioUrl: '/audio/body-scan-stress.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-014',
    title: '海浪轻抚',
    description: '缓慢海浪节奏，有节律的潮起潮落，呼吸同频。',
    coverImage: 'linear-gradient(135deg,#154360,#2874A6,#AED6F1)',
    duration: 1200,
    category: 'stress',
    tags: ['海浪', '自然音', '节奏'],
    author: '自然声景',
    copyrightInfo: { contentId: 'CONT-STR-006', watermarkId: 'WM-1C9A5D', licenseType: '独家授权', copyrightHolder: '自然声景实验室', royaltyInfo: '分成合作' },
    playCount: 23456,
    favorited: false,
    audioUrl: '/audio/ocean-waves.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-015',
    title: '白日梦飞行',
    description: '悬浮感的合成器Pad音色，让思绪自由飘浮。',
    coverImage: 'linear-gradient(135deg,#6C3483,#A569BD,#D7BDE2)',
    duration: 840,
    category: 'stress',
    tags: ['氛围音乐', '冥想', '电子'],
    author: 'Dreamscape',
    copyrightInfo: { contentId: 'CONT-STR-007', watermarkId: 'WM-8E2F7A', licenseType: '商用授权', copyrightHolder: 'Dreamscape Music', royaltyInfo: '月度授权' },
    playCount: 9876,
    favorited: false,
    audioUrl: '/audio/daydream-fly.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-016',
    title: '墨香书房',
    description: '翻书声、研磨声、远处钟鸣，古典中国风解压环境音。',
    coverImage: 'linear-gradient(135deg,#784212,#B9770E,#F5CBA7)',
    duration: 1080,
    category: 'stress',
    tags: ['国风', '书房', '白噪音'],
    author: '东方声影',
    copyrightInfo: { contentId: 'CONT-STR-008', watermarkId: 'WM-3A6D5F', licenseType: '独家授权', copyrightHolder: '东方声影工作室', royaltyInfo: '五五分成' },
    playCount: 11234,
    favorited: false,
    audioUrl: '/audio/ink-study.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-017',
    title: '深度睡眠波',
    description: 'Delta波双耳节拍，2Hz频率，诱导深睡状态。需佩戴耳机。',
    coverImage: 'linear-gradient(135deg,#0A0E2A,#1B2A5E,#3B4F8A)',
    duration: 1800,
    category: 'insomnia',
    tags: ['双耳节拍', 'Delta波', '深睡'],
    author: '脑波实验室',
    copyrightInfo: { contentId: 'CONT-INS-001', watermarkId: 'WM-6D9B3E', licenseType: '独家授权', copyrightHolder: '神经声学研究中心', royaltyInfo: '分成合作' },
    playCount: 45678,
    favorited: true,
    audioUrl: '/audio/deep-sleep-wave.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-018',
    title: '睡前故事·银河铁道',
    description: '轻柔男声讲述宫泽贤治风格的梦幻旅程，助你入眠。',
    coverImage: 'linear-gradient(135deg,#1A5276,#2E86C1,#85C1E9)',
    duration: 1500,
    category: 'insomnia',
    tags: ['睡前故事', '人声', '幻想'],
    author: '夜航船工作室',
    copyrightInfo: { contentId: 'CONT-INS-002', watermarkId: 'WM-2E8C4F', licenseType: '独家授权', copyrightHolder: '夜航船声音工作室', royaltyInfo: '五五分成' },
    playCount: 38923,
    favorited: false,
    audioUrl: '/audio/galaxy-railway.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-019',
    title: '478呼吸引导',
    description: '韦尔医生4-7-8呼吸法，吸气4秒屏息7秒呼气8秒。',
    coverImage: 'linear-gradient(135deg,#0E6655,#1ABC9C,#A9DFBF)',
    duration: 480,
    category: 'insomnia',
    tags: ['呼吸法', '478', '人声引导'],
    author: '陈医生心理工作室',
    copyrightInfo: { contentId: 'CONT-INS-003', watermarkId: 'WM-9A5D7B', licenseType: '专家授权', copyrightHolder: '陈明心理咨询师', royaltyInfo: '分成合作' },
    playCount: 27654,
    favorited: false,
    audioUrl: '/audio/478-breathing.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-020',
    title: '白噪音·纯净版',
    description: '全频段均匀白噪音，掩蔽环境杂音，经典助眠。',
    coverImage: 'linear-gradient(135deg,#424949,#707B7C,#D0D3D4)',
    duration: 1800,
    category: 'insomnia',
    tags: ['白噪音', '经典', '掩蔽'],
    author: '声频工程组',
    copyrightInfo: { contentId: 'CONT-INS-004', watermarkId: 'WM-5C7E9A', licenseType: '公有领域', copyrightHolder: '声频工程公共资源', royaltyInfo: '免费' },
    playCount: 52345,
    favorited: false,
    audioUrl: '/audio/white-noise-pure.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-021',
    title: '粉噪音·暖调',
    description: '低频更丰富的粉红噪音，更接近自然环境声，听感舒适。',
    coverImage: 'linear-gradient(135deg,#78281F,#C0392B,#F5B7B1)',
    duration: 1800,
    category: 'insomnia',
    tags: ['粉噪音', '暖调', '助眠'],
    author: '声频工程组',
    copyrightInfo: { contentId: 'CONT-INS-005', watermarkId: 'WM-3B9D6C', licenseType: '公有领域', copyrightHolder: '声频工程公共资源', royaltyInfo: '免费' },
    playCount: 34567,
    favorited: false,
    audioUrl: '/audio/pink-noise-warm.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-022',
    title: '棕噪音·深沉',
    description: '棕噪音（布朗噪音）更沉更低频，适合耳鸣人群。',
    coverImage: 'linear-gradient(135deg,#5D4037,#8D6E63,#D7CCC8)',
    duration: 1800,
    category: 'insomnia',
    tags: ['棕噪音', '低频', '耳鸣友好'],
    author: '声频工程组',
    copyrightInfo: { contentId: 'CONT-INS-006', watermarkId: 'WM-7F2A5E', licenseType: '公有领域', copyrightHolder: '声频工程公共资源', royaltyInfo: '免费' },
    playCount: 21345,
    favorited: false,
    audioUrl: '/audio/brown-noise-deep.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-023',
    title: '夏夜虫鸣',
    description: '乡村夏夜的虫鸣蛙声，怀旧静谧，童年般的安心感。',
    coverImage: 'linear-gradient(135deg,#1B4332,#2D6A4F,#95D5B2)',
    duration: 1500,
    category: 'insomnia',
    tags: ['自然音', '夏夜', '虫鸣'],
    author: '自然声景',
    copyrightInfo: { contentId: 'CONT-INS-007', watermarkId: 'WM-4D8B7E', licenseType: '独家授权', copyrightHolder: '自然声景实验室', royaltyInfo: '分成合作' },
    playCount: 28765,
    favorited: false,
    audioUrl: '/audio/summer-night.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-024',
    title: '入睡前的小对话',
    description: '温和女声与你聊些轻松话题，慢慢聊到你困意袭来。',
    coverImage: 'linear-gradient(135deg,#884EA0,#BB8FCE,#E8DAEF)',
    duration: 1200,
    category: 'insomnia',
    tags: ['人声', '故事', '陪伴'],
    author: '夜航船工作室',
    copyrightInfo: { contentId: 'CONT-INS-008', watermarkId: 'WM-6A3D9F', licenseType: '独家授权', copyrightHolder: '夜航船声音工作室', royaltyInfo: '五五分成' },
    playCount: 31234,
    favorited: false,
    audioUrl: '/audio/bedtime-chat.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-025',
    title: 'CBT-I睡眠限制引导',
    description: '讲解睡眠限制疗法原理，配合首日练习指导。',
    coverImage: 'linear-gradient(135deg,#1A5276,#2980B9,#85C1E9)',
    duration: 720,
    category: 'insomnia',
    tags: ['CBT-I', '睡眠限制', '科普'],
    author: '睡眠医学中心',
    copyrightInfo: { contentId: 'CONT-INS-009', watermarkId: 'WM-2F5C8E', licenseType: '医疗机构授权', copyrightHolder: '市睡眠医学中心', royaltyInfo: '公益合作' },
    playCount: 18765,
    favorited: true,
    audioUrl: '/audio/cbt-sleep-restriction.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-026',
    title: '暴风雪小屋',
    description: '窗外暴风雪呼啸，屋内壁炉噼啪，极致安全感。',
    coverImage: 'linear-gradient(135deg,#154360,#2E86C1,#AED6F1)',
    duration: 1500,
    category: 'insomnia',
    tags: ['环境音', '壁炉', '风雪'],
    author: '环境声景',
    copyrightInfo: { contentId: 'CONT-INS-010', watermarkId: 'WM-8E6B3D', licenseType: '商用授权', copyrightHolder: '声景工坊', royaltyInfo: '月度授权' },
    playCount: 26543,
    favorited: false,
    audioUrl: '/audio/blizzard-cabin.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-027',
    title: '正念呼吸冥想',
    description: '经典正念入门：观察呼吸，觉察念头来去，不评判。',
    coverImage: 'linear-gradient(135deg,#2E7D32,#66BB6A,#C8E6C9)',
    duration: 600,
    category: 'meditation',
    tags: ['正念', '呼吸', '入门'],
    author: '正念减压中心',
    copyrightInfo: { contentId: 'CONT-MED-001', watermarkId: 'WM-3C8E5A', licenseType: '专家授权', copyrightHolder: '东方正念中心', royaltyInfo: '分成合作' },
    playCount: 23456,
    favorited: false,
    audioUrl: '/audio/mindfulness-breathing.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-028',
    title: '身体扫描冥想',
    description: '20分钟完整身体扫描，培养对身体的觉察与连接。',
    coverImage: 'linear-gradient(135deg,#512DA8,#7E57C2,#D1C4E9)',
    duration: 1200,
    category: 'meditation',
    tags: ['身体扫描', '长时', '深度'],
    author: '正念减压中心',
    copyrightInfo: { contentId: 'CONT-MED-002', watermarkId: 'WM-7B4D9F', licenseType: '专家授权', copyrightHolder: '东方正念中心', royaltyInfo: '分成合作' },
    playCount: 15678,
    favorited: true,
    audioUrl: '/audio/body-scan-meditation.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-029',
    title: '慈心冥想',
    description: 'metta冥想，培养对自己和他人的慈悲心，化解内心批判。',
    coverImage: 'linear-gradient(135deg,#E65100,#FF9800,#FFE0B2)',
    duration: 540,
    category: 'meditation',
    tags: ['慈心', '自我关怀', '情绪'],
    author: '释心如',
    copyrightInfo: { contentId: 'CONT-MED-003', watermarkId: 'WM-5F9E2B', licenseType: '法师授权', copyrightHolder: '释心如法师', royaltyInfo: '公益免费' },
    playCount: 12345,
    favorited: false,
    audioUrl: '/audio/loving-kindness.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-030',
    title: '晨间觉醒冥想',
    description: '温和唤醒身心，设定今日意图，带着觉知开始一天。',
    coverImage: 'linear-gradient(135deg,#F57F17,#FFB300,#FFF9C4)',
    duration: 420,
    category: 'meditation',
    tags: ['晨间', '唤醒', '意图'],
    author: '日光冥想',
    copyrightInfo: { contentId: 'CONT-MED-004', watermarkId: 'WM-2D7A6E', licenseType: '独家授权', copyrightHolder: '日光冥想工作室', royaltyInfo: '五五分成' },
    playCount: 9876,
    favorited: false,
    audioUrl: '/audio/morning-awakening.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-031',
    title: '空间感冥想',
    description: '觉察身体周围的空间，扩展觉知，放下思维紧缩感。',
    coverImage: 'linear-gradient(135deg,#006064,#00ACC1,#B2EBF2)',
    duration: 480,
    category: 'meditation',
    tags: ['空间', '扩展', '觉察'],
    author: '正念减压中心',
    copyrightInfo: { contentId: 'CONT-MED-005', watermarkId: 'WM-9C3F8D', licenseType: '专家授权', copyrightHolder: '东方正念中心', royaltyInfo: '分成合作' },
    playCount: 8765,
    favorited: false,
    audioUrl: '/audio/space-awareness.mp3',
    watermarkEmbedded: true,
  },
  {
    id: 'audio-032',
    title: '感恩冥想',
    description: '回顾一天中的三件小事，培养感恩心态，温暖入睡。',
    coverImage: 'linear-gradient(135deg,#880E4F,#C2185B,#F8BBD0)',
    duration: 360,
    category: 'meditation',
    tags: ['感恩', '睡前', '积极心理'],
    author: '积极心理学应用中心',
    copyrightInfo: { contentId: 'CONT-MED-006', watermarkId: 'WM-6E8B4A', licenseType: '机构授权', copyrightHolder: '积极心理学研究中心', royaltyInfo: '公益合作' },
    playCount: 14567,
    favorited: false,
    audioUrl: '/audio/gratitude-meditation.mp3',
    watermarkEmbedded: true,
  },
];

export const mockCBTModules: CBTModule[] = [
  {
    id: 'cbt-001',
    type: 'sleep_restriction',
    title: '睡眠限制疗法',
    description: '通过缩短卧床时间提高睡眠效率，是CBT-I的核心技术。',
    progress: 25,
    sessions: [
      { id: 'sr-1', title: '什么是睡眠限制', content: '睡眠限制疗法（Sleep Restriction Therapy）是CBT-I中最有效的技术之一...', completed: true },
      { id: 'sr-2', title: '计算你的睡眠窗口', content: '基于过去一周的睡眠数据，我们来计算你的初始睡眠窗口...', completed: true },
      { id: 'sr-3', title: '第一周执行指南', content: '严格遵守固定起床时间，白天避免补觉，记录每日睡眠效率...', completed: false, exercise: { type: 'behavior_checklist', prompts: ['昨晚几点上床？', '今晨几点起床？', '估计总睡眠时长？', '是否有日间小睡？'] } },
      { id: 'sr-4', title: '动态调整睡眠窗口', content: '当睡眠效率持续高于90%，可以增加15-30分钟卧床时间...', completed: false },
      { id: 'sr-5', title: '维持与巩固', content: '达到理想睡眠时长后，如何维持长期效果...', completed: false },
    ],
  },
  {
    id: 'cbt-002',
    type: 'stimulus_control',
    title: '刺激控制疗法',
    description: '重建床与睡眠的条件反射，让卧室成为睡眠的专属信号。',
    progress: 10,
    sessions: [
      { id: 'sc-1', title: '原理：巴甫洛夫的狗与床', content: '刺激控制基于经典条件反射理论...', completed: true },
      { id: 'sc-2', title: '六条核心规则', content: '1. 只在困倦时上床 2. 床只用于睡眠和性生活...', completed: false, exercise: { type: 'behavior_checklist', prompts: ['昨晚是否只有困倦才上床？', '床上是否做了非睡眠活动？', '醒后15分钟是否起床？', '早晨是否固定时间起床？'] } },
      { id: 'sc-3', title: '应对躺卧焦虑', content: '睡不着时的焦虑会形成恶性循环，我们来学习打破它...', completed: false },
      { id: 'sc-4', title: '睡前例行程序', content: '建立30-60分钟的睡前仪式，给大脑清晰的睡眠信号...', completed: false },
    ],
  },
  {
    id: 'cbt-003',
    type: 'cognitive_restructuring',
    title: '认知重构',
    description: '识别并改变关于睡眠的负性思维，减少对失眠的灾难化想象。',
    progress: 0,
    sessions: [
      { id: 'cr-1', title: '思维与睡眠的关系', content: '你是否有过这样的经历：越想睡着越睡不着...', completed: false },
      { id: 'cr-2', title: '常见睡眠负性思维', content: '"我今晚肯定又睡不着"、"今天没睡好什么都做不了"...', completed: false },
      { id: 'cr-3', title: '三栏记录表练习', content: '用三栏法记录：情境-自动思维-替代思维...', completed: false, exercise: { type: 'thought_record', prompts: ['引发焦虑的情境是什么？', '当时脑海中冒出了什么想法？', '这个想法让你感觉如何？', '有什么证据支持/反对这个想法？', '更平衡的想法是什么？'] } },
      { id: 'cr-4', title: '灾难化思维拆解', content: '"如果我连续失眠会怎样？"我们一层层拆解...', completed: false },
      { id: 'cr-5', title: '接纳与承诺', content: '有时候，越追求睡眠反而越睡不着...', completed: false },
    ],
  },
  {
    id: 'cbt-004',
    type: 'relaxation',
    title: '放松训练',
    description: '多种放松技术组合，降低睡前生理唤醒水平。',
    progress: 15,
    sessions: [
      { id: 'rl-1', title: '为何需要放松', content: '睡前的身体紧张和心理警觉会显著延长入睡时间...', completed: true },
      { id: 'rl-2', title: '腹式呼吸训练', content: '学习用膈肌呼吸，减慢心率，激活副交感神经...', completed: true },
      { id: 'rl-3', title: '渐进式肌肉放松', content: '从脚趾到头顶，逐一绷紧再放松每一组肌肉...', completed: false, exercise: { type: 'progressive_relaxation', prompts: ['脚趾', '小腿', '大腿', '臀部', '腹部', '胸部', '双手', '手臂', '肩膀', '面部'] } },
      { id: 'rl-4', title: '正念呼吸', content: '将注意力锚定在呼吸上，让思维自然来去...', completed: false },
      { id: 'rl-5', title: '想象放松', content: '在心中构建一个安全放松的场景...', completed: false },
    ],
  },
];

export function generateDailyTasks(days = 14): DailyTask[] {
  const tasks: DailyTask[] = [];
  const types: DailyTask['type'][] = ['schedule', 'cbt', 'audio', 'assessment', 'habit'];
  const titles: Record<string, string[]> = {
    schedule: ['执行睡眠限制时间表', '固定时间起床', '23点前准备就寝'],
    cbt: ['完成今日CBT练习', '填写思维记录表', '阅读CBT课程'],
    audio: ['收听助眠音频', '做5分钟放松练习', '睡前冥想10分钟'],
    assessment: ['晨间清醒度自评', '记录睡眠日记'],
    habit: ['下午4点后不喝咖啡', '睡前1小时不看手机', '每日运动30分钟'],
  };
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const dayTasks = 3 + Math.floor(Math.random() * 2);
    for (let j = 0; j < dayTasks; j++) {
      const type = types[j % types.length];
      const tList = titles[type];
      const completed = i >= 5 && Math.random() > 0.35;
      tasks.push({
        id: `task-${date}-${j}`,
        date,
        type,
        title: tList[j % tList.length],
        description: '根据今日计划完成此项任务，坚持就是胜利。',
        completed,
        completedAt: completed ? dayjs(date).hour(9 + j).toISOString() : undefined,
        rewardPoints: 10 + j * 5,
      });
    }
  }
  return tasks;
}

export const mockImprovementPlan: SleepImprovementPlan = {
  id: 'plan-001',
  userId: 'user-001',
  startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  durationWeeks: 4,
  status: 'active',
  sleepRestriction: {
    currentBedTime: '00:30',
    targetBedTime: '23:00',
    currentWakeTime: '08:00',
    targetWakeTime: '07:00',
    weeklyAdjustMinutes: 15,
    sleepEfficiencyThreshold: 85,
  },
  cbtModules: mockCBTModules,
  tasks: generateDailyTasks(14),
  totalPoints: 340,
  streakDays: 5,
};

export const mockRiskAssessments: RiskAssessment[] = [
  {
    id: 'risk-001',
    sessionId: 'session-20260604',
    userId: 'user-001',
    assessedAt: dayjs().subtract(7, 'day').toISOString(),
    overallRisk: 'moderate',
    dsm5Mapping: [
      { disorder: 'insomnia', dsm5Code: 'F51.01', riskLevel: 'moderate', score: 55, threshold: 60, evidences: ['入睡潜伏期>30分钟', '睡眠效率<70%'], diagnosticCriteriaMet: ['主诉对睡眠量/质不满意', '日间功能损害'] },
      { disorder: 'osa', dsm5Code: 'G47.33', riskLevel: 'moderate', score: 62, threshold: 50, evidences: ['AHI≈7.2', '鼾声响亮', '晨起口干'], diagnosticCriteriaMet: ['睡眠中呼吸障碍证据', '日间嗜睡/疲劳'] },
      { disorder: 'restless_legs', dsm5Code: 'G25.81', riskLevel: 'low', score: 15, threshold: 40, evidences: [], diagnosticCriteriaMet: [] },
      { disorder: 'periodic_limb', dsm5Code: 'G47.61', riskLevel: 'low', score: 20, threshold: 40, evidences: ['夜间轻度体动增多'], diagnosticCriteriaMet: [] },
      { disorder: 'narcolepsy', dsm5Code: 'G47.419', riskLevel: 'low', score: 8, threshold: 50, evidences: [], diagnosticCriteriaMet: [] },
      { disorder: 'circadian_rhythm', dsm5Code: 'G47.21', riskLevel: 'mild' as unknown as 'low', score: 42, threshold: 50, evidences: ['晚睡晚起倾向'], diagnosticCriteriaMet: ['睡眠时相延迟模式'] },
    ],
    ahiBasedRisk: { ahiValue: 7.2, eventsCount: 7, severity: 'mild', threshold: 5 },
    referralTriggered: false,
    recommendations: [
      '建议进一步评估阻塞性睡眠呼吸暂停风险',
      '继续执行CBT-I睡眠限制训练',
      '保持规律作息，避免周末补觉',
      '注意体重管理和侧卧位睡眠',
    ],
  },
  {
    id: 'risk-002',
    sessionId: 'session-20260608',
    userId: 'user-001',
    assessedAt: dayjs().subtract(3, 'day').toISOString(),
    overallRisk: 'high',
    dsm5Mapping: [
      { disorder: 'insomnia', dsm5Code: 'F51.01', riskLevel: 'moderate', score: 48, threshold: 60, evidences: ['入睡潜伏期>20分钟'], diagnosticCriteriaMet: ['睡眠主诉'] },
      { disorder: 'osa', dsm5Code: 'G47.33', riskLevel: 'high', score: 75, threshold: 50, evidences: ['AHI≈8.5', '多次呼吸暂停事件', '血氧下降>5%'], diagnosticCriteriaMet: ['睡眠中呼吸受阻证据', '日间功能影响', '打鼾史'] },
      { disorder: 'restless_legs', dsm5Code: 'G25.81', riskLevel: 'low', score: 18, threshold: 40, evidences: [], diagnosticCriteriaMet: [] },
      { disorder: 'periodic_limb', dsm5Code: 'G47.61', riskLevel: 'low', score: 22, threshold: 40, evidences: [], diagnosticCriteriaMet: [] },
      { disorder: 'narcolepsy', dsm5Code: 'G47.419', riskLevel: 'low', score: 10, threshold: 50, evidences: [], diagnosticCriteriaMet: [] },
      { disorder: 'circadian_rhythm', dsm5Code: 'G47.21', riskLevel: 'mild' as unknown as 'low', score: 38, threshold: 50, evidences: [], diagnosticCriteriaMet: [] },
    ],
    ahiBasedRisk: { ahiValue: 8.5, eventsCount: 9, severity: 'moderate', threshold: 5 },
    referralTriggered: true,
    recommendations: [
      'OSA风险较高，建议尽快至睡眠专科就诊',
      '已为您匹配合作医院可预约远程初筛',
      '避免饮酒和仰卧位睡眠',
      '持续监测夜间呼吸情况',
    ],
  },
];

export const mockHospitals: HospitalInfo[] = [
  { id: 'hosp-001', name: '北京协和医院', department: '呼吸与危重症医学科（睡眠中心）', city: '北京', level: '三级甲等', cooperationType: '深度合作', doctorsCount: 8, rating: 4.9 },
  { id: 'hosp-002', name: '上海瑞金医院', department: '睡眠呼吸障碍诊疗中心', city: '上海', level: '三级甲等', cooperationType: '深度合作', doctorsCount: 6, rating: 4.8 },
  { id: 'hosp-003', name: '广州中山一院', department: '睡眠医学中心', city: '广州', level: '三级甲等', cooperationType: '战略合作', doctorsCount: 5, rating: 4.7 },
  { id: 'hosp-004', name: '华西医院', department: '睡眠医学中心', city: '成都', level: '三级甲等', cooperationType: '战略合作', doctorsCount: 7, rating: 4.8 },
  { id: 'hosp-005', name: '深圳人民医院', department: '呼吸内科睡眠组', city: '深圳', level: '三级甲等', cooperationType: '区域合作', doctorsCount: 4, rating: 4.6 },
];

export const mockReferralRecord: ReferralRecord = {
  id: 'referral-001',
  userId: 'user-001',
  assessmentId: 'risk-002',
  sessionId: 'session-20260608',
  createdAt: dayjs().subtract(2, 'day').toISOString(),
  status: 'hospital_matched',
  consentGiven: true,
  consentGivenAt: dayjs().subtract(2, 'day').add(15, 'minute').toISOString(),
  reportId: 'report-osa-20260609',
  matchedHospital: mockHospitals[1],
  appointment: undefined,
  consultationResult: undefined,
};
