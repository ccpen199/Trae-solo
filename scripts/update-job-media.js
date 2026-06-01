const db = require('../backend/src/database');

function updateJobsWithMedia() {
  console.log('Updating jobs with media content...');

  const jobs = db.prepare('SELECT id, title FROM jobs').all();
  
  const jobMedia = {
    1: { // 资深前端开发工程师
      video_url: 'https://example.com/frontend-intro.mp4',
      team_vlog_url: 'https://example.com/frontend-team-vlog.mp4',
      office_images: JSON.stringify(['https://example.com/office1.jpg', 'https://example.com/office2.jpg', 'https://example.com/office3.jpg']),
    },
    2: { // AI算法工程师
      video_url: 'https://example.com/ai-intro.mp4',
      team_vlog_url: 'https://example.com/ai-team-vlog.mp4',
      office_images: JSON.stringify(['https://example.com/ai-lab1.jpg', 'https://example.com/ai-lab2.jpg']),
    },
    3: { // 高级Java开发工程师
      video_url: 'https://example.com/java-intro.mp4',
      team_vlog_url: null,
      office_images: JSON.stringify(['https://example.com/finance-office1.jpg']),
    },
    4: { // 数据分析师
      video_url: null,
      team_vlog_url: 'https://example.com/data-team-vlog.mp4',
      office_images: JSON.stringify(['https://example.com/data-office1.jpg', 'https://example.com/data-office2.jpg', 'https://example.com/data-office3.jpg', 'https://example.com/data-office4.jpg']),
    },
  };

  const updateStmt = db.prepare(`
    UPDATE jobs SET 
      video_url = COALESCE(?, video_url),
      team_vlog_url = COALESCE(?, team_vlog_url),
      office_images = COALESCE(?, office_images),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  jobs.forEach(job => {
    const media = jobMedia[job.id];
    if (media) {
      updateStmt.run(media.video_url, media.team_vlog_url, media.office_images, job.id);
      console.log(`  Updated job ${job.id}: ${job.title} - added media`);
    }
  });

  console.log('Jobs media update complete!');
}

updateJobsWithMedia();
