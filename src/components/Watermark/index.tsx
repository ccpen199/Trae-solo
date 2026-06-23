import React, { useMemo } from 'react';
import { View } from '@tarojs/components';
import styles from './index.module.scss';
import { WatermarkConfig } from '@/types/document';

interface WatermarkProps {
  config: WatermarkConfig;
  visible?: boolean;
}

const Watermark: React.FC<WatermarkProps> = ({ config, visible = true }) => {
  const watermarkStyle = useMemo(() => {
    if (!visible || !config.enabled) return {};

    const canvas = document.createElement('canvas');
    const ratio = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return {};

    const fontSize = config.fontSize * ratio;
    canvas.width = 300 * ratio;
    canvas.height = 200 * ratio;
    ctx.translate(0, canvas.height / 2);
    ctx.rotate((config.angle * Math.PI) / 180);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = config.color;
    ctx.globalAlpha = config.opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    return {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><text x="150" y="100" fill="${config.color}" opacity="${config.opacity}" font-size="${config.fontSize}" font-family="sans-serif" text-anchor="middle" transform="rotate(${config.angle} 150 100)">${config.text}</text></svg>')`,
      backgroundRepeat: 'repeat'
    };
  }, [config, visible]);

  if (!visible || !config.enabled) return null;

  return (
    <View
      className={styles.watermark}
      style={watermarkStyle as React.CSSProperties}
    />
  );
};

export default Watermark;
