const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/worker', auth, requireRole('worker'), (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ code: -1, message: 'Worker profile not found' });
    }
    res.json({ code: 0, data: profile, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/worker', auth, requireRole('worker'), (req, res) => {
  try {
    const { identity_type, real_name, id_number, university, major, grade, skills, availability_calendar } = req.body;
    const profile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ code: -1, message: 'Worker profile not found' });
    }
    db.prepare(
      `UPDATE worker_profiles SET identity_type = COALESCE(?, identity_type), real_name = COALESCE(?, real_name), id_number = COALESCE(?, id_number), university = COALESCE(?, university), major = COALESCE(?, major), grade = COALESCE(?, grade), skills = COALESCE(?, skills), availability_calendar = COALESCE(?, availability_calendar) WHERE user_id = ?`
    ).run(identity_type, real_name, id_number, university, major, grade, skills, availability_calendar, req.user.id);
    res.json({ code: 0, data: null, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/employer', auth, requireRole('employer'), (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ code: -1, message: 'Employer profile not found' });
    }
    res.json({ code: 0, data: profile, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.put('/employer', auth, requireRole('employer'), (req, res) => {
  try {
    const { company_name } = req.body;
    const profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ code: -1, message: 'Employer profile not found' });
    }
    db.prepare(
      'UPDATE employer_profiles SET company_name = COALESCE(?, company_name) WHERE user_id = ?'
    ).run(company_name, req.user.id);
    res.json({ code: 0, data: null, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/employer/verify', auth, requireRole('employer'), (req, res) => {
  try {
    const { business_license } = req.body;
    if (!business_license) {
      return res.status(400).json({ code: -1, message: 'Business license is required' });
    }
    db.prepare(
      'UPDATE employer_profiles SET business_license = ?, verified = 0 WHERE user_id = ?'
    ).run(business_license, req.user.id);
    res.json({ code: 0, data: null, message: 'Verification request submitted' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
