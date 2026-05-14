import React from 'react';

export default function Avatar({ src, alt, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <img
      src={src || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20simple%20icon&image_size=square'}
      alt={alt || 'avatar'}
      className={`rounded-full object-cover bg-gray-100 ${sizes[size]} ${className}`}
      onError={(e) => {
        e.target.src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20simple%20icon&image_size=square';
      }}
    />
  );
}
