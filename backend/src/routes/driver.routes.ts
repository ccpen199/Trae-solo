import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const driverController = new BaseController('driver')

export default createCrudRouter(driverController)
