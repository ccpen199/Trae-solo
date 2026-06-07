import { Request, Response } from 'express';
import BuildingRepository from '../repositories/BuildingRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import type { Building, Unit, Resident } from '../types/index.js';

const buildingRepo = new BuildingRepository();
const userRepo = new UserRepository();

export const BuildingController = {
  async getAllBuildings(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const result = await buildingRepo.getAllBuildingsWithStats();

      res.json({
        success: true,
        data: result,
        page,
        page_size: pageSize,
        total: result.length,
      });
    } catch (error) {
      console.error('Get buildings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get buildings',
      });
    }
  },

  async getBuildingById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const building = buildingRepo.getBuildingWithStats(id);

      if (!building) {
        res.status(404).json({
          success: false,
          error: 'Building not found',
        });
        return;
      }

      const units = buildingRepo.getUnitsByBuilding(id, 1, 100);
      const residents = buildingRepo.getResidentsByBuilding(id, 1, 200);

      res.json({
        success: true,
        data: {
          building,
          units: units.items,
          residents: residents.items,
        },
      });
    } catch (error) {
      console.error('Get building error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get building',
      });
    }
  },

  async createBuilding(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, total_floors, total_units, description } = req.body;

      if (!name || !address) {
        res.status(400).json({
          success: false,
          error: 'Name and address are required',
        });
        return;
      }

      const building = await buildingRepo.create({
        name,
        address,
        total_floors: total_floors || 0,
        total_units: total_units || 0,
        description: description || '',
      });

      res.json({
        success: true,
        data: building,
        message: 'Building created successfully',
      });
    } catch (error) {
      console.error('Create building error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create building',
      });
    }
  },

  async updateBuilding(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { name, address, total_floors, total_units, description } = req.body;

      const existing = buildingRepo.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Building not found',
        });
        return;
      }

      const building = await buildingRepo.update(id, {
        name,
        address,
        total_floors,
        total_units,
        description,
      });

      res.json({
        success: true,
        data: building,
        message: 'Building updated successfully',
      });
    } catch (error) {
      console.error('Update building error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update building',
      });
    }
  },

  async deleteBuilding(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      const existing = buildingRepo.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Building not found',
        });
        return;
      }

      buildingRepo.delete(id);

      res.json({
        success: true,
        message: 'Building deleted successfully',
      });
    } catch (error) {
      console.error('Delete building error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete building',
      });
    }
  },

  async getUnitsByBuilding(req: Request, res: Response): Promise<void> {
    try {
      const buildingId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const result = buildingRepo.getUnitsByBuilding(buildingId, page, pageSize);

      res.json({
        success: true,
        data: result.items,
        total: result.total,
        page: result.page,
        page_size: result.page_size,
      });
    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get units',
      });
    }
  },

  async getResidentsByBuilding(req: Request, res: Response): Promise<void> {
    try {
      const buildingId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const result = buildingRepo.getResidentsByBuilding(buildingId, page, pageSize);

      res.json({
        success: true,
        data: result.items,
        total: result.total,
        page: result.page,
        page_size: result.page_size,
      });
    } catch (error) {
      console.error('Get residents error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get residents',
      });
    }
  },

  async getBuildingGraph(req: Request, res: Response): Promise<void> {
    try {
      const buildings = buildingRepo.findAll();
      const graph = [];

      for (const building of buildings) {
        const unitsResult = buildingRepo.getUnitsByBuilding(building.id, 1, 100);
        const residentsResult = buildingRepo.getResidentsByBuilding(building.id, 1, 200);

        const unitsWithResidents = unitsResult.items.map((unit: Unit) => ({
          ...unit,
          residents: residentsResult.items.filter(
            (r: Resident) => (r as any).unit_id === unit.id
          ),
        }));

        graph.push({
          ...building,
          units: unitsWithResidents,
        });
      }

      res.json({
        success: true,
        data: graph,
      });
    } catch (error) {
      console.error('Get building graph error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get building graph',
      });
    }
  },
};

export default BuildingController;
