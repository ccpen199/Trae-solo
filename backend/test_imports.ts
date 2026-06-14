console.log('Step 1: Loading dotenv...');
import('dotenv').then(() => {
  console.log('Step 2: Loading db...');
  return import('./src/db');
}).then(() => {
  console.log('Step 3: Loading auth routes...');
  return import('./src/routes/auth');
}).then(() => {
  console.log('Step 4: Loading resume routes...');
  return import('./src/routes/resumes');
}).then(() => {
  console.log('Step 5: Loading template routes...');
  return import('./src/routes/templates');
}).then(() => {
  console.log('Step 6: Loading import routes...');
  return import('./src/routes/import');
}).then(() => {
  console.log('Step 7: Loading quality routes...');
  return import('./src/routes/quality');
}).then(() => {
  console.log('Step 8: Loading export routes...');
  return import('./src/routes/export');
}).then(() => {
  console.log('Step 9: Loading delivery routes...');
  return import('./src/routes/delivery');
}).then(() => {
  console.log('Step 10: Loading admin routes...');
  return import('./src/routes/admin');
}).then(() => {
  console.log('All imports successful!');
}).catch(e => {
  console.error('Import failed:', e.message);
  console.error(e.stack);
});
