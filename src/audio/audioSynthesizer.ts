import type { Emotion, SynthesisParams, SynthesisResult, EmotionCategory } from '../types';
import { getEmotionById, getEmotionByCategory } from '../data/emotions';

interface MeowSynthesisParams {
  baseFrequency: number;
  duration: number;
  intensity: number;
  vibratoRate: number;
  vibratoDepth: number;
  harmonics: number[];
  attack: number;
  release: number;
}

export class AudioSynthesizer {
  private emotionSynthesisParams: Map<EmotionCategory, MeowSynthesisParams>;

  constructor() {
    this.emotionSynthesisParams = this.buildSynthesisParams();
  }

  synthesizeMeow(params: SynthesisParams, audioContext: AudioContext): AudioBuffer {
    const emotion = getEmotionByCategory(params.emotion);
    if (!emotion) {
      return this.createSilentBuffer(audioContext, params.duration);
    }

    const baseParams = this.emotionSynthesisParams.get(params.emotion)!;
    const adjustedParams: MeowSynthesisParams = {
      ...baseParams,
      baseFrequency: baseParams.baseFrequency * (1 + (params.pitch - 1) * 0.3),
      intensity: params.intensity,
      duration: params.duration,
    };

    return this.renderMeowBuffer(adjustedParams, audioContext);
  }

  synthesizeByEmotion(emotionId: string, audioContext: AudioContext): SynthesisResult {
    const emotion = getEmotionById(emotionId);
    if (!emotion) {
      throw new Error(`Emotion with id ${emotionId} not found`);
    }

    const baseParams = this.emotionSynthesisParams.get(emotion.category)!;
    const audioBuffer = this.renderMeowBuffer(baseParams, audioContext);

    const audioUrl = this.bufferToWaveUrl(audioBuffer);
    const expectedReactions = this.getExpectedReactions(emotionId);

    return {
      audioUrl,
      duration: audioBuffer.duration,
      baseFrequency: emotion.baseFrequency,
      emotion,
      expectedReactions,
      timestamp: Date.now(),
    };
  }

  getExpectedReactions(emotionId: string): { type: string; probability: number; description: string }[] {
    const emotion = getEmotionById(emotionId);
    if (!emotion) return [];

    const reactionsByCategory: Record<EmotionCategory, { type: string; probability: number; description: string }[]> = {
      purr: [
        { type: 'relaxation', probability: 0.85, description: '猫咪会更加放松，可能会闭上眼睛' },
        { type: 'approach', probability: 0.6, description: '猫咪可能会靠近声源寻求更多互动' },
        { type: 'purr_response', probability: 0.7, description: '猫咪可能以呼噜声回应' },
      ],
      meow: [
        { type: 'attention', probability: 0.8, description: '猫咪会注意到声音，可能转向声源' },
        { type: 'vocal_response', probability: 0.5, description: '猫咪可能会以喵叫回应' },
        { type: 'curiosity', probability: 0.65, description: '猫咪会表现出好奇并探索周围' },
      ],
      hiss: [
        { type: 'fear', probability: 0.75, description: '猫咪可能会感到害怕并后退' },
        { type: 'defense', probability: 0.6, description: '猫咪可能摆出防御姿态' },
        { type: 'escape', probability: 0.7, description: '猫咪可能会试图逃离该区域' },
      ],
      wail: [
        { type: 'concern', probability: 0.65, description: '猫咪可能表现出担忧或困惑' },
        { type: 'approach', probability: 0.4, description: '猫咪可能会靠近查看情况' },
        { type: 'vocal_response', probability: 0.5, description: '猫咪可能以类似叫声回应' },
      ],
      growl: [
        { type: 'aggression', probability: 0.7, description: '猫咪可能表现出攻击性' },
        { type: 'retreat', probability: 0.5, description: '猫咪可能会后退保持距离' },
        { type: 'defense', probability: 0.65, description: '猫咪可能摆出防御姿态准备反击' },
      ],
      content: [
        { type: 'relaxation', probability: 0.8, description: '猫咪会感到放松和舒适' },
        { type: 'affection', probability: 0.6, description: '猫咪可能表现出亲昵行为' },
        { type: 'purring', probability: 0.7, description: '猫咪可能开始发出呼噜声' },
      ],
    };

    return reactionsByCategory[emotion.category] || [];
  }

  private buildSynthesisParams(): Map<EmotionCategory, MeowSynthesisParams> {
    const params = new Map<EmotionCategory, MeowSynthesisParams>();

    params.set('purr', {
      baseFrequency: 25,
      duration: 2,
      intensity: 0.3,
      vibratoRate: 25,
      vibratoDepth: 2,
      harmonics: [1, 2, 3],
      attack: 0.1,
      release: 0.2,
    });

    params.set('meow', {
      baseFrequency: 500,
      duration: 0.8,
      intensity: 0.5,
      vibratoRate: 5,
      vibratoDepth: 30,
      harmonics: [1, 1.5, 2, 3],
      attack: 0.05,
      release: 0.1,
    });

    params.set('hiss', {
      baseFrequency: 8000,
      duration: 0.5,
      intensity: 0.4,
      vibratoRate: 0,
      vibratoDepth: 0,
      harmonics: [1],
      attack: 0.02,
      release: 0.05,
    });

    params.set('wail', {
      baseFrequency: 1200,
      duration: 2,
      intensity: 0.6,
      vibratoRate: 3,
      vibratoDepth: 50,
      harmonics: [1, 2, 2.5],
      attack: 0.2,
      release: 0.3,
    });

    params.set('growl', {
      baseFrequency: 150,
      duration: 1.2,
      intensity: 0.5,
      vibratoRate: 20,
      vibratoDepth: 10,
      harmonics: [1, 1.5, 2],
      attack: 0.15,
      release: 0.1,
    });

    params.set('content', {
      baseFrequency: 350,
      duration: 0.6,
      intensity: 0.35,
      vibratoRate: 4,
      vibratoDepth: 20,
      harmonics: [1, 1.25, 2],
      attack: 0.03,
      release: 0.08,
    });

    return params;
  }

  private renderMeowBuffer(params: MeowSynthesisParams, audioContext: AudioContext): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const totalSamples = Math.floor(params.duration * sampleRate);
    const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    const baseFreq = params.baseFrequency;
    const intensity = params.intensity;
    const attackSamples = Math.floor(params.attack * sampleRate);
    const releaseSamples = Math.floor(params.release * sampleRate);
    const sustainSamples = totalSamples - attackSamples - releaseSamples;

    if (params.baseFrequency >= 2000) {
      this.renderNoise(channelData, params, sampleRate, attackSamples, releaseSamples, sustainSamples);
    } else {
      this.renderTone(channelData, params, sampleRate, attackSamples, releaseSamples, sustainSamples, baseFreq, intensity);
    }

    return buffer;
  }

  private renderTone(
    channelData: Float32Array,
    params: MeowSynthesisParams,
    sampleRate: number,
    attackSamples: number,
    releaseSamples: number,
    sustainSamples: number,
    baseFreq: number,
    intensity: number
  ): void {
    const totalSamples = channelData.length;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      const vibrato = Math.sin(2 * Math.PI * params.vibratoRate * t) * params.vibratoDepth;
      const freq = baseFreq + vibrato;

      let envelope = 1;
      if (i < attackSamples) {
        envelope = i / attackSamples;
      } else if (i >= attackSamples + sustainSamples) {
        const releasePos = i - (attackSamples + sustainSamples);
        envelope = 1 - releasePos / releaseSamples;
      }
      envelope = Math.max(0, Math.min(1, envelope));

      let sample = 0;
      for (let h = 0; h < params.harmonics.length; h++) {
        const harmonicFreq = freq * params.harmonics[h];
        const harmonicGain = 1 / (h + 1);
        sample += Math.sin(2 * Math.PI * harmonicFreq * t) * harmonicGain;
      }

      const formant = this.calculateFormant(t, baseFreq);
      sample *= formant;

      channelData[i] = sample * intensity * envelope * 0.5;
    }
  }

  private renderNoise(
    channelData: Float32Array,
    params: MeowSynthesisParams,
    sampleRate: number,
    attackSamples: number,
    releaseSamples: number,
    sustainSamples: number
  ): void {
    const totalSamples = channelData.length;
    const centerFreq = params.baseFrequency;

    let previousOut = 0;
    const cutoff = centerFreq / (sampleRate / 2);

    for (let i = 0; i < totalSamples; i++) {
      const whiteNoise = (Math.random() * 2 - 1) * 0.5;
      const filtered = previousOut + cutoff * (whiteNoise - previousOut);
      previousOut = filtered;

      let envelope = 1;
      if (i < attackSamples) {
        envelope = i / attackSamples;
      } else if (i >= attackSamples + sustainSamples) {
        const releasePos = i - (attackSamples + sustainSamples);
        envelope = 1 - releasePos / releaseSamples;
      }
      envelope = Math.max(0, Math.min(1, envelope));

      const t = i / sampleRate;
      const amplitudeMod = 1 + 0.3 * Math.sin(2 * Math.PI * 15 * t);

      channelData[i] = filtered * params.intensity * envelope * amplitudeMod * 0.8;
    }
  }

  private calculateFormant(t: number, baseFreq: number): number {
    const normalizedFreq = Math.min(baseFreq / 1000, 1);
    const formantFreq = 1000 + 500 * Math.sin(t * 2) * normalizedFreq;
    const formantWidth = 200 + 100 * normalizedFreq;

    return 1;
  }

  private createSilentBuffer(audioContext: AudioContext, duration: number): AudioBuffer {
    const sampleRate = audioContext.sampleRate;
    const totalSamples = Math.floor(duration * sampleRate);
    const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
    const channelData = buffer.getChannelData(0);
    channelData.fill(0);
    return buffer;
  }

  private bufferToWaveUrl(buffer: AudioBuffer): string {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    const channelData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
