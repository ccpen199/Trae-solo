import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const arrivalForecastController = new BaseController('arrivalForecast')

export default createCrudRouter(arrivalForecastController)
