import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDraggable, DndContext, DragOverlay, useDroppable, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Instagram, Twitter } from 'lucide-react';
import useModelCardStore from '@/store/useModelCardStore';
import { cn } from '@/lib/utils';
import type { CanvasElement, SocialIconType } from '@shared/types';

const SocialIconRenderer: React.FC<{ type: SocialIconType; color?: string }> = ({ type, color = '#ffffff' }) => {
  switch (type) {
    case 'instagram':
      return <Instagram style={{ color }} className="w-full h-full" />;
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ color }} className="w-full h-full">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case 'wechat':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ color }} className="w-full h-full">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
        </svg>
      );
    case 'weibo':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ color }} className="w-full h-full">
          <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.578-.18-.405-.649.389-1.061.429-1.978.001-2.63-.801-1.22-2.994-1.155-5.534-.032l.001-.001c0-.001-.067.029-.189.085-.088-.221-.194-.434-.315-.635 1.792-.908 2.94-2.146 2.94-3.506 0-2.063-2.879-3.501-6.42-3.501-3.542 0-6.42 1.438-6.42 3.501 0 1.36 1.148 2.598 2.94 3.506-.479.775-.851 1.669-1.105 2.667-3.714 1.018-6.241 3.547-6.241 6.493 0 3.925 4.793 6.377 9.543 6.377 6.139 0 10.54-3.577 10.54-6.377 0-1.706-1.449-3.194-3.737-3.903z" />
        </svg>
      );
    case 'xiaohongshu':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ color }} className="w-full h-full">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 13.5h-7v-1h7v1zm0-3h-7v-1h7v1zm0-3h-7v-1h7v1z" />
        </svg>
      );
    default:
      return <Twitter style={{ color }} className="w-full h-full" />;
  }
};

const CanvasElementRenderer: React.FC<{ element: CanvasElement }> = ({ element }) => {
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    borderRadius: element.content?.borderRadius ? `${element.content.borderRadius}px` : undefined,
    overflow: 'hidden',
  };

  switch (element.type) {
    case 'photo':
      return (
        <div style={style}>
          <img
            src={element.content?.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      );
    case 'text':
      return (
        <div
          style={{
            ...style,
            fontSize: element.content?.fontSize || 16,
            fontFamily: element.content?.fontFamily || 'Inter',
            fontWeight: element.content?.fontWeight || 400,
            color: element.content?.color || '#ffffff',
            textAlign: element.content?.textAlign || 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          {element.content?.text || '文本内容'}
        </div>
      );
    case 'shape':
      if (element.content?.shapeType === 'circle') {
        return (
          <div
            style={{
              ...style,
              backgroundColor: element.content?.shapeColor || '#ffffff',
              borderRadius: '50%',
            }}
          />
        );
      }
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.content?.shapeColor || '#ffffff',
            borderWidth: element.content?.borderWidth || 0,
            borderColor: element.content?.borderColor || 'transparent',
            borderStyle: 'solid',
          }}
        />
      );
    case 'social-icon':
      return (
        <div style={style}>
          <SocialIconRenderer type={element.content?.socialIconType || 'instagram'} color={element.content?.color || '#ffffff'} />
        </div>
      );
    case 'divider':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.content?.shapeColor || '#ffffff',
            height: element.content?.borderWidth || 2,
          }}
        />
      );
    default:
      return null;
  }
};

interface DraggableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  zoom: number;
  onDragEnd: () => void;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ element, isSelected, onSelect, onUpdate, zoom, onDragEnd }) => {
  const resizingRef = useRef<{ type: string; startX: number; startY: number; startWidth: number; startHeight: number; startXPos: number; startYPos: number } | null>(null);
  const rotatingRef = useRef<{ startAngle: number; startRotation: number; centerX: number; centerY: number } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    disabled: element.locked,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!element.locked) {
      onSelect(element.id);
    }
  }, [element.id, element.locked, onSelect]);

  const handleResizeStart = useCallback((e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (element.locked) return;

    resizingRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startXPos: element.x,
      startYPos: element.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { type, startX, startY, startWidth, startHeight, startXPos, startYPos } = resizingRef.current;
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      if (type.includes('e')) newWidth = Math.max(20, startWidth + dx);
      if (type.includes('w')) {
        newWidth = Math.max(20, startWidth - dx);
        newX = startXPos + (startWidth - newWidth);
      }
      if (type.includes('s')) newHeight = Math.max(20, startHeight + dy);
      if (type.includes('n')) {
        newHeight = Math.max(20, startHeight - dy);
        newY = startYPos + (startHeight - newHeight);
      }

      onUpdate(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [element, zoom, onUpdate, onDragEnd]);

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (element.locked) return;

    const rect = (e.currentTarget as HTMLElement).closest('[data-element-wrapper]')?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    rotatingRef.current = {
      startAngle,
      startRotation: element.rotation,
      centerX,
      centerY,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!rotatingRef.current) return;
      const { startAngle, startRotation, centerX, centerY } = rotatingRef.current;
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
      const newRotation = startRotation + (currentAngle - startAngle);
      onUpdate(element.id, { rotation: newRotation });
    };

    const handleMouseUp = () => {
      rotatingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [element, onUpdate, onDragEnd]);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    cursor: element.locked ? 'not-allowed' : 'move',
    transform: transform ? `translate3d(${transform.x / zoom}px, ${transform.y / zoom}px, 0)` : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const cursorStyles: Record<string, string> = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    e: 'e-resize', se: 'se-resize', s: 's-resize',
    sw: 'sw-resize', w: 'w-resize',
  };
  const positionStyles: Record<string, React.CSSProperties> = {
    nw: { top: -4, left: -4 },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)' },
    se: { bottom: -4, right: -4 },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -4, left: -4 },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)' },
  };

  return (
    <div
      ref={setNodeRef}
      data-element-wrapper
      style={style}
      onMouseDown={handleMouseDown}
      {...(!element.locked ? { ...listeners, ...attributes } : {})}
      className={cn(
        'group',
        isSelected && !element.locked && 'ring-2 ring-rose-500 ring-offset-0',
      )}
    >
      <CanvasElementRenderer element={element} />

      {isSelected && !element.locked && (
        <>
          {resizeHandles.map((handle) => (
            <div
              key={handle}
              onMouseDown={(e) => handleResizeStart(e, handle)}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                backgroundColor: '#ffffff',
                border: '2px solid #f43f5e',
                borderRadius: '50%',
                cursor: cursorStyles[handle],
                zIndex: 1000,
                ...positionStyles[handle],
              }}
            />
          ))}
          <div
            onMouseDown={handleRotateStart}
            style={{
              position: 'absolute',
              top: -32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 20,
              height: 20,
              backgroundColor: '#f43f5e',
              borderRadius: '50%',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 12a9 9 0 11-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              top: -32,
              left: 'calc(50% + 14px)',
              width: 1,
              height: 12,
              backgroundColor: '#f43f5e',
            }}
          />
        </>
      )}
    </div>
  );
};

const EditorCanvas: React.FC = () => {
  const {
    elements,
    selectedElementId,
    canvasWidth,
    canvasHeight,
    zoom,
    showGrid,
    selectElement,
    updateElement,
    saveToHistory,
  } = useModelCardStore();

  const [activeId, setActiveId] = useState<string | null>(null);

  const { setNodeRef: setDropRef } = useDroppable({ id: 'canvas' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (delta.x !== 0 || delta.y !== 0) {
      const el = elements.find(e => e.id === String(active.id));
      if (el) {
        updateElement(el.id, {
          x: el.x + delta.x / zoom,
          y: el.y + delta.y / zoom,
        });
        saveToHistory();
      }
    }
    setActiveId(null);
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  }, [selectElement]);

  const activeElement = activeId ? elements.find(e => e.id === activeId) : null;

  const gridSize = 20;
  const gridLines = [];
  if (showGrid) {
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      gridLines.push(
        <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={canvasHeight} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      );
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      gridLines.push(
        <line key={`h-${y}`} x1={0} y1={y} x2={canvasWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      );
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="w-full h-full flex items-center justify-center overflow-auto p-8 bg-midnight-950"
        onClick={handleCanvasClick}
      >
        <div
          ref={setDropRef}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          }}
          className="bg-midnight-800 shadow-2xl"
          onClick={handleCanvasClick}
        >
          {showGrid && (
            <svg
              width={canvasWidth}
              height={canvasHeight}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              {gridLines}
            </svg>
          )}

          {sortedElements.map((element) => (
            <DraggableElement
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              onSelect={selectElement}
              onUpdate={updateElement}
              zoom={zoom}
              onDragEnd={saveToHistory}
            />
          ))}
        </div>

        <DragOverlay>
          {activeElement ? (
            <div
              style={{
                width: activeElement.width,
                height: activeElement.height,
                opacity: 0.8,
                transform: `rotate(${activeElement.rotation}deg) scale(${zoom})`,
              }}
            >
              <CanvasElementRenderer element={activeElement} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default EditorCanvas;
