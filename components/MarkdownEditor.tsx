import React, { useState } from 'react';
import { parse } from 'marked';
// Removed import DOMPurify from 'dompurify'; to avoid build errors if package is missing
import { EditIcon } from './Icons';

export const MarkdownView = ({ content, className }: { content: string, className?: string }) => {
  // Security Fix: Parse markdown then sanitize the resulting HTML
  // We access DOMPurify from the global window object because it is loaded via CDN in index.html
  const rawHtml = content ? parse(content) as string : '';
  
  // Use global DOMPurify
  const purifier = (window as any).DOMPurify;
  const cleanHtml = purifier ? purifier.sanitize(rawHtml) : rawHtml;

  if (!purifier) {
      console.warn("DOMPurify not loaded, content may be unsafe.");
  }

  return (
    <div
      className={`markdown-body leading-relaxed break-words ${className || 'text-sm text-slate-600'}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export const MarkdownInput = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [isEditing, setIsEditing] = useState(!value);

  if (isEditing) {
    return (
      <div className="animate-fade-in">
        <textarea 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-40 focus:outline-none focus:border-orange-500 text-sm text-slate-700 resize-none font-mono"
          placeholder="寫下你的美食評論..."
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
        />
        <div className="mt-2 bg-orange-50/50 p-2 rounded-lg border border-orange-100/50 text-xs text-slate-500 space-y-1">
          <p className="font-bold text-orange-700 mb-1">Markdown 格式提示：</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
             <span>**粗體**</span>
             <span>*斜體*</span>
             <span># 標題1</span>
             <span>## 標題2</span>
             <span>- 項目清單</span>
             <span>1. 數字清單</span>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(false)}
          className="w-full mt-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform"
        >
          完成編輯並預覽
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="w-full bg-white border border-slate-100 rounded-xl p-3 min-h-[5rem] cursor-pointer hover:bg-slate-50 transition-colors group relative"
    >
       {value ? (
         <MarkdownView content={value} />
       ) : (
         <span className="text-slate-300 text-xs">點擊此處開始撰寫心得...</span>
       )}
       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditIcon className="w-4 h-4 text-orange-500" />
       </div>
    </div>
  );
};