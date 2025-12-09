import React, { useState, useEffect, useMemo } from 'react';
import { Review, Restaurant, Dish } from '../types';
import { MarkdownInput } from '../components/MarkdownEditor';
import { ChevronLeftIcon, EditIcon, GpsIcon, PlusIcon, TrashIcon } from '../components/Icons';
import StarRating from '../components/StarRating';
import { compressImage } from '../services/imageCompressor';

interface EditorPageProps {
  initialData?: Review;
  initialRestaurant?: Restaurant;
  isSaving: boolean;
  allAvailableTypes: string[];
  onSave: (r: Review) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ 
  initialData, 
  initialRestaurant, 
  isSaving,
  allAvailableTypes,
  onSave, 
  onDelete,
  onCancel 
}) => {
  const [formData, setFormData] = useState<Review>({
     id: '',
     restaurant: { name: '', address: ''},
     date: new Date().toISOString().split('T')[0],
     type: [],
     totalCost: 0,
     ratingEnvironment: 0,
     ratingQuiet: 0,
     ratingRevisit: 0,
     ratingTaste: 0,
     dishes: [],
     createdAt: Date.now(),
     updatedAt: Date.now(),
     ...initialData
  });

  // Ensure type is array (handled by reviewService now but keeping for safety)
  useEffect(() => {
    if (initialData) {
        setFormData({
            ...initialData,
            type: initialData.type || [],
        });
    } else if (initialRestaurant) {
        setFormData(prev => ({ ...prev, id: Date.now().toString(), restaurant: initialRestaurant, createdAt: Date.now() }));
    }
  }, [initialData, initialRestaurant]);

  // Auto calculate total cost when dishes change
  useEffect(() => {
     if (formData.dishes) {
         const calculatedCost = formData.dishes.reduce((sum, dish) => sum + (dish.price || 0), 0);
         setFormData(prev => ({ ...prev, totalCost: calculatedCost }));
     }
  }, [formData.dishes]);

  const restaurant = formData.restaurant;

  // Dish Management
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [tempDish, setTempDish] = useState<Partial<Dish>>({ rating: 0, description: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const openAddDish = () => {
    setEditingDishId(null);
    setTempDish({ rating: 0, description: '', name: '', price: undefined, image: undefined });
    setImagePreview(null);
    setIsDishModalOpen(true);
  };

  const openEditDish = (dish: Dish) => {
    setEditingDishId(dish.id);
    setTempDish({ ...dish });
    setImagePreview(dish.image || null);
    setIsDishModalOpen(true);
  };

  const handleSaveDish = () => {
     if(!tempDish.name) return alert("請輸入餐點名稱");
     
     if (editingDishId) {
       // Update existing
       setFormData(prev => ({
         ...prev,
         dishes: prev.dishes?.map(d => d.id === editingDishId ? { ...d, ...tempDish } as Dish : d)
       }));
     } else {
       // Create new
       const newDish: Dish = {
         id: Date.now().toString(),
         name: tempDish.name!,
         price: tempDish.price,
         rating: tempDish.rating || 0,
         description: tempDish.description || '',
         image: tempDish.image
       };
       setFormData(prev => ({ ...prev, dishes: [...(prev.dishes || []), newDish] }));
     }
     
     setIsDishModalOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressImage(file);
        setTempDish(prev => ({ ...prev, image: compressedBase64 }));
        setImagePreview(compressedBase64);
      } catch (error) {
        console.error("Image compression failed", error);
        alert("圖片壓縮失敗，請嘗試另一張圖片。");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Types Management
  const [customType, setCustomType] = useState('');
  const toggleType = (t: string) => {
      const currentTypes = formData.type || [];
      if (currentTypes.includes(t)) {
          setFormData({ ...formData, type: currentTypes.filter(x => x !== t) });
      } else {
          setFormData({ ...formData, type: [...currentTypes, t] });
      }
  };
  const addCustomType = () => {
      if (customType && !formData.type?.includes(customType)) {
          setFormData({ ...formData, type: [...(formData.type || []), customType] });
          setCustomType('');
      }
  };

  const handleSave = () => {
    if (!restaurant) return;
    onSave({ ...formData, updatedAt: Date.now() });
  };
  
  const handleDelete = () => {
      if (formData.id && onDelete) {
           if(confirm("確定要刪除這篇評論嗎？此動作無法復原。")) {
               onDelete(formData.id);
           }
      }
  }

  // Combine suggested types (managed by user now) and any types present in this specific review
  const displayedTypes = useMemo(() => {
    // 1. Get all used types
    const combined = new Set([...allAvailableTypes, ...(formData.type || [])]);
    
    // 2. We want to preserve the order of 'allAvailableTypes' (user preferences),
    // and append any extra custom types found in this review at the end.
    const sortedList = [...allAvailableTypes];
    
    // Add types that are in formData but not in the standard list
    (formData.type || []).forEach(t => {
        if (!sortedList.includes(t)) {
            sortedList.push(t);
        }
    });

    return sortedList;
  }, [allAvailableTypes, formData.type]);


  if (isDishModalOpen) {
      return (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col max-w-[480px] mx-auto animate-fade-in-up">
            <div className="p-4 border-b flex justify-between items-center bg-white/90 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={() => setIsDishModalOpen(false)} className="text-slate-500">取消</button>
                <h3 className="font-bold text-slate-800">{editingDishId ? '編輯餐點' : '新增餐點'}</h3>
                <button onClick={handleSaveDish} className="text-orange-600 font-bold">完成</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar pb-20">
                <div>
                   <label className="label-text">餐點照片</label>
                   <div className="relative w-full h-48 bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden group">
                      {isCompressing ? (
                          <div className="flex flex-col items-center text-slate-500">
                             <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-2" />
                             <span className="text-xs">壓縮中...</span>
                          </div>
                      ) : imagePreview ? (
                          <>
                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full">更換照片</span>
                            </div>
                          </>
                      ) : (
                          <div className="text-slate-400 flex flex-col items-center pointer-events-none">
                              <PlusIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs">上傳照片</span>
                          </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isCompressing} className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                </div>
                
                <input 
                  className="w-full text-lg font-bold border-b border-slate-200 py-2 focus:outline-none focus:border-orange-500 bg-transparent" 
                  placeholder="餐點名稱 (例如：招牌牛肉麵)"
                  value={tempDish.name || ''}
                  onChange={e => setTempDish({...tempDish, name: e.target.value})}
                />
                
                <div className="flex items-center gap-4">
                     <span className="text-slate-500 text-sm">價格 $</span>
                     <input 
                       type="number"
                       className="flex-1 bg-slate-50 rounded-lg p-2 focus:outline-none"
                       placeholder="0"
                       value={tempDish.price || ''}
                       onChange={e => setTempDish({...tempDish, price: Number(e.target.value)})}
                     />
                </div>

                <div>
                   <label className="label-text mb-2">評分</label>
                   <StarRating value={tempDish.rating || 0} onChange={v => setTempDish({...tempDish, rating: v})} size="lg" />
                </div>

                <div>
                   <div className="flex justify-between items-center mb-2">
                     <label className="label-text">筆記 (點擊下方編輯)</label>
                   </div>
                   <MarkdownInput 
                     value={tempDish.description || ''} 
                     onChange={v => setTempDish({...tempDish, description: v})}
                   />
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="h-full bg-white flex flex-col animate-slide-in-right">
       <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={onCancel} className="text-slate-500 flex items-center gap-1 text-sm">
             <ChevronLeftIcon className="w-5 h-5" /> 返回
          </button>
          <span className="font-bold text-slate-800">撰寫評論</span>
          <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="text-orange-600 font-bold text-sm bg-orange-50 px-3 py-1.5 rounded-full disabled:opacity-50"
          >
             {isSaving ? '儲存中...' : '儲存'}
          </button>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-32">
          {/* Restaurant Info Card */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 relative">
             <h2 className="text-lg font-bold text-slate-800 pr-12">{restaurant?.name}</h2>
             <p className="text-xs text-slate-500 mt-1">{restaurant?.address}</p>
             {restaurant?.uri && (
                 <a href={restaurant.uri} target="_blank" className="text-xs text-blue-500 mt-2 block hover:underline">查看 Google Map</a>
             )}
          </div>

          {/* Metadata Form */}
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="flex flex-col gap-1">
                <label className="label-text">日期</label>
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors text-slate-900 font-medium" 
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="label-text">總費用 (自動加總)</label>
                <input 
                   type="number" 
                   value={formData.totalCost || ''} 
                   onChange={e => setFormData({...formData, totalCost: Number(e.target.value)})}
                   className="w-full bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors text-slate-900 font-bold" 
                   placeholder="$"
                />
             </div>
             
             {/* Multi-select Types */}
             <div className="col-span-2">
                 <label className="label-text">類型 (可複選)</label>
                 <div className="flex flex-wrap gap-2 mb-2">
                     {displayedTypes.map(t => {
                         const isSelected = formData.type?.includes(t);
                         return (
                             <button
                                 key={t}
                                 onClick={() => toggleType(t)}
                                 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                     isSelected 
                                     ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                                     : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                 }`}
                             >
                                 {t}
                             </button>
                         )
                     })}
                 </div>
                 <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                        placeholder="其他類型..."
                        value={customType}
                        onChange={e => setCustomType(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomType()}
                    />
                    <button 
                        onClick={addCustomType}
                        disabled={!customType}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                        新增
                    </button>
                 </div>
             </div>
          </div>

          {/* Ratings */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 mb-6 space-y-4">
              <h3 className="font-bold text-slate-700 mb-2">整體評分</h3>
              {[
                  { label: "環境", key: 'ratingEnvironment' },
                  { label: "美味", key: 'ratingTaste' },
                  { label: "安靜", key: 'ratingQuiet' },
                  { label: "再訪", key: 'ratingRevisit' }
              ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <StarRating 
                        value={(formData as any)[item.key]} 
                        onChange={(v) => setFormData({...formData, [item.key]: v})} 
                      />
                  </div>
              ))}
          </div>

          {/* Dishes */}
          <div>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700">餐點紀錄</h3>
                  <span className="text-xs text-slate-400">{formData.dishes?.length} 道</span>
              </div>
              
              <div className="space-y-3 mb-4">
                 {formData.dishes?.map((dish, i) => (
                     <div 
                        key={i} 
                        onClick={() => openEditDish(dish)}
                        className="flex gap-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm cursor-pointer hover:border-orange-300 transition-colors"
                     >
                         {dish.image && (
                             <img src={dish.image} alt={dish.name} className="w-16 h-16 rounded-lg object-cover" />
                         )}
                         <div className="flex-1 min-w-0">
                             <div className="flex justify-between">
                                 <h4 className="font-bold text-sm text-slate-800">{dish.name}</h4>
                                 <StarRating value={dish.rating} size="sm" readOnly />
                             </div>
                             <div className="flex justify-between items-end mt-1">
                                <span className="text-xs text-orange-600 font-bold">${dish.price}</span>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <EditIcon className="w-3 h-3" /> 編輯
                                </div>
                             </div>
                         </div>
                     </div>
                 ))}
              </div>

              <button 
                onClick={openAddDish}
                className="w-full py-3 border-2 border-dashed border-orange-200 text-orange-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
              >
                  <PlusIcon className="w-5 h-5" />
                  新增餐點卡
              </button>
          </div>
          
          {/* Delete Button Area */}
          {initialData?.id && onDelete && (
             <div className="mt-8 border-t border-slate-100 pt-6 flex justify-center">
                 <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-600 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
                 >
                     <TrashIcon className="w-5 h-5" />
                     刪除此篇評論
                 </button>
             </div>
          )}
       </div>
    </div>
  );
};

export default EditorPage;