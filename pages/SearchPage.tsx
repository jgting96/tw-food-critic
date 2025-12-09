import React, { useState } from 'react';
import { Restaurant } from '../types';
import { searchRestaurants } from '../services/geminiService';
import { SearchIcon, GpsIcon, LocationIcon, StarIcon } from '../components/Icons';

const SearchPage = ({ onSelectRestaurant }: { onSelectRestaurant: (r: Restaurant) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const handleSearch = async (
    searchQuery = query,
    location = userLocation
  ) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults([]);
    try {
        const found = await searchRestaurants(searchQuery, location || undefined);
        setResults(found);
    } catch (e: any) {
        console.error("Search failed:", e);
        // Generic error alert
        alert("搜尋失敗，請檢查 API Key 或網路連線。\n(" + (e.message || "Unknown error") + ")");
    } finally {
        setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("您的瀏覽器不支援位置資訊");
      return;
    }

    setLocationStatus("正在取得位置...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setUserLocation(newLocation);
        setLocationStatus(`已取得位置，將優先搜尋附近`);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        let message = "無法取得位置資訊";
        if (error.code === error.PERMISSION_DENIED) {
          message = "您已拒絕位置資訊權限";
        }
        setLocationStatus(message);
      }
    );
  };

  return (
    <div className="pb-24 pt-6 px-5 h-full flex flex-col">
       <h2 className="text-xl font-bold text-slate-800 mb-6">搜尋餐廳</h2>
       
       <div className="relative mb-4">
         <input 
           type="text" 
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           placeholder="輸入餐廳名稱、地點..."
           className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-slate-700 focus:outline-none focus:border-orange-500 shadow-sm"
           onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
         />
         <button 
           onClick={() => handleSearch()}
           disabled={loading}
           className="absolute right-2 top-2 p-1.5 bg-orange-600 rounded-lg text-white disabled:opacity-50 hover:bg-orange-700 transition-colors"
         >
           {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SearchIcon className="w-5 h-5" />}
         </button>
       </div>

       <div className="flex justify-between items-center mb-6">
            <button 
                onClick={handleGetLocation}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 border ${
                    userLocation 
                    ? 'bg-orange-600 text-white border-orange-600 shadow-orange-200 ring-2 ring-orange-100 ring-offset-1' 
                    : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                }`}
            >
                <GpsIcon className="w-4 h-4" />
                {userLocation ? '已啟用定位' : '使用目前位置'}
            </button>
            {locationStatus && (
                <p className={`text-xs text-right max-w-[50%] leading-tight ${locationStatus.includes('無法') || locationStatus.includes('拒絕') ? 'text-red-500' : 'text-slate-500'}`}>
                    {locationStatus}
                </p>
            )}
        </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {results.map((r, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 relative">
               <div className="flex justify-between items-start">
                 <div className="pr-16">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{r.name}</h3>
                    <p className="text-sm text-slate-600 mt-2 flex items-start gap-1">
                        <LocationIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
                        <span className="font-medium">{r.address}</span>
                    </p>
                 </div>
                 {r.distance && (
                     <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-orange-100 shadow-sm">
                         <GpsIcon className="w-3 h-3" />
                         {r.distance}
                     </div>
                 )}
               </div>
               
               <div className="flex items-center gap-3 mt-1">
                   {r.rating ? (
                       <div className="flex items-center gap-1">
                           <StarIcon filled={true} className="w-3.5 h-3.5 text-yellow-500" />
                           <span className="text-sm font-bold text-slate-700">{r.rating}</span>
                           <span className="text-xs text-slate-400">({r.userRatingsTotal})</span>
                       </div>
                   ) : null}
               </div>

               <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  <a href={r.uri} target="_blank" rel="noreferrer" className="flex-1 text-center py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                    查看地圖
                  </a>
                  <button onClick={() => onSelectRestaurant(r)} className="flex-1 py-2.5 rounded-lg bg-orange-600 text-sm text-white font-medium shadow-md shadow-orange-100 active:scale-95 transition-transform hover:bg-orange-700">
                    撰寫評論
                  </button>
               </div>
            </div>
          ))}
          {results.length === 0 && !loading && (
             <div className="text-center text-slate-400 mt-10">
                <p>輸入關鍵字來尋找美食</p>
                <p className="text-xs mt-2 opacity-60">使用 Google Maps Places API 搜尋</p>
             </div>
          )}
       </div>
    </div>
  );
};

export default SearchPage;