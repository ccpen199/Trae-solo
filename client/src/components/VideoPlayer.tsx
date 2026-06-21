import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  wsUrl: string;
  permission?: string;
  onPTZCommand?: (cmd: string, speed?: number) => void;
  onTalkToggle?: (talking: boolean) => void;
  width?: string | number;
  height?: string | number;
  deviceName?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  wsUrl,
  permission = 'view',
  onPTZCommand,
  onTalkToggle,
  width = '100%',
  height = '400px',
  deviceName = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameQueueRef = useRef<Uint8Array[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [bitrate, setBitrate] = useState(0);
  const bytesRef = useRef(0);
  const lastBitrateUpdate = useRef(Date.now());

  useEffect(() => {
    connectStream();
    return () => disconnectStream();
  }, [wsUrl]);

  const connectStream = () => {
    setIsLoading(true);
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      let headerBuffer: Uint8Array | null = null;
      let waitingForFrameData = false;

      ws.onopen = () => {
        setIsPlaying(true);
        setIsLoading(false);
        ws.send(JSON.stringify({ type: 'request_keyframe' }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'video_frame') {
              waitingForFrameData = true;
              headerBuffer = null;
            } else if (msg.type === 'heartbeat_ack') {
            }
          } catch (e) {}
        } else if (event.data instanceof ArrayBuffer) {
          bytesRef.current += event.data.byteLength;
          const now = Date.now();
          if (now - lastBitrateUpdate.current >= 1000) {
            setBitrate(Math.round((bytesRef.current * 8) / (now - lastBitrateUpdate.current)));
            bytesRef.current = 0;
            lastBitrateUpdate.current = now;
          }
          drawFrame(new Uint8Array(event.data));
        }
      };

      ws.onerror = () => {
        setIsLoading(false);
      };

      ws.onclose = () => {
        setIsPlaying(false);
        setIsLoading(true);
      };
    } catch (e) {
      setIsLoading(false);
    }
  };

  const disconnectStream = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsPlaying(false);
  };

  const drawFrame = (data: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(deviceName || 'Live Stream', 10, 25);
    ctx.fillText(`${bitrate} kbps`, canvas.width - 100, 25);

    if (data.length > 0) {
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const len = Math.min(data.length, imgData.data.length);
      for (let i = 0; i < len; i++) {
        imgData.data[i] = data[i % data.length];
      }
      ctx.putImageData(imgData, 0, 0);
    }

    if (!isPlaying) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isLoading ? '连接中...' : '已断开', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }
  };

  useEffect(() => {
    let animFrame: number;
    const render = () => {
      const frame = frameQueueRef.current.shift();
      if (frame) {
        drawFrame(frame);
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#444';
            ctx.font = '14px monospace';
            ctx.fillText(deviceName || 'Live Stream', 10, 25);
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isLoading ? '正在建立连接...' : (isPlaying ? '等待视频帧...' : '点击重新连接'), canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
          }
        }
      }
      animFrame = requestAnimationFrame(render);
    };
    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [isLoading, isPlaying, deviceName]);

  const ptzBtnClass = (cmd: string) => `w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-blue-600 rounded text-white cursor-pointer transition-colors`;

  return (
    <div className="relative bg-black rounded-lg overflow-hidden" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        className="w-full h-full object-contain"
        style={{ aspectRatio: '16/9' }}
      />

      <div className="absolute top-2 left-2 flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
          {isPlaying ? 'LIVE' : 'OFFLINE'}
        </span>
        {bitrate > 0 && (
          <span className="text-white/70 text-xs bg-black/50 px-2 py-1 rounded">
            {bitrate} kbps
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm">
            <span>{deviceName}</span>
          </div>
          <div className="flex items-center gap-3">
            {permission === 'config' && (
              <div className="flex items-center gap-1">
                <div className={ptzBtnClass('up')} onClick={() => onPTZCommand?.('up')}>▲</div>
                <div className="flex flex-col gap-1">
                  <div className={ptzBtnClass('left')} onClick={() => onPTZCommand?.('left')}>◀</div>
                  <div className={ptzBtnClass('right')} onClick={() => onPTZCommand?.('right')}>▶</div>
                </div>
                <div className={ptzBtnClass('down')} onClick={() => onPTZCommand?.('down')}>▼</div>
                <div className={`w-10 h-10 flex items-center justify-center rounded cursor-pointer transition-colors ${isTalking ? 'bg-red-600' : 'bg-gray-700 hover:bg-blue-600'}`}>
                  <button
                    className="text-white text-xs"
                    onMouseDown={() => { setIsTalking(true); onTalkToggle?.(true); }}
                    onMouseUp={() => { setIsTalking(false); onTalkToggle?.(false); }}
                    onMouseLeave={() => { setIsTalking(false); onTalkToggle?.(false); }}
                  >🎙</button>
                </div>
              </div>
            )}
            <button
              className={`px-3 py-1 rounded text-white text-xs ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              onClick={() => isPlaying ? disconnectStream() : connectStream()}
            >
              {isPlaying ? '断开' : '连接'}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
