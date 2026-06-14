import { Router } from 'express'
import calculatorController from '../controllers/CalculatorController.js'

const router = Router()

router.post('/pension-estimate', calculatorController.pensionEstimate.bind(calculatorController))

export default router
