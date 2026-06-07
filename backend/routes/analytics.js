import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/box-office-heatmap', (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];
    if (start_date && end_date) {
      dateFilter = ' AND s.show_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const data = db.prepare(`
      SELECT c.city, c.district, c.name as cinema_name,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'pending') THEN o.total_amount ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT s.id) as showtime_count
      FROM cinemas c
      LEFT JOIN showtimes s ON c.id = s.cinema_id${dateFilter ? dateFilter.replace('s.show_date', 's.show_date') : ''}
      LEFT JOIN orders o ON s.id = o.showtime_id AND o.status IN ('paid', 'pending')
      GROUP BY c.id
      ORDER BY revenue DESC
    `).all(...params);

    const citySummary = {};
    for (const row of data) {
      if (!citySummary[row.city]) {
        citySummary[row.city] = { city: row.city, total_revenue: 0, total_orders: 0, districts: [] };
      }
      citySummary[row.city].total_revenue += row.revenue;
      citySummary[row.city].total_orders += row.order_count;
      citySummary[row.city].districts.push({
        district: row.district,
        cinema_name: row.cinema_name,
        revenue: row.revenue,
        order_count: row.order_count,
        showtime_count: row.showtime_count
      });
    }

    const cities = Object.values(citySummary);

    let orderDateFilter = '';
    const orderParams = [];
    if (start_date && end_date) {
      orderDateFilter = ' AND DATE(o.created_at) BETWEEN ? AND ?';
      orderParams.push(start_date, end_date);
    }

    const channelData = db.prepare(`
      SELECT COALESCE(o.channel, 'official') as channel,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'pending') THEN o.total_amount ELSE 0 END), 0) as revenue
      FROM orders o
      WHERE 1=1${orderDateFilter}
      GROUP BY COALESCE(o.channel, 'official')
      ORDER BY revenue DESC
    `).all(...orderParams);

    const channels = [];
    const channelMap = { official: 0, mini_program: 0, h5: 0, third_party: 0 };
    const channelOrderMap = { official: 0, mini_program: 0, h5: 0, third_party: 0 };
    for (const row of channelData) {
      const ch = row.channel || 'official';
      channelMap[ch] = row.revenue;
      channelOrderMap[ch] = row.order_count;
    }
    for (const ch of Object.keys(channelMap)) {
      channels.push({
        channel: ch,
        order_count: channelOrderMap[ch] || 0,
        revenue: channelMap[ch] || 0
      });
    }

    const topMovies = db.prepare(`
      SELECT m.id, m.title,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'pending') THEN o.total_amount ELSE 0 END), 0) as revenue
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE 1=1${orderDateFilter}
      GROUP BY m.id
      ORDER BY revenue DESC
      LIMIT 5
    `).all(...orderParams);

    const topCinemas = db.prepare(`
      SELECT c.id, c.name, c.city,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'pending') THEN o.total_amount ELSE 0 END), 0) as revenue
      FROM orders o
      JOIN showtimes s ON o.showtime_id = s.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE 1=1${orderDateFilter}
      GROUP BY c.id
      ORDER BY revenue DESC
      LIMIT 5
    `).all(...orderParams);

    const today = new Date().toISOString().split('T')[0];
    const showtimeData = db.prepare(`
      SELECT s.id, m.title as movie_title, c.name as cinema_name, s.show_time,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status IN ('paid', 'pending') THEN o.total_amount ELSE 0 END), 0) as revenue,
        s.current_price,
        (h.seat_rows * h.seat_cols) as total_seats
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      JOIN halls h ON s.hall_id = h.id
      LEFT JOIN orders o ON s.id = o.showtime_id AND o.status IN ('paid', 'pending')
      WHERE s.show_date = ?
      GROUP BY s.id
      ORDER BY revenue DESC
    `).all(today);

    const showtimeIds = showtimeData.map(st => st.id);
    const soldSeatsData = showtimeIds.length > 0
      ? db.prepare(`
          SELECT showtime_id, COUNT(*) as sold_seats
          FROM seats_lock
          WHERE showtime_id IN (${showtimeIds.map(() => '?').join(',')}) AND status = 'sold'
          GROUP BY showtime_id
        `).all(...showtimeIds)
      : [];

    const soldSeatsMap = {};
    for (const ss of soldSeatsData) {
      soldSeatsMap[ss.showtime_id] = ss.sold_seats;
    }

    const showtimes = showtimeData.map(st => ({
      ...st,
      sold_seats: soldSeatsMap[st.id] || 0,
      occupancy_rate: st.total_seats > 0 ? Math.round((soldSeatsMap[st.id] || 0) / st.total_seats * 100) : 0
    }));

    const aggregation = {
      channels,
      top_movies: topMovies,
      top_cinemas: topCinemas,
      showtimes
    };

    res.json({
      cities,
      aggregation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movie-lifecycle/:movie_id', (req, res) => {
  try {
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.movie_id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const dailyStats = db.prepare(`
      SELECT s.show_date,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT s.id) as showtime_count
      FROM showtimes s
      LEFT JOIN orders o ON s.id = o.showtime_id AND o.status = 'paid'
      WHERE s.movie_id = ?
      GROUP BY s.show_date
      ORDER BY s.show_date
    `).all(req.params.movie_id);

    const totalRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = dailyStats.reduce((sum, d) => sum + d.order_count, 0);
    const peakDay = dailyStats.length > 0
      ? dailyStats.reduce((max, d) => d.revenue > max.revenue ? d : max, dailyStats[0])
      : null;

    const releaseDate = new Date(movie.release_date);
    const now = new Date();
    const daysSinceRelease = Math.floor((now - releaseDate) / (1000 * 60 * 60 * 24));

    let lifecycleStage = 'growth';
    if (daysSinceRelease > 60) lifecycleStage = 'long-tail';
    else if (daysSinceRelease > 30) lifecycleStage = 'mature';
    else if (daysSinceRelease > 14) lifecycleStage = 'decline';

    res.json({
      movie_id: movie.id,
      title: movie.title,
      genre: movie.genre,
      release_date: movie.release_date,
      days_since_release: daysSinceRelease,
      lifecycle_stage: lifecycleStage,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      peak_day: peakDay,
      daily_stats: dailyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audience-ltv', (req, res) => {
  try {
    const { audience_id } = req.query;

    if (audience_id) {
      const audience = db.prepare('SELECT * FROM audiences WHERE id = ?').get(audience_id);
      if (!audience) return res.status(404).json({ error: 'Audience not found' });

      const orderStats = db.prepare(`
        SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent,
          COALESCE(AVG(CASE WHEN status = 'paid' THEN total_amount ELSE NULL END), 0) as avg_order_value,
          MIN(created_at) as first_order,
          MAX(created_at) as last_order
        FROM orders
        WHERE audience_id = ? AND status = 'paid'
      `).get(audience_id);

      const walletBalance = db.prepare(`
        SELECT COALESCE(SUM(balance), 0) as total_balance FROM wallet_cards WHERE audience_id = ? AND status = 'active'
      `).get(audience_id);

      const firstOrder = orderStats.first_order ? new Date(orderStats.first_order) : null;
      const lastOrder = orderStats.last_order ? new Date(orderStats.last_order) : null;
      const daysActive = firstOrder && lastOrder
        ? Math.max(1, Math.floor((lastOrder - firstOrder) / (1000 * 60 * 60 * 24)))
        : 0;

      const ltv = orderStats.total_spent * (1 + audience.points_balance / 1000);

      res.json({
        audience_id: audience.id,
        name: audience.name,
        member_level: audience.member_level,
        total_spent: orderStats.total_spent,
        total_orders: orderStats.total_orders,
        avg_order_value: orderStats.avg_order_value,
        wallet_balance: walletBalance.total_balance,
        points_balance: audience.points_balance,
        days_active: daysActive,
        ltv
      });
    } else {
      const aggregated = db.prepare(`
        SELECT
          a.member_level,
          COUNT(DISTINCT a.id) as audience_count,
          COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE NULL END), 0) as avg_order_value
        FROM audiences a
        LEFT JOIN orders o ON a.id = o.audience_id
        GROUP BY a.member_level
        ORDER BY total_revenue DESC
      `).all();

      res.json(aggregated);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ab-test-results/:test_id', (req, res) => {
  try {
    const test = db.prepare('SELECT * FROM ab_tests WHERE id = ?').get(req.params.test_id);
    if (!test) return res.status(404).json({ error: 'A/B test not found' });

    const variants = db.prepare('SELECT * FROM ab_test_variants WHERE test_id = ?').all(req.params.test_id);

    const variantResults = variants.map(variant => {
      const results = db.prepare(`
        SELECT
          COUNT(*) as total_participants,
          SUM(converted) as total_conversions,
          COALESCE(SUM(revenue), 0) as total_revenue,
          CASE WHEN COUNT(*) > 0 THEN CAST(SUM(converted) AS REAL) / COUNT(*) ELSE 0 END as conversion_rate
        FROM ab_test_results
        WHERE variant_id = ?
      `).get(variant.id);

      return {
        variant_id: variant.id,
        variant_name: variant.variant_name,
        traffic_percent: variant.traffic_percent,
        total_participants: results.total_participants,
        total_conversions: results.total_conversions,
        total_revenue: results.total_revenue,
        conversion_rate: results.conversion_rate
      };
    });

    let winner = null;
    if (variantResults.length >= 2) {
      const metric = test.metric;
      if (metric === 'conversion') {
        winner = variantResults.reduce((best, v) => v.conversion_rate > best.conversion_rate ? v : best, variantResults[0]);
      } else if (metric === 'revenue') {
        winner = variantResults.reduce((best, v) => v.total_revenue > best.total_revenue ? v : best, variantResults[0]);
      } else {
        winner = variantResults.reduce((best, v) => v.total_conversions > best.total_conversions ? v : best, variantResults[0]);
      }
    }

    res.json({
      test_id: test.id,
      name: test.name,
      metric: test.metric,
      status: test.status,
      start_date: test.start_date,
      end_date: test.end_date,
      variants: variantResults,
      winner: winner ? { variant_id: winner.variant_id, variant_name: winner.variant_name } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
