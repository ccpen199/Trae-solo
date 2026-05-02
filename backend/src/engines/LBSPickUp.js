const db = require('../database');

class LBSPickUpEngine {
  constructor() {
    this.earthRadius = 6371;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.earthRadius * c;
    
    return distance;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async findNearbyRiders(latitude, longitude, radiusKm = 5.0) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, u.name, u.phone
         FROM riders r
         JOIN users u ON r.user_id = u.id
         WHERE r.status = 'online'`,
        (err, riders) => {
          if (err) return reject(err);
          
          const nearbyRiders = riders
            .map(rider => {
              if (rider.latitude === null || rider.longitude === null) return null;
              const distance = this.calculateDistance(
                latitude, longitude,
                rider.latitude, rider.longitude
              );
              return { ...rider, distance_km: distance };
            })
            .filter(rider => rider && rider.distance_km <= radiusKm)
            .sort((a, b) => a.distance_km - b.distance_km);
          
          resolve(nearbyRiders);
        }
      );
    });
  }

  async findNearestCenter(latitude, longitude) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM centers`, (err, centers) => {
        if (err) return reject(err);
        
        if (centers.length === 0) {
          return resolve(null);
        }

        const centersWithDistance = centers.map(center => {
          const distance = this.calculateDistance(
            latitude, longitude,
            center.latitude, center.longitude
          );
          return { ...center, distance_km: distance };
        });

        centersWithDistance.sort((a, b) => a.distance_km - b.distance_km);
        resolve(centersWithDistance[0]);
      });
    });
  }

  async updateRiderLocation(riderId, latitude, longitude) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE riders SET latitude = ?, longitude = ? WHERE user_id = ?`,
        [latitude, longitude, riderId],
        function(err) {
          if (err) return reject(err);
          resolve({ success: true, changes: this.changes });
        }
      );
    });
  }

  async setRiderStatus(riderId, status) {
    const validStatuses = ['online', 'offline', 'busy'];
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的状态: ${status}`);
    }

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE riders SET status = ? WHERE user_id = ?`,
        [status, riderId],
        function(err) {
          if (err) return reject(err);
          resolve({ success: true, changes: this.changes });
        }
      );
    });
  }

  async getRiderByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT r.*, u.name, u.phone
         FROM riders r
         JOIN users u ON r.user_id = u.id
         WHERE r.user_id = ?`,
        [userId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  async dispatchOrderToNearbyRider(orderId, latitude, longitude) {
    const nearbyRiders = await this.findNearbyRiders(latitude, longitude);
    
    if (nearbyRiders.length === 0) {
      return { success: false, message: '附近没有可用的骑手' };
    }

    const selectedRider = nearbyRiders[0];
    
    return {
      success: true,
      rider: selectedRider,
      distance_km: selectedRider.distance_km
    };
  }

  async getAllOnlineRiders() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, u.name, u.phone, u.address
         FROM riders r
         JOIN users u ON r.user_id = u.id
         WHERE r.status = 'online'`,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getAllCenters() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM centers ORDER BY name`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
}

module.exports = new LBSPickUpEngine();
