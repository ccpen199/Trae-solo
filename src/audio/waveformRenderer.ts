export class WaveformRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  drawWaveform(data: Float32Array, color: string = '#3B82F6'): void {
    this.clear();
    this.ctx.save();

    const gradient = this.createGradient(color);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10;

    const sliceWidth = this.width / data.length;
    const centerY = this.height / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);

    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * this.height * 0.4;
      const y = centerY + amplitude * Math.sin(i * 0.1);
      this.ctx.lineTo(x, centerY + amplitude);
    }

    for (let i = data.length - 1; i >= 0; i--) {
      const x = i * sliceWidth;
      const amplitude = data[i] * this.height * 0.4;
      this.ctx.lineTo(x, centerY - amplitude);
    }

    this.ctx.closePath();
    this.ctx.fillStyle = this.createFillGradient(color);
    this.ctx.globalAlpha = 0.3;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    this.ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * this.height * 0.4;
      const y = centerY + amplitude;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    this.ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const amplitude = data[i] * this.height * 0.4;
      const y = centerY - amplitude;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawSpectrum(data: Float32Array, color: string = '#8B5CF6'): void {
    this.clear();
    this.ctx.save();

    const barCount = Math.min(data.length, 64);
    const barWidth = (this.width / barCount) * 0.8;
    const gap = (this.width / barCount) * 0.2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * data.length);
      const value = data[dataIndex] || 0;
      const barHeight = Math.min(value * this.height * 2, this.height * 0.95);
      const x = i * (barWidth + gap) + gap / 2;
      const y = this.height - barHeight;

      const gradient = this.ctx.createLinearGradient(x, this.height, x, y);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.lightenColor(color, 30));

      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;

      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawAnimatedWaveform(data: Float32Array, progress: number): void {
    this.clear();
    this.ctx.save();

    const totalBars = Math.min(data.length, 128);
    const barWidth = (this.width / totalBars) * 0.7;
    const gap = (this.width / totalBars) * 0.3;
    const centerY = this.height / 2;

    const playedCount = Math.floor(totalBars * progress);

    for (let i = 0; i < totalBars; i++) {
      const dataIndex = Math.floor((i / totalBars) * data.length);
      const value = data[dataIndex] || 0;
      const barHeight = Math.min(value * this.height * 0.8, this.height * 0.9);
      const x = i * (barWidth + gap) + gap / 2;

      const isPlayed = i < playedCount;
      const color = isPlayed ? '#10B981' : '#E5E7EB';
      const gradientColor = isPlayed ? '#34D399' : '#9CA3AF';

      const gradient = this.ctx.createLinearGradient(x, centerY + barHeight / 2, x, centerY - barHeight / 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, gradientColor);
      gradient.addColorStop(1, color);

      this.ctx.fillStyle = gradient;

      if (isPlayed) {
        this.ctx.shadowColor = '#10B981';
        this.ctx.shadowBlur = 6;
      }

      const y = centerY - barHeight / 2;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, 2);
      this.ctx.fill();
    }

    const progressX = progress * this.width;
    this.ctx.strokeStyle = '#10B981';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#10B981';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(progressX, 0);
    this.ctx.lineTo(progressX, this.height);
    this.ctx.stroke();

    this.ctx.restore();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private createGradient(color: string): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, this.lightenColor(color, 20));
    gradient.addColorStop(1, color);
    return gradient;
  }

  private createFillGradient(color: string): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(0.5, color + '20');
    gradient.addColorStop(1, color + '40');
    return gradient;
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}
