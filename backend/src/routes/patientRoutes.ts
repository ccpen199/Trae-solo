import express from 'express';
import { mockPatients } from '../data/mockData';
import { Patient } from '../types';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    res.json(mockPatients);
  } catch (error) {
    res.status(500).json({ error: '获取患者列表失败' });
  }
});

router.get('/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = mockPatients.find(p => p.id === patientId);
    
    if (!patient) {
      return res.status(404).json({ error: '患者不存在' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: '获取患者信息失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, age, gender, phone, condition } = req.body;
    
    if (!name || !age || !gender || !phone || !condition) {
      return res.status(400).json({ error: '请提供完整的患者信息' });
    }
    
    const newPatient: Patient = {
      id: Date.now().toString(),
      name,
      age,
      gender: gender as 'male' | 'female',
      phone,
      condition,
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    mockPatients.push(newPatient);
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: '创建患者失败' });
  }
});

router.put('/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, age, gender, phone, condition, status } = req.body;
    
    const patientIndex = mockPatients.findIndex(p => p.id === patientId);
    
    if (patientIndex === -1) {
      return res.status(404).json({ error: '患者不存在' });
    }
    
    const updatedPatient: Patient = {
      ...mockPatients[patientIndex],
      ...(name !== undefined && { name }),
      ...(age !== undefined && { age }),
      ...(gender !== undefined && { gender: gender as 'male' | 'female' }),
      ...(phone !== undefined && { phone }),
      ...(condition !== undefined && { condition }),
      ...(status !== undefined && { status: status as 'active' | 'discharged' | 'follow-up' })
    };
    
    mockPatients[patientIndex] = updatedPatient;
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: '更新患者信息失败' });
  }
});

router.delete('/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const patientIndex = mockPatients.findIndex(p => p.id === patientId);
    
    if (patientIndex === -1) {
      return res.status(404).json({ error: '患者不存在' });
    }
    
    mockPatients.splice(patientIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除患者失败' });
  }
});

export default router;
