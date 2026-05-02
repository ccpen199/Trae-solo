const express = require('express');
const router = express.Router();
const YardRuleEngine = require('../rules/yardRuleEngine');

module.exports = (db) => {
  const yardEngine = new YardRuleEngine(db);

  router.get('/', (req, res) => {
    try {
      const { status, yard_code, bay } = req.query;
      
      let query = `
        SELECT yl.*, c.container_no, c.size_type, c.weight
        FROM yard_locations yl
        LEFT JOIN containers c ON yl.container_id = c.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND yl.status = ?';
        params.push(status);
      }

      if (yard_code) {
        query += ' AND yl.yard_code = ?';
        params.push(yard_code);
      }

      if (bay) {
        query += ' AND yl.bay = ?';
        params.push(bay);
      }

      query += ' ORDER BY CAST(yl.bay AS INTEGER), CAST(yl.row AS INTEGER), CAST(yl.tier AS INTEGER)';

      const locations = db.prepare(query).all(...params);
      res.json({ success: true, data: locations });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const location = db.prepare(`
        SELECT yl.*, c.container_no, c.size_type, c.weight
        FROM yard_locations yl
        LEFT JOIN containers c ON yl.container_id = c.id
        WHERE yl.id = ?
      `).get(id);
      
      if (!location) {
        return res.status(404).json({ success: false, message: '堆场位置不存在' });
      }

      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/available/find', (req, res) => {
    try {
      const { size_type, weight } = req.query;
      
      const container = {
        size_type,
        weight: weight ? parseFloat(weight) : undefined
      };

      const location = yardEngine.findAvailableYardLocation(container);

      if (!location) {
        return res.status(404).json({ 
          success: false, 
          message: '没有可用的堆场位置' 
        });
      }

      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/lock', (req, res) => {
    try {
      const { id } = req.params;

      const success = yardEngine.lockYardLocation(id);
      
      if (!success) {
        return res.status(400).json({ 
          success: false, 
          message: '堆场位置锁定失败，可能已被占用' 
        });
      }

      const location = db.prepare('SELECT * FROM yard_locations WHERE id = ?').get(id);

      res.json({ 
        success: true, 
        data: { 
          id,
          status: 'LOCKED',
          yard_code: location.yard_code,
          bay: location.bay,
          row: location.row,
          tier: location.tier
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/:id/unlock', (req, res) => {
    try {
      const { id } = req.params;

      const success = yardEngine.unlockYardLocation(id);
      
      if (!success) {
        return res.status(400).json({ 
          success: false, 
          message: '堆场位置解锁失败，可能未被锁定' 
        });
      }

      const location = db.prepare('SELECT * FROM yard_locations WHERE id = ?').get(id);

      res.json({ 
        success: true, 
        data: { 
          id,
          status: 'AVAILABLE',
          yard_code: location.yard_code,
          bay: location.bay,
          row: location.row,
          tier: location.tier
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/allocate', (req, res) => {
    try {
      const { container_id, yard_location_id } = req.body;

      if (!container_id) {
        return res.status(400).json({ 
          success: false, 
          message: '集装箱ID为必填项' 
        });
      }

      const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(container_id);
      
      if (!container) {
        return res.status(404).json({ 
          success: false, 
          message: '集装箱不存在' 
        });
      }

      if (container.status === 'IN_YARD') {
        return res.status(400).json({ 
          success: false, 
          message: '该集装箱已分配堆场位置' 
        });
      }

      let targetLocation;

      if (yard_location_id) {
        targetLocation = db.prepare('SELECT * FROM yard_locations WHERE id = ?').get(yard_location_id);
        
        if (!targetLocation) {
          return res.status(404).json({ 
            success: false, 
            message: '指定的堆场位置不存在' 
          });
        }

        const validation = yardEngine.validateYardAllocation(container, targetLocation);
        if (!validation.valid) {
          return res.status(400).json({ 
            success: false, 
            message: validation.errors.join('; ') 
          });
        }
      } else {
        targetLocation = yardEngine.findAvailableYardLocation(container);
        if (!targetLocation) {
          return res.status(404).json({ 
            success: false, 
            message: '没有可用的堆场位置' 
          });
        }
      }

      const success = yardEngine.allocateContainer(container_id, targetLocation.id);
      
      if (!success) {
        return res.status(500).json({ 
          success: false, 
          message: '堆场分配失败' 
        });
      }

      const updatedLocation = db.prepare(`
        SELECT yl.*, c.container_no, c.size_type, c.weight
        FROM yard_locations yl
        LEFT JOIN containers c ON yl.container_id = c.id
        WHERE yl.id = ?
      `).get(targetLocation.id);

      res.json({ 
        success: true, 
        data: updatedLocation 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/release', (req, res) => {
    try {
      const { yard_location_id, container_id } = req.body;

      let location;
      
      if (yard_location_id) {
        location = db.prepare('SELECT * FROM yard_locations WHERE id = ?').get(yard_location_id);
      } else if (container_id) {
        location = db.prepare('SELECT * FROM yard_locations WHERE container_id = ?').get(container_id);
      }

      if (!location) {
        return res.status(404).json({ 
          success: false, 
          message: '堆场位置不存在' 
        });
      }

      if (location.status !== 'OCCUPIED') {
        return res.status(400).json({ 
          success: false, 
          message: '该堆场位置未被占用' 
        });
      }

      const transaction = db.transaction(() => {
        db.prepare(`
          UPDATE yard_locations 
          SET status = 'AVAILABLE', container_id = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(location.id);

        if (location.container_id) {
          db.prepare(`
            UPDATE containers 
            SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(location.container_id);
        }

        return true;
      });

      try {
        transaction();
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: '释放堆场位置失败' 
        });
      }

      const updatedLocation = db.prepare('SELECT * FROM yard_locations WHERE id = ?').get(location.id);

      res.json({ 
        success: true, 
        data: {
          id: updatedLocation.id,
          status: 'AVAILABLE',
          yard_code: updatedLocation.yard_code,
          bay: updatedLocation.bay,
          row: updatedLocation.row,
          tier: updatedLocation.tier
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/statistics/occupancy', (req, res) => {
    try {
      const report = yardEngine.getYardOccupancyReport();
      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/statistics/by-bay', (req, res) => {
    try {
      const statistics = db.prepare(`
        SELECT 
          yard_code,
          bay,
          COUNT(*) as total_locations,
          SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied
        FROM yard_locations
        GROUP BY yard_code, bay
        ORDER BY yard_code, CAST(bay AS INTEGER)
      `).all();

      res.json({ success: true, data: statistics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
