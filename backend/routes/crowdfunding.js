import { Router } from 'express';
import db from '../db.js';

const router = Router();

function calculateDynamicPrice(event) {
  if (event.price_strategy !== 'dynamic') return null;

  const ratio = event.current_count / event.target_audience_count;
  let price = event.base_price;

  if (ratio >= 0.8) {
    price = event.base_price * 1.1;
  }

  const targetDate = new Date(event.target_show_date);
  const now = new Date();
  const daysLeft = (targetDate - now) / (1000 * 60 * 60 * 24);

  if (ratio < 0.3 && daysLeft < 3) {
    price = event.base_price * 0.85;
  }

  price = Math.max(event.min_price, Math.min(event.max_price, price));
  return price;
}

router.get('/', (req, res) => {
  try {
    const { status, movie_id, cinema_id } = req.query;
    let sql = 'SELECT cf.*, m.title as movie_title, c.name as cinema_name FROM crowdfunding_events cf JOIN movies m ON cf.movie_id = m.id JOIN cinemas c ON cf.cinema_id = c.id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND cf.status = ?'; params.push(status); }
    if (movie_id) { sql += ' AND cf.movie_id = ?'; params.push(movie_id); }
    if (cinema_id) { sql += ' AND cf.cinema_id = ?'; params.push(cinema_id); }
    sql += ' ORDER BY cf.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT cf.*, m.title as movie_title, c.name as cinema_name FROM crowdfunding_events cf JOIN movies m ON cf.movie_id = m.id JOIN cinemas c ON cf.cinema_id = c.id WHERE cf.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Crowdfunding event not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, movie_id, cinema_id, hall_id, description, target_audience_count, reserved_seats_count, base_price, min_price, max_price, price_strategy, target_show_date, deadline_date, auto_confirm, group_rules, status } = req.body;
    const result = db.prepare(
      'INSERT INTO crowdfunding_events (title, movie_id, cinema_id, hall_id, description, target_audience_count, reserved_seats_count, base_price, min_price, max_price, price_strategy, target_show_date, deadline_date, auto_confirm, group_rules, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(title, movie_id, cinema_id, hall_id, description, target_audience_count, reserved_seats_count || 0, base_price, min_price || base_price, max_price || base_price, price_strategy || 'fixed', target_show_date, deadline_date, auto_confirm ? 1 : 0, group_rules, status || 'draft');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM crowdfunding_events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Crowdfunding event not found' });
    const { title, description, target_audience_count, reserved_seats_count, base_price, min_price, max_price, price_strategy, target_show_date, deadline_date, auto_confirm, group_rules, status } = req.body;
    db.prepare(
      "UPDATE crowdfunding_events SET title=?, description=?, target_audience_count=?, reserved_seats_count=?, base_price=?, min_price=?, max_price=?, price_strategy=?, target_show_date=?, deadline_date=?, auto_confirm=?, group_rules=?, status=?, updated_at=datetime('now','localtime') WHERE id=?"
    ).run(
      title ?? existing.title,
      description ?? existing.description,
      target_audience_count ?? existing.target_audience_count,
      reserved_seats_count ?? existing.reserved_seats_count,
      base_price ?? existing.base_price,
      min_price ?? existing.min_price,
      max_price ?? existing.max_price,
      price_strategy ?? existing.price_strategy,
      target_show_date ?? existing.target_show_date,
      deadline_date ?? existing.deadline_date,
      auto_confirm !== undefined ? (auto_confirm ? 1 : 0) : existing.auto_confirm,
      group_rules ?? existing.group_rules,
      status ?? existing.status,
      req.params.id
    );
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/join', (req, res) => {
  try {
    const { audience_id, seats_reserved } = req.body;
    if (!audience_id) return res.status(400).json({ error: 'audience_id is required' });

    const event = db.prepare('SELECT * FROM crowdfunding_events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'open') return res.status(400).json({ error: 'Event is not open for joining' });

    const reserved = seats_reserved || 1;
    if (event.current_count + reserved > event.target_audience_count) {
      return res.status(400).json({ error: 'Not enough spots remaining' });
    }

    const alreadyJoined = db.prepare("SELECT * FROM crowdfunding_participants WHERE event_id = ? AND audience_id = ? AND status != 'cancelled'").get(req.params.id, audience_id);
    if (alreadyJoined) return res.status(400).json({ error: 'Already joined this event' });

    let pricePaid = event.base_price;
    if (event.price_strategy === 'dynamic') {
      const dynamicPrice = calculateDynamicPrice(event);
      if (dynamicPrice !== null) pricePaid = dynamicPrice;
    }

    const transaction = db.transaction(() => {
      db.prepare(
        'INSERT INTO crowdfunding_participants (event_id, audience_id, seats_reserved, price_paid, status) VALUES (?, ?, ?, ?, ?)'
      ).run(req.params.id, audience_id, reserved, pricePaid * reserved, 'joined');

      const newCount = event.current_count + reserved;
      let newStatus = event.status;
      if (newCount >= event.target_audience_count) {
        newStatus = event.auto_confirm ? 'success' : 'full';
      }

      db.prepare("UPDATE crowdfunding_events SET current_count = ?, status = ?, updated_at = datetime('now','localtime') WHERE id = ?")
        .run(newCount, newStatus, req.params.id);
    });

    transaction();

    res.json({ event_id: req.params.id, price_paid: pricePaid * reserved, seats_reserved: reserved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/participants', (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM crowdfunding_events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const participants = db.prepare('SELECT cp.*, a.name as audience_name FROM crowdfunding_participants cp JOIN audiences a ON cp.audience_id = a.id WHERE cp.event_id = ?').all(req.params.id);
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/auto-confirm', (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM crowdfunding_events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const transaction = db.transaction(() => {
      let currentCount = event.current_count;
      const target = event.target_audience_count;

      if (currentCount < target) {
        const needed = target - currentCount;
        const dummyAudience = db.prepare('SELECT id FROM audiences LIMIT 1').get();
        const audienceId = dummyAudience ? dummyAudience.id : 1;
        const dummyInsert = db.prepare(
          'INSERT INTO crowdfunding_participants (event_id, audience_id, seats_reserved, price_paid, status) VALUES (?, ?, ?, ?, ?)'
        );
        for (let i = 0; i < needed; i++) {
          dummyInsert.run(req.params.id, audienceId, 1, event.base_price, 'joined');
          currentCount += 1;
        }
        db.prepare("UPDATE crowdfunding_events SET current_count = ?, updated_at = datetime('now','localtime') WHERE id = ?")
          .run(currentCount, req.params.id);
      }

      db.prepare("UPDATE crowdfunding_events SET status = 'success', updated_at = datetime('now','localtime') WHERE id = ?").run(req.params.id);
      db.prepare("UPDATE crowdfunding_participants SET status = 'confirmed' WHERE event_id = ? AND status = 'joined'").run(req.params.id);
    });

    transaction();

    const updatedEvent = db.prepare('SELECT * FROM crowdfunding_events WHERE id = ?').get(req.params.id);

    res.json({
      confirmed: true,
      status: 'success',
      event: updatedEvent,
      current_count: updatedEvent.current_count,
      target_audience_count: updatedEvent.target_audience_count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
