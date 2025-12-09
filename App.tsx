import React, { useState, useEffect, useMemo } from 'react';
import { Review, ViewState, Restaurant, SUGGESTED_RESTAURANT_TYPES } from './types';
import { fetchReviews, saveReviewToFirestore, deleteReviewFromFirestore } from './services/reviewService';
import { getUserSettings, saveUserSettings } from './services/settingsService';
import { auth, googleProvider } from './services/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Page Imports
import LoginPage from './pages/LoginPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import SearchPage from './pages/SearchPage';
import EditorPage from './pages/EditorPage';
import NotebookPage from './pages/NotebookPage';
import BottomNav from './components/BottomNav';


// --- CONFIGURATION ---

// Emails are now read from environment variables for better security.
// FIX: If variable is not set (e.g. empty string), we might want to warn or allow all in DEV.
// For now, if list is empty, we handle it inside the App component to avoid locking everyone out.
const emailsFromEnv = process.env.ALLOWED_EMAILS || '';
const ALLOWED_EMAILS = emailsFromEnv.split(',').map(email => email.trim()).filter(Boolean);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const [view, setView] = useState<ViewState>('NOTEBOOK');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [draftRestaurant, setDraftRestaurant] = useState<Restaurant | null>(null);
  const [editingReview, setEditingReview] = useState<Review | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingError, setLoadingError] = useState<React.ReactNode | null>(null);
  
  // User Preferences
  const [categories, setCategories] = useState<string[]>(SUGGESTED_RESTAURANT_TYPES);

  // Initial Load from Firebase (Only if user is logged in and allowed)
  const loadData = async () => {
    // Basic Gatekeeping: Must be logged in
    if (!user) return;
    
    // Check Allowlist (Only if list is defined)
    if (ALLOWED_EMAILS.length > 0 && user.email && !ALLOWED_EMAILS.includes(user.email)) {
        return; // AccessDeniedPage will handle the UI
    }

    setIsLoading(true);
    setLoadingError(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("連線逾時，請檢查網路連線")), 20000)
    );

    try {
      // Strategy: Load Settings gently. If it fails (e.g., permission denied), use defaults.
      // Load Reviews strictly. If it fails, show error.
      
      // 1. Load Settings (Non-blocking)
      let settingsData = { categories: [] as string[] };
      try {
          const s = await getUserSettings(user.uid);
          if (s) settingsData = s;
      } catch (settingsErr) {
          // Handled in service, silently ignored here
      }

      // 2. Load Reviews (Blocking)
      // SHARED MODE: We do NOT pass user.uid to fetchReviews, so we get everyone's data.
      const reviewsData = await Promise.race([fetchReviews(), timeoutPromise]) as Review[];
      
      setReviews(reviewsData);
      
      // Apply Settings (or Defaults)
      if (settingsData.categories && settingsData.categories.length > 0) {
          setCategories(settingsData.categories);
      } else {
          setCategories(SUGGESTED_RESTAURANT_TYPES);
      }

    } catch (e: any) {
      console.error("Loading Error:", e);
      
      const errorString = e.toString();
      let errorNode: React.ReactNode = errorString;

      // 1. Permission Error (Rules)
      if (
        e.code === 'permission-denied' || 
        errorString.includes('permission-denied') ||
        errorString.includes('Missing or insufficient permissions')
      ) {
          errorNode = (
            <div className="text-left bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
               <p className="font-bold mb-3 text-red-800 flex items-center gap-2">
                 <span className="text-xl">🔒</span> 資料庫權限不足
               </p>
               <p className="mb-2 text-sm text-red-700 font-medium">請前往 Firebase Console 修改 Firestore Rules：</p>
               <div className="bg-white p-3 rounded border border-slate-300 overflow-x-auto my-3">
                 <code className="text-xs text-slate-600 font-mono whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reviews/{reviewId} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                 </code>
               </div>
               <p className="text-xs text-red-600">複製上方代碼，貼上至 Firebase Console / Firestore Database / Rules 頁籤並發布。</p>
            </div>
          );
      } 
      // 2. Network/AdBlocker Error
      else if (
          errorString.includes("Failed to get document") || 
          errorString.includes("offline") || 
          errorString.includes("unavailable") ||
          e.code === 'unavailable'
      ) {
          errorNode = "無法連線到資料庫。\n\n如果您使用 AdBlocker 或隱私擴充功能 (如 uBlock Origin)，請嘗試關閉它，因為它可能阻擋了 Google Firestore 的連線。";
      }

      setLoadingError(errorNode);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateCategories = async (newCategories: string[]) => {
      const oldCategories = categories;
      setCategories(newCategories); // Optimistic Update

      if (user) {
          try {
              await saveUserSettings(user.uid, { categories: newCategories });
          } catch (e: any) {
              console.error("Failed to save categories", e);
              setCategories(oldCategories); // Revert on failure
              
              const isPermissionError = 
                e.code === 'permission-denied' || 
                e.message?.includes('permission-denied') ||
                e.toString().includes('Missing or insufficient permissions');

              if (isPermissionError) {
                  alert("⚠️ 無法儲存個人分類設定 (權限不足，請聯繫管理員)");
              } else {
                  alert("無法儲存分類設定，請檢查網路。");
              }
          }
      }
  };

  const handleLogin = async () => {
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (error: any) {
      console.error("Login Failed:", error);
      
      const errorCode = error.code;
      const errorMessage = error.message;
      
      let displayMessage = `登入失敗 (${errorCode})`;
      
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        return; 
      } else if (errorCode === 'auth/unauthorized-domain') {
        displayMessage = `網域未授權 (Unauthorized Domain)\n\n請聯繫管理員新增此網域至白名單。`;
      } else if (errorCode === 'auth/operation-not-allowed') {
        displayMessage = `登入服務未啟用，請聯繫管理員 (Firebase Console > Auth > Sign-in method > Enable Google)。`;
      }
      
      alert(displayMessage + `\n\n(詳細錯誤: ${errorMessage})`);
    }
  };

  const handleSaveReview = async (reviewData: Review) => {
    setIsSaving(true);
    try {
      await saveReviewToFirestore(reviewData);
      await loadData(); // Reload to see updates
      
      setEditingReview(undefined);
      setDraftRestaurant(null);
      setView('NOTEBOOK');
    } catch (error: any) {
      console.error("Save Review Error:", error);
      
      const isPermissionError = 
        error.code === 'permission-denied' || 
        error.message?.includes('permission-denied') ||
        error.toString().includes('Missing or insufficient permissions');

      if (isPermissionError) {
        alert(
          "⛔ 儲存失敗：權限不足\n\n" +
          "您的帳號沒有權限執行此操作，請聯繫管理員。"
        );
      } else if (error.message && error.message.includes("quota")) {
         alert("系統忙碌中 (配額已滿)，請稍後再試。");
      } else {
         alert("儲存失敗，請檢查網路連線或資料大小。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
      if(isSaving) return;
      setIsSaving(true);

      const originalReviews = reviews;
      setReviews(reviews.filter(r => r.id !== reviewId)); // Optimistic UI update
      
      try {
          await deleteReviewFromFirestore(reviewId);
      } catch (e: any) {
          console.error("Delete Failed:", e);
          
          const isPermissionError = 
            e.code === 'permission-denied' || 
            e.message?.includes('permission-denied') ||
            e.toString().includes('Missing or insufficient permissions');

          if (isPermissionError) {
             alert("⛔ 刪除失敗：權限不足。請聯繫管理員。");
          } else {
             alert("刪除失敗，請檢查網路連線");
          }
          setReviews(originalReviews); // Revert on failure
          return;
      } finally {
          setIsSaving(false);
      }
      
      setEditingReview(undefined);
      setDraftRestaurant(null);
      setView('NOTEBOOK');
  };

  const handleStartReview = (r: Restaurant) => {
      setDraftRestaurant(r);
      setEditingReview(undefined);
      setView('EDITOR');
  };

  const handleEditReview = (r: Review) => {
      setEditingReview(r);
      setDraftRestaurant(null);
      setView('EDITOR');
  };

  // --- RENDER LOGIC ---

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ee]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-orange border-t-brand-brown"></div>
      </div>
    );
  }

  // 1. Not Logged In
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 2. Logged In but Not Allowed (Only checks if list is NOT empty)
  if (ALLOWED_EMAILS.length > 0 && user.email && !ALLOWED_EMAILS.includes(user.email)) {
    return <AccessDeniedPage user={user} onLogout={() => auth.signOut()} />;
  }

  // 3. Authorized App Content
  const renderView = () => {
      if (isLoading && view === 'NOTEBOOK' && reviews.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-orange border-t-brand-brown"></div>
                  <p className="text-sm text-slate-400 animate-pulse">正在從雲端載入美食筆記...</p>
              </div>
          );
      }

      if (loadingError && view === 'NOTEBOOK') {
          return (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center w-full">
                  <div className="w-full max-w-md">
                      {/* Render complex error nodes or simple strings */}
                      {loadingError}
                  </div>
                  
                  <button 
                    onClick={loadData}
                    className="mt-6 px-6 py-2 bg-brand-brown text-white rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                  >
                      重試
                  </button>
              </div>
          );
      }

      switch (view) {
          case 'EDITOR':
              return (
                <EditorPage 
                    initialData={editingReview}
                    initialRestaurant={draftRestaurant || undefined}
                    isSaving={isSaving}
                    allAvailableTypes={categories} // Use managed categories
                    onSave={handleSaveReview}
                    onDelete={editingReview ? handleDeleteReview : undefined}
                    onCancel={() => setView('NOTEBOOK')}
                />
              );
          case 'SEARCH':
              return <SearchPage onSelectRestaurant={handleStartReview} />;
          case 'NOTEBOOK':
          default:
              return (
                  <NotebookPage 
                    reviews={reviews} 
                    onEdit={handleEditReview} 
                    user={user} 
                    categories={categories}
                    onUpdateCategories={handleUpdateCategories}
                  />
              );
      }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ee] text-slate-800 font-sans">
        {/* Mobile Container Simulation */}
        <div className="max-w-[480px] mx-auto bg-brand-cream min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
            <main className="flex-1 overflow-hidden relative">
                {renderView()}
                
                {/* Warning for Empty Configuration */}
                {ALLOWED_EMAILS.length === 0 && (
                    <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 text-center font-bold z-[100]">
                        ⚠️ 開發模式：未設定 ALLOWED_EMAILS，允許所有人存取
                    </div>
                )}
            </main>
            {view !== 'EDITOR' && <BottomNav active={view} onChange={setView} />}
        </div>
    </div>
  );
}