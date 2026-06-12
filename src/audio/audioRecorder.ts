export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private recordedData: Float32Array | null = null;
  private recordBuffer: number[] = [];

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      source.connect(this.analyser);

      this.recordBuffer = [];
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (this.isRecording) {
          const inputData = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < inputData.length; i++) {
            this.recordBuffer.push(inputData[i]);
          }
        }
      };

      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw error;
    }
  }

  async stop(): Promise<Float32Array> {
    this.isRecording = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.recordedData = new Float32Array(this.recordBuffer);
    this.recordBuffer = [];
    this.analyser = null;

    return this.recordedData;
  }

  getLiveRMS(): number {
    if (!this.analyser || !this.isRecording) {
      return 0;
    }

    const dataArray = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }

    return Math.sqrt(sum / dataArray.length);
  }

  getLiveWaveform(samples: number): Float32Array {
    if (!this.analyser || !this.isRecording) {
      return new Float32Array(samples);
    }

    const dataArray = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(dataArray);

    const waveform = new Float32Array(samples);
    const blockSize = Math.floor(dataArray.length / samples);

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const abs = Math.abs(dataArray[start + j] || 0);
        if (abs > max) {
          max = abs;
        }
      }
      waveform[i] = max;
    }

    return waveform;
  }

  getLiveSpectrum(): Float32Array {
    if (!this.analyser || !this.isRecording) {
      return new Float32Array(1024);
    }

    const frequencyData = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(frequencyData);

    const spectrum = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      spectrum[i] = Math.pow(10, frequencyData[i] / 20);
    }

    return spectrum;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}
