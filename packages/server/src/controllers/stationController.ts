import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { stationService } from '../services';

export const getStationList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, keyword, type, status } = req.query;
    const result = await stationService.getStationList({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      keyword: keyword as string,
      type: type as string,
      status: status as string,
    });
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getStationDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const station = await stationService.getStationById(id);
    success(res, station);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getStationPiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const piles = await stationService.getPilesByStationId(id);
    success(res, piles);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getPileDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pileId } = req.params;
    const pile = await stationService.getPileById(pileId);
    success(res, pile);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  getStationList,
  getStationDetail,
  getStationPiles,
  getPileDetail,
};
