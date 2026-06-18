import type { ARContent, AudioTrack, TimelineSegment, InteractionNode, HistoryImage } from '@/types'

function generateWaveform(length: number): number[] {
  const result: number[] = []
  for (let i = 0; i < length; i++) {
    const base = Math.sin(i * 0.1) * 0.3
    const noise = (Math.random() - 0.5) * 0.4
    result.push(Math.max(0, Math.min(1, base + noise + 0.5)))
  }
  return result
}

function makeAudioTrack(id: string, name: string, duration: number): AudioTrack {
  return {
    id,
    language: 'zh-CN',
    name,
    audioUrl: `/audio/${id}.mp3`,
    duration,
    waveform: generateWaveform(Math.floor(duration * 3)),
  }
}

let arContents: ARContent[] = [
  {
    id: 'ar-1',
    poiId: 'poi-1-1',
    modelUrl: '/models/taihedian.glb',
    modelScale: 1.0,
    modelHeight: 0,
    audioTracks: [
      makeAudioTrack('at-1-1', '太和殿解说', 40),
      makeAudioTrack('at-1-1-en', 'Hall of Supreme Harmony', 40),
    ],
    interactions: [
      { id: 'int-1-1', triggerTime: 15, type: 'hotspot' },
      { id: 'int-1-2', triggerTime: 30, type: 'quiz', question: '太和殿在清代的主要用途是什么？', options: [{ text: '举行大典', correct: true }, { text: '日常办公', correct: false }, { text: '寝宫居住', correct: false }] },
    ],
    timeline: [
      { id: 'tl-1-1', type: 'model-animation', startTime: 0, endTime: 5, payload: { animation: 'intro_rotate' } },
      { id: 'tl-1-2', type: 'image', startTime: 5, endTime: 15, payload: { imageUrl: '/images/taihedian-structure.jpg' } },
      { id: 'tl-1-3', type: 'audio', startTime: 5, endTime: 35, payload: { trackId: 'at-1-1' } },
      { id: 'tl-1-4', type: 'model-animation', startTime: 15, endTime: 30, payload: { animation: 'ceremony_replay' } },
      { id: 'tl-1-5', type: 'interaction', startTime: 30, endTime: 40, payload: { interactionId: 'int-1-2' } },
    ],
    historyImages: [
      { id: 'hi-1-1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20Hall%20of%20Supreme%20Harmony%20Qing%20Dynasty&image_size=landscape_16_9', year: '1900', caption: '清末太和殿旧影' },
      { id: 'hi-1-2', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20Hall%20Supreme%20Harmony%20modern%20restoration&image_size=landscape_16_9', year: '2020', caption: '修缮后的太和殿' },
    ],
  },
  {
    id: 'ar-2',
    poiId: 'poi-1-4',
    modelUrl: '/models/qianqinggong.glb',
    modelScale: 1.0,
    modelHeight: 0,
    audioTracks: [
      makeAudioTrack('at-2-1', '乾清宫解说', 35),
    ],
    interactions: [
      { id: 'int-2-1', triggerTime: 20, type: 'hotspot' },
    ],
    timeline: [
      { id: 'tl-2-1', type: 'model-animation', startTime: 0, endTime: 8, payload: { animation: 'entrance_reveal' } },
      { id: 'tl-2-2', type: 'audio', startTime: 8, endTime: 30, payload: { trackId: 'at-2-1' } },
      { id: 'tl-2-3', type: 'image', startTime: 20, endTime: 35, payload: { imageUrl: '/images/qianqinggong-interior.jpg' } },
    ],
    historyImages: [
      { id: 'hi-2-1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20Palace%20Heavenly%20Purity%20Ming%20Dynasty&image_size=landscape_16_9', year: '1600', caption: '明代乾清宫' },
    ],
  },
  {
    id: 'ar-3',
    poiId: 'poi-2-1',
    modelUrl: '/models/cave17.glb',
    modelScale: 0.8,
    modelHeight: 0,
    audioTracks: [
      makeAudioTrack('at-3-1', '第17窟解说', 38),
      makeAudioTrack('at-3-1-en', 'Cave 17 Guide', 38),
      makeAudioTrack('at-3-1-ja', '第17窟ガイド', 38),
    ],
    interactions: [
      { id: 'int-3-1', triggerTime: 18, type: 'hotspot' },
      { id: 'int-3-2', triggerTime: 28, type: 'quiz', question: '莫高窟壁画使用的主要颜料来源是什么？', options: [{ text: '矿物颜料', correct: true }, { text: '化学合成', correct: false }, { text: '植物染料', correct: false }] },
    ],
    timeline: [
      { id: 'tl-3-1', type: 'model-animation', startTime: 0, endTime: 6, payload: { animation: 'cave_panorama' } },
      { id: 'tl-3-2', type: 'image', startTime: 6, endTime: 18, payload: { imageUrl: '/images/cave17-mural.jpg' } },
      { id: 'tl-3-3', type: 'audio', startTime: 6, endTime: 34, payload: { trackId: 'at-3-1' } },
      { id: 'tl-3-4', type: 'model-animation', startTime: 18, endTime: 30, payload: { animation: 'color_restore' } },
      { id: 'tl-3-5', type: 'interaction', startTime: 28, endTime: 38, payload: { interactionId: 'int-3-2' } },
    ],
    historyImages: [
      { id: 'hi-3-1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mogao%20Cave%2017%20original%20colors%20Tang%20Dynasty&image_size=landscape_16_9', year: '750', caption: '唐代原貌复原图' },
      { id: 'hi-3-2', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mogao%20Cave%2017%20current%20deteriorated&image_size=landscape_16_9', year: '2020', caption: '现状' },
    ],
  },
  {
    id: 'ar-4',
    poiId: 'poi-2-3',
    modelUrl: '/models/cave328.glb',
    modelScale: 0.8,
    modelHeight: 0,
    audioTracks: [
      makeAudioTrack('at-4-1', '第328窟解说', 25),
    ],
    interactions: [
      { id: 'int-4-1', triggerTime: 15, type: 'hotspot' },
    ],
    timeline: [
      { id: 'tl-4-1', type: 'model-animation', startTime: 0, endTime: 5, payload: { animation: 'sculpture_reveal' } },
      { id: 'tl-4-2', type: 'audio', startTime: 5, endTime: 22, payload: { trackId: 'at-4-1' } },
      { id: 'tl-4-3', type: 'image', startTime: 15, endTime: 25, payload: { imageUrl: '/images/cave328-celestial.jpg' } },
    ],
    historyImages: [
      { id: 'hi-4-1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mogao%20Cave%20328%20Tang%20sculpture%20original&image_size=landscape_16_9', year: '680', caption: '初唐塑像原貌' },
    ],
  },
  {
    id: 'ar-5',
    poiId: 'poi-3-1',
    modelUrl: '/models/pit1.glb',
    modelScale: 1.2,
    modelHeight: 0,
    audioTracks: [
      makeAudioTrack('at-5-1', '一号坑解说', 45),
      makeAudioTrack('at-5-1-en', 'Pit 1 Guide', 45),
    ],
    interactions: [
      { id: 'int-5-1', triggerTime: 20, type: 'hotspot' },
      { id: 'int-5-2', triggerTime: 35, type: 'quiz', question: '兵马俑原本是什么颜色？', options: [{ text: '彩绘', correct: true }, { text: '灰色陶土', correct: false }, { text: '青铜色', correct: false }] },
      { id: 'int-5-3', triggerTime: 40, type: 'share' },
    ],
    timeline: [
      { id: 'tl-5-1', type: 'model-animation', startTime: 0, endTime: 8, payload: { animation: 'army_overview' } },
      { id: 'tl-5-2', type: 'audio', startTime: 8, endTime: 40, payload: { trackId: 'at-5-1' } },
      { id: 'tl-5-3', type: 'image', startTime: 8, endTime: 20, payload: { imageUrl: '/images/pit1-formation.jpg' } },
      { id: 'tl-5-4', type: 'model-animation', startTime: 20, endTime: 35, payload: { animation: 'color_restore' } },
      { id: 'tl-5-5', type: 'interaction', startTime: 35, endTime: 45, payload: { interactionId: 'int-5-2' } },
    ],
    historyImages: [
      { id: 'hi-5-1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Terracotta%20Warriors%20original%20painted%20colors&image_size=landscape_16_9', year: '-210', caption: '彩绘原貌复原图' },
      { id: 'hi-5-2', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Terracotta%20Warriors%20excavation%201974&image_size=landscape_16_9', year: '1974', caption: '1974年发掘现场' },
    ],
  },
  {
    id: 'ar-6',
    poiId: 'poi-3-4',
    modelUrl: '/models/chariot.glb',
    modelScale: 0.5,
    modelHeight: 0,
    audioTracks: [
      makeAudioTrack('at-6-1', '铜车马解说', 22),
    ],
    interactions: [
      { id: 'int-6-1', triggerTime: 15, type: 'hotspot' },
    ],
    timeline: [
      { id: 'tl-6-1', type: 'model-animation', startTime: 0, endTime: 5, payload: { animation: 'chariot_reveal' } },
      { id: 'tl-6-2', type: 'audio', startTime: 5, endTime: 20, payload: { trackId: 'at-6-1' } },
      { id: 'tl-6-3', type: 'model-animation', startTime: 10, endTime: 22, payload: { animation: 'chariot_disassemble' } },
    ],
    historyImages: [
      { id: 'hi-6-1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Qin%20Dynasty%20bronze%20chariot%20excavation&image_size=landscape_16_9', year: '1980', caption: '铜车马出土' },
    ],
  },
]

export function getARContent(id: string): ARContent | undefined {
  return arContents.find((c) => c.id === id)
}

export function getARContentByPOI(poiId: string): ARContent | undefined {
  return arContents.find((c) => c.poiId === poiId)
}

export function updateARContent(id: string, data: Partial<ARContent>): ARContent | undefined {
  const index = arContents.findIndex((c) => c.id === id)
  if (index === -1) return undefined
  arContents[index] = { ...arContents[index], ...data }
  return arContents[index]
}
