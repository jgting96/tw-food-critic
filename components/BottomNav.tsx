import React from 'react';
import { ViewState } from '../types';
import { BookIcon, SearchIcon } from './Icons';

interface BottomNavProps {
    active: ViewState;
    onChange: (v: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] max-w-[480px] mx-auto z-50">
      <div className="grid grid-cols-2 h-16">
        <button 
            onClick={() => onChange('NOTEBOOK')} 
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${active === 'NOTEBOOK' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <BookIcon className="w-6 h-6" />
          <span className="text-xs font-medium">筆記本</span>
        </button>
        <button 
            onClick={() => onChange('SEARCH')} 
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${active === 'SEARCH' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <SearchIcon className="w-6 h-6" />
          <span className="text-xs font-medium">找餐廳</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;