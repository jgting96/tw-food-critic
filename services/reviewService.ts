import { db, auth } from "./firebase";
import { Review } from "../types";

const COLLECTION_NAME = "reviews";

// Helper to recursively remove undefined values which Firebase does not support
const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => removeUndefined(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const value = removeUndefined(obj[key]);
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

export const fetchReviews = async (userId?: string): Promise<Review[]> => {
  // Update for Shared Mode: 
  // We ignore the userId parameter and fetch ALL reviews so both friends can see everything.
  
  let query: any = db.collection(COLLECTION_NAME);

  // Note: If you want to go back to private mode, uncomment the line below:
  // if (userId) { query = query.where('userId', '==', userId); }

  // Let errors propagate to App.tsx so we can show error UI
  const querySnapshot = await query.get();
  
  const reviews: Review[] = [];
  querySnapshot.forEach((doc: any) => {
    // Cast to any first to handle potential legacy data structure
    const data = doc.data() as any;
    
    reviews.push({
      ...data,
      id: doc.id,
      type: Array.isArray(data.type) ? data.type : (data.type ? [data.type] : [])
    } as Review);
  });
  
  // Client-side sort by date (newest first)
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
};

export const saveReviewToFirestore = async (review: Review): Promise<void> => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
      throw new Error("Must be logged in to save");
  }

  // Create a copy of the review to modify for storage
  const dataToSave = { 
      ...review,
      // SHARED MODE LOGIC:
      // 1. If it's a new review (no userId), set it to current user.
      // 2. If it's an existing review (has userId), KEEP the original creator's ID.
      // 3. Always update 'lastEditedBy' so we know who changed it last.
      userId: review.userId || currentUser.uid, 
      userEmail: review.userEmail || currentUser.email,
      lastEditedBy: currentUser.email,
      updatedAt: Date.now()
  };

  // We want to remove the 'distance' field from the restaurant object as it's a runtime-only property
  if (dataToSave.restaurant) {
      const { distance, ...cleanRestaurant } = dataToSave.restaurant;
      dataToSave.restaurant = cleanRestaurant;
  }

  // Sanitize data
  const cleanData = removeUndefined(dataToSave);
  
  console.log(`[ReviewService] Saving shared review ${review.id}`);
  
  try {
    await db.collection(COLLECTION_NAME).doc(review.id).set(cleanData, { merge: true });
    console.log("[ReviewService] Save successful");
  } catch (error) {
    console.error("[ReviewService] Save failed:", error);
    throw error;
  }
};

export const deleteReviewFromFirestore = async (reviewId: string): Promise<void> => {
  console.log(`[ReviewService] Deleting review ${reviewId}`);
  try {
    await db.collection(COLLECTION_NAME).doc(reviewId).delete();
  } catch (error) {
    console.error("[ReviewService] Delete failed:", error);
    throw error;
  }
};