import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const departmentController = new BaseController('department')

export default createCrudRouter(departmentController)
