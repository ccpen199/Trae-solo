import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const transportRouteController = new BaseController('transportRoute')

export default createCrudRouter(transportRouteController)
