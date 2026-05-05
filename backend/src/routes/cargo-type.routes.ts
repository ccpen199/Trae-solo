import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const cargoTypeController = new BaseController('cargoType')

export default createCrudRouter(cargoTypeController)
