import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const vehicleController = new BaseController('vehicle')

export default createCrudRouter(vehicleController)
