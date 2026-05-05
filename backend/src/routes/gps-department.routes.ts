import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const gpsDepartmentController = new BaseController('gpsDepartment')

export default createCrudRouter(gpsDepartmentController)
