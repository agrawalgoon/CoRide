export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const normalizeScore = (value, min, max, inverse = false) => {
  let score = 0;
  if (value <= min) {
    score = inverse ? 100 : 0;
  } else if (value >= max) {
    score = inverse ? 0 : 100;
  } else {
    const ratio = (value - min) / (max - min);
    score = inverse ? (1 - ratio) * 100 : ratio * 100;
  }
  return Math.round(score);
};

export const generateReasons = (pickupDist, dropDist, diffHours, orgMatch, qualityScore, prefMatch) => {
  const reasons = [];
  
  if (pickupDist < 2) {
    reasons.push('Pickup point is very close to your requested location');
  } else if (pickupDist < 5) {
    reasons.push('Pickup point is reasonably close');
  }

  if (dropDist < 2) {
    reasons.push('Drop point is very close to your requested destination');
  }

  if (diffHours <= 0.5) {
    reasons.push('Departure time is within 30 minutes of your preference');
  } else if (diffHours <= 1) {
    reasons.push('Departure time is within 1 hour of your preference');
  }
  
  if (orgMatch) {
    reasons.push('Driver is from your organization');
  }

  if (prefMatch) {
    reasons.push('Ride matches your preferences');
  }

  if (qualityScore >= 90) {
    reasons.push('Highly rated driver');
  }

  return reasons;
};
