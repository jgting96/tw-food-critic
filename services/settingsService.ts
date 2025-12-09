
import { db } from "./firebase";
import { UserSettings, SUGGESTED_RESTAURANT_TYPES } from "../types";

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const doc = await db.collection("users").doc(userId).collection("settings").doc("preferences").get();
    if (doc.exists) {
      return doc.data() as UserSettings;
    }
  } catch (e: any) {
    // Suppress permission errors in console, just warn lightly
    if (e.code === 'permission-denied') {
        console.warn("User settings access denied (using defaults). This is expected if Rules are not configured for 'users' collection.");
    } else {
        console.warn("Failed to fetch user settings", e);
    }
  }
  
  // Return default if no settings saved yet or on error
  return {
    categories: [...SUGGESTED_RESTAURANT_TYPES]
  };
};

export const saveUserSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  try {
    await db.collection("users").doc(userId).collection("settings").doc("preferences").set(settings, { merge: true });
  } catch (e) {
    console.error("Failed to save user settings", e);
    throw e;
  }
};
