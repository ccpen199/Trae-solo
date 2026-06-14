const bcrypt = require('bcryptjs');
const db = require('./backend/database');

const salt = bcrypt.genSaltSync(10);
const pwd = bcrypt.hashSync('123456', salt);
console.log('Password hash:', pwd);

db.run('UPDATE users SET password = ? WHERE username = ?', [pwd, 'agent01'], function(err) {
  if (err) console.error('Error updating password:', err);
  else console.log('Updated agent01 password, rows:', this.changes);
});

db.get('SELECT * FROM user_roles WHERE user_id = 8', (err, row) => {
  if (err) {
    console.error('Error checking user_role:', err);
  } else if (!row) {
    db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [8, 8], function(err) {
      if (err) console.error('Error inserting user_role:', err);
      else console.log('Inserted user_role:', this.lastID);
    });
  } else {
    console.log('User_role exists:', row);
  }
  setTimeout(() => {
    db.all('SELECT u.username, r.name, r.code FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id ORDER BY u.id', (err, rows) => {
      console.log('\nAll users with roles:');
      rows.forEach(r => console.log(`  ${r.username} -> ${r.name} (${r.code})`));
      process.exit(0);
    });
  }, 500);
});
