import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const vehicleTypeController = new BaseController('vehicleType')

export default createCrudRouter(vehicleTypeController)
