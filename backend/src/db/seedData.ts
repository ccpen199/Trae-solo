import db from './index';

export function seedBusinessData(): void {
  const agent1 = db.prepare('SELECT * FROM agents WHERE user_id = (SELECT id FROM users WHERE username = ?)').get('agent001') as any;
  const agent2 = db.prepare('SELECT * FROM agents WHERE user_id = (SELECT id FROM users WHERE username = ?)').get('agent002') as any;
  const user1 = db.prepare('SELECT * FROM users WHERE username = ?').get('user001') as any;
  const user2 = db.prepare('SELECT * FROM users WHERE username = ?').get('user002') as any;
  const dev1 = db.prepare('SELECT * FROM developers WHERE user_id = (SELECT id FROM users WHERE username = ?)').get('dev001') as any;

  if (!agent1 || !user1 || !user2 || !dev1) {
    console.log('基础数据不存在，跳过业务数据填充');
    return;
  }

  const propCount = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
  if (propCount.count === 0) {
    console.log('房源数据不存在，跳过业务数据填充');
    return;
  }

  const properties = db.prepare('SELECT * FROM properties ORDER BY id').all() as any[];
  const newProps = properties.filter((p: any) => p.type === 'new');
  const secondHandProps = properties.filter((p: any) => p.type === 'secondhand');
  const rentalProps = properties.filter((p: any) => p.type === 'rental');
  const commercialProps = properties.filter((p: any) => p.type === 'commercial');

  const imgCount = db.prepare('SELECT COUNT(*) as count FROM property_images').get() as { count: number };
  if (imgCount.count === 0) {
    const insertImg = db.prepare(
      'INSERT INTO property_images (property_id, image_url, image_hash, is_duplicate, sort_order) VALUES (?, ?, ?, ?, ?)'
    );

    properties.forEach((prop: any, idx: number) => {
      const images = JSON.parse(prop.images || '[]');
      const hashes = [
        'abc123def456' + idx,
        'def789ghi012' + idx,
        'ghi345jkl678' + idx,
      ];

      images.forEach((img: string, i: number) => {
        const isDup = idx === 2 && i === 0 ? 1 :
                      idx === 5 && i === 1 ? 1 :
                      idx === 1 && i === 0 ? 1 : 0;
        insertImg.run(prop.id, img, hashes[i] || 'hash' + idx + i, isDup, i);
      });
    });

    console.log('已填充 property_images 数据');
  }

  const warnCount = db.prepare("SELECT COUNT(*) as count FROM properties WHERE price_warning = 1").get() as { count: number };
  if (warnCount.count < 2 && secondHandProps.length >= 2) {
    db.prepare('UPDATE properties SET price_warning = 1, price_deviation = 15.5 WHERE id = ?').run(secondHandProps[0].id);
    db.prepare('UPDATE properties SET price_warning = 1, price_deviation = -12.3 WHERE id = ?').run(secondHandProps[1].id);
    if (rentalProps[0]) {
      db.prepare('UPDATE properties SET price_warning = 1, price_deviation = 8.7 WHERE id = ?').run(rentalProps[0].id);
    }
    console.log('已填充价格预警数据');
  }

  const ownerConfirmCount = db.prepare('SELECT COUNT(*) as count FROM owner_confirmations').get() as { count: number };
  if (ownerConfirmCount.count === 0) {
    const insertConfirm = db.prepare(
      'INSERT INTO owner_confirmations (property_id, owner_id, code, confirmed, confirmed_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    secondHandProps.forEach((prop: any, idx: number) => {
      if (prop.owner_id) {
        const confirmed = idx < 2 ? 1 : 0;
        const confirmedAt = confirmed ? new Date(Date.now() - idx * 86400000).toISOString() : null;
        const expiresAt = new Date(Date.now() + (idx + 1) * 86400000).toISOString();
        insertConfirm.run(prop.id, prop.owner_id, '123456', confirmed, confirmedAt, expiresAt);
      }
    });

    rentalProps.forEach((prop: any, idx: number) => {
      if (prop.owner_id) {
        const confirmed = idx < 1 ? 1 : 0;
        const confirmedAt = confirmed ? new Date(Date.now() - (idx + 3) * 86400000).toISOString() : null;
        const expiresAt = new Date(Date.now() + (idx + 2) * 86400000).toISOString();
        insertConfirm.run(prop.id, prop.owner_id, '654321', confirmed, confirmedAt, expiresAt);
      }
    });

    console.log('已填充业主确认数据');
  }

  const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  if (txCount.count === 0) {
    const insertTx = db.prepare(
      `INSERT INTO transactions 
       (order_no, property_id, buyer_id, seller_id, agent_id, type, price, status, 
        contract_signed, contract_url, fund_escrow, fund_amount, tax_amount, transfer_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertProgress = db.prepare(
      'INSERT INTO transaction_progress (transaction_id, step, status, remark, operator, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertCommission = db.prepare(
      'INSERT INTO commission_records (agent_id, transaction_id, amount, type, status) VALUES (?, ?, ?, ?, ?)'
    );
    const insertRegulatory = db.prepare(
      'INSERT INTO regulatory_records (transaction_id, record_type, record_content, platform_ref_no, status) VALUES (?, ?, ?, ?, ?)'
    );

    const orderNos = [
      'RE20240615103045001',
      'RE20240618142033002',
      'RE20240620091522003',
      'RE20240610164511004',
      'RE20240605112555005',
    ];

    const txData = [
      {
        prop: secondHandProps[0],
        buyer: user1.id,
        seller: user2.id,
        agent: agent1.id,
        type: 'secondhand',
        price: secondHandProps[0]?.price || 450,
        status: 'completed',
        contract: 1,
        fundEscrow: 1,
        fundAmount: (secondHandProps[0]?.price || 450) * 0.3,
        taxAmount: (secondHandProps[0]?.price || 450) * 0.078,
        transferStatus: 'completed',
        commission: (secondHandProps[0]?.price || 450) * 0.025,
        steps: [
          { step: 'sign_contract', status: 'completed', remark: '电子签约完成', operator: 'admin' },
          { step: 'fund_escrow', status: 'completed', remark: '资金监管完成', operator: 'admin' },
          { step: 'tax_payment', status: 'completed', remark: '税费缴纳完成', operator: 'admin' },
          { step: 'property_transfer', status: 'completed', remark: '产权过户完成', operator: 'admin' },
          { step: 'delivery', status: 'completed', remark: '房屋交付完成', operator: 'admin' },
        ],
      },
      {
        prop: secondHandProps[1],
        buyer: user2.id,
        seller: user1.id,
        agent: agent1.id,
        type: 'secondhand',
        price: secondHandProps[1]?.price || 320,
        status: 'processing',
        contract: 1,
        fundEscrow: 1,
        fundAmount: (secondHandProps[1]?.price || 320) * 0.3,
        taxAmount: 0,
        transferStatus: 'processing',
        commission: (secondHandProps[1]?.price || 320) * 0.02,
        steps: [
          { step: 'sign_contract', status: 'completed', remark: '电子签约完成', operator: 'agent001' },
          { step: 'fund_escrow', status: 'completed', remark: '首付资金已监管', operator: 'agent001' },
          { step: 'tax_payment', status: 'processing', remark: '税费核算中', operator: 'agent001' },
          { step: 'property_transfer', status: 'pending', remark: '', operator: '' },
          { step: 'delivery', status: 'pending', remark: '', operator: '' },
        ],
      },
      {
        prop: newProps[0],
        buyer: user1.id,
        seller: dev1.user_id,
        agent: agent1.id,
        type: 'new',
        price: newProps[0]?.price || 580,
        status: 'processing',
        contract: 1,
        fundEscrow: 0,
        fundAmount: 0,
        taxAmount: 0,
        transferStatus: 'pending',
        commission: (newProps[0]?.price || 580) * 0.015,
        steps: [
          { step: 'sign_contract', status: 'completed', remark: '认购协议已签署', operator: 'dev001' },
          { step: 'fund_escrow', status: 'processing', remark: '等待支付首付', operator: '' },
          { step: 'tax_payment', status: 'pending', remark: '', operator: '' },
          { step: 'property_transfer', status: 'pending', remark: '', operator: '' },
          { step: 'delivery', status: 'pending', remark: '', operator: '' },
        ],
      },
      {
        prop: rentalProps[0],
        buyer: user1.id,
        seller: user2.id,
        agent: agent2.id,
        type: 'rental',
        price: rentalProps[0]?.price || 5500,
        status: 'completed',
        contract: 1,
        fundEscrow: 1,
        fundAmount: (rentalProps[0]?.price || 5500) * 2,
        taxAmount: (rentalProps[0]?.price || 5500) * 0.05,
        transferStatus: 'completed',
        commission: (rentalProps[0]?.price || 5500) * 0.5,
        steps: [
          { step: 'sign_contract', status: 'completed', remark: '租赁合同签署完成', operator: 'agent002' },
          { step: 'fund_escrow', status: 'completed', remark: '押金及首月租金监管', operator: 'agent002' },
          { step: 'tax_payment', status: 'completed', remark: '租赁税费已缴纳', operator: 'agent002' },
          { step: 'property_transfer', status: 'completed', remark: '房屋交付完成', operator: 'agent002' },
          { step: 'delivery', status: 'completed', remark: '钥匙交接完成', operator: 'agent002' },
        ],
      },
      {
        prop: commercialProps[0],
        buyer: user2.id,
        seller: dev1.user_id,
        agent: agent2.id,
        type: 'commercial',
        price: commercialProps[0]?.price || 8500,
        status: 'processing',
        contract: 1,
        fundEscrow: 1,
        fundAmount: (commercialProps[0]?.price || 8500) * 0.3,
        taxAmount: 0,
        transferStatus: 'pending',
        commission: (commercialProps[0]?.price || 8500) * 0.03,
        steps: [
          { step: 'sign_contract', status: 'completed', remark: '商业购房合同签署', operator: 'agent002' },
          { step: 'fund_escrow', status: 'completed', remark: '商业贷款首付监管', operator: 'agent002' },
          { step: 'tax_payment', status: 'processing', remark: '土地增值税核算中', operator: '' },
          { step: 'property_transfer', status: 'pending', remark: '', operator: '' },
          { step: 'delivery', status: 'pending', remark: '', operator: '' },
        ],
      },
    ];

    txData.forEach((tx, idx) => {
      if (!tx.prop) return;
      
      const txId = insertTx.run(
        orderNos[idx],
        tx.prop.id,
        tx.buyer,
        tx.seller,
        tx.agent,
        tx.type,
        tx.price,
        tx.status,
        tx.contract,
        `/contracts/${orderNos[idx]}.pdf`,
        tx.fundEscrow,
        tx.fundAmount,
        tx.taxAmount,
        tx.transferStatus
      ).lastInsertRowid as number;

      tx.steps.forEach(step => {
        insertProgress.run(
          txId,
          step.step,
          step.status,
          step.remark,
          step.operator,
          new Date(Date.now() - (5 - idx) * 86400000).toISOString()
        );
      });

      insertCommission.run(
        tx.agent,
        txId,
        tx.commission,
        tx.type === 'rental' ? 'rental' : 'sale',
        tx.status === 'completed' ? 'paid' : 'pending'
      );

      if (tx.status === 'completed') {
        insertRegulatory.run(
          txId,
          'contract_sign',
          '电子签约完成，已同步至住建监管平台',
          'JG' + orderNos[idx],
          'synced'
        );
        insertRegulatory.run(
          txId,
          'transfer_done',
          '产权过户完成，网签备案成功',
          'BW' + orderNos[idx],
          'synced'
        );
      } else {
        insertRegulatory.run(
          txId,
          'contract_sign',
          '电子签约完成，监管备案中',
          'JG' + orderNos[idx],
          'pending'
        );
      }
    });

    console.log('已填充交易数据');
  }

  const followupCount = db.prepare('SELECT COUNT(*) as count FROM customer_followups').get() as { count: number };
  if (followupCount.count === 0) {
    const insertFollowup = db.prepare(
      'INSERT INTO customer_followups (agent_id, customer_id, type, content, next_follow_time, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const followups = [
      { agent: agent1.id, customer: user1.id, type: 'phone', content: '客户对阳光花园三居感兴趣，约定周末带看', next: 1 },
      { agent: agent1.id, customer: user1.id, type: 'wechat', content: '发送了房源资料和价格明细，等待回复', next: 2 },
      { agent: agent1.id, customer: user2.id, type: 'visit', content: '客户到访门店，了解金色家园两居', next: 1 },
      { agent: agent1.id, customer: user2.id, type: 'phone', content: '回访客户，客户表示价格偏高', next: 3 },
      { agent: agent2.id, customer: user1.id, type: 'wechat', content: '推荐了白领公寓，客户在考虑', next: 2 },
      { agent: agent2.id, customer: user2.id, type: 'phone', content: '商业物业咨询，约定下周面谈', next: 5 },
    ];

    followups.forEach((f, idx) => {
      const createdAt = new Date(Date.now() - (idx + 1) * 86400000 / 2).toISOString();
      const nextFollow = new Date(Date.now() + f.next * 86400000).toISOString();
      insertFollowup.run(f.agent, f.customer, f.type, f.content, nextFollow, createdAt);
    });

    console.log('已填充客户跟进数据');
  }

  const viewingCount = db.prepare('SELECT COUNT(*) as count FROM viewing_records').get() as { count: number };
  if (viewingCount.count === 0) {
    const insertViewing = db.prepare(
      'INSERT INTO viewing_records (agent_id, customer_id, property_id, view_time, feedback, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const viewings = [
      { agent: agent1.id, customer: user1.id, prop: secondHandProps[0]?.id, daysAgo: 1, feedback: '户型不错，楼层好，价格可谈', rating: 4 },
      { agent: agent1.id, customer: user1.id, prop: secondHandProps[1]?.id, daysAgo: 2, feedback: '装修不错，小区环境好', rating: 5 },
      { agent: agent1.id, customer: user2.id, prop: newProps[0]?.id, daysAgo: 3, feedback: '位置好，但是价格偏高', rating: 3 },
      { agent: agent2.id, customer: user1.id, prop: rentalProps[0]?.id, daysAgo: 1, feedback: '装修精致，拎包入住，考虑签约', rating: 5 },
      { agent: agent2.id, customer: user2.id, prop: commercialProps[0]?.id, daysAgo: 4, feedback: '位置优越，回报率高，考虑投资', rating: 4 },
      { agent: agent1.id, customer: user1.id, prop: rentalProps[1]?.id, daysAgo: 5, feedback: '合租室友不错，价格合适', rating: 4 },
    ];

    viewings.forEach((v, idx) => {
      if (!v.prop) return;
      const viewTime = new Date(Date.now() - v.daysAgo * 86400000).toISOString();
      const createdAt = viewTime;
      insertViewing.run(v.agent, v.customer, v.prop, viewTime, v.feedback, v.rating, createdAt);
    });

    console.log('已填充带看记录数据');
  }

  const entrustmentCount = db.prepare('SELECT COUNT(*) as count FROM owner_entrustments').get() as { count: number };
  if (entrustmentCount.count === 0) {
    const insertEntrust = db.prepare(
      'INSERT INTO owner_entrustments (owner_id, property_id, type, expected_price, description, status, replacement_demand) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const entrustments = [
      { owner: user2.id, prop: secondHandProps[0]?.id, type: 'sale', price: secondHandProps[0]?.price, desc: '置换大房，诚心出售，价格可谈', status: 'active', demand: '三居室，学区房，海淀区' },
      { owner: user2.id, prop: secondHandProps[1]?.id, type: 'sale', price: secondHandProps[1]?.price, desc: '换工作搬家，急售', status: 'active', demand: '' },
      { owner: user1.id, prop: rentalProps[0]?.id, type: 'rental', price: rentalProps[0]?.price, desc: '长期出租，一年起租，不养宠物', status: 'active', demand: '' },
      { owner: user1.id, prop: rentalProps[2]?.id, type: 'rental', price: rentalProps[2]?.price, desc: '短租也可以，价格面议', status: 'active', demand: '' },
    ];

    entrustments.forEach(e => {
      if (!e.prop) return;
      insertEntrust.run(e.owner, e.prop, e.type, e.price, e.desc, e.status, e.demand);
    });

    console.log('已填充业主委托数据');
  }

  const consultationCount = db.prepare('SELECT COUNT(*) as count FROM consultations').get() as { count: number };
  if (consultationCount.count === 0) {
    const insertConsult = db.prepare(
      'INSERT INTO consultations (user_id, property_id, agent_id, content, status) VALUES (?, ?, ?, ?, ?)'
    );

    const consultations = [
      { user: user1.id, prop: secondHandProps[0]?.id, agent: agent1.id, content: '请问这套房还在吗？能便宜多少？', status: 'replied' },
      { user: user1.id, prop: newProps[0]?.id, agent: agent1.id, content: '什么时候交房？有什么优惠？', status: 'pending' },
      { user: user2.id, prop: rentalProps[0]?.id, agent: agent2.id, content: '租金可以月付吗？', status: 'replied' },
      { user: user2.id, prop: commercialProps[0]?.id, agent: agent2.id, content: '投资回报率大概多少？', status: 'pending' },
    ];

    consultations.forEach(c => {
      if (!c.prop) return;
      insertConsult.run(c.user, c.prop, c.agent, c.content, c.status);
    });

    console.log('已填充咨询记录数据');
  }

  console.log('业务数据填充完成');
}

export default seedBusinessData;
