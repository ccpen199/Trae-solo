const { Engineer, EngineerSkill } = require('../models');

class DispatchService {
  async findSuitableEngineers(userLat, userLng, requiredSkills = [], limit = 5) {
    const engineers = await Engineer.findAll({
      where: {
        status: 1
      },
      include: [{
        model: EngineerSkill,
        as: 'EngineerSkills'
      }]
    });

    const scoredEngineers = engineers.map(engineer => {
      const distance = this.calculateDistance(userLat, userLng, engineer.lat, engineer.lng);
      const skillMatch = this.calculateSkillMatch(engineer.EngineerSkills || [], requiredSkills);
      const score = this.calculateTotalScore(distance, skillMatch, engineer);
      const eta = Math.ceil(distance * 10);

      return {
        id: engineer.id,
        name: engineer.name,
        phone: engineer.phone,
        certificateLevel: engineer.certificate_level,
        successRate: engineer.success_rate,
        avgRating: engineer.avg_rating,
        totalOrders: engineer.total_orders,
        distance: distance.toFixed(2),
        skillMatch: (skillMatch * 100).toFixed(0),
        matchScore: (score * 100).toFixed(0),
        eta,
        avatar: engineer.avatar
      };
    });

    scoredEngineers.sort((a, b) => b.matchScore - a.matchScore);
    return scoredEngineers.slice(0, limit);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  calculateSkillMatch(engineerSkills, requiredSkills) {
    if (requiredSkills.length === 0) return 1.0;

    let matched = 0;
    const skillCodes = engineerSkills.map(s => s.fault_code);

    requiredSkills.forEach(skill => {
      if (skillCodes.includes(skill)) {
        matched++;
      }
    });

    return matched / requiredSkills.length;
  }

  calculateTotalScore(distance, skillMatch, engineer) {
    const distanceScore = Math.max(0, 1 - distance / 20);
    const ratingScore = engineer.avg_rating / 5;
    const successScore = engineer.success_rate / 100;

    return (
      skillMatch * 0.4 +
      distanceScore * 0.3 +
      ratingScore * 0.15 +
      successScore * 0.15
    );
  }
}

module.exports = new DispatchService();
