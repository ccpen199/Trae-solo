const flightService = require('../services/flightService');

const searchFlights = (req, res) => {
  const params = {
    departureAirport: req.query.departureAirport,
    arrivalAirport: req.query.arrivalAirport,
    departureDate: req.query.departureDate,
    airlineCode: req.query.airlineCode
  };
  
  try {
    const flights = flightService.searchFlights(params);
    res.json(flights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFlightDetail = (req, res) => {
  const flightId = parseInt(req.params.id);
  
  if (!flightId) {
    return res.status(400).json({ error: '无效的航班ID' });
  }
  
  const flight = flightService.getFlightDetail(flightId);
  if (flight.error) {
    return res.status(404).json(flight);
  }
  res.json(flight);
};

const getAllAirlines = (req, res) => {
  try {
    const airlines = flightService.getAllAirlines();
    res.json(airlines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAvailableCabins = (req, res) => {
  const flightId = parseInt(req.params.flightId);
  
  if (!flightId) {
    return res.status(400).json({ error: '无效的航班ID' });
  }
  
  try {
    const cabins = flightService.getAvailableCabins(flightId);
    res.json(cabins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  searchFlights,
  getFlightDetail,
  getAllAirlines,
  getAvailableCabins
};
