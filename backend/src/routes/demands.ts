import { Router, Request, Response } from 'express';
import { db, getAsync, allAsync, runAsync } from '../database/init';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { gridCode, status, type } = req.query;
    
    let query = 'SELECT * FROM demands WHERE 1=1';
    const params: any[] = [];
    
    if (gridCode) {
      query += ' AND grid_code = ?';
      params.push(gridCode);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const demands = await allAsync(query, params);
    res.json({ success: true, data: demands });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取需求列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const demand = await getAsync('SELECT * FROM demands WHERE id = ?', [Number(req.params.id)]);
    if (!demand) {
      return res.status(404).json({ success: false, error: '需求不存在' });
    }
    res.json({ success: true, data: demand });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取需求详情失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, title, description, gridCode, publisherId, publisherName, reward, serviceTime, address, scene, recommendChain } = req.body;
    
    const result = await new Promise<any>((resolve, reject) => {
      db.run(`
        INSERT INTO demands (type, title, description, grid_code, publisher_id, publisher_name, reward, status, service_time, address, scene, recommend_chain)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
      `, [type, title, description, gridCode, publisherId, publisherName, reward || 0, serviceTime, address, scene, recommendChain], function(err: any) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID });
      });
    });
    
    res.json({ success: true, data: { id: result.lastID } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建需求失败' });
  }
});

const logOperation = async (demandId: number, operatorId: number | null, operatorName: string | null, operation: string, detail: string, req: Request) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    await runAsync(`
      INSERT INTO demand_operations (demand_id, operator_id, operator_name, operation, detail, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [demandId, operatorId, operatorName, operation, detail, ip?.toString(), userAgent]);
  } catch (logErr) {
    console.error('记录操作日志失败:', logErr);
  }
};

const acceptDemand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acceptorId, acceptorName } = req.body;
    
    await runAsync(`
      UPDATE demands 
      SET status = 'accepted', acceptor_id = ?, acceptor_name = ?
      WHERE id = ? AND status = 'open'
    `, [acceptorId, acceptorName, Number(id)]);
    
    await logOperation(Number(id), acceptorId, acceptorName, 'accept', `接单成功，服务商：${acceptorName}`, req);
    
    res.json({ success: true, message: '接单成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '接单失败' });
  }
};

const completeDemand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operatorId, operatorName } = req.body;
    
    await runAsync(`
      UPDATE demands 
      SET status = 'completed'
      WHERE id = ?
    `, [Number(id)]);
    
    await logOperation(Number(id), operatorId || null, operatorName || null, 'complete', '需求完成确认', req);
    
    res.json({ success: true, message: '需求已完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: '操作失败' });
  }
};

router.get('/:id/operations', async (req, res) => {
  try {
    const operations = await allAsync(`
      SELECT * FROM demand_operations 
      WHERE demand_id = ? 
      ORDER BY created_at DESC
    `, [Number(req.params.id)]);
    
    res.json({ success: true, data: operations });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取操作记录失败' });
  }
});

router.post('/:id/dispute', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, complainantId, complainantName } = req.body;
    
    const demand = await getAsync('SELECT * FROM demands WHERE id = ?', [Number(id)]);
    if (!demand) {
      return res.status(404).json({ success: false, error: '需求不存在' });
    }
    
    await runAsync(`
      INSERT INTO disputes (demand_id, provider_id, complainant_id, description, status, grid_code)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `, [Number(id), demand.acceptor_id || demand.provider_id, complainantId, description, demand.grid_code]);
    
    await logOperation(Number(id), complainantId, complainantName, 'dispute', `提交纠纷申诉：${description}`, req);
    
    res.json({ success: true, message: '申诉已提交，社区管理员将在24小时内处理' });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交失败' });
  }
});

router.put('/:id/accept', acceptDemand);
router.post('/:id/accept', acceptDemand);
router.put('/:id/complete', completeDemand);
router.post('/:id/complete', completeDemand);

export default router;
