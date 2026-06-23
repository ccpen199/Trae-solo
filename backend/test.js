console.log('Test starting...');
console.log('PORT:', process.env.PORT);

try {
  const express = require('express');
  console.log('express loaded');
} catch(e) {
  console.error('express error:', e.message);
}

try {
  const Database = require('better-sqlite3');
  console.log('better-sqlite3 loaded');
} catch(e) {
  console.error('better-sqlite3 error:', e.message);
}

console.log('Test done');
