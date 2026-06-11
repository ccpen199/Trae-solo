import bcrypt from 'bcryptjs';
import db from './api/src/database/connection.js';

console.log('Testing login flow...');

const user = db.prepare('SELECT * FROM users WHERE username = ?').get('owner1') as any;
console.log('User found:', user.username, user.name);

console.log('Password hash:', user.password_hash.substring(0, 30) + '...');

const startTime = Date.now();
const isValid = bcrypt.compareSync('123456', user.password_hash);
const endTime = Date.now();

console.log('Password valid:', isValid);
console.log('Time taken:', endTime - startTime, 'ms');
