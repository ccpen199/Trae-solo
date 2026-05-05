import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const businessTypeController = new BaseController('businessType')

export default createCrudRouter(businessTypeController)
