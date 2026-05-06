import { useState } from 'react';
import { cn, getInitials } from '../../lib/utils';

interface AvatarProps {
  name: string;
  src?: string;           // optional image URL
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

const colors = [
  'bg-[#2c4070]',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-[#4e68b0]',
  'bg-pink-500',
  'bg-teal-500',
  'bg-[#3d5490]',
  'bg-rose-500',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
        sizeClasses[size],
        !showImage && getColor(name),
        className
      )}
      title={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-white font-semibold select-none">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
