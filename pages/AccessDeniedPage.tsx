import React from 'react';
import firebase from 'firebase/compat/app';

const AccessDeniedPage = ({ user, onLogout }: { user: firebase.User, onLogout: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">🚫</span>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">存取被拒絕</h2>
      <p className="text-slate-500 mb-2">您的帳號 ({user.email}) 不在允許清單中。</p>
      <p className="text-slate-400 text-xs mb-8">此應用程式僅供特定人員使用。</p>
      <button 
        onClick={onLogout}
        className="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm"
      >
        登出
      </button>
    </div>
  )
}

export default AccessDeniedPage;