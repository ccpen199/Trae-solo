console.log('Test starting...');
console.log('PORT:', process.env.PORT);
console.log('CWD:', process.cwd());

import express from 'express';
console.log('express loaded');

import Database from 'better-sqlite3';
console.log('better-sqlite3 loaded');

import('./database.js').then(() => {
  console.log('database module loaded');
}).catch(e => {
  console.error('database module error:', e.message);
  console.error(e.stack);
});

console.log('Test imports done');
