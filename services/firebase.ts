
// FIX: Changed Firebase imports to v9 compat syntax to match older Firebase versions.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/app-check";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// FIX: Robust initialization
if (!firebase.apps.length) {
  // Check if configuration is present before initializing
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0) {
    try {
      // --- SECURITY: Enable Debug Token in Development ---
      // Determine if we are on localhost to auto-enable debug token
      const isLocalhost = 
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1" || 
        window.location.hostname.includes("webcontainer");

      if ((import.meta as any).env?.DEV || isLocalhost) {
        // This forces the console to print a debug token and allows localhost to work without reCAPTCHA errors
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      const app = firebase.initializeApp(firebaseConfig);
      
      // --- SECURITY: App Check Initialization ---
      const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
      
      // DEBUG: Print key status to help user troubleshoot 400 errors
      if (siteKey) {
          console.log(`🔧 App Check Config: Key found (${siteKey.substring(0, 5)}...), Domain: ${window.location.hostname}`);
      } else {
          console.warn("🔧 App Check Config: VITE_RECAPTCHA_SITE_KEY is missing or empty.");
      }

      // Only attempt to activate App Check if a key is provided and looks valid
      if (siteKey && siteKey.length > 10 && siteKey !== 'undefined') {
         try {
             const appCheck = firebase.appCheck();
             // Activate with reCAPTCHA v3
             appCheck.activate(siteKey, true);
             console.log("🛡️ Firebase App Check Activated");
         } catch (e) {
             // Suppress initialization errors to prevent app crash loop
             console.warn("⚠️ App Check failed to activate (ignoring):", e);
         }
      } else {
          console.log("ℹ️ App Check skipped (No valid Site Key provided)");
      }
      
    } catch (error) {
      console.error("Firebase Initialization Failed:", error);
    }
  } else {
    console.warn("⚠️ Firebase API Key is missing. Please check your .env file or environment variables.");
  }
}

// Ensure exports are valid even if init failed
export const db = firebase.firestore ? firebase.firestore() : {} as any;
export const auth = firebase.auth ? firebase.auth() : {} as any;
export const googleProvider = firebase.auth ? new firebase.auth.GoogleAuthProvider() : {} as any;
