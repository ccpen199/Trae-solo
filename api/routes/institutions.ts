import express, { type Request, type Response } from 'express';
import * as institutionRepository from '../db/repositories/institutionRepository.js';
import type { CreateInstitutionDto, UpdateInstitutionDto } from '../types/index.js';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const institutions = institutionRepository.findAllInstitutions();
    res.json({
      success: true,
      data: institutions
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
    const institution = institutionRepository.findInstitutionById(id);

    if (!institution) {
      res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
      return;
    }

    res.json({
      success: true,
      data: institution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/:id/departments', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    const institution = institutionRepository.findInstitutionById(id);

    if (!institution) {
      res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
      return;
    }

    const departments = institutionRepository.findAllDepartmentsByInstitutionId(id);
    res.json({
      success: true,
      data: departments
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
    const dto: CreateInstitutionDto = req.body;

    if (!dto.name) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: name'
      });
      return;
    }

    const institution = institutionRepository.createInstitution(dto);
    res.status(201).json({
      success: true,
      data: institution
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
    const dto: UpdateInstitutionDto = req.body;

    const existing = institutionRepository.findInstitutionById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
      return;
    }

    const institution = institutionRepository.updateInstitution(id, dto);
    res.json({
      success: true,
      data: institution
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

    const existing = institutionRepository.findInstitutionById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
      return;
    }

    const deleted = institutionRepository.deleteInstitution(id);
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
