/**
 * Express server entry point for the translation proxy
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env from monorepo root (two levels up from apps/translate)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import express from 'express'
import { handleRequest } from './pipeline.js'
import { testConnection, closePool } from '@pantolingo/db'
import { renderMessagePage } from './utils/message-page.js'

const app = express()
const PORT = process.env.PORT || 8787

// Parse raw body for POST/PUT requests
app.use(express.raw({ type: '*/*', limit: '10mb' }))

// Health check endpoint
app.get('/healthz', (_req, res) => {
	res.json({ status: 'ok' })
})

// Maintenance mode middleware
app.use((req, res, next) => {
	const maintenanceMessage = process.env.MAINTENANCE_MESSAGE
	if (maintenanceMessage) {
		res.status(503).set('Content-Type', 'text/html').send(
			renderMessagePage({
				title: 'Maintenance in Progress',
				message: maintenanceMessage,
				subtitle: 'Thank you for your patience.',
			})
		)
		return
	}
	next()
})

// Main request handler
app.use(async (req, res) => {
	try {
		await handleRequest(req, res)
	} catch (error) {
		console.error('Unhandled error:', error)
		if (!res.headersSent) {
			res.status(500).send('Internal Server Error')
		}
	}
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
	console.log(`${signal} received, closing database pool...`)
	await closePool()
	process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
async function start() {
	// Test database connection
	const connected = await testConnection()
	if (!connected) {
		console.error('Failed to connect to PostgreSQL. Exiting.')
		process.exit(1)
	}
	console.log('PostgreSQL connected')

	app.listen(PORT, () => {
		console.log(`Translation proxy running on port ${PORT}`)
		if (PORT === 8787) console.log(`http://localhost:${PORT}`)
	})
}

start()
