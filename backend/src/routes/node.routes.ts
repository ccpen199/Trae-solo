import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const nodeController = new BaseController('node')

export default createCrudRouter(nodeController)
