const { AppDataSource } = require('./dist/data-source');
const { seedDatabase } = require('./dist/utils/seed');
(async () => {
  try {
    await AppDataSource.initialize();
    console.log('DB init OK');
    await seedDatabase();
    console.log('Seed done');
    const oc = await AppDataSource.getRepository('Order').count();
    const ic = await AppDataSource.getRepository('OrderItem').count();
    const lc = await AppDataSource.getRepository('OrderLog').count();
    const sc = await AppDataSource.getRepository('SettlementRecord').count();
    const dc = await AppDataSource.getRepository('Dispute').count();
    const mc = await AppDataSource.getRepository('DisputeMessage').count();
    const qc = await AppDataSource.getRepository('QualityInspectionRule').count();
    console.log('Orders:', oc, 'Items:', ic, 'Logs:', lc);
    console.log('Settlements:', sc, 'Disputes:', dc, 'Messages:', mc, 'QIRules:', qc);
    await AppDataSource.destroy();
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack.split('\n').slice(0,5).join('\n'));
  }
})();
