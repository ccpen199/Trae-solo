const express = require('express');
const router = express.Router();
const EmployeeBiz = require('../biz/EmployeeBiz');
const EmployeeDetailBiz = require('../biz/EmployeeDetailBiz');

const employeeBiz = new EmployeeBiz();
const employeeDetailBiz = new EmployeeDetailBiz();

router.get('/', async (req, res) => {
  try {
    const result = await employeeBiz.getEmployeeList(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await employeeBiz.getEmployeeById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/details', async (req, res) => {
  try {
    const result = await employeeDetailBiz.getEmployeeFullDetails(req.params.id, null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await employeeBiz.createEmployee(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await employeeBiz.updateEmployee(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const result = await employeeBiz.updateEmployeeStatus(
      req.params.id,
      req.body.status,
      req.body.resignDate
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await employeeBiz.deleteEmployee(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/education', async (req, res) => {
  try {
    const result = await employeeDetailBiz.createEducation({
      employeeId: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/family', async (req, res) => {
  try {
    const result = await employeeDetailBiz.createFamilyMember({
      employeeId: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/work-experience', async (req, res) => {
  try {
    const result = await employeeDetailBiz.createWorkExperience({
      employeeId: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/project-experience', async (req, res) => {
  try {
    const result = await employeeDetailBiz.createProjectExperience({
      employeeId: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/training', async (req, res) => {
  try {
    const result = await employeeDetailBiz.createTrainingRecord({
      employeeId: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/detail/:type/:id', async (req, res) => {
  try {
    const result = await employeeDetailBiz.updateDetail(req.params.type, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/detail/:type/:id', async (req, res) => {
  try {
    const result = await employeeDetailBiz.deleteDetail(req.params.type, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
