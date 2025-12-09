import React from 'react';

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-[#f5f2ee] flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 flex flex-col items-center">
        <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-4 object-contain rounded-full shadow-lg bg-white" />
        <h1 className="text-3xl font-bold text-orange-800 tracking-wider">台灣美食評論家</h1>
        <p className="text-xs text-slate-500 tracking-[0.2em] uppercase mt-2">Taiwan Food Critic</p>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <p className="text-slate-600 mb-6 font-medium">請登入以存取您的私人美食筆記</p>
        <button 
          onClick={onLogin}
          className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-sm flex items-center justify-center gap-3 transition-colors active:scale-95"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          使用 Google 帳號登入
        </button>
      </div>
      <div className="mt-8 text-xs text-slate-400 max-w-xs mx-auto space-y-2">
        <p>僅限授權成員存取</p>
        <p className="opacity-50">若登入無反應，請嘗試停用 AdBlocker 或開啟無痕模式。</p>
      </div>
    </div>
  )
}

export default LoginPage;