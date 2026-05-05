const express = require('express');
const router = express.Router();
const DepartmentBiz = require('../biz/DepartmentBiz');

const departmentBiz = new DepartmentBiz();

router.get('/', async (req, res) => {
  try {
    const result = await departmentBiz.getDepartmentList();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await departmentBiz.getDepartmentById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await departmentBiz.createDepartment(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await departmentBiz.updateDepartment(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await departmentBiz.deleteDepartment(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
