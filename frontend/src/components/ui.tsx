import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '', ...props }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
    {...props}
  >
    {children}
  </span>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };
  const initial = name?.[0] || '?';

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-medium overflow-hidden ${className}`}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initial}
    </div>
  );
};

interface IconProps {
  name: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className = '' }) => {
  const icons: Record<string, string> = {
    location: '📍',
    like: '👍',
    comment: '💬',
    share: '📤',
    fire: '🔥',
    warning: '⚠️',
    check: '✅',
    close: '❌',
    search: '🔍',
    bell: '🔔',
    home: '🏠',
    message: '💌',
    user: '👤',
    star: '⭐',
    coupon: '🎫',
    shop: '🏪',
    news: '📰',
    food: '🍜',
    help: '🆘',
    bus: '🚌',
    power: '⚡',
    water: '💧',
    plus: '➕',
    back: '←',
  };

  return <span className={className}>{icons[name] || '📌'}</span>;
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-500 text-center">{description}</p>}
  </div>
);

interface TagProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export const Tag: React.FC<TagProps> = ({ children, onClick, active }) => (
  <span
    onClick={onClick}
    className={`inline-block px-3 py-1 rounded-full text-xs font-medium transition-colors ${
      active
        ? 'bg-primary-500 text-white cursor-pointer'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
    }`}
  >
    {children}
  </span>
);

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, className = '' }) => {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="bg-gradient-to-r from-primary-400 to-primary-600 h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
