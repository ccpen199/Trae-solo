const db = require('../utils/database');

const searchFlights = (params) => {
  const { departureAirport, arrivalAirport, departureDate, airlineCode } = params;
  
  let sql = `SELECT f.*, a.code as airline_code, a.name as airline_name
             FROM flights f
             JOIN airlines a ON f.airline_id = a.id
             WHERE 1=1`;
  const values = [];
  
  if (departureAirport) {
    sql += ' AND f.departure_airport LIKE ?';
    values.push(`%${departureAirport}%`);
  }
  
  if (arrivalAirport) {
    sql += ' AND f.arrival_airport LIKE ?';
    values.push(`%${arrivalAirport}%`);
  }
  
  if (departureDate) {
    sql += ' AND date(f.departure_time) = ?';
    values.push(departureDate);
  }
  
  if (airlineCode) {
    sql += ' AND a.code = ?';
    values.push(airlineCode);
  }
  
  sql += ' ORDER BY f.departure_time ASC';
  
  return db.prepare(sql).all(...values);
};

const getFlightDetail = (flightId) => {
  const flightSql = `SELECT f.*, a.code as airline_code, a.name as airline_name, a.full_name as airline_full_name
                      FROM flights f
                      JOIN airlines a ON f.airline_id = a.id
                      WHERE f.id = ?`;
  
  const flight = db.prepare(flightSql).get(flightId);
  
  if (!flight) {
    return { error: '航班不存在' };
  }
  
  const cabinSql = `SELECT c.*
                    FROM cabins c
                    WHERE c.flight_id = ? AND c.status = 'available'
                    ORDER BY c.price ASC`;
  
  const cabins = db.prepare(cabinSql).all(flightId);
  
  const fareSql = `SELECT * FROM fares WHERE cabin_id = ? AND status = 'active'`;
  const fareStmt = db.prepare(fareSql);
  
  const cabinsWithFares = cabins.map(c => ({
    ...c,
    fares: fareStmt.all(c.id)
  }));
  
  return {
    ...flight,
    cabins: cabinsWithFares
  };
};

const getAllAirlines = () => {
  return db.prepare("SELECT * FROM airlines WHERE status = 'active' ORDER BY code").all();
};

const getAvailableCabins = (flightId) => {
  const cabinSql = `SELECT c.*
                    FROM cabins c
                    WHERE c.flight_id = ? AND c.status = 'available' AND c.available_seats > 0
                    ORDER BY c.price ASC`;
  
  const cabins = db.prepare(cabinSql).all(flightId);
  
  const fareSql = `SELECT * FROM fares WHERE cabin_id = ? AND status = 'active'`;
  const fareStmt = db.prepare(fareSql);
  
  return cabins.map(c => ({
    ...c,
    fares: fareStmt.all(c.id)
  }));
};

module.exports = {
  searchFlights,
  getFlightDetail,
  getAllAirlines,
  getAvailableCabins
};
