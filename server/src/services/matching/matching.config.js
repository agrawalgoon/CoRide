export const MATCHING_WEIGHTS = {
  ROUTE: 0.40,
  TIME: 0.25,
  ORGANIZATION: 0.15,
  PREFERENCES: 0.10,
  CONVENIENCE: 0.10
};

export const MATCHING_THRESHOLDS = {
  MAX_TIME_DIFF_HOURS: 3,         // Max 3 hours deviation
  MAX_PICKUP_DISTANCE_KM: 10,     // Passenger has to walk/travel max 10km to pickup
  MAX_DROP_DISTANCE_KM: 10,       // Passenger has to walk/travel max 10km from drop
  MAX_TOTAL_ROUTE_DEVIATION_KM: 20 // Base for scoring route
};
