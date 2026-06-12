import type { AudioFeatures } from '../types';

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  async loadAudio(file: File): Promise<AudioBuffer> {
    const context = this.getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  extractFeatures(audioBuffer: AudioBuffer): AudioFeatures {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const rms = this.calculateRMS(channelData);
    const zeroCrossingRate = this.calculateZeroCrossingRate(channelData);

    const fftSize = 2048;
    const spectrum = this.getSpectrum(audioBuffer, fftSize);

    const spectralCentroid = this.calculateSpectralCentroid(spectrum, sampleRate);
    const spectralFlatness = this.calculateSpectralFlatness(spectrum);
    const dominantFrequency = this.calculateDominantFrequency(spectrum, sampleRate);

    return {
      rms,
      spectralCentroid,
      spectralFlatness,
      dominantFrequency,
      zeroCrossingRate,
    };
  }

  getSpectrum(audioBuffer: AudioBuffer, fftSize: number): Float32Array {
    const context = this.getAudioContext();
    const channelData = audioBuffer.getChannelData(0);

    const analyser = context.createAnalyser();
    analyser.fftSize = fftSize;

    const bufferLength = analyser.frequencyBinCount;
    const spectrum = new Float32Array(bufferLength);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;

    const offlineContext = new OfflineAudioContext(1, channelData.length, audioBuffer.sampleRate);
    const offlineAnalyser = offlineContext.createAnalyser();
    offlineAnalyser.fftSize = fftSize;

    const offlineSource = offlineContext.createBufferSource();
    offlineSource.buffer = audioBuffer;
    offlineSource.connect(offlineAnalyser);
    offlineSource.start();

    const frequencyData = new Float32Array(offlineAnalyser.frequencyBinCount);
    offlineAnalyser.getFloatFrequencyData(frequencyData);

    for (let i = 0; i < frequencyData.length; i++) {
      spectrum[i] = Math.pow(10, frequencyData[i] / 20);
    }

    if (spectrum.every(v => v === 0)) {
      const windowSize = Math.min(fftSize, channelData.length);
      const windowedData = new Float32Array(windowSize);
      for (let i = 0; i < windowSize; i++) {
        const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (windowSize - 1));
        windowedData[i] = channelData[i] * window;
      }

      const fftResult = this.simpleFFT(windowedData);
      for (let i = 0; i < fftResult.length && i < spectrum.length; i++) {
        spectrum[i] = fftResult[i];
      }
    }

    return spectrum;
  }

  getWaveformData(audioBuffer: AudioBuffer, samples: number): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    const waveform = new Float32Array(samples);
    const blockSize = Math.floor(channelData.length / samples);

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const abs = Math.abs(channelData[start + j] || 0);
        if (abs > max) {
          max = abs;
        }
      }
      waveform[i] = max;
    }

    return waveform;
  }

  private calculateRMS(channelData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
  }

  private calculateSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / spectrum.length;

    let sumMagnitude = 0;
    let sumWeighted = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const magnitude = spectrum[i];
      const freq = i * binWidth;
      sumMagnitude += magnitude;
      sumWeighted += magnitude * freq;
    }

    if (sumMagnitude === 0) return 0;
    return sumWeighted / sumMagnitude;
  }

  private calculateSpectralFlatness(spectrum: Float32Array): number {
    const epsilon = 1e-10;
    let logSum = 0;
    let linSum = 0;
    const n = spectrum.length;

    for (let i = 0; i < n; i++) {
      const value = Math.max(spectrum[i], epsilon);
      logSum += Math.log(value);
      linSum += value;
    }

    const geometricMean = Math.exp(logSum / n);
    const arithmeticMean = linSum / n;

    if (arithmeticMean === 0) return 0;
    return geometricMean / arithmeticMean;
  }

  private calculateDominantFrequency(spectrum: Float32Array, sampleRate: number): number {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / spectrum.length;

    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 1; i < spectrum.length; i++) {
      if (spectrum[i] > maxValue) {
        maxValue = spectrum[i];
        maxIndex = i;
      }
    }

    return maxIndex * binWidth;
  }

  private calculateZeroCrossingRate(channelData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < channelData.length; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0) ||
          (channelData[i] < 0 && channelData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / channelData.length;
  }

  private simpleFFT(data: Float32Array): Float32Array {
    const n = data.length;
    const spectrum = new Float32Array(n / 2);

    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = (-2 * Math.PI * k * t) / n;
        real += data[t] * Math.cos(angle);
        imag += data[t] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag) / n;
    }

    return spectrum;
  }
}
