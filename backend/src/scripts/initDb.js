const db = require("../models/db");

const summary = {
  users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
  projects: db.prepare("SELECT COUNT(*) AS count FROM research_projects").get().count,
  patients: db.prepare("SELECT COUNT(*) AS count FROM patients").get().count,
  followupTasks: db.prepare("SELECT COUNT(*) AS count FROM followup_tasks").get().count,
};

console.log(JSON.stringify({ ok: true, summary }, null, 2));
