const db = require('../backend/src/database');

function updateLiveRooms() {
  console.log('Updating live rooms with job associations...');

  const rooms = db.prepare('SELECT id, company_id, hr_id FROM live_rooms').all();
  
  // For each room, associate some jobs from the same company
  rooms.forEach(room => {
    const jobs = db.prepare(`
      SELECT id FROM jobs WHERE company_id = ? LIMIT 3
    `).all(room.company_id);

    if (jobs.length > 0) {
      const jobIds = jobs.map(j => j.id).join(',');
      db.prepare(`
        UPDATE live_rooms SET 
          job_ids = ?,
          job_count = ?
        WHERE id = ?
      `).run(jobIds, jobs.length, room.id);
      
      console.log(`  Room ${room.id}: linked ${jobs.length} jobs [${jobIds}]`);
    }
  });

  console.log('Live rooms update complete!');
}

try {
  // Check if job_ids column exists
  db.prepare('SELECT job_ids FROM live_rooms LIMIT 1').get();
} catch (e) {
  console.log('Adding job_ids and job_count columns to live_rooms...');
  db.exec(`
    ALTER TABLE live_rooms ADD COLUMN job_ids TEXT;
    ALTER TABLE live_rooms ADD COLUMN job_count INTEGER DEFAULT 0;
  `);
  console.log('Columns added successfully!');
}

updateLiveRooms();
