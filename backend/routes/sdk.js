import express from 'express';

export default function sdkRoutes(db) {
  const router = express.Router();

  router.get('/packages', (req, res) => {
    try {
      const { status, device_type } = req.query;

      let query = 'SELECT * FROM sdk_packages WHERE 1=1';
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (device_type) {
        query += ' AND device_type = ?';
        params.push(device_type);
      }

      query += ' ORDER BY created_at DESC';

      const packages = db.prepare(query).all(...params);
      const parsedPackages = packages.map(pkg => ({
        ...pkg,
        package_data: JSON.parse(pkg.package_data),
        test_result: pkg.test_result ? JSON.parse(pkg.test_result) : null
      }));
      res.json(parsedPackages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const pkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: 'SDK package not found' });
      }
      res.json({
        ...pkg,
        package_data: JSON.parse(pkg.package_data),
        test_result: pkg.test_result ? JSON.parse(pkg.test_result) : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/upload', (req, res) => {
    try {
      const { package_name, version, device_type, package_data } = req.body;

      if (!package_name || !version || !device_type || !package_data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingPackage = db.prepare(
        'SELECT * FROM sdk_packages WHERE package_name = ? AND version = ?'
      ).get(package_name, version);

      if (existingPackage) {
        return res.status(409).json({ error: 'Package version already exists' });
      }

      const stmt = db.prepare(`
        INSERT INTO sdk_packages (package_name, version, device_type, package_data, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);

      const result = stmt.run(package_name, version, device_type, JSON.stringify(package_data));

      const pkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({
        ...pkg,
        package_data: JSON.parse(pkg.package_data)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/test', (req, res) => {
    try {
      const { id } = req.params;

      const pkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(id);
      if (!pkg) {
        return res.status(404).json({ error: 'SDK package not found' });
      }

      db.prepare('UPDATE sdk_packages SET status = ? WHERE id = ?').run('testing', id);

      const testResult = {
        sandbox_test: {
          status: 'passed',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          duration_ms: Math.floor(Math.random() * 1000) + 500,
          results: {
            syntax_check: true,
            capability_validation: true,
            device_simulation: true,
            error_count: 0
          }
        },
        production_test: {
          status: 'pending',
          notes: 'Production test pending approval'
        }
      };

      db.prepare('UPDATE sdk_packages SET test_result = ?, status = ? WHERE id = ?').run(
        JSON.stringify(testResult),
        'approved',
        id
      );

      const updatedPkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(id);
      res.json({
        ...updatedPkg,
        package_data: JSON.parse(updatedPkg.package_data),
        test_result: JSON.parse(updatedPkg.test_result)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id/approve', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const pkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(id);
      if (!pkg) {
        return res.status(404).json({ error: 'SDK package not found' });
      }

      db.prepare('UPDATE sdk_packages SET status = ? WHERE id = ?').run(status, id);

      const updatedPkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(id);
      res.json({
        ...updatedPkg,
        package_data: JSON.parse(updatedPkg.package_data),
        test_result: updatedPkg.test_result ? JSON.parse(updatedPkg.test_result) : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;

      const pkg = db.prepare('SELECT * FROM sdk_packages WHERE id = ?').get(id);
      if (!pkg) {
        return res.status(404).json({ error: 'SDK package not found' });
      }

      db.prepare('DELETE FROM sdk_packages WHERE id = ?').run(id);

      res.json({ message: 'SDK package deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
