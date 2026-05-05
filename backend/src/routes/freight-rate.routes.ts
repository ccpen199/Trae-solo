import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const freightRateController = new BaseController('freightRate')

export default createCrudRouter(freightRateController)
