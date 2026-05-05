import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const transportPlanController = new BaseController('transportPlan')

export default createCrudRouter(transportPlanController)
