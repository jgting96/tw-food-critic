import { Restaurant } from "../types";

// NOTE: This service implements a Hybrid Strategy.
// 1. Try to use "Places API (New)" for cost savings (Basic Data).
// 2. Fallback to "Legacy Places API" if the environment doesn't support the new version
//    (e.g. if 'importLibrary' is missing) or if the request fails.

declare var google: any;

// Helper: Load Google Maps Script dynamically with strict callback
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 1. If 'places' library is already available, resolve immediately.
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }

    // 2. If the script tag exists, we attach to the existing global callback or poll
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // Poll for the 'places' library specifically
      const checkInterval = setInterval(() => {
          if ((window as any).google?.maps?.places) {
              clearInterval(checkInterval);
              resolve();
          }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
          clearInterval(checkInterval);
          if ((window as any).google?.maps?.places) {
              resolve();
          } else {
              // If timeout but google.maps exists, maybe libraries failed. 
              // We reject here to prompt user to check network/extensions.
              reject(new Error("Google Maps 'places' library failed to load. Please check for AdBlockers."));
          }
      }, 10000);
      return;
    }

    // 3. Define the global callback function that Google Maps will call when ready
    (window as any).initGoogleMaps = () => {
        if ((window as any).google?.maps?.places) {
            resolve();
        } else {
            reject(new Error("Google Maps loaded but 'places' library is missing."));
        }
    };

    // 4. Load Script
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Added 'loading=async' to satisfy the console warning recommendation.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async&language=zh-TW&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => reject(new Error("Failed to load Google Maps script (Network Error). Check AdBlocker."));
    document.head.appendChild(script);
  });
};

// Helper: Calculate Haversine distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  
  if (d < 1) {
    return `${Math.round(d * 1000)} m`;
  }
  return `${d.toFixed(1)} km`;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

// --- SEARCH IMPLEMENTATIONS ---

// Strategy A: New Places API (Cheaper)
const searchWithNewApi = async (query: string, userLocation: { lat: number; lng: number } | undefined) => {
    // Double check importLibrary availability
    if (!(window as any).google?.maps?.importLibrary) {
        throw new Error("importLibrary not found");
    }

    const { Place } = await (window as any).google.maps.importLibrary("places");
    const { LatLng } = await (window as any).google.maps.importLibrary("core");

    const request = {
      textQuery: query,
      fields: [
        'id', 
        'displayName', 
        'formattedAddress', 
        'location', 
        'rating', 
        'userRatingCount'
      ],
      language: 'zh-TW',
      locationBias: userLocation ? new LatLng(userLocation.lat, userLocation.lng) : undefined,
    };

    const { places } = await Place.searchByText(request);
    
    if (!places) return [];

    return places.map((place: any) => {
       // Handle Location (Function or Property)
       let lat = 0, lng = 0;
       if (place.location) {
           lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
           lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
       }

       // Clean Address
       const cleanAddress = (place.formattedAddress || "").replace(/^(台灣|Taiwan)\s?/, '').trim();
       
       // Handle Name
       const name = place.displayName || "餐廳";

       return {
          name: name,
          address: cleanAddress,
          rating: place.rating,
          userRatingsTotal: place.userRatingCount,
          placeId: place.id,
          // Manually construct robust URL using Search + Place ID
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${place.id}`,
          distance: (userLocation && lat) ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : undefined
       } as Restaurant;
    });
};

// Strategy B: Legacy Places API (Fallback)
const searchWithLegacyApi = async (query: string, userLocation: { lat: number; lng: number } | undefined): Promise<Restaurant[]> => {
    return new Promise((resolve, reject) => {
        // Safety check
        if (!(window as any).google?.maps?.places?.PlacesService) {
            reject(new Error("Google Maps PlacesService is not available. Please refresh or check AdBlocker."));
            return;
        }

        const mapDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(mapDiv);
        
        const request: any = {
            query: query,
            language: 'zh-TW',
        };

        if (userLocation) {
            request.location = new google.maps.LatLng(userLocation.lat, userLocation.lng);
            request.radius = 5000;
        }

        service.textSearch(request, (results: any[], status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const restaurants = results.map(place => {
                    const cleanAddress = (place.formatted_address || "").replace(/^(台灣|Taiwan)\s?/, '').trim();
                    const name = place.name || "餐廳";
                    
                    let distanceStr: string | undefined = undefined;
                    if (userLocation && place.geometry?.location) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        distanceStr = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
                    }

                    return {
                        name: name,
                        address: cleanAddress,
                        rating: place.rating,
                        userRatingsTotal: place.user_ratings_total,
                        placeId: place.place_id,
                        // Use robust URL format here as well
                        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${place.place_id}`,
                        distance: distanceStr,
                    } as Restaurant;
                });
                resolve(restaurants);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]);
            } else {
                reject(new Error(`Legacy Search Failed with status: ${status}`));
            }
        });
    });
}


export const searchRestaurants = async (
  query: string,
  userLocation?: { lat: number; lng: number }
): Promise<Restaurant[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    await loadGoogleMapsScript(apiKey);

    // Try New API if importLibrary is available
    if ((window as any).google?.maps?.importLibrary) {
        try {
            console.log("Attempting search with New Places API...");
            return await searchWithNewApi(query, userLocation);
        } catch (newApiError) {
            console.warn("New Places API failed, falling back to Legacy API.", newApiError);
            // Fall through to Legacy API
        }
    } else {
        console.log("New Places API not supported (importLibrary missing), using Legacy API.");
    }

    // Fallback: Legacy API
    return await searchWithLegacyApi(query, userLocation);

  } catch (error) {
    console.error("All Search Strategies Failed:", error);
    throw error;
  }
};