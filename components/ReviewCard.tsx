import React, { useState } from 'react';
import { Review } from '../types';
import { LocationIcon } from './Icons';
import StarRating from './StarRating';

interface ReviewCardProps {
  review: Review;
  onClick: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick }) => {
  const mainDishImage = review.dishes.find(d => d.image)?.image;
  // Simplified type handling
  const types = review.type || [];
  
  // Calculate average of all 4 ratings
  const avgRating = (
    (review.ratingTaste || 0) + 
    (review.ratingEnvironment || 0) + 
    (review.ratingQuiet || 0) + 
    (review.ratingRevisit || 0)
  ) / 4;

  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-50 active:scale-95 transition-transform cursor-pointer flex gap-4">
      <div className="w-24 h-24 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden relative">
        {mainDishImage ? (
           <img src={mainDishImage} alt="Dish" className="w-full h-full object-cover" />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-300">
             <span className="text-xs">無照片</span>
           </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-slate-800 truncate pr-2">{review.restaurant.name}</h3>
          </div>
          <div className="flex flex-wrap gap-1 mt-1 mb-1">
             {types.slice(0, 3).map(t => (
               <span key={t} className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-md whitespace-nowrap">{t}</span>
             ))}
             {types.length > 3 && <span className="text-xs text-slate-400">+{types.length - 3}</span>}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
             <LocationIcon className="w-3 h-3 flex-shrink-0" />
             <span className="truncate">{review.restaurant.address}</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between mt-2">
            <div className="flex items-center gap-2">
                <StarRating value={avgRating} size="sm" readOnly />
                <span className="text-sm font-bold text-orange-600 font-mono">${review.totalCost}</span>
            </div>
            <p className="text-xs text-orange-500 font-medium">{review.date}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;