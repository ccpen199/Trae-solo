import request from '../request';
import type { StatisticsSummary, ConversionFunnelItem } from '../../types';

export const getSummary = (): Promise<StatisticsSummary> => {
  return request.get('/statistics/summary');
};

export const getConversionFunnel = (): Promise<ConversionFunnelItem[]> => {
  return request.get('/statistics/conversion-funnel');
};

export const getPriceAdjustments = (): Promise<any[]> => {
  return request.get('/statistics/price-adjustments');
};

export const getInspectionExceptions = (): Promise<any[]> => {
  return request.get('/statistics/inspection-exceptions');
};

export const getCancellationReasons = (): Promise<any[]> => {
  return request.get('/statistics/cancellation-reasons');
};

export const getSalesEfficiency = (): Promise<any[]> => {
  return request.get('/statistics/sales-efficiency');
};
