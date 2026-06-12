import { StyleType, LightMode } from '@/store/dGeneratorStore';

export interface StyleColors {
  bg: string;
  floor: string;
  wall: string;
  accent: string;
  furniture: string;
  furnitureSecondary: string;
}

export interface LightConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalColor: string;
  background: string;
  fogColor: string;
}

export const styleConfigs: Record<StyleType, StyleColors & { name: string; icon: string }> = {
  modern: {
    name: '现代简约',
    icon: '▢',
    bg: '#FAF8F5',
    floor: '#DBBF85',
    wall: '#FAF8F5',
    accent: '#C4623A',
    furniture: '#555452',
    furnitureSecondary: '#9A9489',
  },
  nordic: {
    name: '北欧风格',
    icon: '❄',
    bg: '#F2F6F7',
    floor: '#E9D8B5',
    wall: '#FFFFFF',
    accent: '#7A9CA9',
    furniture: '#F5F2ED',
    furnitureSecondary: '#C3D3D9',
  },
  chinese: {
    name: '新中式',
    icon: '🏮',
    bg: '#FBF6EC',
    floor: '#8B6914',
    wall: '#FBF2ED',
    accent: '#A84E2C',
    furniture: '#6B5010',
    furnitureSecondary: '#4A380B',
  },
  luxury: {
    name: '轻奢风格',
    icon: '✨',
    bg: '#FDFBF8',
    floor: '#B8B0A0',
    wall: '#FAF8F5',
    accent: '#CBA356',
    furniture: '#2A2A2A',
    furnitureSecondary: '#CBA356',
  },
  industrial: {
    name: '工业风',
    icon: '⚙',
    bg: '#EFEFEF',
    floor: '#707070',
    wall: '#D6D6D6',
    accent: '#1A1A1A',
    furniture: '#3D3A35',
    furnitureSecondary: '#8C8C8C',
  },
  japanese: {
    name: '日式禅意',
    icon: '🎋',
    bg: '#FDFBF8',
    floor: '#CBA356',
    wall: '#F5F2ED',
    accent: '#415763',
    furniture: '#DBBF85',
    furnitureSecondary: '#E9D8B5',
  },
  mediterranean: {
    name: '地中海',
    icon: '🌊',
    bg: '#E1EAED',
    floor: '#DE8F69',
    wall: '#F5F2ED',
    accent: '#54707F',
    furniture: '#F5DCCE',
    furnitureSecondary: '#9CB8C2',
  },
};

export const lightConfigs: Record<LightMode, LightConfig> = {
  natural: {
    ambientIntensity: 0.5,
    directionalIntensity: 1.2,
    directionalColor: '#FFF5E6',
    background: '#FAF8F5',
    fogColor: '#F5F2ED',
  },
  warm: {
    ambientIntensity: 0.4,
    directionalIntensity: 1.0,
    directionalColor: '#FFD4A3',
    background: '#FBF2ED',
    fogColor: '#F5DCCE',
  },
  cool: {
    ambientIntensity: 0.6,
    directionalIntensity: 1.3,
    directionalColor: '#E8F4FF',
    background: '#F2F6F7',
    fogColor: '#E1EAED',
  },
};

export const nightConfig: LightConfig = {
  ambientIntensity: 0.15,
  directionalIntensity: 0.3,
  directionalColor: '#6B7A8F',
  background: '#1C272D',
  fogColor: '#2E3F48',
};
