export function applyWatermark(imgUrl: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const watermarkText = `${text} | ${timestamp}`;

      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#000000';

      const textWidth = ctx.measureText(watermarkText).width;
      const textHeight = 18;
      const stepX = textWidth + 80;
      const stepY = textHeight + 60;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);

      const startX = -canvas.width;
      const startY = -canvas.height;

      for (let y = startY; y < canvas.height * 2; y += stepY) {
        for (let x = startX; x < canvas.width * 2; x += stepX) {
          ctx.fillText(watermarkText, x, y);
        }
      }

      ctx.restore();
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = imgUrl;
  });
}
