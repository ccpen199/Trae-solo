const crypto = require('crypto');

function generateBlockchainHash(data) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data) + Date.now().toString());
  return hash.digest('hex');
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function detectMockLocation(lat, lng, accuracy, timestamp) {
  const suspiciousPatterns = [
    { lat: 0, lng: 0, name: '原点坐标' },
    { lat: 39.9042, lng: 116.4074, name: '北京天安门' },
  ];
  
  for (const pattern of suspiciousPatterns) {
    const dist = calculateDistance(lat, lng, pattern.lat, pattern.lng);
    if (dist < 100) {
      return { isMock: true, reason: `疑似使用预设坐标: ${pattern.name}` };
    }
  }
  
  if (accuracy && accuracy > 500) {
    return { isMock: true, reason: '定位精度过低' };
  }
  
  return { isMock: false };
}

function scoreActivityMatch(activity, volunteer, userLocation) {
  let score = 0;
  let lbsScore = 0;
  let skillScore = 0;
  let hourScore = 0;
  
  if (userLocation && activity.latitude && activity.longitude) {
    const dist = calculateDistance(
      userLocation.lat, userLocation.lng,
      activity.latitude, activity.longitude
    );
    if (dist < 1000) lbsScore = 30;
    else if (dist < 5000) lbsScore = 20;
    else if (dist < 10000) lbsScore = 10;
    else lbsScore = 5;
  }
  
  if (activity.required_skills && volunteer.skills) {
    const requiredSkills = activity.required_skills.split(',');
    const volunteerSkills = volunteer.skills.split(',');
    const matchCount = requiredSkills.filter(s => volunteerSkills.includes(s.trim())).length;
    skillScore = (matchCount / requiredSkills.length) * 35;
  } else {
    skillScore = 15;
  }
  
  if (volunteer.total_hours >= (activity.required_hours || 0)) {
    hourScore = 35;
  } else {
    hourScore = (volunteer.total_hours / (activity.required_hours || 1)) * 35;
  }
  
  score = lbsScore + skillScore + hourScore;
  
  return {
    total: Math.round(score),
    lbs: Math.round(lbsScore),
    skills: Math.round(skillScore),
    hours: Math.round(hourScore),
    distance: userLocation && activity.latitude ? 
      Math.round(calculateDistance(userLocation.lat, userLocation.lng, activity.latitude, activity.longitude)) : null
  };
}

module.exports = {
  generateBlockchainHash,
  calculateDistance,
  detectMockLocation,
  scoreActivityMatch
};
