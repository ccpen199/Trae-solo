import React, { useRef, useState, useEffect } from 'react';
import { View, Canvas, Button, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SignPadProps {
  visible: boolean;
  onConfirm: (signatureData: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

const SignPad: React.FC<SignPadProps> = ({ visible, onConfirm, onCancel }) => {
  const [hasContent, setHasContent] = useState(false);
  const pointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setHasContent(false);
      pointsRef.current = [];
      isDrawingRef.current = false;
      setTimeout(() => initCanvas(), 100);
    }
  }, [visible]);

  const initCanvas = () => {
    const query = Taro.createSelectorQuery();
    query.select('#signCanvas')
      .fields({ node: true, size: true })
      .exec((res: any[]) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d');
        const dpr = Taro.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1D2129';
      });
  };

  const getPoint = (e: any): Point => {
    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    return { x: touch.x, y: touch.y };
  };

  const handleTouchStart = (e: any) => {
    isDrawingRef.current = true;
    const p = getPoint(e);
    pointsRef.current = [p];
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isDrawingRef.current) return;
    const p = getPoint(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
    pointsRef.current.push(p);
    if (!hasContent) setHasContent(true);
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pointsRef.current = [];
    setHasContent(false);
    console.log('[SignPad] 清除签名');
  };

  const handleConfirm = () => {
    if (!hasContent) {
      Taro.showToast({ title: '请先完成手写签名', icon: 'none' });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    console.log('[SignPad] 签名完成，数据长度:', dataUrl.length);
    onConfirm(dataUrl);
  };

  if (!visible) return null;

  return (
    <View className={styles.mask} onClick={onCancel}>
      <View className={styles.wrapper} onClick={e => e.stopPropagation()}>
        <View className={styles.header}>
          <Text className={styles.title}>手写签名</Text>
          <Text className={styles.hint}>请在下方区域内签名，保持字迹清晰</Text>
        </View>

        <View className={styles.canvasWrap}>
          <Canvas
            id="signCanvas"
            type="2d"
            className={styles.canvas}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            disableScroll
          />
          {!hasContent && (
            <View className={styles.placeholder}>
              <Text className={styles.placeholderIcon}>✏️</Text>
              <Text className={styles.placeholderText}>请在此区域书写签名</Text>
            </View>
          )}
        </View>

        <View className={styles.tips}>
          <View className={styles.tipItem}>
            <Text className={styles.tipIcon}>•</Text>
            <Text className={styles.tipText}>签名将作为法律有效签章使用</Text>
          </View>
          <View className={styles.tipItem}>
            <Text className={styles.tipIcon}>•</Text>
            <Text className={styles.tipText}>请使用真实手写签名，避免潦草</Text>
          </View>
        </View>

        <View className={styles.buttons}>
          <Button className={classnames(styles.btn, styles.btnOutline)} onClick={handleClear}>
            重新签名
          </Button>
          <Button className={classnames(styles.btn, styles.btnOutline)} onClick={onCancel}>
            取消
          </Button>
          <Button
            className={classnames(styles.btn, styles.btnPrimary, !hasContent && styles.disabled)}
            onClick={handleConfirm}
          >
            确认使用
          </Button>
        </View>
      </View>
    </View>
  );
};

export default SignPad;
