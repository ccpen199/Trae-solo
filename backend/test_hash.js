import bcrypt from 'bcryptjs';

const testCases = [
  { username: 'admin', password: 'admin123', hash: '$2a$10$LBDrZkOXFwCFbs1VHdz.qem0jLElVWn.hcB3c3DjkCrWMUMSNn4Ku' },
  { username: 'platform', password: 'platform123', hash: '$2a$10$O4J2YieE0/tWonW7oSk2M.qrf7leJgPSZIBhVI9GFo1v7jrJjWfeq' },
  { username: 'ops', password: 'ops123', hash: '$2a$10$J2zhvebQCBcZU7jusWVNq.brDtSK9fkIpprTD4Co6rLvjIiQaX032' },
  { username: 'zhangsan', password: '123456', hash: '$2a$10$1K3xmFYxPCd0.4VWIeG35.9X9cDuHSFkU/A/sEBIsWRaMtWNFCMEi' },
];

for (const tc of testCases) {
  const match = bcrypt.compareSync(tc.password, tc.hash);
  console.log(`${tc.username}:${tc.password} => ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
}
