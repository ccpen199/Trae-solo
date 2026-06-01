const db = require('./src/db');

const properties = db.prepare('SELECT id, type, property_reg_no, created_at FROM properties WHERE property_verified = 1').all();
console.log('Properties to add verifications for:', JSON.stringify(properties, null, 2));

const insertVerification = db.prepare(
  'INSERT INTO property_verifications (property_id, verifier_id, property_reg_no, verification_result, verified, verified_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const insertAll = db.transaction(() => {
  properties.forEach(p => {
    const baseDate = new Date(p.created_at || '2024-05-20T10:00:00');
    const initialDate = new Date(baseDate.getTime() + 3600000);
    const reviewDate = new Date(baseDate.getTime() + 86400000);

    insertVerification.run(
      p.id,
      1,
      p.property_reg_no || null,
      '产权信息校验通过，不动产登记编号核验一致',
      1,
      initialDate.toISOString().replace('T', ' ').substring(0, 19),
      initialDate.toISOString().replace('T', ' ').substring(0, 19)
    );

    if (p.type === 'secondhand') {
      insertVerification.run(
        p.id,
        1,
        p.property_reg_no || null,
        '产权复查通过，无异常记录',
        1,
        reviewDate.toISOString().replace('T', ' ').substring(0, 19),
        reviewDate.toISOString().replace('T', ' ').substring(0, 19)
      );
    }
  });
});

insertAll();

const verifs = db.prepare('SELECT * FROM property_verifications').all();
console.log('Total verifications:', verifs.length);
verifs.forEach(v => console.log(v));
