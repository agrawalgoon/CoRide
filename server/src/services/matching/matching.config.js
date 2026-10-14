// ============================================================
// AI Matching Weights & Thresholds Configuration
// ============================================================

export const MATCHING_WEIGHTS = {
  ROUTE: 0.30,         // Route compatibility, road alignment & detour
  PICKUP: 0.25,        // Pickup proximity to driver route corridor
  DESTINATION: 0.20,   // Destination proximity to driver drop point
  TIME: 0.15,          // Departure time synchronization
  TRUST: 0.10          // Campus/Organization affiliation & driver rating
};

export const MATCHING_THRESHOLDS = {
  MAX_TIME_DIFF_HOURS: 3,             // Max 3 hours departure window
  MAX_PICKUP_CORRIDOR_KM: 8.0,        // Max 8km perpendicular from driver route
  MAX_DROP_CORRIDOR_KM: 8.0,          // Max 8km perpendicular from driver destination
  MAX_ALLOWABLE_DETOUR_KM: 10.0,      // Max allowable road detour added to driver trip
  MAX_DETOUR_RATIO: 0.35              // Max 35% detour relative to total trip
};
