import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const reconciliationController = new BaseController('reconciliation')

export default createCrudRouter(reconciliationController)
