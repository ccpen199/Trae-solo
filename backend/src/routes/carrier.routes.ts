import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const carrierController = new BaseController('carrier')

export default createCrudRouter(carrierController)
