

export interface Restaurant {
  name: string;
  address: string;
  rating?: number;
  uri?: string; // Google Maps Link
  openingHours?: string[];
  placeId?: string;
  userRatingsTotal?: number;
  distance?: string; // Display string like "1.2 km"
}

export interface Dish {
  id: string;
  name: string;
  price?: number;
  description: string; // Markdown supported
  rating: number;
  image?: string; // Compressed Base64 data URL
}

export interface Review {
  id: string;
  userId?: string; // Added for Security (BOLA)
  userEmail?: string; // Added for Security (Ownership check)
  restaurant: Restaurant;
  date: string; // YYYY-MM-DD
  type: string[]; // Changed to array for multi-select
  totalCost: number;
  
  // Environment Ratings (0-5)
  ratingEnvironment: number;
  ratingTaste: number;
  ratingQuiet: number;
  ratingRevisit: number;

  dishes: Dish[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
    categories: string[];
}

export type ViewState = 'SEARCH' | 'NOTEBOOK' | 'EDITOR';

export const SUGGESTED_RESTAURANT_TYPES = [
  "台灣小吃", "飯類", "麵類", "湯類", "滷味", "燒烤", "火鍋", "甜點", "飲料", "冰品", 
  "夜市", "咖啡廳", "居酒屋", "KTV", "日式料理", "韓式料理", "美式料理", "義式料理", 
  "泰式料理", "中式料理", "法式料理", "中東料理", "墨西哥料理", "東南亞料理"
];