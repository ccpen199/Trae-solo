import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const freightCalculationController = new BaseController('freightCalculation')

export default createCrudRouter(freightCalculationController)
