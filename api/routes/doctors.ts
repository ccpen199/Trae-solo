import express, { type Request, type Response } from 'express';
import * as doctorRepository from '../db/repositories/doctorRepository.js';
import type { CreateDoctorDto, UpdateDoctorDto } from '../types/index.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const doctors = doctorRepository.findAll();
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const doctor = doctorRepository.findById(id);

    if (!doctor) {
      res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
      return;
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const dto: CreateDoctorDto = req.body;

    if (!dto.name || !dto.licenseNo || !dto.specialty || !dto.title || !dto.practiceScope) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, licenseNo, specialty, title, practiceScope'
      });
      return;
    }

    const existing = doctorRepository.findByLicenseNo(dto.licenseNo);
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Doctor with this license number already exists'
      });
      return;
    }

    const doctor = doctorRepository.create(dto);
    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const dto: UpdateDoctorDto = req.body;

    const existing = doctorRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
      return;
    }

    if (dto.licenseNo && dto.licenseNo !== existing.licenseNo) {
      const duplicate = doctorRepository.findByLicenseNo(dto.licenseNo);
      if (duplicate) {
        res.status(400).json({
          success: false,
          error: 'Doctor with this license number already exists'
        });
        return;
      }
    }

    const doctor = doctorRepository.update(id, dto);
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = doctorRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
      return;
    }

    const deleted = doctorRepository.remove(id);
    res.json({
      success: true,
      data: deleted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
