export function findBestRider(order, riders, riderLocations) {
  const maxDistance = 5;
  const orderLat = order.pickup_lat;
  const orderLng = order.pickup_lng;

  const scored = riders
    .filter((r) => r.status === 'active' && r.role !== 'admin')
    .map((rider) => {
      const loc = riderLocations.find((l) => l.rider_id === rider.id && l.is_online === 1);
      if (!loc) return null;

      const dist = haversine(orderLat, orderLng, loc.lat, loc.lng);
      if (dist > maxDistance) return null;

      const distanceScore = 1 - dist / maxDistance;

      const lastCompletion = rider.last_order_time
        ? (Date.now() - new Date(rider.last_order_time).getTime()) / 60000
        : 60;
      const idleScore = Math.min(lastCompletion / 60, 1);

      const creditScore = Math.min((rider.credit_score || 100) / 200, 1);

      const totalOrders = rider.total_orders || 0;
      const completedOrders = rider.completed_orders || 0;
      const completionRate = totalOrders > 0 ? completedOrders / totalOrders : 0.5;

      const finalScore =
        distanceScore * 0.4 + idleScore * 0.2 + creditScore * 0.3 + completionRate * 0.1;

      return {
        rider_id: rider.id,
        rider_name: rider.name,
        distance: Math.round(dist * 100) / 100,
        score: Math.round(finalScore * 1000) / 1000,
        details: {
          distance_score: Math.round(distanceScore * 1000) / 1000,
          idle_score: Math.round(idleScore * 1000) / 1000,
          credit_score: Math.round(creditScore * 1000) / 1000,
          completion_rate: Math.round(completionRate * 1000) / 1000,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
