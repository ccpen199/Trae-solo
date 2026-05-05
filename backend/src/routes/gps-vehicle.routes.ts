import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const gpsVehicleController = new BaseController('gpsVehicle')

export default createCrudRouter(gpsVehicleController)
