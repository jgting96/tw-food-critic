import React, { useState, useMemo, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { Review, Dish } from '../types';
import ReviewCard from '../components/ReviewCard';
import { MarkdownView } from '../components/MarkdownEditor';
import { SearchIcon, ChevronLeftIcon, EditIcon, LocationIcon, StarIcon, Cog6ToothIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, PlusIcon } from '../components/Icons';
import StarRating from '../components/StarRating';
import { auth } from '../services/firebase';

interface NotebookPageProps {
  reviews: Review[];
  onEdit: (r: Review) => void;
  user: firebase.User;
  categories: string[];
  onUpdateCategories: (newCategories: string[]) => void;
}

const CategoryManagerModal = ({ 
    isOpen, 
    onClose, 
    categories, 
    onUpdate 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    categories: string[], 
    onUpdate: (c: string[]) => void 
}) => {
    const [localCategories, setLocalCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        if(isOpen) setLocalCategories(categories);
    }, [isOpen, categories]);

    const handleSave = () => {
        onUpdate(localCategories);
        onClose();
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newList = [...localCategories];
        if (direction === 'up') {
            if (index === 0) return;
            [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        } else {
            if (index === newList.length - 1) return;
            [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
        }
        setLocalCategories(newList);
    };

    const deleteItem = (index: number) => {
        if (confirm("確定要刪除這個分類嗎？")) {
             setLocalCategories(localCategories.filter((_, i) => i !== index));
        }
    };

    const addItem = () => {
        if (newCategory.trim() && !localCategories.includes(newCategory.trim())) {
            setLocalCategories([...localCategories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
            onClick={onClose}
        >
             <div 
                className="bg-white rounded-2xl w-full max-w-sm flex flex-col max-h-[80vh] shadow-2xl animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
             >
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="font-bold text-slate-800 text-lg">類別管理</h3>
                     <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-slate-400" />
                     </button>
                 </div>
                 
                 <div className="p-4 border-b border-slate-100 bg-slate-50">
                     <div className="flex gap-2">
                         <input 
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="新增分類名稱..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                         />
                         <button 
                            onClick={addItem}
                            disabled={!newCategory.trim()}
                            className="bg-orange-600 text-white rounded-lg px-3 py-2 disabled:opacity-50 hover:bg-orange-700 transition-colors shadow-sm"
                         >
                            <PlusIcon className="w-5 h-5" />
                         </button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                     {localCategories.map((cat, idx) => (
                         <div key={cat} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-orange-200 hover:shadow-sm transition-all group">
                             <span className="font-medium text-slate-700">{cat}</span>
                             <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors">
                                     <ArrowUpIcon className="w-4 h-4 text-slate-600" />
                                 </button>
                                 <button onClick={() => moveItem(idx, 'down')} disabled={idx === localCategories.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors">
                                     <ArrowDownIcon className="w-4 h-4 text-slate-600" />
                                 </button>
                                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                 <button onClick={() => deleteItem(idx)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-500 transition-colors">
                                     <TrashIcon className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                     ))}
                     {localCategories.length === 0 && (
                         <div className="text-center py-8 text-slate-400 text-sm">暫無分類</div>
                     )}
                 </div>

                 <div className="p-4 border-t border-slate-100">
                     <button onClick={handleSave} className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform hover:bg-orange-700">
                         儲存變更
                     </button>
                 </div>
             </div>
        </div>
    );
};

const NotebookPage: React.FC<NotebookPageProps> = ({ reviews, onEdit, user, categories, onUpdateCategories }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('全部');
    const [viewingDish, setViewingDish] = useState<Dish | null>(null);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    const filtered = reviews.filter(r => {
        const types = r.type || [];
        const matchesSearch = 
            r.restaurant.name.includes(searchTerm) || 
            r.restaurant.address.includes(searchTerm) || 
            types.some(t => t.includes(searchTerm)) ||
            r.dishes.some(d => d.name.includes(searchTerm));
        const matchesType = filterType === '全部' || types.includes(filterType);
        return matchesSearch && matchesType;
    });

    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    // Calculate tags that are actually used in the current reviews
    const usedTags = useMemo(() => {
        const tags = new Set<string>();
        reviews.forEach(r => {
            if (r.type && Array.isArray(r.type)) {
                r.type.forEach(t => tags.add(t));
            }
        });
        return tags;
    }, [reviews]);

    // Combine "全部" with the managed categories list, BUT only include those that are used
    const availableFilterTypes = useMemo(() => {
        const list = ["全部"];
        
        // 1. Add used tags that exist in user preferences (to respect user order)
        categories.forEach(cat => {
            if (usedTags.has(cat)) {
                list.push(cat);
            }
        });

        // 2. Add any other used tags that might not be in settings anymore (orphaned tags)
        usedTags.forEach(tag => {
            if (!categories.includes(tag)) {
                list.push(tag);
            }
        });

        return list;
    }, [categories, usedTags]);

    if (viewingDish) {
        return (
            <div className="fixed inset-0 z-[70] bg-white animate-slide-in-right flex flex-col h-full max-w-[480px] mx-auto">
                {/* Hero Image */}
                <div className="h-1/3 min-h-[250px] relative bg-slate-200">
                    {viewingDish.image ? (
                        <img src={viewingDish.image} alt={viewingDish.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            無照片
                        </div>
                    )}
                    <button 
                        onClick={() => setViewingDish(null)}
                        className="absolute top-4 left-4 bg-black/30 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/50 transition-colors"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                         <h1 className="text-2xl font-bold text-white mb-1">{viewingDish.name}</h1>
                         <div className="flex items-center gap-3">
                             {viewingDish.price && (
                                 <span className="text-orange-500 font-bold text-lg font-mono">${viewingDish.price}</span>
                             )}
                             <StarRating value={viewingDish.rating} readOnly />
                         </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar pb-safe">
                    <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">餐點評論</h3>
                    {viewingDish.description ? (
                         <MarkdownView content={viewingDish.description} />
                    ) : (
                         <p className="text-slate-300 text-sm italic">沒有詳細描述...</p>
                    )}
                </div>
            </div>
        );
    }

    if (selectedReview) {
        // Detail View
        const types = selectedReview.type || [];
        return (
            <div className="bg-white min-h-screen animate-slide-in-right custom-scrollbar overflow-y-auto">
                <div className="relative h-64 bg-slate-200">
                    {selectedReview.dishes.find(d => d.image)?.image ? (
                        <img src={selectedReview.dishes.find(d => d.image)?.image as string} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">無封面照片</div>
                    )}
                    <button 
                        onClick={() => setSelectedReview(null)}
                        className="absolute top-4 left-4 bg-black/30 text-white p-2 rounded-full backdrop-blur-sm"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => { setSelectedReview(null); onEdit(selectedReview); }}
                        className="absolute top-4 right-4 bg-white text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 hover:bg-orange-50 transition-colors"
                    >
                        <EditIcon className="w-4 h-4" /> 編輯
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
                        <h1 className="text-white text-2xl font-bold">{selectedReview.restaurant.name}</h1>
                        <a 
                           href={selectedReview.restaurant.uri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-orange-300 text-sm flex items-center gap-1 mt-1 hover:text-orange-200 transition-colors cursor-pointer w-fit"
                        >
                            <LocationIcon className="w-4 h-4" />
                            <span className="underline underline-offset-2">{selectedReview.restaurant.address}</span>
                        </a>
                    </div>
                </div>

                <div className="p-5 space-y-6 pb-32">
                    {/* Types */}
                    <div className="flex flex-wrap gap-2">
                        {types.map(t => (
                            <span key={t} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Detailed Ratings Grid */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">整體評分</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                 <span className="text-xs text-slate-500">美味程度</span>
                                 <div className="flex items-center gap-1">
                                     <StarIcon filled={true} className="w-4 h-4 text-yellow-500" />
                                     <span className="font-bold text-slate-700">{selectedReview.ratingTaste}</span>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                 <span className="text-xs text-slate-500">環境氣氛</span>
                                 <div className="flex items-center gap-1">
                                     <StarIcon filled={true} className="w-4 h-4 text-yellow-500" />
                                     <span className="font-bold text-slate-700">{selectedReview.ratingEnvironment}</span>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                 <span className="text-xs text-slate-500">安靜程度</span>
                                 <div className="flex items-center gap-1">
                                     <StarIcon filled={true} className="w-4 h-4 text-yellow-500" />
                                     <span className="font-bold text-slate-700">{selectedReview.ratingQuiet}</span>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                 <span className="text-xs text-slate-500">再訪意願</span>
                                 <div className="flex items-center gap-1">
                                     <StarIcon filled={true} className="w-4 h-4 text-yellow-500" />
                                     <span className="font-bold text-slate-700">{selectedReview.ratingRevisit}</span>
                                 </div>
                             </div>
                             <div className="col-span-2 flex justify-between items-center pt-2">
                                 <span className="text-xs text-slate-500">總消費金額</span>
                                 <span className="font-bold text-orange-600 text-lg font-mono">${selectedReview.totalCost}</span>
                             </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 mb-4">餐點評論 (點擊查看詳情)</h3>
                        <div className="space-y-4">
                            {selectedReview.dishes.map((dish, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => setViewingDish(dish)}
                                    className="flex gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors cursor-pointer active:scale-[0.98]"
                                >
                                    {dish.image && <img src={dish.image} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-slate-200" alt={dish.name} />}
                                    <div className="flex-1 min-w-0 flex flex-col justify-start">
                                        <div className="flex justify-between items-start w-full">
                                            <h4 className="font-bold text-slate-800 line-clamp-1">{dish.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 mb-1">
                                            <StarRating value={dish.rating} size="sm" readOnly />
                                            {dish.price && <span className="text-xs text-orange-600 font-mono font-bold">${dish.price}</span>}
                                        </div>
                                        {/* Updated to use MarkdownView with high contrast text and NO line clamp */}
                                        <MarkdownView 
                                            content={dish.description} 
                                            className="text-sm text-slate-700 [&>p]:mb-1" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-4 text-center">
                        <a 
                            href={selectedReview.restaurant.uri} 
                            target="_blank" 
                            className="inline-flex items-center justify-center w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                        >
                            <LocationIcon className="w-5 h-5 mr-2" />
                            在 Google Maps 開啟
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="pb-24 pt-6 px-5 h-full flex flex-col">
            <CategoryManagerModal 
                isOpen={isManagerOpen} 
                onClose={() => setIsManagerOpen(false)}
                categories={categories}
                onUpdate={onUpdateCategories}
            />

            <header className="mb-6 mt-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain rounded-full shadow-sm bg-white" />
                   <div>
                       <h1 className="text-xl font-bold text-orange-800 tracking-wider">台灣美食評論家</h1>
                       <p className="text-xs text-slate-500 tracking-[0.2em] uppercase">Taiwan Food Critic</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                    {user.photoURL && (
                        <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-orange-200" />
                    )}
                    <button onClick={() => auth.signOut()} className="text-xs text-slate-400 underline">登出</button>
                </div>
            </header>

            <div className="mb-4 space-y-3">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input 
                        className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 shadow-sm"
                        placeholder="搜尋筆記..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={() => setIsManagerOpen(true)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-all shadow-sm flex-shrink-0 active:scale-95"
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                        {availableFilterTypes.map(t => (
                            <button 
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors border ${filterType === t ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        沒有找到符合的紀錄
                    </div>
                ) : (
                    filtered.map(r => (
                        <ReviewCard key={r.id} review={r} onClick={() => setSelectedReview(r)} />
                    ))
                )}
            </div>
        </div>
    );
};

export default NotebookPage;