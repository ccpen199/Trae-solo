import { get, post, put, del, PaginatedResult } from './request'

export interface ListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number | string
  [key: string]: unknown
}

export interface BatchDeleteParams {
  ids: string[]
}

export interface ToggleStatusParams {
  id: string
  status: number
}

export function createCrudService(baseUrl: string) {
  return {
    list: <T>(params?: ListParams): Promise<PaginatedResult<T>> => {
      return get(baseUrl, { params }).then((res) => res.data as PaginatedResult<T>)
    },

    all: <T>(): Promise<T[]> => {
      return get(`${baseUrl}/all`).then((res) => res.data as T[])
    },

    getById: <T>(id: string): Promise<T> => {
      return get(`${baseUrl}/${id}`).then((res) => res.data as T)
    },

    create: <T>(data: unknown): Promise<T> => {
      return post(baseUrl, data).then((res) => res.data as T)
    },

    update: <T>(id: string, data: unknown): Promise<T> => {
      return put(`${baseUrl}/${id}`, data).then((res) => res.data as T)
    },

    delete: (id: string): Promise<void> => {
      return del(`${baseUrl}/${id}`).then()
    },

    batchDelete: (params: BatchDeleteParams): Promise<void> => {
      return post(`${baseUrl}/batch-delete`, params).then()
    },

    toggleStatus: (params: ToggleStatusParams): Promise<void> => {
      return post(`${baseUrl}/toggle-status`, params).then()
    },
  }
}

export const userService = createCrudService('/users')
export const roleService = createCrudService('/roles')
export const menuService = createCrudService('/menus')
export const departmentService = createCrudService('/departments')
export const cityService = createCrudService('/cities')
export const nodeService = createCrudService('/nodes')
export const vehicleTypeService = createCrudService('/vehicle-types')
export const vehicleService = createCrudService('/vehicles')
export const driverService = createCrudService('/drivers')
export const cargoTypeService = createCrudService('/cargo-types')
export const businessTypeService = createCrudService('/business-types')
export const gpsDepartmentService = createCrudService('/gps-departments')
export const gpsVehicleService = createCrudService('/gps-vehicles')
export const carrierService = createCrudService('/carriers')
export const transportTypeService = createCrudService('/transport-types')
export const transportRouteService = createCrudService('/transport-routes')
export const freightRateService = createCrudService('/freight-rates')
export const transportPlanService = createCrudService('/transport-plans')
export const transportOrderService = createCrudService('/transport-orders')
export const inTransitMonitoringService = createCrudService('/in-transit-monitorings')
export const exceptionRecordService = createCrudService('/exception-records')
export const arrivalForecastService = createCrudService('/arrival-forecasts')
export const orderSignService = createCrudService('/order-signs')
export const claimService = createCrudService('/claims')
export const freightCalculationService = createCrudService('/freight-calculations')
export const reconciliationService = createCrudService('/reconciliations')
