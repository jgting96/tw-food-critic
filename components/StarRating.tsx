import React from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, readOnly = false, size = 'md' }) => {
  const stars = [1, 2, 3, 4, 5];
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors duration-200`}
        >
          <StarIcon 
            filled={star <= value} 
            className={`${sizeClasses[size]} ${star <= value ? 'text-yellow-400' : 'text-slate-300'}`} 
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
