import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const claimController = new BaseController('claim')

export default createCrudRouter(claimController)
