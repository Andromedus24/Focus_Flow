import { Router } from 'express'
import { 
	getHome, 
	createInitialTask, 
	checkTask, 
	getTaskAnalytics, 
	getTaskSuggestions 
} from './controllers/taskController.js'

const router = Router()

// Base route
router.get('/', getHome)

// Task management routes
router.post('/initial', createInitialTask)
router.post('/check', checkTask)
router.get('/analytics', getTaskAnalytics)
router.post('/suggestions', getTaskSuggestions)

// Health check (moved to main app)
// router.get('/health', (req, res) => res.json({ status: 'OK' }))

export default router
