import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const transportTypeController = new BaseController('transportType')

export default createCrudRouter(transportTypeController)
