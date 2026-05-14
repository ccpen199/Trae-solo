import React from 'react';
import type { AvatarConfig } from '../types';

const hairStyles: Record<string, React.ReactNode> = {
  style1: (
    <path d="M30 20 Q40 10 50 15 Q60 10 70 20 L68 30 Q50 25 32 30 Z" />
  ),
  style2: (
    <path d="M25 25 Q30 5 50 5 Q70 5 75 25 L70 30 Q50 25 30 30 Z" />
  ),
  style3: (
    <circle cx="50" cy="25" r="22" />
  ),
  style4: (
    <path d="M25 28 L25 15 Q50 0 75 15 L75 28 Q60 32 50 30 Q40 32 25 28" />
  ),
  style5: (
    <>
      <ellipse cx="50" cy="25" rx="25" ry="18" />
      <circle cx="35" cy="18" r="8" />
      <circle cx="65" cy="18" r="8" />
    </>
  ),
  style6: (
    <path d="M30 30 Q20 20 35 10 Q50 5 65 10 Q80 20 70 30 Q50 25 30 30" />
  ),
};

const eyeStyles: Record<string, React.ReactNode> = {
  style1: (
    <>
      <circle cx="38" cy="45" r="4" fill="#1a1a1a" />
      <circle cx="62" cy="45" r="4" fill="#1a1a1a" />
      <circle cx="39" cy="44" r="1.5" fill="white" />
      <circle cx="63" cy="44" r="1.5" fill="white" />
    </>
  ),
  style2: (
    <>
      <ellipse cx="38" cy="45" rx="5" ry="6" fill="#1a1a1a" />
      <ellipse cx="62" cy="45" rx="5" ry="6" fill="#1a1a1a" />
      <circle cx="39" cy="44" r="2" fill="white" />
      <circle cx="63" cy="44" r="2" fill="white" />
    </>
  ),
  style3: (
    <>
      <path d="M33 45 Q38 42 43 45" stroke="#1a1a1a" strokeWidth="2" fill="none" />
      <path d="M57 45 Q62 42 67 45" stroke="#1a1a1a" strokeWidth="2" fill="none" />
    </>
  ),
  style4: (
    <>
      <circle cx="38" cy="45" r="5" fill="#1a1a1a" />
      <circle cx="62" cy="45" r="5" fill="#1a1a1a" />
      <circle cx="39" cy="43" r="2" fill="white" />
      <circle cx="63" cy="43" r="2" fill="white" />
      <circle cx="37" cy="47" r="1" fill="white" />
      <circle cx="61" cy="47" r="1" fill="white" />
    </>
  ),
};

const outfits: Record<string, React.ReactNode> = {
  casual: (
    <path d="M30 75 Q30 95 50 95 Q70 95 70 75 L65 70 Q50 75 35 70 Z" fill="#3B82F6" />
  ),
  formal: (
    <>
      <path d="M30 75 L30 95 L50 95 L70 95 L70 75 L65 70 L50 75 L35 70 Z" fill="#1e3a8a" />
      <path d="M45 75 L50 90 L55 75" fill="white" />
      <circle cx="50" cy="82" r="2" fill="#1e3a8a" />
    </>
  ),
  sport: (
    <>
      <path d="M30 75 Q30 95 50 95 Q70 95 70 75 L65 70 Q50 75 35 70 Z" fill="#EF4444" />
      <path d="M35 80 L65 80" stroke="white" strokeWidth="2" />
    </>
  ),
  gamer: (
    <>
      <path d="M30 75 Q30 95 50 95 Q70 95 70 75 L65 70 Q50 75 35 70 Z" fill="#7c3aed" />
      <path d="M40 82 L45 78 L50 82 L55 78 L60 82" stroke="#a855f7" strokeWidth="2" fill="none" />
    </>
  ),
  anime: (
    <>
      <path d="M30 75 Q30 95 50 95 Q70 95 70 75 L65 70 Q50 75 35 70 Z" fill="#ec4899" />
      <circle cx="50" cy="85" r="8" fill="#fdf2f8" />
      <circle cx="47" cy="83" r="1.5" fill="#ec4899" />
      <circle cx="53" cy="83" r="1.5" fill="#ec4899" />
    </>
  ),
  fantasy: (
    <>
      <path d="M28 75 L35 95 L65 95 L72 75 L60 70 L50 75 L40 70 Z" fill="#8b5cf6" />
      <path d="M42 75 L42 90" stroke="#c4b5fd" strokeWidth="2" />
      <path d="M58 75 L58 90" stroke="#c4b5fd" strokeWidth="2" />
      <path d="M38 82 L62 82" stroke="#c4b5fd" strokeWidth="1" />
    </>
  ),
};

const accessories: Record<string, React.ReactNode> = {
  none: null,
  glasses: (
    <>
      <circle cx="38" cy="45" r="7" fill="none" stroke="#333" strokeWidth="2" />
      <circle cx="62" cy="45" r="7" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="45" y1="45" x2="55" y2="45" stroke="#333" strokeWidth="2" />
    </>
  ),
  hat: (
    <>
      <ellipse cx="50" cy="20" rx="28" ry="5" fill="#1a1a1a" />
      <path d="M30 20 Q30 5 50 5 Q70 5 70 20 Z" fill="#1a1a1a" />
    </>
  ),
  headphone: (
    <>
      <path d="M28 35 Q28 15 50 15 Q72 15 72 35" fill="none" stroke="#333" strokeWidth="5" />
      <circle cx="28" cy="40" r="8" fill="#333" />
      <circle cx="72" cy="40" r="8" fill="#333" />
      <circle cx="28" cy="40" r="5" fill="#666" />
      <circle cx="72" cy="40" r="5" fill="#666" />
    </>
  ),
  crown: (
    <>
      <path d="M28 30 L32 18 L40 25 L50 15 L60 25 L68 18 L72 30 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="35" cy="22" r="3" fill="#ef4444" />
      <circle cx="50" cy="18" r="3" fill="#3b82f6" />
      <circle cx="65" cy="22" r="3" fill="#22c55e" />
    </>
  ),
};

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ config, size = 60, className = '', animate = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${animate ? 'animate-float' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="50" cy="60" rx="25" ry="30" fill={config.skinColor} />
      
      <g fill={config.hairColor}>
        {hairStyles[config.hairStyle] || hairStyles.style1}
      </g>
      
      {eyeStyles[config.eyeStyle] || eyeStyles.style1}
      
      <path d="M45 55 Q50 60 55 55" stroke="#e57373" strokeWidth="2" fill="none" />
      
      {outfits[config.outfit] || outfits.casual}
      
      {config.accessory && config.accessory !== 'none' && (
        <g>{accessories[config.accessory]}</g>
      )}
      
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
    </svg>
  );
};

export default Avatar;
