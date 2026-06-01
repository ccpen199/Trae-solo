const express = require('express');
const router = express.Router();

const usersController = require('../controllers/usersController');
const clientsController = require('../controllers/clientsController');
const mattersController = require('../controllers/mattersController');
const timeEntriesController = require('../controllers/timeEntriesController');
const ratesController = require('../controllers/ratesController');
const invoicesController = require('../controllers/invoicesController');
const reportsController = require('../controllers/reportsController');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

router.get('/users', usersController.getUsers);
router.get('/users/:id', usersController.getUserById);
router.post('/users', usersController.createUser);

router.get('/clients', clientsController.getClients);
router.get('/clients/:id', clientsController.getClientById);
router.post('/clients', clientsController.createClient);
router.put('/clients/:id', clientsController.updateClient);

router.get('/matters', mattersController.getMatters);
router.get('/matters/:id', mattersController.getMatterById);
router.post('/matters', mattersController.createMatter);
router.put('/matters/:id', mattersController.updateMatter);

router.get('/time-entries', timeEntriesController.getTimeEntries);
router.get('/time-entries/:id', timeEntriesController.getTimeEntryById);
router.post('/time-entries', timeEntriesController.createTimeEntry);
router.put('/time-entries/:id', timeEntriesController.updateTimeEntry);
router.put('/time-entries/:id/review', timeEntriesController.reviewTimeEntry);
router.delete('/time-entries/:id', timeEntriesController.deleteTimeEntry);

router.get('/rates', ratesController.getRates);
router.post('/rates', ratesController.createRate);
router.get('/rates/user/:user_id', ratesController.getActiveRate);

router.get('/invoices', invoicesController.getInvoices);
router.get('/invoices/:id', invoicesController.getInvoiceById);
router.post('/invoices', invoicesController.createInvoice);
router.put('/invoices/:id/status', invoicesController.updateInvoiceStatus);
router.post('/payments', invoicesController.recordPayment);
router.post('/invoices/:id/reopen', invoicesController.reopenInvoice);

router.get('/reports/budget', reportsController.getBudgetReport);
router.get('/reports/time-summary', reportsController.getTimeSummary);
router.get('/reports/revenue', reportsController.getRevenueReport);

module.exports = router;
