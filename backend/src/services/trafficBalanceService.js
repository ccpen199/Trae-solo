const { getDb } = require('../database');

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function searchStations(latitude, longitude, radius = 5, connectorType = null) {
  const sql = getDb();
  
  let query = `
    SELECT 
      s.*,
      o.name as operator_name,
      v.name as venue_name,
      COUNT(DISTINCT c.id) as total_chargers,
      SUM(CASE WHEN c.status = 'idle' THEN 1 ELSE 0 END) as idle_chargers,
      SUM(CASE WHEN c.status = 'charging' THEN 1 ELSE 0 END) as charging_chargers
    FROM stations s
    LEFT JOIN operators o ON s.operator_id = o.id
    LEFT JOIN venues v ON s.venue_id = v.id
    LEFT JOIN chargers c ON s.id = c.station_id
    WHERE s.status = 'active'
  `;
  const params = [];
  
  if (connectorType) {
    query += ' AND c.connector_type = ?';
    params.push(connectorType);
  }
  
  query += ' GROUP BY s.id';
  
  const result = sql.exec(query, params);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return {
      stations: [],
      recommended: null
    };
  }
  
  const columns = result[0].columns;
  let stations = result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    
    if (latitude && longitude && obj.latitude && obj.longitude) {
      obj.distance = Number(getDistance(
        latitude, longitude, 
        parseFloat(obj.latitude), parseFloat(obj.longitude)
      ).toFixed(2));
    } else {
      obj.distance = null;
    }
    
    return obj;
  });
  
  if (latitude && longitude) {
    stations = stations.filter(s => s.distance !== null && s.distance <= radius);
    stations.sort((a, b) => a.distance - b.distance);
  }
  
  const recommended = findRecommendedStation(stations);
  
  return {
    stations,
    recommended
  };
}

function findRecommendedStation(stations) {
  if (stations.length === 0) return null;
  
  const scoredStations = stations.map(station => {
    let score = 0;
    
    if (station.idle_chargers > 0) {
      score += 100;
      score += Math.min(station.idle_chargers * 10, 50);
    }
    
    if (station.distance !== null) {
      const distanceScore = Math.max(0, 100 - station.distance * 20);
      score += distanceScore;
    }
    
    return { ...station, score };
  });
  
  scoredStations.sort((a, b) => b.score - a.score);
  
  return scoredStations[0];
}

function getStationDetail(stationId) {
  const sql = getDb();
  
  const stationResult = sql.exec(`
    SELECT s.*,
      o.name as operator_name,
      v.name as venue_name
    FROM stations s
    LEFT JOIN operators o ON s.operator_id = o.id
    LEFT JOIN venues v ON s.venue_id = v.id
    WHERE s.id = ?
  `, [stationId]);
  
  if (stationResult.length === 0 || stationResult[0].values.length === 0) {
    return null;
  }
  
  const stationColumns = stationResult[0].columns;
  const stationRow = stationResult[0].values[0];
  const station = {};
  stationColumns.forEach((col, idx) => {
    station[col] = stationRow[idx];
  });
  
  const chargersResult = sql.exec(`
    SELECT * FROM chargers WHERE station_id = ? ORDER BY charger_code
  `, [stationId]);
  
  let chargers = [];
  if (chargersResult.length > 0 && chargersResult[0].values.length > 0) {
    const chargerColumns = chargersResult[0].columns;
    chargers = chargersResult[0].values.map(row => {
      const obj = {};
      chargerColumns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }
  
  return {
    ...station,
    chargers
  };
}

function lockCharger(chargerId, userId) {
  const sql = getDb();
  
  const chargerResult = sql.exec(
    'SELECT * FROM chargers WHERE id = ?', 
    [chargerId]
  );
  
  if (chargerResult.length === 0 || chargerResult[0].values.length === 0) {
    throw new Error('Charger not found');
  }
  
  const chargerColumns = chargerResult[0].columns;
  const chargerRow = chargerResult[0].values[0];
  const charger = {};
  chargerColumns.forEach((col, idx) => {
    charger[col] = chargerRow[idx];
  });
  
  if (charger.status !== 'idle') {
    throw new Error(`Charger is not available. Current status: ${charger.status}`);
  }
  
  sql.run(
    'UPDATE chargers SET status = "locked", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [chargerId]
  );
  
  const { saveDb } = require('../database');
  saveDb();
  
  return {
    chargerId,
    status: 'locked',
    lockedAt: new Date().toISOString()
  };
}

function unlockCharger(chargerId) {
  const sql = getDb();
  
  const chargerResult = sql.exec(
    'SELECT * FROM chargers WHERE id = ?', 
    [chargerId]
  );
  
  if (chargerResult.length === 0 || chargerResult[0].values.length === 0) {
    throw new Error('Charger not found');
  }
  
  const chargerColumns = chargerResult[0].columns;
  const chargerRow = chargerResult[0].values[0];
  const charger = {};
  chargerColumns.forEach((col, idx) => {
    charger[col] = chargerRow[idx];
  });
  
  if (charger.status === 'locked') {
    sql.run(
      'UPDATE chargers SET status = "idle", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [chargerId]
    );
    
    const { saveDb } = require('../database');
    saveDb();
  }
  
  return {
    chargerId,
    status: charger.status === 'locked' ? 'idle' : charger.status
  };
}

module.exports = {
  searchStations,
  getStationDetail,
  lockCharger,
  unlockCharger,
  findRecommendedStation
};
