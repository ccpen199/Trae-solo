import { BaseController } from '../controllers/base.controller'
import { createCrudRouter } from '../utils/router-factory'

const inTransitMonitoringController = new BaseController('inTransitMonitoring')

export default createCrudRouter(inTransitMonitoringController)
