import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const exceptionRecordController = new BaseController('exceptionRecord')

export default createCrudRouter(exceptionRecordController)
