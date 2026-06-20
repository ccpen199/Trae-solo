import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Type, Image, Square, Circle, Share2, Minus } from 'lucide-react';
import useModelCardStore from '@/store/useModelCardStore';
import { cn } from '@/lib/utils';
import type { CanvasElement, SocialIconType } from '@shared/types';

const generateId = (): string => {
  return 'el-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

interface LibraryItemProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const LibraryItem: React.FC<LibraryItemProps> = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-xl bg-midnight-800/50 border border-midnight-700 hover:border-rose-500/50 hover:bg-midnight-800 transition-all duration-300 group"
  >
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-sapphire-500/20 flex items-center justify-center text-rose-400 group-hover:from-rose-500/30 group-hover:to-sapphire-500/30 transition-all duration-300">
      {icon}
    </div>
    <span className="mt-2 text-xs text-midnight-300 group-hover:text-white transition-colors duration-300">
      {label}
    </span>
  </button>
);

interface DraggableLibraryItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const DraggableLibraryItem: React.FC<DraggableLibraryItemProps> = ({ id, label, icon }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl bg-midnight-800/50 border border-midnight-700 hover:border-rose-500/50 hover:bg-midnight-800 transition-all duration-300 group cursor-grab active:cursor-grabbing",
        isDragging && 'opacity-50'
      )}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-sapphire-500/20 flex items-center justify-center text-rose-400 group-hover:from-rose-500/30 group-hover:to-sapphire-500/30 transition-all duration-300">
        {icon}
      </div>
      <span className="mt-2 text-xs text-midnight-300 group-hover:text-white transition-colors duration-300">
        {label}
      </span>
    </div>
  );
};

const socialIcons: { type: SocialIconType; label: string }[] = [
  { type: 'instagram', label: 'Instagram' },
  { type: 'tiktok', label: 'TikTok' },
  { type: 'wechat', label: '微信' },
  { type: 'weibo', label: '微博' },
  { type: 'xiaohongshu', label: '小红书' },
];

const ElementLibrary: React.FC = () => {
  const { addElement, canvasWidth, canvasHeight, elements } = useModelCardStore();

  const getMaxZIndex = () => {
    return elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) + 1 : 1;
  };

  const createTextElement = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2,
      width: 200,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: getMaxZIndex(),
      locked: false,
      content: {
        text: '双击编辑文字',
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 600,
        color: '#ffffff',
        textAlign: 'center',
      },
    };
    addElement(newElement);
  };

  const createPhotoElement = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'photo',
      x: canvasWidth / 2 - 150,
      y: canvasHeight / 2 - 150,
      width: 300,
      height: 300,
      rotation: 0,
      opacity: 1,
      zIndex: getMaxZIndex(),
      locked: false,
      content: {
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20model%20portrait&image_size=square_hd',
        borderRadius: 8,
      },
    };
    addElement(newElement);
  };

  const createRectangleElement = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'shape',
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 50,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      zIndex: getMaxZIndex(),
      locked: false,
      content: {
        shapeType: 'rectangle',
        shapeColor: '#f43f5e',
        borderRadius: 8,
      },
    };
    addElement(newElement);
  };

  const createCircleElement = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'shape',
      x: canvasWidth / 2 - 75,
      y: canvasHeight / 2 - 75,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      zIndex: getMaxZIndex(),
      locked: false,
      content: {
        shapeType: 'circle',
        shapeColor: '#8b5cf6',
      },
    };
    addElement(newElement);
  };

  const createDividerElement = () => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'shape',
      x: canvasWidth / 2 - 150,
      y: canvasHeight / 2,
      width: 300,
      height: 4,
      rotation: 0,
      opacity: 1,
      zIndex: getMaxZIndex(),
      locked: false,
      content: {
        shapeType: 'rectangle',
        shapeColor: '#ffffff',
        borderRadius: 2,
      },
    };
    addElement(newElement);
  };

  const createSocialIcon = (type: SocialIconType) => {
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'social-icon',
      x: canvasWidth / 2 - 30,
      y: canvasHeight / 2 - 30,
      width: 60,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: getMaxZIndex(),
      locked: false,
      content: {
        socialIconType: type,
        color: '#ffffff',
      },
    };
    addElement(newElement);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h4 className="text-sm font-semibold text-white mb-4">基础元素</h4>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <LibraryItem label="文本" icon={<Type className="w-5 h-5" />} onClick={createTextElement} />
        <LibraryItem label="图片" icon={<Image className="w-5 h-5" />} onClick={createPhotoElement} />
        <LibraryItem label="矩形" icon={<Square className="w-5 h-5" />} onClick={createRectangleElement} />
        <LibraryItem label="圆形" icon={<Circle className="w-5 h-5" />} onClick={createCircleElement} />
        <LibraryItem label="分割线" icon={<Minus className="w-5 h-5" />} onClick={createDividerElement} />
      </div>

      <h4 className="text-sm font-semibold text-white mb-4">社交图标</h4>
      <div className="grid grid-cols-2 gap-3">
        {socialIcons.map((social) => (
          <LibraryItem
            key={social.type}
            label={social.label}
            icon={<Share2 className="w-5 h-5" />}
            onClick={() => createSocialIcon(social.type)}
          />
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-midnight-800/30 border border-midnight-700">
        <p className="text-xs text-midnight-400 leading-relaxed">
          💡 <span className="text-midnight-200">提示:</span> 点击元素即可添加到画布，拖拽元素可以调整位置，使用右侧面板调整属性。
        </p>
      </div>
    </div>
  );
};

export default ElementLibrary;
