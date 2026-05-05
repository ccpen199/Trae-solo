import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const cityController = new BaseController('city')

export default createCrudRouter(cityController)
