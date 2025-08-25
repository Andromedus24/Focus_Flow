import { pipeline } from '@huggingface/transformers'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Hugging Face pipeline
let extractor
;(async () => {
	try {
		extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
			device: 'cpu',
			dtype: 'fp32',
		})
		console.log('✅ Hugging Face pipeline initialized successfully')
	} catch (error) {
		console.error('❌ Failed to initialize Hugging Face pipeline:', error)
	}
})()

// Utility functions
const cosineSimilarity = (vecA, vecB) => {
	if (!vecA || !vecB || vecA.length !== vecB.length) return 0
	const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0)
	const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
	const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
	return magnitudeA === 0 || magnitudeB === 0 ? 0 : dotProduct / (magnitudeA * magnitudeB)
}

const validateRequest = (req, res, requiredFields) => {
	for (const field of requiredFields) {
		if (!req.body[field]) {
			return res.status(400).json({ 
				error: `Missing required field: ${field}`,
				required: requiredFields 
			})
		}
	}
	return null
}

// AI-powered task relevance checking
const checkRelevanceMiniLM = async (task, tabName) => {
	try {
		if (!extractor) {
			throw new Error('Hugging Face pipeline not initialized')
		}
		
		const embeddings = await extractor([task, tabName], { 
			pooling: 'mean', 
			normalize: true 
		})
		
		const taskEmbedding = embeddings[0].data
		const tabEmbedding = embeddings[1].data
		const similarity = cosineSimilarity(taskEmbedding, tabEmbedding)
		
		return {
			relevant: similarity > 0.4,
			confidence: similarity,
			method: 'embeddings'
		}
	} catch (error) {
		console.error('Embeddings error:', error)
		return { relevant: false, confidence: 0, method: 'embeddings', error: error.message }
	}
}

const checkRelevanceOpenAI = async (task, tabName) => {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			max_tokens: 50,
			temperature: 0,
			messages: [
				{
					role: 'system',
					content: `Analyze if the current browser tab is relevant to the user's task goal. Consider content, context, and purpose. Respond with only "Yes" or "No" followed by a brief reason.`
				},
				{
					content: `Task Goal: ${task}\nCurrent Tab: ${tabName}`,
					role: 'user',
				},
			],
		})

		const response = completion.choices[0].message.content
		const isRelevant = response.toLowerCase().includes('yes')
		
		return {
			relevant: isRelevant,
			confidence: 0.8,
			method: 'gpt-4o-mini',
			reasoning: response
		}
	} catch (error) {
		console.error('OpenAI error:', error)
		return { relevant: false, confidence: 0, method: 'gpt-4o-mini', error: error.message }
	}
}

// Controller methods
export const getHome = (req, res) => {
	res.json({
		message: 'Welcome to Focus Flow API',
		version: '1.0.0',
		endpoints: {
			health: '/api/health',
			tasks: '/api/tasks',
			relevance: '/api/tasks/check-relevance',
			generate: '/api/tasks/generate'
		}
	})
}

export const createInitialTask = async (req, res) => {
	try {
		const validation = validateRequest(req, res, ['taskGoal'])
		if (validation) return validation

		const { taskGoal, context } = req.body

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			max_tokens: 200,
			temperature: 0.3,
			messages: [
				{
					role: 'system',
					content: `You are a productivity assistant helping users stay focused on their goals. Generate a list of 5-8 essential websites needed to achieve the given task goal. Consider the context and provide practical, specific websites.`
				},
				{
					content: `Task Goal: ${taskGoal}\nContext: ${context || 'No additional context provided'}\n\nProvide only the website domains (without www), separated by commas.`,
					role: 'user',
				},
			],
		})

		const websites = completion.choices[0].message.content
			.split(',')
			.map(site => site.trim())
			.filter(site => site.length > 0)

		res.json({
			success: true,
			websites,
			count: websites.length,
			goal: taskGoal,
			timestamp: new Date().toISOString()
		})
	} catch (error) {
		console.error('Task creation error:', error)
		res.status(500).json({ 
			error: 'Failed to generate task websites',
			details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
		})
	}
}

export const checkTask = async (req, res) => {
	try {
		const validation = validateRequest(req, res, ['titleTab', 'goalNeeded'])
		if (validation) return validation

		const { titleTab, goalNeeded, URLTab, context } = req.body

		// Try embeddings first (faster and cheaper)
		const embeddingsResult = await checkRelevanceMiniLM(goalNeeded, titleTab)
		
		let finalResult
		if (embeddingsResult.error || embeddingsResult.confidence < 0.3) {
			// Fallback to OpenAI for better accuracy
			finalResult = await checkRelevanceOpenAI(goalNeeded, titleTab)
		} else {
			finalResult = embeddingsResult
		}

		// Log the check for analytics
		console.log('Task relevance check:', {
			goal: goalNeeded,
			tab: titleTab,
			url: URLTab,
			result: finalResult,
			timestamp: new Date().toISOString()
		})

		res.json({
			success: true,
			relevant: finalResult.relevant,
			confidence: finalResult.confidence,
			method: finalResult.method,
			reasoning: finalResult.reasoning,
			goal: goalNeeded,
			tab: titleTab,
			timestamp: new Date().toISOString()
		})
	} catch (error) {
		console.error('Task check error:', error)
		res.status(500).json({ 
			error: 'Failed to check task relevance',
			details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
		})
	}
}

// New endpoint for task analytics
export const getTaskAnalytics = async (req, res) => {
	try {
		// This would typically query a database
		// For now, return mock data structure
		res.json({
			success: true,
			analytics: {
				totalChecks: 0,
				relevanceRate: 0,
				mostCommonGoals: [],
				productivityScore: 0,
				lastUpdated: new Date().toISOString()
			}
		})
	} catch (error) {
		console.error('Analytics error:', error)
		res.status(500).json({ 
			error: 'Failed to retrieve task analytics',
			details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
		})
	}
}

// New endpoint for task suggestions
export const getTaskSuggestions = async (req, res) => {
	try {
		const { currentGoal, completedTasks } = req.body

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			max_tokens: 300,
			temperature: 0.4,
			messages: [
				{
					role: 'system',
					content: `You are a productivity coach. Based on the user's current goal and completed tasks, suggest 3-5 next steps or sub-tasks to help them progress. Be specific and actionable.`
				},
				{
					content: `Current Goal: ${currentGoal}\nCompleted Tasks: ${completedTasks?.join(', ') || 'None'}\n\nSuggest next steps:`,
					role: 'user',
				},
			],
		})

		const suggestions = completion.choices[0].message.content
			.split('\n')
			.filter(suggestion => suggestion.trim().length > 0)
			.map(suggestion => suggestion.replace(/^\d+\.\s*/, '').trim())

		res.json({
			success: true,
			suggestions,
			count: suggestions.length,
			goal: currentGoal,
			timestamp: new Date().toISOString()
		})
	} catch (error) {
		console.error('Suggestions error:', error)
		res.status(500).json({ 
			error: 'Failed to generate task suggestions',
			details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
		})
	}
}
