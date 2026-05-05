import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const orderSignController = new BaseController('orderSign')

export default createCrudRouter(orderSignController)
