import StyleSelector from './StyleSelector';
import Scene3D from './Scene3D';
import ControlToolbar from './ControlToolbar';
import MaterialDrawer from './MaterialDrawer';
import BottomBar from './BottomBar';
import { useDGeneratorStore, StyleType } from '@/store/dGeneratorStore';
import { styleConfigs } from '@/config/styleConfigs';

export default function Step3Preview() {
  const { selectedStyle, selectedFurnitureId } = useDGeneratorStore();
  const currentStyle = styleConfigs[selectedStyle as StyleType];
  void currentStyle;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-ivory-50">
      <StyleSelector />

      <div className="flex-1 relative overflow-hidden">
        <Scene3D />
        <ControlToolbar />
        <MaterialDrawer />

        {selectedFurnitureId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-2.5 bg-white/90 backdrop-blur-xl rounded-full shadow-card border border-wood-200 flex items-center gap-2 animate-[float_2s_ease-in-out_infinite]">
            <span className="w-2.5 h-2.5 rounded-full bg-terracotta-500 animate-pulse" />
            <span className="text-sm font-medium text-carbon-700">
              已选中：{formatFurnitureId(selectedFurnitureId)}
            </span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-10 px-4 py-2.5 bg-white/80 backdrop-blur-xl rounded-xl shadow-card border border-wood-100/50 text-xs text-carbon-500 space-y-1">
          <p>🖱️ 左键拖拽：旋转视角</p>
          <p>🖱️ 右键拖拽：平移视角</p>
          <p>🖱️ 滚轮：缩放远近</p>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}

function formatFurnitureId(id: string): string {
  const map: Record<string, string> = {
    sofa: '三人沙发',
    'coffee-table': '茶几',
    'tv-cabinet': '电视柜（含电视）',
    rug: '地毯',
    'dining-table': '餐桌',
    bed: '双人床',
    nightstand: '床头柜',
    wardrobe: '衣柜',
    'plant-1': '绿植盆栽',
    'plant-2': '绿植盆栽',
  };
  if (id.startsWith('chair-')) return '餐椅';
  return map[id] || id;
}
