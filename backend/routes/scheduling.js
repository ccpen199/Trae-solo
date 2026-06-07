import { Router } from 'express';
import db from '../db.js';

const router = Router();

function getOccupancyByTimeSlot(cinema_id, dateRange) {
  const showtimes = db.prepare(`
    SELECT s.*, h.seat_rows, h.seat_cols,
      (SELECT COUNT(*) FROM seats_lock sl WHERE sl.showtime_id = s.id AND sl.status = 'sold') as sold_count
    FROM showtimes s
    JOIN halls h ON s.hall_id = h.id
    WHERE s.cinema_id = ? AND s.show_date BETWEEN ? AND ?
  `).all(cinema_id, dateRange.start, dateRange.end);

  const timeSlots = {};
  for (const st of showtimes) {
    const hour = parseInt(st.show_time.split(':')[0], 10);
    const slotKey = `${hour}:00`;
    if (!timeSlots[slotKey]) {
      timeSlots[slotKey] = { total_seats: 0, sold_seats: 0, showtime_count: 0 };
    }
    const totalSeats = st.seat_rows * st.seat_cols;
    timeSlots[slotKey].total_seats += totalSeats;
    timeSlots[slotKey].sold_seats += st.sold_count;
    timeSlots[slotKey].showtime_count += 1;
  }

  return Object.entries(timeSlots).map(([slot, data]) => ({
    time_slot: slot,
    occupancy_rate: data.total_seats > 0 ? data.sold_seats / data.total_seats : 0,
    total_seats: data.total_seats,
    sold_seats: data.sold_seats,
    showtime_count: data.showtime_count
  }));
}

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function getGoldenSlots(dateStr) {
  if (isWeekend(dateStr)) {
    return ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  }
  return ['18:00', '19:00', '20:00', '21:00'];
}

router.post('/smart-schedule', (req, res) => {
  try {
    const { cinema_id, date_range } = req.body;
    if (!cinema_id || !date_range || !date_range.start || !date_range.end) {
      return res.status(400).json({ error: 'cinema_id and date_range (start, end) are required' });
    }

    const cinema = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(cinema_id);
    if (!cinema) return res.status(404).json({ error: 'Cinema not found' });

    const halls = db.prepare('SELECT * FROM halls WHERE cinema_id = ?').all(cinema_id);
    const movies = db.prepare("SELECT * FROM movies WHERE status = 'showing'").all();

    const occupancyData = getOccupancyByTimeSlot(cinema_id, date_range);

    const recommendations = [];
    const startDate = new Date(date_range.start);
    const endDate = new Date(date_range.end);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const goldenSlots = getGoldenSlots(dateStr);
      const existingShowtimes = db.prepare(
        'SELECT * FROM showtimes WHERE cinema_id = ? AND show_date = ?'
      ).all(cinema_id, dateStr);

      const usedSlots = new Set(existingShowtimes.map(st => st.show_time));
      const dateOccupancy = occupancyData.filter(o => {
        const slotHour = parseInt(o.time_slot, 10);
        return true;
      });

      const avgOccupancy = dateOccupancy.length > 0
        ? dateOccupancy.reduce((sum, o) => sum + o.occupancy_rate, 0) / dateOccupancy.length
        : 0;

      for (const hall of halls) {
        for (const slot of goldenSlots) {
          const slotAlreadyUsed = existingShowtimes.some(st => st.hall_id === hall.id && st.show_time === slot);
          if (slotAlreadyUsed) continue;

          const slotOccupancy = dateOccupancy.find(o => o.time_slot === slot);
          const occupancyRate = slotOccupancy ? slotOccupancy.occupancy_rate : 0;

          let bestMovie = null;
          let bestScore = -1;
          for (const movie of movies) {
            const movieShowtimesCount = existingShowtimes.filter(st => st.movie_id === movie.id).length;
            const score = (1 - occupancyRate) * 0.4 + (movieShowtimesCount < 3 ? 0.3 : 0) + (isWeekend(dateStr) && movie.genre === 'Action' ? 0.2 : 0) + 0.1;
            if (score > bestScore) {
              bestScore = score;
              bestMovie = movie;
            }
          }

          if (bestMovie) {
            recommendations.push({
              date: dateStr,
              time: slot,
              hall_id: hall.id,
              hall_name: hall.name,
              movie_id: bestMovie.id,
              movie_title: bestMovie.title,
              predicted_occupancy: Math.round(occupancyRate * 100 + (isWeekend(dateStr) ? 20 : 10)),
              is_golden_time: true,
              score: Math.round(bestScore * 100)
            });
          }
        }

        const nonGoldenSlots = ['10:00', '11:00', '12:00', '13:00'];
        for (const slot of nonGoldenSlots) {
          const slotAlreadyUsed = existingShowtimes.some(st => st.hall_id === hall.id && st.show_time === slot);
          if (slotAlreadyUsed) continue;

          const coldMovies = movies.filter(m => {
            const count = db.prepare("SELECT COUNT(*) as c FROM orders o JOIN showtimes s ON o.showtime_id = s.id WHERE s.movie_id = ? AND o.status = 'paid'").get(m.id).c;
            return count < 5;
          });

          if (coldMovies.length > 0 && avgOccupancy < 0.3) {
            recommendations.push({
              date: dateStr,
              time: slot,
              hall_id: hall.id,
              hall_name: hall.name,
              movie_id: coldMovies[0].id,
              movie_title: coldMovies[0].title,
              predicted_occupancy: 15,
              is_golden_time: false,
              score: 20,
              strategy: 'discount',
              suggested_discount: 0.8
            });
          }
        }
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    res.json({
      cinema_id,
      date_range,
      recommendations: recommendations.slice(0, 50),
      occupancy_summary: occupancyData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/occupancy-prediction', (req, res) => {
  try {
    const { cinema_id, start_date, end_date } = req.query;
    if (!cinema_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'cinema_id, start_date, and end_date are required' });
    }
    const data = getOccupancyByTimeSlot(cinema_id, { start: start_date, end: end_date });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cold-movie-strategies', (req, res) => {
  try {
    const movies = db.prepare("SELECT * FROM movies WHERE status = 'showing'").all();
    const strategies = [];

    for (const movie of movies) {
      const orderCount = db.prepare(`
        SELECT COUNT(*) as count FROM orders o
        JOIN showtimes s ON o.showtime_id = s.id
        WHERE s.movie_id = ? AND o.status = 'paid'
      `).get(movie.id).count;

      if (orderCount < 10) {
        const popularMovies = db.prepare(`
          SELECT m.*, COUNT(o.id) as order_count
          FROM movies m
          JOIN showtimes s ON m.id = s.movie_id
          JOIN orders o ON s.id = o.showtime_id
          WHERE o.status = 'paid'
          GROUP BY m.id
          ORDER BY order_count DESC
          LIMIT 3
        `).all();

        strategies.push({
          movie_id: movie.id,
          title: movie.title,
          genre: movie.genre,
          current_orders: orderCount,
          strategies: [
            {
              type: 'pairing',
              description: 'Pair with popular movies in adjacent time slots',
              suggested_pairings: popularMovies.map(pm => ({ movie_id: pm.id, title: pm.title }))
            },
            {
              type: 'discount',
              description: 'Offer discounted tickets to boost attendance',
              suggested_discount: 0.7,
              current_price: db.prepare('SELECT MIN(current_price) as price FROM showtimes WHERE movie_id = ?').get(movie.id).price
            },
            {
              type: 'bundling',
              description: 'Bundle with concession combos for added value',
              suggested_combo_discount: 0.85
            }
          ]
        });
      }
    }

    res.json(strategies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
